package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Finance service for payments, invoices, and sales tracking.
 */
@Service
public class FinanceService {

    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;
    private final SalesRepository salesRepo;

    public FinanceService(PaymentRepository paymentRepo, OrderRepository orderRepo, SalesRepository salesRepo) {
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.salesRepo = salesRepo;
    }

    /** Record a payment for an order */
    @Transactional
    public PaymentResponse recordPayment(PaymentRequest req) {
        Order order = orderRepo.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Payment payment = paymentRepo.findByOrderId(req.getOrderId())
                .orElse(Payment.builder().order(order).amount(req.getAmount()).build());

        payment.setPaymentStatus("PAID");
        payment.setPaymentMethod(req.getPaymentMethod());
        payment.setTransactionId(req.getTransactionId());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setAmount(req.getAmount());

        return toResponse(paymentRepo.save(payment));
    }

    /** Get payment by order ID */
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepo.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order"));
        return toResponse(payment);
    }

    /** Get all pending payments */
    public List<PaymentResponse> getPendingPayments() {
        return paymentRepo.findByPaymentStatus("PENDING").stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get all payments */
    public List<PaymentResponse> getAllPayments() {
        return paymentRepo.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get all sales records */
    public List<SalesResponse> getAllSales() {
        return salesRepo.findAll().stream().map(s -> SalesResponse.builder()
                .id(s.getId()).orderId(s.getOrder().getId()).orderNumber(s.getOrder().getOrderNumber())
                .revenue(s.getRevenue()).cost(s.getCost()).profit(s.getProfit())
                .recordedAt(s.getRecordedAt()).build()).collect(Collectors.toList());
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId()).orderId(p.getOrder().getId())
                .orderNumber(p.getOrder().getOrderNumber())
                .amount(p.getAmount()).paymentStatus(p.getPaymentStatus())
                .paymentMethod(p.getPaymentMethod()).transactionId(p.getTransactionId())
                .paymentDate(p.getPaymentDate()).build();
    }
}
