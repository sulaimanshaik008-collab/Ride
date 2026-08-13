package com.corporate.rides.dto;

import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;
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
public class VehicleResponseDto {

    private UUID id;
    private UUID organizationId;
    private String organizationName;

    private String registrationNumber;
    private VehicleType vehicleType;
    private String make;
    private String model;
    private Integer manufacturingYear;
    private Integer seatingCapacity;

    private VehicleStatus vehicleStatus;
    private VehicleAvailability availabilityStatus;
    private MaintenanceStatus maintenanceStatus;

    private LocalDate insuranceExpiryDate;
    private LocalDate permitExpiryDate;
    private Boolean isInsuranceExpired;
    private Boolean isPermitExpired;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
