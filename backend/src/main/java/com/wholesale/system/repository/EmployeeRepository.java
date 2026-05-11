package com.wholesale.system.repository;

import com.wholesale.system.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

/** Repository for Employee entity */
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByBranchId(Long branchId);

    List<Employee> findByBranchIdAndStatus(Long branchId, String status);

    List<Employee> findByBranchIdAndDepartment(Long branchId, String department);

    Optional<Employee> findByUserId(Long userId);

    List<Employee> findByDepartment(String department);

    @Query("SELECT e FROM Employee e WHERE e.branch.id = :branchId AND e.status = 'ACTIVE'")
    List<Employee> findActiveByBranch(Long branchId);

    @Query("SELECT SUM(e.salary) FROM Employee e WHERE e.branch.id = :branchId AND e.status = 'ACTIVE'")
    java.math.BigDecimal sumSalaryByBranch(Long branchId);
}
