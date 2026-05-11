package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.security.JwtUtil;
import com.wholesale.system.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Order management controller handling the complete order lifecycle.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final JwtUtil jwtUtil;

    public OrderController(OrderService orderService, JwtUtil jwtUtil) {
        this.orderService = orderService;
        this.jwtUtil = jwtUtil;
    }

    /** Place a new order (Retailer only) */
    @PostMapping
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(orderService.placeOrder(userId, request));
    }

    /** Update order status (role-dependent) */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE', 'BRANCH_ADMIN')")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdate request, HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(orderService.updateOrderStatus(id, userId, request));
    }

    /** Get orders by branch */
    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<OrderResponse>> getByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(orderService.getOrdersByBranch(branchId));
    }

    /** Get orders by branch and status */
    @GetMapping("/branch/{branchId}/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<OrderResponse>> getByBranchAndStatus(@PathVariable Long branchId,
            @PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByBranchAndStatus(branchId, status));
    }

    /** Get my orders (Retailer) */
    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<List<OrderResponse>> getMyOrders(HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(orderService.getOrdersByRetailer(userId));
    }

    /** Get order by ID */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /** Get order timeline */
    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<Object>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderTimeline(id));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
