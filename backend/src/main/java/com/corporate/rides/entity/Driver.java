package com.corporate.rides.entity;

import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.DriverVerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "drivers", uniqueConstraints = {
    @UniqueConstraint(name = "uk_drivers_org_license", columnNames = {"organization_id", "license_number"})
}, indexes = {
    @Index(name = "idx_drivers_org_id", columnList = "organization_id"),
    @Index(name = "idx_drivers_user_id", columnList = "user_id"),
    @Index(name = "idx_drivers_status", columnList = "driver_status"),
    @Index(name = "idx_drivers_availability", columnList = "availability_status"),
    @Index(name = "idx_drivers_verification", columnList = "verification_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "license_number", nullable = false, length = 50)
    private String licenseNumber;

    @Column(name = "license_expiry_date", nullable = false)
    private LocalDate licenseExpiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "driver_status", nullable = false, length = 30)
    private DriverStatus driverStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 30)
    private DriverAvailability availabilityStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    @Builder.Default
    private DriverVerificationStatus verificationStatus = DriverVerificationStatus.VERIFIED;

    @Column(name = "vehicle_plate_number", length = 50)
    private String vehiclePlateNumber;

    @Column(name = "vehicle_model", length = 100)
    private String vehicleModel;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    @Column(name = "insurance_number", length = 100)
    private String insuranceNumber;

    @Column(name = "insurance_expiry_date")
    private LocalDate insuranceExpiryDate;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc_code", length = 30)
    private String bankIfscCode;

    @Column(name = "bank_account_name", length = 100)
    private String bankAccountName;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (driverStatus == null) {
            driverStatus = DriverStatus.ACTIVE;
        }
        if (availabilityStatus == null) {
            availabilityStatus = DriverAvailability.AVAILABLE;
        }
        if (verificationStatus == null) {
            verificationStatus = DriverVerificationStatus.VERIFIED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
