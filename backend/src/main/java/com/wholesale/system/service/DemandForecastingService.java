package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI-Driven Demand Forecasting Service.
 *
 * Implements:
 * - Weighted Moving Average (WMA) for demand prediction
 * - Linear Trend Detection via least-squares regression
 * - Demand Variability (σ) for safety stock optimization
 * - Optimal Reorder Point = (avg_daily × lead_time) + (Z × σ × √lead_time)
 * - Economic Order Quantity (EOQ) = √(2 × D × S / H)
 * - Estimated Days Until Stockout
 * - Confidence scoring based on data quality
 */
@Service
public class DemandForecastingService {

    private final OrderItemRepository orderItemRepo;
    private final InventoryRepository inventoryRepo;
    private final ProductRepository productRepo;
    private final BranchRepository branchRepo;
    private final StockMovementLogRepository stockLogRepo;

    /** Z-score for 95% service level (covers 95% of demand variation) */
    private static final double Z_SCORE_95 = 1.65;
    /** Default ordering cost per order (₹) — used for EOQ */
    private static final double DEFAULT_ORDER_COST = 500.0;
    /** Holding cost as % of unit cost per year */
    private static final double HOLDING_COST_PCT = 0.25;
    /** Analysis window in days */
    private static final int ANALYSIS_WINDOW_DAYS = 90;

    public DemandForecastingService(OrderItemRepository orderItemRepo,
            InventoryRepository inventoryRepo,
            ProductRepository productRepo,
            BranchRepository branchRepo,
            StockMovementLogRepository stockLogRepo) {
        this.orderItemRepo = orderItemRepo;
        this.inventoryRepo = inventoryRepo;
        this.productRepo = productRepo;
        this.branchRepo = branchRepo;
        this.stockLogRepo = stockLogRepo;
    }

    // ==================== PUBLIC API ====================

    /**
     * Generate advanced demand forecast for all products at a branch.
     */
    public ForecastSummary getAdvancedForecast(Long branchId) {
        Branch branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        List<Inventory> inventories = inventoryRepo.findByBranchId(branchId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusDays(ANALYSIS_WINDOW_DAYS);

        List<ForecastDetail> forecasts = new ArrayList<>();
        int totalNeedsReorder = 0;
        int totalCritical = 0;
        double totalForecastedRevenue = 0;

        for (Inventory inv : inventories) {
            Product product = inv.getProduct();
            if (!product.getIsActive()) continue;

            ForecastDetail detail = analyzeSingleProduct(branchId, product, inv, windowStart, now);
            forecasts.add(detail);

            if (detail.getNeedsReorder()) totalNeedsReorder++;
            if ("CRITICAL".equals(detail.getUrgency())) totalCritical++;
            totalForecastedRevenue += detail.getForecastedDemand30Days() * product.getPrice().doubleValue();
        }

        // Sort by urgency: CRITICAL first, then by days until stockout
        forecasts.sort((a, b) -> {
            int urgencyOrder = urgencyRank(a.getUrgency()) - urgencyRank(b.getUrgency());
            if (urgencyOrder != 0) return urgencyOrder;
            return Double.compare(
                    a.getEstimatedDaysUntilStockout() == null ? 999 : a.getEstimatedDaysUntilStockout(),
                    b.getEstimatedDaysUntilStockout() == null ? 999 : b.getEstimatedDaysUntilStockout());
        });

        return ForecastSummary.builder()
                .branchId(branchId)
                .branchName(branch.getName())
                .analysisWindowDays(ANALYSIS_WINDOW_DAYS)
                .analyzedAt(now)
                .totalProducts(forecasts.size())
                .productsNeedingReorder(totalNeedsReorder)
                .criticalItems(totalCritical)
                .forecastedMonthlyRevenue(round2(totalForecastedRevenue))
                .forecasts(forecasts)
                .build();
    }

    /**
     * Deep analysis for a single product at a branch.
     */
    public ForecastDetail getProductForecast(Long branchId, Long productId) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Inventory inv = inventoryRepo.findByBranchIdAndProductId(branchId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusDays(ANALYSIS_WINDOW_DAYS);

        return analyzeSingleProduct(branchId, product, inv, windowStart, now);
    }

    /**
     * Get reorder recommendations — only products that need reordering.
     */
    public List<ReorderRecommendation> getReorderRecommendations(Long branchId) {
        ForecastSummary summary = getAdvancedForecast(branchId);
        return summary.getForecasts().stream()
                .filter(ForecastDetail::getNeedsReorder)
                .map(f -> ReorderRecommendation.builder()
                        .productId(f.getProductId())
                        .productName(f.getProductName())
                        .sku(f.getSku())
                        .currentStock(f.getCurrentStock())
                        .optimalReorderPoint(f.getOptimalReorderPoint())
                        .economicOrderQuantity(f.getEconomicOrderQuantity())
                        .estimatedDaysUntilStockout(f.getEstimatedDaysUntilStockout())
                        .urgency(f.getUrgency())
                        .avgDailySales(f.getWeightedAvgDailySales())
                        .confidenceScore(f.getConfidenceScore())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Apply AI-recommended reorder points and safety stock to products.
     */
    @Transactional
    public Map<String, Object> applyRecommendations(Long branchId) {
        ForecastSummary summary = getAdvancedForecast(branchId);
        int updated = 0;

        for (ForecastDetail f : summary.getForecasts()) {
            if (f.getConfidenceScore() < 0.3) continue; // skip low-confidence predictions

            Product product = productRepo.findById(f.getProductId()).orElse(null);
            if (product == null) continue;

            boolean changed = false;

            // Update threshold if AI suggests different value
            if (f.getOptimalReorderPoint() != null && f.getOptimalReorderPoint() > 0
                    && !f.getOptimalReorderPoint().equals(product.getThresholdLevel())) {
                product.setThresholdLevel(f.getOptimalReorderPoint());
                changed = true;
            }

            // Update safety stock
            int aiSafetyStock = (int) Math.ceil(f.getDemandStdDev() * Z_SCORE_95);
            if (aiSafetyStock > 0 && aiSafetyStock != product.getSafetyStock()) {
                product.setSafetyStock(Math.max(aiSafetyStock, 1));
                changed = true;
            }

            if (changed) {
                productRepo.save(product);
                updated++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("branchId", branchId);
        result.put("productsAnalyzed", summary.getTotalProducts());
        result.put("productsUpdated", updated);
        result.put("message", updated > 0
                ? updated + " product(s) updated with AI-optimized reorder points"
                : "No products needed threshold updates");
        return result;
    }

    // ==================== CORE FORECASTING ENGINE ====================

    private ForecastDetail analyzeSingleProduct(Long branchId, Product product,
            Inventory inv, LocalDateTime windowStart, LocalDateTime now) {

        Long productId = product.getId();
        int currentStock = inv.getQuantity();
        int leadTime = product.getLeadTime();

        // ----- 1. Fetch daily sales data -----
        List<Object[]> dailyRaw = orderItemRepo.dailySalesForProduct(
                branchId, productId, windowStart, now);

        Map<LocalDate, Double> dailySalesMap = new LinkedHashMap<>();
        for (Object[] row : dailyRaw) {
            LocalDate date = (LocalDate) row[0];
            double qty = ((Number) row[1]).doubleValue();
            dailySalesMap.put(date, qty);
        }

        // Fill missing days with 0
        long totalDays = ChronoUnit.DAYS.between(windowStart.toLocalDate(), now.toLocalDate());
        List<Double> dailySeries = new ArrayList<>();
        for (long i = 0; i < totalDays; i++) {
            LocalDate d = windowStart.toLocalDate().plusDays(i);
            dailySeries.add(dailySalesMap.getOrDefault(d, 0.0));
        }

        // ----- 2. Basic Statistics -----
        double totalSold = dailySeries.stream().mapToDouble(Double::doubleValue).sum();
        double simpleDailyAvg = totalDays > 0 ? totalSold / totalDays : 0;

        // Standard deviation of daily demand
        double variance = dailySeries.stream()
                .mapToDouble(d -> Math.pow(d - simpleDailyAvg, 2))
                .average().orElse(0);
        double stdDev = Math.sqrt(variance);

        // ----- 3. Weighted Moving Average (recent weeks weighted higher) -----
        double weightedDailyAvg = calculateWeightedMovingAverage(dailySeries);

        // ----- 4. Trend Detection (linear regression slope) -----
        double trendSlope = calculateTrendSlope(dailySeries);
        String trendDirection;
        if (trendSlope > 0.05) trendDirection = "INCREASING";
        else if (trendSlope < -0.05) trendDirection = "DECREASING";
        else trendDirection = "STABLE";

        // ----- 5. Seasonality Index (day-of-week pattern) -----
        double[] dayOfWeekFactors = calculateDayOfWeekFactors(dailySalesMap);

        // ----- 6. 30-Day Forecast (WMA + trend adjustment) -----
        double trendAdjustment = trendSlope * 30; // project trend 30 days forward
        double forecast30 = Math.max(0, (weightedDailyAvg * 30) + trendAdjustment);

        // ----- 7. Optimal Reorder Point -----
        // ROP = (avg daily demand × lead time) + safety stock buffer
        // Safety buffer = Z × σ × √(lead time)
        double safetyBuffer = Z_SCORE_95 * stdDev * Math.sqrt(leadTime);
        int optimalReorderPoint = (int) Math.ceil(weightedDailyAvg * leadTime + safetyBuffer);

        // ----- 8. Economic Order Quantity (EOQ) -----
        double annualDemand = weightedDailyAvg * 365;
        double holdingCostPerUnit = product.getCostPrice().doubleValue() * HOLDING_COST_PCT;
        int eoq = 0;
        if (annualDemand > 0 && holdingCostPerUnit > 0) {
            eoq = (int) Math.ceil(Math.sqrt(
                    (2 * annualDemand * DEFAULT_ORDER_COST) / holdingCostPerUnit));
        }

        // ----- 9. Days Until Stockout -----
        Double daysUntilStockout = null;
        if (weightedDailyAvg > 0) {
            daysUntilStockout = round2(currentStock / weightedDailyAvg);
        }

        // ----- 10. Urgency Classification -----
        String urgency = classifyUrgency(currentStock, optimalReorderPoint,
                daysUntilStockout, leadTime);

        // ----- 11. Confidence Score -----
        double confidence = calculateConfidence(dailySeries, totalSold, totalDays);

        // ----- 12. Needs Reorder? -----
        boolean needsReorder = currentStock <= optimalReorderPoint ||
                (daysUntilStockout != null && daysUntilStockout <= leadTime * 1.5);

        return ForecastDetail.builder()
                .productId(productId)
                .productName(product.getName())
                .sku(product.getSku())
                .category(product.getCategory())
                .currentStock(currentStock)
                .currentThreshold(product.getThresholdLevel())
                .leadTimeDays(leadTime)
                // Demand metrics
                .simpleDailyAvg(round2(simpleDailyAvg))
                .weightedAvgDailySales(round2(weightedDailyAvg))
                .demandStdDev(round2(stdDev))
                .forecastedDemand30Days(round2(forecast30))
                // Trend
                .trendDirection(trendDirection)
                .trendSlope(round4(trendSlope))
                // Seasonality (top selling day index: 1=Mon, 7=Sun)
                .peakDayOfWeek(findPeakDay(dayOfWeekFactors))
                // Reorder intelligence
                .optimalReorderPoint(optimalReorderPoint)
                .economicOrderQuantity(eoq > 0 ? eoq : null)
                .estimatedDaysUntilStockout(daysUntilStockout)
                .urgency(urgency)
                .needsReorder(needsReorder)
                // Confidence
                .confidenceScore(round2(confidence))
                .dataPointsUsed((int) totalDays)
                .build();
    }

    // ==================== ALGORITHM HELPERS ====================

    /**
     * Weighted Moving Average: splits data into 4 quarters, most recent weighted 4x,
     * second-most 3x, etc.
     */
    private double calculateWeightedMovingAverage(List<Double> dailySeries) {
        if (dailySeries.isEmpty()) return 0;

        int size = dailySeries.size();
        int quarterSize = Math.max(1, size / 4);

        double[] quarterSums = new double[4];
        int[] quarterCounts = new int[4];

        for (int i = 0; i < size; i++) {
            int quarter = Math.min(3, i / quarterSize);
            quarterSums[quarter] += dailySeries.get(i);
            quarterCounts[quarter]++;
        }

        // Weights: oldest=1, next=2, next=3, newest=4
        double weightedSum = 0;
        double totalWeight = 0;
        int[] weights = { 1, 2, 3, 4 };

        for (int q = 0; q < 4; q++) {
            if (quarterCounts[q] > 0) {
                double quarterAvg = quarterSums[q] / quarterCounts[q];
                weightedSum += quarterAvg * weights[q];
                totalWeight += weights[q];
            }
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * Linear regression slope (least-squares) on daily data.
     * Positive slope = increasing trend, negative = decreasing.
     */
    private double calculateTrendSlope(List<Double> series) {
        int n = series.size();
        if (n < 7) return 0; // not enough data for trend

        // Weekly averaging to smooth noise
        List<Double> weeklyAvgs = new ArrayList<>();
        for (int i = 0; i < n; i += 7) {
            int end = Math.min(i + 7, n);
            double sum = 0;
            for (int j = i; j < end; j++) sum += series.get(j);
            weeklyAvgs.add(sum / (end - i));
        }

        int wn = weeklyAvgs.size();
        if (wn < 2) return 0;

        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < wn; i++) {
            sumX += i;
            sumY += weeklyAvgs.get(i);
            sumXY += i * weeklyAvgs.get(i);
            sumX2 += i * i;
        }

        double denominator = (wn * sumX2 - sumX * sumX);
        if (denominator == 0) return 0;

        return (wn * sumXY - sumX * sumY) / denominator;
    }

    /**
     * Day-of-week seasonality factors (indexed 1-7 for Mon-Sun).
     */
    private double[] calculateDayOfWeekFactors(Map<LocalDate, Double> dailySalesMap) {
        double[] daySums = new double[7];
        int[] dayCounts = new int[7];

        for (Map.Entry<LocalDate, Double> entry : dailySalesMap.entrySet()) {
            int dayIdx = entry.getKey().getDayOfWeek().getValue() - 1; // 0=Mon, 6=Sun
            daySums[dayIdx] += entry.getValue();
            dayCounts[dayIdx]++;
        }

        double overallAvg = 0;
        int totalWithData = 0;
        for (int i = 0; i < 7; i++) {
            if (dayCounts[i] > 0) {
                daySums[i] /= dayCounts[i]; // convert to avg
                overallAvg += daySums[i];
                totalWithData++;
            }
        }
        overallAvg = totalWithData > 0 ? overallAvg / totalWithData : 1;

        // Normalize: factor = dayAvg / overallAvg
        double[] factors = new double[7];
        for (int i = 0; i < 7; i++) {
            factors[i] = overallAvg > 0 ? daySums[i] / overallAvg : 1.0;
        }
        return factors;
    }

    /**
     * Classify urgency of reorder.
     */
    private String classifyUrgency(int currentStock, int reorderPoint,
            Double daysUntilStockout, int leadTime) {
        if (currentStock == 0) return "CRITICAL";
        if (daysUntilStockout != null && daysUntilStockout <= leadTime) return "CRITICAL";
        if (daysUntilStockout != null && daysUntilStockout <= leadTime * 2) return "HIGH";
        if (currentStock <= reorderPoint) return "MEDIUM";
        return "LOW";
    }

    /**
     * Confidence score (0.0–1.0) based on data quantity and consistency.
     */
    private double calculateConfidence(List<Double> series, double totalSold, long totalDays) {
        if (totalDays == 0) return 0;

        // Factor 1: data coverage (more days = higher confidence)
        double coverageFactor = Math.min(1.0, totalDays / 90.0);

        // Factor 2: data volume (more sales = higher confidence)
        double volumeFactor = Math.min(1.0, totalSold / 50.0);

        // Factor 3: consistency (lower CV = more predictable)
        double avg = totalSold / totalDays;
        double variance = series.stream().mapToDouble(d -> Math.pow(d - avg, 2)).average().orElse(0);
        double cv = avg > 0 ? Math.sqrt(variance) / avg : 2;
        double consistencyFactor = Math.max(0, 1.0 - (cv / 3.0));

        return (coverageFactor * 0.3) + (volumeFactor * 0.3) + (consistencyFactor * 0.4);
    }

    private String findPeakDay(double[] factors) {
        String[] days = { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };
        int peakIdx = 0;
        for (int i = 1; i < 7; i++) {
            if (factors[i] > factors[peakIdx]) peakIdx = i;
        }
        return days[peakIdx];
    }

    private int urgencyRank(String urgency) {
        return switch (urgency) {
            case "CRITICAL" -> 0;
            case "HIGH" -> 1;
            case "MEDIUM" -> 2;
            default -> 3;
        };
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private double round4(double val) {
        return Math.round(val * 10000.0) / 10000.0;
    }
}
