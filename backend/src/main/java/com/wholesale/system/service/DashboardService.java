package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Dashboard service providing aggregated statistics, alerts, and pipeline data.
 */
@Service
public class DashboardService {

    private final BranchRepository branchRepo;
    private final EmployeeRepository employeeRepo;
    private final RetailerRepository retailerRepo;
    private final ProductRepository productRepo;
    private final OrderRepository orderRepo;
    private final InventoryRepository inventoryRepo;
    private final SalesRepository salesRepo;
    private final SupportTicketRepository ticketRepo;
    private final PaymentRepository paymentRepo;

    public DashboardService(BranchRepository branchRepo, EmployeeRepository employeeRepo,
            RetailerRepository retailerRepo, ProductRepository productRepo,
            OrderRepository orderRepo, InventoryRepository inventoryRepo,
            SalesRepository salesRepo, SupportTicketRepository ticketRepo,
            PaymentRepository paymentRepo) {
        this.branchRepo = branchRepo;
        this.employeeRepo = employeeRepo;
        this.retailerRepo = retailerRepo;
        this.productRepo = productRepo;
        this.orderRepo = orderRepo;
        this.inventoryRepo = inventoryRepo;
        this.salesRepo = salesRepo;
        this.ticketRepo = ticketRepo;
        this.paymentRepo = paymentRepo;
    }

    /** Super Admin dashboard stats */
    public DashboardStats getSuperAdminStats() {
        BigDecimal revenue = salesRepo.sumTotalRevenue();
        BigDecimal profit = salesRepo.sumTotalProfit();

        return DashboardStats.builder()
                .totalBranches((long) branchRepo.findByIsActiveTrue().size())
                .totalEmployees(employeeRepo.count())
                .totalRetailers((long) retailerRepo.findByApprovalStatus("APPROVED").size())
                .totalProducts((long) productRepo.findByIsActiveTrue().size())
                .totalOrders(orderRepo.count())
                .pendingOrders((long) orderRepo.findByStatus("PENDING").size() +
                        (long) orderRepo.findByStatus("VALIDATED").size() +
                        (long) orderRepo.findByStatus("APPROVED").size())
                .deliveredOrders((long) orderRepo.findByStatus("DELIVERED").size())
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalProfit(profit != null ? profit : BigDecimal.ZERO)
                .openTickets((long) ticketRepo.findByStatus("OPEN").size())
                .lowStockAlerts((long) inventoryRepo.findAllLowStock().size())
                .build();
    }

    /** Branch Admin dashboard stats */
    public DashboardStats getBranchAdminStats(Long branchId) {
        BigDecimal revenue = salesRepo.sumRevenueByBranch(branchId);
        BigDecimal profit = salesRepo.sumProfitByBranch(branchId);

        return DashboardStats.builder()
                .totalEmployees((long) employeeRepo.findActiveByBranch(branchId).size())
                .totalOrders((long) orderRepo.findByBranchId(branchId).size())
                .pendingOrders(orderRepo.countByBranchAndStatus(branchId, "PENDING") +
                        orderRepo.countByBranchAndStatus(branchId, "APPROVED"))
                .deliveredOrders(orderRepo.countByBranchAndStatus(branchId, "DELIVERED"))
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalProfit(profit != null ? profit : BigDecimal.ZERO)
                .openTickets((long) ticketRepo.findByBranchIdAndStatus(branchId, "OPEN").size())
                .lowStockAlerts((long) inventoryRepo.findLowStockByBranch(branchId).size())
                .build();
    }

    /** Get system alerts — low stock, overdue orders, pending payments */
    public List<AlertItem> getAlerts() {
        List<AlertItem> alerts = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Low stock alerts
        List<Inventory> lowStock = inventoryRepo.findAllLowStock();
        for (Inventory inv : lowStock) {
            String severity = inv.getQuantity() <= 0 ? "CRITICAL" :
                    inv.getQuantity() <= inv.getProduct().getThresholdLevel() / 2 ? "HIGH" : "MEDIUM";
            alerts.add(AlertItem.builder()
                    .type("STOCK")
                    .severity(severity)
                    .title("Low Stock: " + inv.getProduct().getName())
                    .message(inv.getBranch().getName() + " — Current: " + inv.getQuantity() +
                            ", Threshold: " + inv.getProduct().getThresholdLevel())
                    .referenceType("INVENTORY")
                    .referenceId(inv.getId())
                    .createdAt(now)
                    .build());
        }

        // Pending payments alerts
        List<Payment> pendingPayments = paymentRepo.findByPaymentStatus("PENDING");
        for (Payment p : pendingPayments) {
            alerts.add(AlertItem.builder()
                    .type("PAYMENT")
                    .severity("MEDIUM")
                    .title("Pending Payment: " + p.getOrder().getOrderNumber())
                    .message("₹" + p.getAmount().toPlainString() + " awaiting payment")
                    .referenceType("ORDER")
                    .referenceId(p.getOrder().getId())
                    .createdAt(now)
                    .build());
        }

        return alerts;
    }
}
