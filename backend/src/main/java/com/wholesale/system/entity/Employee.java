package com.wholesale.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Employee entity - Branch-level employees with department, salary, and status tracking.
 * Supports soft delete (status = INACTIVE).
 */
@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user account linked to this employee */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Branch this employee belongs to */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    /** Department: ORDER_MANAGEMENT, WAREHOUSE, LOGISTICS, PROCUREMENT, FINANCE, HELP_SUPPORT */
    @Column(nullable = false, length = 50)
    private String department;

    @Column(length = 100)
    private String designation;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal salary = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "joining_date", nullable = false)
    private LocalDate joiningDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
