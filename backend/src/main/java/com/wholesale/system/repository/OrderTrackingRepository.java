package com.wholesale.system.repository;

import com.wholesale.system.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/** Repository for OrderTracking entity */
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {
    List<OrderTracking> findByOrderIdOrderByCreatedAtAsc(Long orderId);

    List<OrderTracking> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
