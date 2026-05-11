package com.wholesale.system.repository;

import com.wholesale.system.entity.Sales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.Optional;

/** Repository for Sales entity */
public interface SalesRepository extends JpaRepository<Sales, Long> {
    Optional<Sales> findByOrderId(Long orderId);

    @Query("SELECT SUM(s.revenue) FROM Sales s JOIN s.order o WHERE o.branch.id = :branchId")
    BigDecimal sumRevenueByBranch(Long branchId);

    @Query("SELECT SUM(s.profit) FROM Sales s JOIN s.order o WHERE o.branch.id = :branchId")
    BigDecimal sumProfitByBranch(Long branchId);

    @Query("SELECT SUM(s.revenue) FROM Sales s")
    BigDecimal sumTotalRevenue();

    @Query("SELECT SUM(s.profit) FROM Sales s")
    BigDecimal sumTotalProfit();
}
