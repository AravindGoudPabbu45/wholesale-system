package com.wholesale.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Retailer entity - B2B retailer accounts that require admin approval before
 * ordering.
 */
@Entity
@Table(name = "retailers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Retailer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "business_name", nullable = false, length = 200)
    private String businessName;

    @Column(name = "gst_number", length = 20)
    private String gstNumber;

    @Column(name = "business_license", length = 255)
    private String businessLicense;

    @Column(name = "business_license_no", length = 50)
    private String businessLicenseNo;

    @Column(name = "business_type", length = 50)
    private String businessType;

    @Column(name = "years_in_business")
    private Integer yearsInBusiness;

    @Column(name = "alternate_phone", length = 20)
    private String alternatePhone;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    /** PENDING, APPROVED, REJECTED */
    @Column(name = "approval_status", nullable = false, length = 20)
    @Builder.Default
    private String approvalStatus = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

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
