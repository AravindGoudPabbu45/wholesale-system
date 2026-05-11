package com.wholesale.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * OrderTracking — Amazon-style tracking history for orders.
 * Records each status change with location and timestamp.
 */
@Entity
@Table(name = "order_tracking")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** Status at this tracking point */
    @Column(nullable = false, length = 40)
    private String status;

    /** Location description e.g. "Left Warehouse", "Reached City Hub" */
    @Column(length = 200)
    private String location;

    /** Detailed description of the tracking event */
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
