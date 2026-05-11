package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Order management service — AI-driven workflow engine.
 *
 * AUTOMATED ORDER LIFECYCLE:
 * PENDING → (auto) VALIDATED → (auto) APPROVED → PACKED → SHIPPED → IN_TRANSIT → DELIVERED → (auto) COMPLETED
 *                                                                                (or CANCELLED at any pre-ship stage)
 *
 * Automation triggers:
 * - On place order: auto-validate stock, auto-approve, notify warehouse
 * - On PACKED: deduct inventory, check thresholds, auto-trigger procurement
 * - On DELIVERED: auto-create sales record, auto-update payment, mark COMPLETED, notify finance
 */
@Service
public class OrderService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final OrderStatusLogRepository statusLogRepo;
    private final RetailerRepository retailerRepo;
    private final BranchRepository branchRepo;
    private final ProductRepository productRepo;
    private final InventoryRepository inventoryRepo;
    private final StockMovementLogRepository stockLogRepo;
    private final SalesRepository salesRepo;
    private final PaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;
    private final ProcurementOrderRepository procurementRepo;
    private final SupplierRepository supplierRepo;
    private final OrderTrackingService trackingService;

    public OrderService(OrderRepository orderRepo, OrderItemRepository orderItemRepo,
            OrderStatusLogRepository statusLogRepo, RetailerRepository retailerRepo,
            BranchRepository branchRepo, ProductRepository productRepo,
            InventoryRepository inventoryRepo, StockMovementLogRepository stockLogRepo,
            SalesRepository salesRepo, PaymentRepository paymentRepo,
            UserRepository userRepo, NotificationService notificationService,
            ProcurementOrderRepository procurementRepo, SupplierRepository supplierRepo,
            OrderTrackingService trackingService) {
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.statusLogRepo = statusLogRepo;
        this.retailerRepo = retailerRepo;
        this.branchRepo = branchRepo;
        this.productRepo = productRepo;
        this.inventoryRepo = inventoryRepo;
        this.stockLogRepo = stockLogRepo;
        this.salesRepo = salesRepo;
        this.paymentRepo = paymentRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
        this.procurementRepo = procurementRepo;
        this.supplierRepo = supplierRepo;
        this.trackingService = trackingService;
    }

    /**
     * Place a new order (Retailer) — FULLY AUTOMATED PIPELINE.
     * 1. Validate retailer is approved
     * 2. Check stock availability for ALL items
     * 3. Auto-validate → auto-approve → reserve stock
     * 4. Create pending payment
     * 5. Notify warehouse employees to pack
     * 6. Notify retailer of confirmation
     */
    @Transactional
    public OrderResponse placeOrder(Long userId, OrderRequest req) {
        Retailer retailer = retailerRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer profile not found"));
        if (!"APPROVED".equals(retailer.getApprovalStatus())) {
            throw new BadRequestException("Your retailer account is not yet approved");
        }

        Branch branch = branchRepo.findById(req.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        // Generate unique order number
        String orderNumber = "ORD-" + java.time.Year.now().getValue() + "-" +
                String.format("%04d", orderRepo.count() + 1);

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .retailer(retailer)
                .branch(branch)
                .status("PENDING")
                .notes(req.getNotes())
                .build();
        order = orderRepo.save(order);

        BigDecimal totalAmount = BigDecimal.ZERO;
        boolean allStockAvailable = true;

        // --- Step 1: Validate all items and calculate total ---
        for (OrderItemRequest itemReq : req.getItems()) {
            Product product = productRepo.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));

            Inventory inventory = inventoryRepo.findByBranchIdAndProductId(branch.getId(), product.getId())
                    .orElseThrow(() -> new BadRequestException(
                            "Product not available at this branch: " + product.getName()));

            if (inventory.getQuantity() < itemReq.getQuantity()) {
                allStockAvailable = false;
                throw new BadRequestException("Insufficient stock for " + product.getName() +
                        ". Available: " + inventory.getQuantity() + ", Requested: " + itemReq.getQuantity());
            }

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(product.getPrice())
                    .totalPrice(itemTotal)
                    .build();
            orderItemRepo.save(item);
            totalAmount = totalAmount.add(itemTotal);
        }

        order.setTotalAmount(totalAmount);
        logStatusChange(order, "PENDING", userId, "Order placed by retailer");

        // --- Step 2: AUTO-VALIDATE (stock already checked above) ---
        if (allStockAvailable) {
            order.setStatus("VALIDATED");
            logStatusChange(order, "VALIDATED", userId, "✅ Auto-validated: all stock available");

            // --- Step 3: AUTO-APPROVE ---
            order.setStatus("APPROVED");
            logStatusChange(order, "APPROVED", userId, "✅ Auto-approved: stock validated and reserved");

            // --- Step 4: RESERVE STOCK (deduct immediately on approval) ---
            reserveStockForOrder(order, userId);
        }

        order = orderRepo.save(order);

        // --- Add tracking events ---
        trackingService.addTrackingEvent(order, "PENDING");
        if (allStockAvailable) {
            trackingService.addTrackingEvent(order, "APPROVED");
        }

        // --- Step 5: Create pending payment ---
        Payment payment = Payment.builder()
                .order(order)
                .amount(totalAmount)
                .paymentStatus("PENDING")
                .build();
        paymentRepo.save(payment);

        // --- Step 6: NOTIFICATIONS ---
        // Notify retailer
        notificationService.notify(userId,
                "🛒 Order Confirmed: " + orderNumber,
                "Your order worth ₹" + totalAmount.toPlainString() + " has been auto-approved and is ready for packing.",
                "ORDER", "ORDER", order.getId());

        // Notify warehouse employees to pack
        notificationService.notifyBranchEmployees(branch.getId(), "WAREHOUSE",
                "📦 New Order to Pack: " + orderNumber,
                "Order " + orderNumber + " (₹" + totalAmount.toPlainString() + ") is approved and ready for packing.",
                "ORDER", "ORDER", order.getId());

        // Notify branch admin
        notificationService.notifyBranchEmployees(branch.getId(), null,
                "🆕 New Order Received: " + orderNumber,
                "Retailer " + retailer.getBusinessName() + " placed order worth ₹" + totalAmount.toPlainString(),
                "ORDER", "ORDER", order.getId());

        return toResponse(order);
    }

    /**
     * Update order status (role-dependent) — with automated triggers.
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, Long userId, OrderStatusUpdate req) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        String newStatus = req.getStatus();
        validateStatusTransition(order.getStatus(), newStatus);

        // === PACKED: deduct inventory + check thresholds ===
        if ("PACKED".equals(newStatus)) {
            // If order was auto-approved (stock already reserved/deducted), skip deduction
            // If order was manually approved without reservation, deduct now
            if (!"APPROVED".equals(order.getStatus()) || !isStockAlreadyReserved(order)) {
                deductInventoryForOrder(order, userId);
            }

            // Notify logistics for shipping
            notificationService.notifyBranchEmployees(order.getBranch().getId(), "LOGISTICS",
                    "🚚 Order Ready for Shipping: " + order.getOrderNumber(),
                    "Order " + order.getOrderNumber() + " has been packed and is ready for pickup.",
                    "DELIVERY", "ORDER", order.getId());

            // Check if any product fell below threshold — auto-trigger procurement
            checkAndTriggerProcurement(order, userId);
        }

        // === SHIPPED: notify retailer ===
        if ("SHIPPED".equals(newStatus)) {
            notificationService.notify(order.getRetailer().getUser().getId(),
                    "🚛 Order Shipped: " + order.getOrderNumber(),
                    "Your order " + order.getOrderNumber() + " has been shipped and is on its way!",
                    "DELIVERY", "ORDER", order.getId());
        }

        // === IN_TRANSIT: update tracking ===
        if ("IN_TRANSIT".equals(newStatus)) {
            notificationService.notify(order.getRetailer().getUser().getId(),
                    "📍 Order In Transit: " + order.getOrderNumber(),
                    "Your order " + order.getOrderNumber() + " is in transit and will be delivered soon.",
                    "DELIVERY", "ORDER", order.getId());
        }

        // === DELIVERED: create sales record + auto-complete payment ===
        if ("DELIVERED".equals(newStatus)) {
            createSalesRecord(order);
            autoCompletePayment(order);

            // Auto-advance to COMPLETED
            order.setStatus("DELIVERED");
            logStatusChange(order, "DELIVERED", userId, req.getRemarks());

            // Notify retailer
            notificationService.notify(order.getRetailer().getUser().getId(),
                    "✅ Order Delivered: " + order.getOrderNumber(),
                    "Your order " + order.getOrderNumber() + " has been delivered! Thank you for your business.",
                    "DELIVERY", "ORDER", order.getId());

            // Notify finance
            notificationService.notifyBranchEmployees(order.getBranch().getId(), "FINANCE",
                    "💰 Payment Auto-Completed: " + order.getOrderNumber(),
                    "Order " + order.getOrderNumber() + " delivered. Payment of ₹" +
                            order.getTotalAmount().toPlainString() + " marked as PAID.",
                    "PAYMENT", "ORDER", order.getId());

            order = orderRepo.save(order);
            return toResponse(order);
        }

        order.setStatus(newStatus);
        order = orderRepo.save(order);
        logStatusChange(order, newStatus, userId, req.getRemarks());

        // --- Record tracking event ---
        trackingService.addTrackingEvent(order, newStatus);

        return toResponse(order);
    }

    /** Get all orders for a branch */
    public List<OrderResponse> getOrdersByBranch(Long branchId) {
        return orderRepo.findByBranchId(branchId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get all orders for a retailer */
    public List<OrderResponse> getOrdersByRetailer(Long userId) {
        Retailer retailer = retailerRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer not found"));
        return orderRepo.findByRetailerId(retailer.getId()).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get orders by status for a branch */
    public List<OrderResponse> getOrdersByBranchAndStatus(Long branchId, String status) {
        return orderRepo.findByBranchIdAndStatus(branchId, status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get order by ID */
    public OrderResponse getOrderById(Long orderId) {
        return toResponse(orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found")));
    }

    /** Get order timeline (status logs) */
    public List<Object> getOrderTimeline(Long orderId) {
        return statusLogRepo.findByOrderIdOrderByUpdatedAtAsc(orderId).stream()
                .map(log -> {
                    java.util.Map<String, Object> entry = new java.util.HashMap<>();
                    entry.put("status", log.getStatus());
                    entry.put("remarks", log.getRemarks());
                    entry.put("updatedAt", log.getUpdatedAt());
                    if (log.getChangedBy() != null) {
                        entry.put("changedBy", log.getChangedBy().getFullName());
                    }
                    return (Object) entry;
                }).collect(Collectors.toList());
    }

    /** Get order pipeline stats */
    public OrderPipelineStats getOrderPipeline() {
        return OrderPipelineStats.builder()
                .pending((long) orderRepo.findByStatus("PENDING").size())
                .validated((long) orderRepo.findByStatus("VALIDATED").size())
                .approved((long) orderRepo.findByStatus("APPROVED").size())
                .packed((long) orderRepo.findByStatus("PACKED").size())
                .shipped((long) orderRepo.findByStatus("SHIPPED").size())
                .inTransit((long) orderRepo.findByStatus("IN_TRANSIT").size())
                .delivered((long) orderRepo.findByStatus("DELIVERED").size())
                .cancelled((long) orderRepo.findByStatus("CANCELLED").size())
                .total(orderRepo.count())
                .build();
    }

    // ==================== PRIVATE AUTOMATION METHODS ====================

    /** Reserve (deduct) stock immediately upon auto-approval */
    private void reserveStockForOrder(Order order, Long userId) {
        List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
        User user = userRepo.findById(userId).orElse(null);

        for (OrderItem item : items) {
            Inventory inventory = inventoryRepo.findByBranchIdAndProductId(
                    order.getBranch().getId(), item.getProduct().getId())
                    .orElseThrow(() -> new BadRequestException(
                            "Inventory not found for product: " + item.getProduct().getName()));

            int before = inventory.getQuantity();
            int after = before - item.getQuantity();
            if (after < 0) {
                throw new BadRequestException("Insufficient stock to reserve: " + item.getProduct().getName());
            }

            inventory.setQuantity(after);
            inventoryRepo.save(inventory);

            StockMovementLog log = StockMovementLog.builder()
                    .branch(order.getBranch())
                    .product(item.getProduct())
                    .changeType("ORDER_RESERVED")
                    .quantityChanged(-item.getQuantity())
                    .quantityBefore(before)
                    .quantityAfter(after)
                    .referenceType("ORDER")
                    .referenceId(order.getId())
                    .changedBy(user)
                    .notes("Stock auto-reserved for order " + order.getOrderNumber())
                    .build();
            stockLogRepo.save(log);
        }
    }

    /** Check if stock was already reserved (deducted) during auto-approval */
    private boolean isStockAlreadyReserved(Order order) {
        List<StockMovementLog> logs = stockLogRepo
                .findByReferenceTypeAndReferenceId("ORDER", order.getId());
        return logs.stream().anyMatch(l -> "ORDER_RESERVED".equals(l.getChangeType()));
    }

    /** Deduct stock when order is packed (legacy path for manual approvals) */
    private void deductInventoryForOrder(Order order, Long userId) {
        List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
        User user = userRepo.findById(userId).orElse(null);

        for (OrderItem item : items) {
            Inventory inventory = inventoryRepo.findByBranchIdAndProductId(
                    order.getBranch().getId(), item.getProduct().getId())
                    .orElseThrow(() -> new BadRequestException(
                            "Inventory not found for product: " + item.getProduct().getName()));

            int before = inventory.getQuantity();
            int after = before - item.getQuantity();
            if (after < 0) {
                throw new BadRequestException("Insufficient stock to pack: " + item.getProduct().getName());
            }

            inventory.setQuantity(after);
            inventoryRepo.save(inventory);

            StockMovementLog log = StockMovementLog.builder()
                    .branch(order.getBranch())
                    .product(item.getProduct())
                    .changeType("ORDER_PACKED")
                    .quantityChanged(-item.getQuantity())
                    .quantityBefore(before)
                    .quantityAfter(after)
                    .referenceType("ORDER")
                    .referenceId(order.getId())
                    .changedBy(user)
                    .notes("Stock deducted for order " + order.getOrderNumber())
                    .build();
            stockLogRepo.save(log);
        }
    }

    /**
     * AUTO-TRIGGER PROCUREMENT when stock drops below threshold after an order.
     * Uses the first available supplier to auto-create a procurement order.
     */
    private void checkAndTriggerProcurement(Order order, Long userId) {
        List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
        User user = userRepo.findById(userId).orElse(null);

        for (OrderItem item : items) {
            Inventory inventory = inventoryRepo.findByBranchIdAndProductId(
                    order.getBranch().getId(), item.getProduct().getId()).orElse(null);
            if (inventory == null) continue;

            Product product = item.getProduct();
            if (inventory.getQuantity() < product.getThresholdLevel()) {
                // Calculate reorder quantity (EOQ or 2x threshold)
                int reorderQty = Math.max(product.getThresholdLevel() * 2, product.getSafetyStock() * 3);

                // Find first active supplier
                List<Supplier> suppliers = supplierRepo.findByStatus("ACTIVE");
                if (suppliers.isEmpty()) continue;
                Supplier supplier = suppliers.get(0);

                // Auto-create procurement order
                ProcurementOrder po = ProcurementOrder.builder()
                        .branch(order.getBranch())
                        .supplier(supplier)
                        .product(product)
                        .quantity(reorderQty)
                        .expectedDate(LocalDate.now().plusDays(product.getLeadTime()))
                        .status("REQUESTED")
                        .createdBy(user)
                        .notes("🤖 Auto-generated: Stock dropped below threshold after order " +
                                order.getOrderNumber() + ". Current: " + inventory.getQuantity() +
                                ", Threshold: " + product.getThresholdLevel())
                        .build();
                procurementRepo.save(po);

                // Notify procurement employees
                notificationService.notifyBranchEmployees(order.getBranch().getId(), "PROCUREMENT",
                        "⚠️ Auto-Procurement Created: " + product.getName(),
                        "Stock for " + product.getName() + " dropped to " + inventory.getQuantity() +
                                " (threshold: " + product.getThresholdLevel() +
                                "). Auto-created procurement order for " + reorderQty + " units.",
                        "PROCUREMENT", "PROCUREMENT", po.getId());

                // Notify branch admin
                notificationService.notifyRole("SUPER_ADMIN",
                        "📊 Low Stock Alert: " + product.getName(),
                        "Stock for " + product.getName() + " at " + order.getBranch().getName() +
                                " is " + inventory.getQuantity() + " (below threshold " +
                                product.getThresholdLevel() + "). Auto-procurement created.",
                        "STOCK", "INVENTORY", inventory.getId());
            }
        }
    }

    /** Create sales record when order is delivered */
    private void createSalesRecord(Order order) {
        List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal cost = BigDecimal.ZERO;
        for (OrderItem item : items) {
            revenue = revenue.add(item.getTotalPrice());
            cost = cost.add(item.getProduct().getCostPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        Sales sales = Sales.builder()
                .order(order)
                .revenue(revenue)
                .cost(cost)
                .profit(revenue.subtract(cost))
                .build();
        salesRepo.save(sales);
    }

    /** Auto-complete payment when order is delivered */
    private void autoCompletePayment(Order order) {
        paymentRepo.findByOrderId(order.getId()).ifPresent(payment -> {
            payment.setPaymentStatus("PAID");
            payment.setPaymentMethod("AUTO");
            payment.setPaymentDate(java.time.LocalDateTime.now());
            paymentRepo.save(payment);
        });
    }

    /** Validate order status transitions — expanded pipeline */
    private void validateStatusTransition(String current, String next) {
        boolean valid = switch (current) {
            case "PENDING" -> "VALIDATED".equals(next) || "APPROVED".equals(next) || "CANCELLED".equals(next);
            case "VALIDATED" -> "APPROVED".equals(next) || "CANCELLED".equals(next);
            case "APPROVED" -> "PACKED".equals(next) || "CANCELLED".equals(next);
            case "PACKED" -> "SHIPPED".equals(next);
            case "SHIPPED" -> "IN_TRANSIT".equals(next) || "DELIVERED".equals(next);
            case "IN_TRANSIT" -> "NEARBY".equals(next) || "OUT_FOR_DELIVERY".equals(next) || "DELIVERED".equals(next);
            case "NEARBY" -> "OUT_FOR_DELIVERY".equals(next) || "DELIVERED".equals(next);
            case "OUT_FOR_DELIVERY" -> "DELIVERED".equals(next);
            default -> false;
        };
        if (!valid) {
            throw new BadRequestException("Invalid status transition: " + current + " → " + next);
        }
    }

    /** Log status change for audit trail */
    private void logStatusChange(Order order, String status, Long userId, String remarks) {
        User user = userRepo.findById(userId).orElse(null);
        OrderStatusLog log = OrderStatusLog.builder()
                .order(order)
                .status(status)
                .changedBy(user)
                .remarks(remarks)
                .build();
        statusLogRepo.save(log);
    }

    /** Convert Order entity to OrderResponse DTO */
    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = orderItemRepo.findByOrderId(o.getId()).stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .sku(item.getProduct().getSku())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .retailerId(o.getRetailer().getId())
                .retailerName(o.getRetailer().getUser().getFullName())
                .businessName(o.getRetailer().getBusinessName())
                .branchId(o.getBranch().getId())
                .branchName(o.getBranch().getName())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .notes(o.getNotes())
                .items(items)
                .createdAt(o.getCreatedAt())
                .build();
    }
}
