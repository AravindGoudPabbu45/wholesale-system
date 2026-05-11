package com.wholesale.system.repository;

import com.wholesale.system.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** Repository for Order entity */
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByRetailerId(Long retailerId);

    List<Order> findByBranchId(Long branchId);

    List<Order> findByBranchIdAndStatus(Long branchId, String status);

    List<Order> findByStatus(String status);

    @Query("SELECT o FROM Order o WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end")
    List<Order> findByBranchAndDateRange(Long branchId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.branch.id = :branchId AND o.status = :status")
    Long countByBranchAndStatus(Long branchId, String status);
}
