package com.corporate.rides.dto;

import com.corporate.rides.enums.RideStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideResponseDto {
    private UUID id;
    private String bookingReference;
    private UUID organizationId;
    private String organizationName;
    private UUID employeeId;
    private String employeeName;
    private String employeeEmail;
    private String pickupLocation;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private String destination;
    private Double destinationLatitude;
    private Double destinationLongitude;
    private LocalDate bookingDate;
    private LocalTime pickupTime;
    private String bookingNotes;
    private RideStatus status;

    // Feature 5 — Assignment details
    private UUID driverId;
    private String driverName;
    private String driverPhone;
    private String driverLicenseNumber;

    private UUID vehicleId;
    private String vehicleRegistration;
    private String vehicleMakeModel;
    private String vehicleType;

    private String cancellationReason;
    private OffsetDateTime cancelledAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
