package com.wholesale.system.repository;

import com.wholesale.system.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/** Repository for SupportTicket entity */
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    Optional<SupportTicket> findByTicketNumber(String ticketNumber);

    List<SupportTicket> findByRetailerId(Long retailerId);

    List<SupportTicket> findByBranchId(Long branchId);

    List<SupportTicket> findByAssignedEmployeeId(Long employeeId);

    List<SupportTicket> findByStatus(String status);

    List<SupportTicket> findByBranchIdAndStatus(Long branchId, String status);
}
