package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Finance controller for payments and sales.
 */
@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE', 'BRANCH_ADMIN', 'RETAILER')")
    public ResponseEntity<PaymentResponse> recordPayment(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(financeService.recordPayment(request));
    }

    @GetMapping("/payments/order/{orderId}")
    public ResponseEntity<PaymentResponse> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(financeService.getPaymentByOrderId(orderId));
    }

    @GetMapping("/payments/pending")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PaymentResponse>> getPendingPayments() {
        return ResponseEntity.ok(financeService.getPendingPayments());
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(financeService.getAllPayments());
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalesResponse>> getAllSales() {
        return ResponseEntity.ok(financeService.getAllSales());
    }
}
