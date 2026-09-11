package com.corporate.rides.dto;

import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.DriverVerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverResponseDto {
    private UUID id;
    private UUID userId;
    private UUID organizationId;
    private String organizationName;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String department;
    private String licenseNumber;
    private LocalDate licenseExpiryDate;
    private boolean isLicenseExpired;
    private DriverStatus driverStatus;
    private DriverAvailability availabilityStatus;
    private DriverVerificationStatus verificationStatus;
    private String vehiclePlateNumber;
    private String vehicleModel;
    private String documentUrl;
    private String insuranceNumber;
    private LocalDate insuranceExpiryDate;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankAccountName;
    private String upiId;
    private UUID verifiedById;
    private String verifiedByName;
    private OffsetDateTime verifiedAt;
    private String rejectionReason;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
