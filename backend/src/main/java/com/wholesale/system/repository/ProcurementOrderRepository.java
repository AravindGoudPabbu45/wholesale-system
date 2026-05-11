package com.wholesale.system.repository;

import com.wholesale.system.entity.ProcurementOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/** Repository for ProcurementOrder entity */
public interface ProcurementOrderRepository extends JpaRepository<ProcurementOrder, Long> {
    List<ProcurementOrder> findByBranchId(Long branchId);

    List<ProcurementOrder> findBySupplierId(Long supplierId);

    List<ProcurementOrder> findByStatus(String status);

    List<ProcurementOrder> findByBranchIdAndStatus(Long branchId, String status);
}
