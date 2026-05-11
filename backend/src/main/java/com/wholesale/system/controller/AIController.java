package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.service.AIService;
import com.wholesale.system.service.DemandForecastingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * AI Analytics controller - demand forecasting, anomaly detection, reorder
 * suggestions.
 */
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;
    private final DemandForecastingService forecastService;

    public AIController(AIService aiService, DemandForecastingService forecastService) {
        this.aiService = aiService;
        this.forecastService = forecastService;
    }

    // ==================== Basic Forecasting (existing) ====================

    @GetMapping("/forecast/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<DemandForecast>> getDemandForecast(@PathVariable Long branchId) {
        return ResponseEntity.ok(aiService.getDemandForecast(branchId));
    }

    @GetMapping("/anomalies/detect/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<AnomalyAlert>> detectAnomalies(@PathVariable Long branchId) {
        return ResponseEntity.ok(aiService.detectAnomalies(branchId));
    }

    @GetMapping("/anomalies/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<AnomalyAlert>> getUnresolvedAnomalies(@PathVariable Long branchId) {
        return ResponseEntity.ok(aiService.getUnresolvedAnomalies(branchId));
    }

    // ==================== Advanced AI Forecasting ====================

    /**
     * Full AI-driven demand forecast for all products at a branch.
     * Includes WMA, trend detection, seasonality, reorder points, EOQ.
     */
    @GetMapping("/forecast/advanced/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<ForecastSummary> getAdvancedForecast(@PathVariable Long branchId) {
        return ResponseEntity.ok(forecastService.getAdvancedForecast(branchId));
    }

    /**
     * Deep analysis for a single product at a specific branch.
     */
    @GetMapping("/forecast/product/{productId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<ForecastDetail> getProductForecast(
            @PathVariable Long productId,
            @RequestParam Long branchId) {
        return ResponseEntity.ok(forecastService.getProductForecast(branchId, productId));
    }

    /**
     * Get reorder recommendations — only products needing reorder,
     * sorted by urgency (critical first).
     */
    @GetMapping("/reorder-recommendations/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<ReorderRecommendation>> getReorderRecommendations(
            @PathVariable Long branchId) {
        return ResponseEntity.ok(forecastService.getReorderRecommendations(branchId));
    }

    /**
     * Apply AI-recommended thresholds and safety stock to products.
     * Only updates products with confidence > 0.3.
     */
    @PostMapping("/apply-recommendations/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<Map<String, Object>> applyRecommendations(@PathVariable Long branchId) {
        return ResponseEntity.ok(forecastService.applyRecommendations(branchId));
    }
}
