package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.security.JwtUtil;
import com.wholesale.system.service.ProcurementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Procurement controller for managing purchase orders.
 */
@RestController
@RequestMapping("/api/procurement")
public class ProcurementController {

    private final ProcurementService procurementService;
    private final JwtUtil jwtUtil;

    public ProcurementController(ProcurementService procurementService, JwtUtil jwtUtil) {
        this.procurementService = procurementService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE', 'BRANCH_ADMIN')")
    public ResponseEntity<ProcurementResponse> create(@Valid @RequestBody ProcurementRequest request,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(procurementService.createProcurement(userId, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE', 'BRANCH_ADMIN', 'SUPPLIER')")
    public ResponseEntity<ProcurementResponse> updateStatus(@PathVariable Long id, @RequestParam String status,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(procurementService.updateProcurementStatus(id, status, userId));
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<ProcurementResponse>> getByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(procurementService.getByBranch(branchId));
    }

    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProcurementResponse>> getBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(procurementService.getBySupplier(supplierId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<ProcurementResponse>> getAll() {
        return ResponseEntity.ok(procurementService.getAll());
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
