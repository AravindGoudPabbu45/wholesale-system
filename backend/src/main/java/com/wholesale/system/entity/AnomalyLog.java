package com.wholesale.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AnomalyLog entity - Flagged anomalies detected by AI simulation.
 * E.g., stock reduction > 200% of daily average triggers an anomaly flag.
 */
@Entity
@Table(name = "anomaly_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnomalyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "anomaly_type", nullable = false, length = 50)
    private String anomalyType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "daily_average", precision = 10, scale = 2)
    private BigDecimal dailyAverage;

    @Column(name = "actual_value", precision = 10, scale = 2)
    private BigDecimal actualValue;

    /** LOW, MEDIUM, HIGH, CRITICAL */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "MEDIUM";

    @Column(name = "is_resolved", nullable = false)
    @Builder.Default
    private Boolean isResolved = false;

    @Column(name = "detected_at", updatable = false)
    private LocalDateTime detectedAt;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
    }
}
