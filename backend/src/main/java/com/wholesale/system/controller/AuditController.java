package com.wholesale.system.controller;

import com.wholesale.system.repository.AuditLogRepository;
import com.wholesale.system.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Audit trail controller — view audit logs.
 * SUPER_ADMIN only for security.
 */
@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepo;

    public AuditController(AuditLogRepository auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
    }

    /** Get all audit logs (paginated) */
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepo.findAllByOrderByTimestampDesc(
                PageRequest.of(page, size)));
    }

    /** Get audit logs by entity type (e.g., ORDER, INVENTORY) */
    @GetMapping("/entity/{entityType}")
    public ResponseEntity<Page<AuditLog>> getByEntityType(
            @PathVariable String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepo.findByEntityTypeOrderByTimestampDesc(
                entityType.toUpperCase(), PageRequest.of(page, size)));
    }

    /** Get audit logs for a specific entity */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<Page<AuditLog>> getByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepo.findByEntityTypeAndEntityIdOrderByTimestampDesc(
                entityType.toUpperCase(), entityId, PageRequest.of(page, size)));
    }

    /** Get audit logs by user */
    @GetMapping("/user/{username}")
    public ResponseEntity<Page<AuditLog>> getByUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepo.findByChangedByOrderByTimestampDesc(
                username, PageRequest.of(page, size)));
    }
}
