package com.corporate.rides.dto;

import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
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
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
