package com.wholesale.system.repository;

import com.wholesale.system.entity.StockMovementLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

/** Repository for StockMovementLog entity */
public interface StockMovementLogRepository extends JpaRepository<StockMovementLog, Long> {
    List<StockMovementLog> findByBranchIdAndProductIdOrderByCreatedAtDesc(Long branchId, Long productId);

    List<StockMovementLog> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<StockMovementLog> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);

    /**
     * Sum of stock deductions for a product in a branch within a date range.
     * Includes both ORDER_PACKED and ORDER_RESERVED change types.
     */
    @Query("SELECT COALESCE(SUM(ABS(s.quantityChanged)), 0) FROM StockMovementLog s " +
            "WHERE s.branch.id = :branchId AND s.product.id = :productId " +
            "AND s.changeType IN ('ORDER_PACKED', 'ORDER_RESERVED') " +
            "AND s.createdAt BETWEEN :start AND :end")
    Integer sumDeductionsByProductAndDateRange(Long branchId, Long productId, LocalDateTime start, LocalDateTime end);
}
