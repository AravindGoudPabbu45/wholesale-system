package com.wholesale.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * StockMovementLog entity - Audit trail for all inventory changes.
 * Records every stock increase/decrease with reference to the source event.
 */
@Entity
@Table(name = "stock_movement_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** ORDER_PACKED, SUPPLIER_DELIVERY, DAMAGED, ADJUSTMENT */
    @Column(name = "change_type", nullable = false, length = 30)
    private String changeType;

    @Column(name = "quantity_changed", nullable = false)
    private Integer quantityChanged;

    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    /** ORDER, PROCUREMENT, DAMAGE_REPORT */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
