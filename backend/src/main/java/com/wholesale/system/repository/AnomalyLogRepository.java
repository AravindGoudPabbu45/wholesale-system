package com.wholesale.system.repository;

import com.wholesale.system.entity.AnomalyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/** Repository for AnomalyLog entity */
public interface AnomalyLogRepository extends JpaRepository<AnomalyLog, Long> {
    List<AnomalyLog> findByBranchId(Long branchId);

    List<AnomalyLog> findByIsResolvedFalse();

    List<AnomalyLog> findByBranchIdAndIsResolvedFalse(Long branchId);
}
