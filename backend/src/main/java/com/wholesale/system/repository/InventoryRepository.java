package com.wholesale.system.repository;

import com.wholesale.system.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

/** Repository for Inventory entity */
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByBranchId(Long branchId);

    Optional<Inventory> findByBranchIdAndProductId(Long branchId, Long productId);

    /** Find inventory items below their product threshold level */
    @Query("SELECT i FROM Inventory i JOIN i.product p WHERE i.branch.id = :branchId AND i.quantity <= p.thresholdLevel")
    List<Inventory> findLowStockByBranch(Long branchId);

    @Query("SELECT i FROM Inventory i JOIN i.product p WHERE i.quantity <= p.thresholdLevel")
    List<Inventory> findAllLowStock();
}
