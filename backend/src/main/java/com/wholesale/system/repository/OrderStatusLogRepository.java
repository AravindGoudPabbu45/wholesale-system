package com.wholesale.system.repository;

import com.wholesale.system.entity.OrderStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/** Repository for OrderStatusLog entity */
public interface OrderStatusLogRepository extends JpaRepository<OrderStatusLog, Long> {
    List<OrderStatusLog> findByOrderIdOrderByUpdatedAtAsc(Long orderId);
}
