package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.security.JwtUtil;
import com.wholesale.system.service.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Support ticket controller.
 */
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final JwtUtil jwtUtil;

    public TicketController(TicketService ticketService, JwtUtil jwtUtil) {
        this.ticketService = ticketService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<TicketResponse> create(@Valid @RequestBody TicketRequest request,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(ticketService.createTicket(userId, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE', 'BRANCH_ADMIN')")
    public ResponseEntity<TicketResponse> update(@PathVariable Long id, @RequestBody TicketUpdateRequest request) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request));
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<List<TicketResponse>> getMyTickets(HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(ticketService.getByRetailer(userId));
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<TicketResponse>> getByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ticketService.getByBranch(branchId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<TicketResponse>> getAll() {
        return ResponseEntity.ok(ticketService.getAll());
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
