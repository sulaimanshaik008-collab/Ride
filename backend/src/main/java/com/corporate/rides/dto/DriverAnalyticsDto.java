package com.corporate.rides.dto;

import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverAnalyticsDto {
    private UUID driverId;
    private String driverName;
    private String email;
    private String phoneNumber;
    private DriverStatus driverStatus;
    private DriverAvailability availabilityStatus;
    private long totalAssignedTrips;
    private long completedTrips;
    private long cancelledTrips;
    private long activeTrips;
    private double completionRate;
    private double utilizationPercentage;
}
