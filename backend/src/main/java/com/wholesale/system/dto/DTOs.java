package com.wholesale.system.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * All DTO classes for the wholesale system.
 * Organized by module for easy reference.
 */
public class DTOs {

    // ==================== AUTH DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "Username is required")
        private String username;
        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank
        private String username;
        @NotBlank
        @Email
        private String email;
        @NotBlank
        @Size(min = 6)
        private String password;
        @NotBlank
        private String fullName;
        
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be a valid 10-digit number")
        private String phone;
        
        @NotBlank
        private String role;
        
        // Optional fields for retailer/supplier registration
        private String businessName;
        
        @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", message = "Invalid GST Number format")
        private String gstNumber;
        private String companyName;
        private String contactPerson;
        private String address;
        private String city;
        private String state;
        
        @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Pincode must be exactly 6 digits")
        private String pincode;
        
        // New multi-phase registration fields
        private String businessLicenseNo;
        private String businessType;
        private Integer yearsInBusiness;
        
        @Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Alternate phone must be a valid 10-digit number or empty")
        private String alternatePhone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String username;
        private String fullName;
        private String email;
        private String role;
        private Long branchId;
        private String branchName;
        private String department;
    }

    // ==================== BRANCH DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BranchRequest {
        @NotBlank
        private String name;
        @NotBlank
        private String location;
        private String city;
        private String state;
        private String pincode;
        private String contactPhone;
        private String contactEmail;
        private Long adminId;
        // Optional: auto-create a new BRANCH_ADMIN user
        private String adminUsername;
        private String adminPassword;
        private String adminEmail;
        private String adminFullName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BranchResponse {
        private Long id;
        private String name;
        private String location;
        private String city;
        private String state;
        private String pincode;
        private String contactPhone;
        private String contactEmail;
        private Long adminId;
        private String adminName;
        private Boolean isActive;
        private LocalDateTime createdAt;
    }

    // ==================== EMPLOYEE DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeRequest {
        @NotBlank
        private String username;
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String fullName;
        private String phone;
        @NotNull
        private Long branchId;
        @NotBlank
        private String department;
        private String designation;
        @NotNull
        private BigDecimal salary;
        private LocalDate joiningDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeResponse {
        private Long id;
        private Long userId;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private Long branchId;
        private String branchName;
        private String department;
        private String designation;
        private BigDecimal salary;
        private String status;
        private LocalDate joiningDate;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeUpdateRequest {
        private String fullName;
        private String phone;
        private String department;
        private String designation;
        private BigDecimal salary;
        private String status;
    }

    // ==================== PRODUCT DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductRequest {
        @NotBlank
        private String name;
        @NotBlank
        private String sku;
        private String category;
        private String description;
        @NotNull
        private BigDecimal price;
        @NotNull
        private BigDecimal costPrice;
        private String unit;
        private Integer thresholdLevel;
        private Integer leadTime;
        private Integer safetyStock;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductResponse {
        private Long id;
        private String name;
        private String sku;
        private String category;
        private String description;
        private BigDecimal price;
        private BigDecimal costPrice;
        private String unit;
        private Integer thresholdLevel;
        private Integer leadTime;
        private Integer safetyStock;
        private Boolean isActive;
    }

    // ==================== INVENTORY DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryResponse {
        private Long id;
        private Long branchId;
        private String branchName;
        private Long productId;
        private String productName;
        private String sku;
        private String category;
        private Integer quantity;
        private Integer thresholdLevel;
        private Boolean isLowStock;
        private LocalDateTime lastUpdated;
    }

    // ==================== ORDER DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderRequest {
        @NotNull
        private Long branchId;
        private String notes;
        @NotEmpty
        private List<OrderItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemRequest {
        @NotNull
        private Long productId;
        @NotNull
        @Min(1)
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderResponse {
        private Long id;
        private String orderNumber;
        private Long retailerId;
        private String retailerName;
        private String businessName;
        private Long branchId;
        private String branchName;
        private BigDecimal totalAmount;
        private String status;
        private String notes;
        private List<OrderItemResponse> items;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String sku;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderStatusUpdate {
        @NotBlank
        private String status;
        private String remarks;
    }

    // ==================== PROCUREMENT DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcurementRequest {
        @NotNull
        private Long branchId;
        @NotNull
        private Long supplierId;
        @NotNull
        private Long productId;
        @NotNull
        @Min(1)
        private Integer quantity;
        private LocalDate expectedDate;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcurementResponse {
        private Long id;
        private Long branchId;
        private String branchName;
        private Long supplierId;
        private String supplierName;
        private Long productId;
        private String productName;
        private String sku;
        private Integer quantity;
        private LocalDate expectedDate;
        private LocalDate actualDeliveryDate;
        private String status;
        private String notes;
        private LocalDateTime createdAt;
    }

    // ==================== PAYMENT DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentRequest {
        @NotNull
        private Long orderId;
        @NotNull
        private BigDecimal amount;
        private String paymentMethod;
        private String transactionId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentResponse {
        private Long id;
        private Long orderId;
        private String orderNumber;
        private BigDecimal amount;
        private String paymentStatus;
        private String paymentMethod;
        private String transactionId;
        private LocalDateTime paymentDate;
    }

    // ==================== MESSAGE DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageRequest {
        @NotNull
        private Long receiverId;
        @NotBlank
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageResponse {
        private Long id;
        private Long senderId;
        private String senderName;
        private Long receiverId;
        private String receiverName;
        private String content;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }

    // ==================== SUPPORT TICKET DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketRequest {
        private Long branchId;
        @NotBlank
        private String subject;
        private String description;
        private String priority;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketResponse {
        private Long id;
        private String ticketNumber;
        private Long retailerId;
        private String retailerName;
        private Long branchId;
        private String branchName;
        private Long assignedEmployeeId;
        private String assignedEmployeeName;
        private String subject;
        private String description;
        private String status;
        private String priority;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketUpdateRequest {
        private String status;
        private Long assignedEmployeeId;
        private String priority;
    }

    // ==================== RETAILER DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RetailerResponse {
        private Long id;
        private Long userId;
        private String fullName;
        private String email;
        private String businessName;
        private String gstNumber;
        private String address;
        private String city;
        private String state;
        private String pincode;
        private String approvalStatus;
        private LocalDateTime createdAt;
    }

    // ==================== SUPPLIER DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SupplierResponse {
        private Long id;
        private Long userId;
        private String companyName;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private String city;
        private String state;
        private String status;
    }

    // ==================== DASHBOARD / ANALYTICS DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardStats {
        private Long totalBranches;
        private Long totalEmployees;
        private Long totalRetailers;
        private Long totalProducts;
        private Long totalOrders;
        private Long pendingOrders;
        private Long deliveredOrders;
        private BigDecimal totalRevenue;
        private BigDecimal totalProfit;
        private Long openTickets;
        private Long lowStockAlerts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BranchAnalytics {
        private Long branchId;
        private String branchName;
        private BigDecimal revenue;
        private BigDecimal profit;
        private Long orderCount;
        private Long employeeCount;
        private BigDecimal salaryExpense;
    }

    // ==================== AI SIMULATION DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DemandForecast {
        private Long productId;
        private String productName;
        private Double averageDailySales;
        private Double forecastedDemand30Days;
        private Integer currentStock;
        private Integer reorderSuggestion;
        private Boolean needsReorder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnomalyAlert {
        private Long branchId;
        private String branchName;
        private Long productId;
        private String productName;
        private Double dailyAverage;
        private Double actualDeduction;
        private String severity;
        private LocalDateTime detectedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockMovementResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String changeType;
        private Integer quantityChanged;
        private Integer quantityBefore;
        private Integer quantityAfter;
        private String referenceType;
        private Long referenceId;
        private String changedByName;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesResponse {
        private Long id;
        private Long orderId;
        private String orderNumber;
        private BigDecimal revenue;
        private BigDecimal cost;
        private BigDecimal profit;
        private LocalDateTime recordedAt;
    }

    // ==================== AI DEMAND FORECASTING DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForecastDetail {
        private Long productId;
        private String productName;
        private String sku;
        private String category;
        private Integer currentStock;
        private Integer currentThreshold;
        private Integer leadTimeDays;
        // Demand metrics
        private Double simpleDailyAvg;
        private Double weightedAvgDailySales;
        private Double demandStdDev;
        private Double forecastedDemand30Days;
        // Trend analysis
        private String trendDirection;  // INCREASING, DECREASING, STABLE
        private Double trendSlope;
        // Seasonality
        private String peakDayOfWeek;
        // Reorder intelligence
        private Integer optimalReorderPoint;
        private Integer economicOrderQuantity;
        private Double estimatedDaysUntilStockout;
        private String urgency;  // CRITICAL, HIGH, MEDIUM, LOW
        private Boolean needsReorder;
        // Confidence
        private Double confidenceScore;  // 0.0–1.0
        private Integer dataPointsUsed;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForecastSummary {
        private Long branchId;
        private String branchName;
        private Integer analysisWindowDays;
        private LocalDateTime analyzedAt;
        private Integer totalProducts;
        private Integer productsNeedingReorder;
        private Integer criticalItems;
        private Double forecastedMonthlyRevenue;
        private List<ForecastDetail> forecasts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReorderRecommendation {
        private Long productId;
        private String productName;
        private String sku;
        private Integer currentStock;
        private Integer optimalReorderPoint;
        private Integer economicOrderQuantity;
        private Double estimatedDaysUntilStockout;
        private String urgency;
        private Double avgDailySales;
        private Double confidenceScore;
    }

    // ==================== NOTIFICATION DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationResponse {
        private Long id;
        private String title;
        private String message;
        private String type;
        private String referenceType;
        private Long referenceId;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }

    // ==================== ORDER PIPELINE DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderPipelineStats {
        private Long pending;
        private Long validated;
        private Long approved;
        private Long packed;
        private Long shipped;
        private Long inTransit;
        private Long delivered;
        private Long cancelled;
        private Long total;
    }

    // ==================== ALERT SUMMARY DTO ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertItem {
        private String type;
        private String severity;
        private String title;
        private String message;
        private String referenceType;
        private Long referenceId;
        private LocalDateTime createdAt;
    }

    // ==================== ORDER TRACKING DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackingEvent {
        private String status;
        private String location;
        private String description;
        private LocalDateTime timestamp;
        private Boolean isCompleted;
        private Boolean isCurrent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackingResponse {
        private Long orderId;
        private String orderNumber;
        private String currentStatus;
        private String retailerName;
        private String branchName;
        private BigDecimal totalAmount;
        private LocalDateTime estimatedDelivery;
        private List<TrackingEvent> timeline;
    }

    // ==================== INVENTORY ACTION DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryAdjustRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;
        @NotNull(message = "Branch ID is required")
        private Long branchId;
        @NotNull(message = "Quantity is required")
        private Integer quantity;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThresholdUpdateRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;
        @NotNull(message = "Threshold is required")
        private Integer thresholdLevel;
    }
}
