package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AI Simulation service implementing rule-based business intelligence:
 * - Demand forecasting (30-day average)
 * - Smart reorder suggestions
 * - Anomaly detection (stock deduction > 200% of daily avg)
 */
@Service
public class AIService {

        private final InventoryRepository inventoryRepo;
        private final StockMovementLogRepository stockLogRepo;
        private final AnomalyLogRepository anomalyLogRepo;
        private final BranchRepository branchRepo;

        public AIService(InventoryRepository inventoryRepo, StockMovementLogRepository stockLogRepo,
                        ProductRepository productRepo, AnomalyLogRepository anomalyLogRepo,
                        BranchRepository branchRepo) {
                this.inventoryRepo = inventoryRepo;
                this.stockLogRepo = stockLogRepo;
                this.anomalyLogRepo = anomalyLogRepo;
                this.branchRepo = branchRepo;
        }

        /**
         * Generate demand forecast for all products at a branch.
         * Formula: forecast = average_daily_sales × 30
         * Reorder: average_daily_sales × lead_time + safety_stock
         */
        public List<DemandForecast> getDemandForecast(Long branchId) {
                List<Inventory> inventories = inventoryRepo.findByBranchId(branchId);
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime thirtyDaysAgo = now.minusDays(30);

                List<DemandForecast> forecasts = new ArrayList<>();
                for (Inventory inv : inventories) {
                        Product product = inv.getProduct();
                        Integer totalDeductions = stockLogRepo.sumDeductionsByProductAndDateRange(
                                        branchId, product.getId(), thirtyDaysAgo, now);

                        double avgDailySales = totalDeductions != null ? totalDeductions / 30.0 : 0;
                        double forecast30Days = avgDailySales * 30;
                        int reorderQty = (int) Math
                                        .ceil(avgDailySales * product.getLeadTime() + product.getSafetyStock());
                        boolean needsReorder = inv.getQuantity() <= product.getThresholdLevel();

                        forecasts.add(DemandForecast.builder()
                                        .productId(product.getId())
                                        .productName(product.getName())
                                        .averageDailySales(Math.round(avgDailySales * 100.0) / 100.0)
                                        .forecastedDemand30Days(Math.round(forecast30Days * 100.0) / 100.0)
                                        .currentStock(inv.getQuantity())
                                        .reorderSuggestion(reorderQty)
                                        .needsReorder(needsReorder)
                                        .build());
                }
                return forecasts;
        }

        /**
         * Detect anomalies: flag if stock deduction > 2x daily average.
         */
        @Transactional
        public List<AnomalyAlert> detectAnomalies(Long branchId) {
                List<Inventory> inventories = inventoryRepo.findByBranchId(branchId);
                Branch branch = branchRepo.findById(branchId)
                                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

                LocalDateTime now = LocalDateTime.now();
                LocalDateTime thirtyDaysAgo = now.minusDays(30);
                LocalDateTime yesterday = now.minusDays(1);

                List<AnomalyAlert> alerts = new ArrayList<>();

                for (Inventory inv : inventories) {
                        Product product = inv.getProduct();

                        // Get 30-day daily average
                        Integer totalDeductions30 = stockLogRepo.sumDeductionsByProductAndDateRange(
                                        branchId, product.getId(), thirtyDaysAgo, now);
                        double dailyAvg = totalDeductions30 != null ? totalDeductions30 / 30.0 : 0;

                        // Get today's deductions
                        Integer todayDeductions = stockLogRepo.sumDeductionsByProductAndDateRange(
                                        branchId, product.getId(), yesterday, now);
                        double todayActual = todayDeductions != null ? todayDeductions.doubleValue() : 0;

                        // Flag if > 200% of daily average
                        if (dailyAvg > 0 && todayActual > 2 * dailyAvg) {
                                String severity = todayActual > 3 * dailyAvg ? "CRITICAL" : "HIGH";

                                // Save to anomaly logs
                                AnomalyLog anomalyLog = AnomalyLog.builder()
                                                .branch(branch)
                                                .product(product)
                                                .anomalyType("EXCESSIVE_STOCK_DEDUCTION")
                                                .description("Stock deduction of " + todayActual
                                                                + " exceeds 200% of daily average " +
                                                                String.format("%.2f", dailyAvg))
                                                .dailyAverage(BigDecimal.valueOf(dailyAvg))
                                                .actualValue(BigDecimal.valueOf(todayActual))
                                                .severity(severity)
                                                .build();
                                anomalyLogRepo.save(anomalyLog);

                                alerts.add(AnomalyAlert.builder()
                                                .branchId(branchId)
                                                .branchName(branch.getName())
                                                .productId(product.getId())
                                                .productName(product.getName())
                                                .dailyAverage(dailyAvg)
                                                .actualDeduction(todayActual)
                                                .severity(severity)
                                                .detectedAt(now)
                                                .build());
                        }
                }
                return alerts;
        }

        /** Get all unresolved anomaly alerts */
        public List<AnomalyAlert> getUnresolvedAnomalies(Long branchId) {
                return anomalyLogRepo.findByBranchIdAndIsResolvedFalse(branchId).stream()
                                .map(log -> AnomalyAlert.builder()
                                                .branchId(log.getBranch().getId())
                                                .branchName(log.getBranch().getName())
                                                .productId(log.getProduct().getId())
                                                .productName(log.getProduct().getName())
                                                .dailyAverage(log.getDailyAverage() != null
                                                                ? log.getDailyAverage().doubleValue()
                                                                : 0)
                                                .actualDeduction(log.getActualValue() != null
                                                                ? log.getActualValue().doubleValue()
                                                                : 0)
                                                .severity(log.getSeverity())
                                                .detectedAt(log.getDetectedAt())
                                                .build())
                                .collect(Collectors.toList());
        }
}
