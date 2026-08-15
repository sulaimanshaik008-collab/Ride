package com.corporate.rides.dto;

import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleAnalyticsDto {
    private UUID vehicleId;
    private String registrationNumber;
    private String makeModel;
    private VehicleType vehicleType;
    private int seatingCapacity;
    private VehicleStatus vehicleStatus;
    private VehicleAvailability availabilityStatus;
    private MaintenanceStatus maintenanceStatus;
    private long totalAssignedTrips;
    private long completedTrips;
    private long activeTrips;
    private double utilizationPercentage;
}
