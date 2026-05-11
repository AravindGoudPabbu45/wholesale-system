package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.service.DashboardService;
import com.wholesale.system.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Dashboard controller providing KPI stats, order pipeline, and alerts.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final OrderService orderService;

    public DashboardController(DashboardService dashboardService, OrderService orderService) {
        this.dashboardService = dashboardService;
        this.orderService = orderService;
    }

    @GetMapping("/super-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<DashboardStats> getSuperAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getSuperAdminStats());
    }

    @GetMapping("/branch-admin/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<DashboardStats> getBranchAdminDashboard(@PathVariable Long branchId) {
        return ResponseEntity.ok(dashboardService.getBranchAdminStats(branchId));
    }

    @GetMapping("/order-pipeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<OrderPipelineStats> getOrderPipeline() {
        return ResponseEntity.ok(orderService.getOrderPipeline());
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<AlertItem>> getAlerts() {
        return ResponseEntity.ok(dashboardService.getAlerts());
    }
}
