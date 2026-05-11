package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Support ticket management service.
 * Handles ticket creation, assignment, status updates, and retrieval.
 */
@Service
public class TicketService {

    private final SupportTicketRepository ticketRepo;
    private final RetailerRepository retailerRepo;
    private final BranchRepository branchRepo;
    private final EmployeeRepository employeeRepo;

    public TicketService(SupportTicketRepository ticketRepo, RetailerRepository retailerRepo,
            BranchRepository branchRepo, EmployeeRepository employeeRepo) {
        this.ticketRepo = ticketRepo;
        this.retailerRepo = retailerRepo;
        this.branchRepo = branchRepo;
        this.employeeRepo = employeeRepo;
    }

    /** Create a support ticket (Retailer) */
    @Transactional
    public TicketResponse createTicket(Long userId, TicketRequest req) {
        Retailer retailer = retailerRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer profile not found"));

        String ticketNumber = "TKT-" + java.time.Year.now().getValue() + "-" +
                String.format("%04d", ticketRepo.count() + 1);

        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber(ticketNumber).retailer(retailer)
                .subject(req.getSubject()).description(req.getDescription())
                .priority(req.getPriority() != null ? req.getPriority() : "MEDIUM")
                .status("OPEN").build();

        if (req.getBranchId() != null) {
            ticket.setBranch(branchRepo.findById(req.getBranchId()).orElse(null));
        }
        return toResponse(ticketRepo.save(ticket));
    }

    /** Update ticket (assign, change status/priority) */
    @Transactional
    public TicketResponse updateTicket(Long ticketId, TicketUpdateRequest req) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (req.getStatus() != null) {
            ticket.setStatus(req.getStatus());
            if ("RESOLVED".equals(req.getStatus()) || "CLOSED".equals(req.getStatus())) {
                ticket.setResolvedAt(LocalDateTime.now());
            }
        }
        if (req.getAssignedEmployeeId() != null) {
            Employee emp = employeeRepo.findById(req.getAssignedEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
            ticket.setAssignedEmployee(emp);
            if ("OPEN".equals(ticket.getStatus()))
                ticket.setStatus("IN_PROGRESS");
        }
        if (req.getPriority() != null)
            ticket.setPriority(req.getPriority());

        return toResponse(ticketRepo.save(ticket));
    }

    public List<TicketResponse> getByRetailer(Long userId) {
        Retailer retailer = retailerRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer not found"));
        return ticketRepo.findByRetailerId(retailer.getId()).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<TicketResponse> getByBranch(Long branchId) {
        return ticketRepo.findByBranchId(branchId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<TicketResponse> getByEmployee(Long employeeId) {
        return ticketRepo.findByAssignedEmployeeId(employeeId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<TicketResponse> getAll() {
        return ticketRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    private TicketResponse toResponse(SupportTicket t) {
        return TicketResponse.builder()
                .id(t.getId()).ticketNumber(t.getTicketNumber())
                .retailerId(t.getRetailer().getId())
                .retailerName(t.getRetailer().getUser().getFullName())
                .branchId(t.getBranch() != null ? t.getBranch().getId() : null)
                .branchName(t.getBranch() != null ? t.getBranch().getName() : null)
                .assignedEmployeeId(t.getAssignedEmployee() != null ? t.getAssignedEmployee().getId() : null)
                .assignedEmployeeName(
                        t.getAssignedEmployee() != null ? t.getAssignedEmployee().getUser().getFullName() : null)
                .subject(t.getSubject()).description(t.getDescription())
                .status(t.getStatus()).priority(t.getPriority())
                .createdAt(t.getCreatedAt()).resolvedAt(t.getResolvedAt())
                .build();
    }
}
