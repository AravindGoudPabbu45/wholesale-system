package com.wholesale.system.repository;

import com.wholesale.system.entity.Retailer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/** Repository for Retailer entity */
public interface RetailerRepository extends JpaRepository<Retailer, Long> {
    Optional<Retailer> findByUserId(Long userId);

    List<Retailer> findByApprovalStatus(String approvalStatus);
}
