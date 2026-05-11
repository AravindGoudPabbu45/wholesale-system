package com.wholesale.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * AuditLog entity — tracks who changed what, when, and from where.
 * Used by AuditAspect (AOP) to automatically log inventory and order changes.
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_audit_user", columnList = "changedBy"),
    @Index(name = "idx_audit_time", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. "ORDER", "INVENTORY", "PRODUCT", "BRANCH" */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /** The ID of the modified entity */
    @Column(name = "entity_id")
    private Long entityId;

    /** e.g. "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE" */
    @Column(nullable = false, length = 30)
    private String action;

    /** Username of who made the change */
    @Column(name = "changed_by", nullable = false, length = 100)
    private String changedBy;

    /** Role of who made the change */
    @Column(name = "changed_by_role", length = 30)
    private String changedByRole;

    /** JSON snapshot of previous values (for updates) */
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    /** JSON snapshot of new values */
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    /** Brief description of the change */
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
