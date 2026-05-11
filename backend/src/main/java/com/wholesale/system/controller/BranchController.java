package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.service.BranchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Branch management controller - Super Admin only.
 */
@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    public ResponseEntity<List<BranchResponse>> getAll() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BranchResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.getBranchById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<BranchResponse> create(@Valid @RequestBody BranchRequest request) {
        return ResponseEntity.ok(branchService.createBranch(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<BranchResponse> update(@PathVariable Long id, @Valid @RequestBody BranchRequest request) {
        return ResponseEntity.ok(branchService.updateBranch(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        branchService.deactivateBranch(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<BranchResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.activateBranch(id));
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> permanentDelete(@PathVariable Long id) {
        branchService.permanentlyDeleteBranch(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<BranchAnalytics>> getAnalytics() {
        return ResponseEntity.ok(branchService.getBranchAnalytics());
    }
}
