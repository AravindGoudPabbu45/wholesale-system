package com.wholesale.system.repository;

import com.wholesale.system.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/** Repository for Branch entity */
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByIsActiveTrue();

    List<Branch> findByAdminId(Long adminId);
}
