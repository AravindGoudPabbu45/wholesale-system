package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Retailer management controller - approval and listing.
 */
@RestController
@RequestMapping("/api/retailers")
public class RetailerController {

    private final RetailerRepository retailerRepo;
    private final UserRepository userRepo;

    public RetailerController(RetailerRepository retailerRepo, UserRepository userRepo) {
        this.retailerRepo = retailerRepo;
        this.userRepo = userRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<RetailerResponse>> getAll() {
        return ResponseEntity.ok(retailerRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<RetailerResponse>> getPending() {
        return ResponseEntity.ok(retailerRepo.findByApprovalStatus("PENDING").stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<RetailerResponse> approve(@PathVariable Long id) {
        Retailer retailer = retailerRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer not found"));
        retailer.setApprovalStatus("APPROVED");
        retailer.setApprovedAt(LocalDateTime.now());
        
        User user = retailer.getUser();
        user.setStatus("ACTIVE");
        userRepo.save(user);

        return ResponseEntity.ok(toResponse(retailerRepo.save(retailer)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<RetailerResponse> reject(@PathVariable Long id) {
        Retailer retailer = retailerRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer not found"));
        retailer.setApprovalStatus("REJECTED");
        
        User user = retailer.getUser();
        user.setStatus("REJECTED");
        userRepo.save(user);

        return ResponseEntity.ok(toResponse(retailerRepo.save(retailer)));
    }

    private RetailerResponse toResponse(Retailer r) {
        return RetailerResponse.builder()
                .id(r.getId()).userId(r.getUser().getId())
                .fullName(r.getUser().getFullName()).email(r.getUser().getEmail())
                .businessName(r.getBusinessName()).gstNumber(r.getGstNumber())
                .address(r.getAddress()).city(r.getCity()).state(r.getState()).pincode(r.getPincode())
                .approvalStatus(r.getApprovalStatus()).createdAt(r.getCreatedAt())
                .build();
    }
}
