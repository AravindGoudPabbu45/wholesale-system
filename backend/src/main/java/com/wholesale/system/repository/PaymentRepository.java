package com.wholesale.system.repository;

import com.wholesale.system.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/** Repository for Payment entity */
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);

    List<Payment> findByPaymentStatus(String paymentStatus);
}
