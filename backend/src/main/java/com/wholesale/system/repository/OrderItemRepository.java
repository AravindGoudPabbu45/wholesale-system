package com.wholesale.system.repository;

import com.wholesale.system.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

/** Repository for OrderItem entity */
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    /**
     * Sum qty sold per product in a branch within a date range (for AI
     * forecasting).
     * Returns: [productId, totalQty]
     */
    @Query("SELECT oi.product.id, SUM(oi.quantity) FROM OrderItem oi " +
            "WHERE oi.order.branch.id = :branchId " +
            "AND oi.order.status IN ('APPROVED','PACKED','SHIPPED','DELIVERED') " +
            "AND oi.order.createdAt BETWEEN :start AND :end " +
            "GROUP BY oi.product.id")
    List<Object[]> sumQuantityByProductAndBranchInRange(Long branchId, LocalDateTime start, LocalDateTime end);

    /**
     * Daily sales totals for a specific product at a branch (for trend analysis).
     * Returns: [date as LocalDate, totalQty]
     */
    @Query("SELECT CAST(oi.order.createdAt AS localdate), SUM(oi.quantity) FROM OrderItem oi " +
            "WHERE oi.order.branch.id = :branchId " +
            "AND oi.product.id = :productId " +
            "AND oi.order.status IN ('APPROVED','PACKED','SHIPPED','DELIVERED') " +
            "AND oi.order.createdAt BETWEEN :start AND :end " +
            "GROUP BY CAST(oi.order.createdAt AS localdate) " +
            "ORDER BY CAST(oi.order.createdAt AS localdate)")
    List<Object[]> dailySalesForProduct(Long branchId, Long productId, LocalDateTime start, LocalDateTime end);

    /**
     * Weekly sales totals for a product - used for weighted moving average.
     * Returns: [weekNumber (int), totalQty]
     */
    @Query("SELECT FUNCTION('WEEK', oi.order.createdAt), SUM(oi.quantity) FROM OrderItem oi " +
            "WHERE oi.order.branch.id = :branchId " +
            "AND oi.product.id = :productId " +
            "AND oi.order.status IN ('APPROVED','PACKED','SHIPPED','DELIVERED') " +
            "AND oi.order.createdAt BETWEEN :start AND :end " +
            "GROUP BY FUNCTION('WEEK', oi.order.createdAt) " +
            "ORDER BY FUNCTION('WEEK', oi.order.createdAt)")
    List<Object[]> weeklySalesForProduct(Long branchId, Long productId, LocalDateTime start, LocalDateTime end);
}
