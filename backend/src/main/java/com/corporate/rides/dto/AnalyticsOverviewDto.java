package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewDto {
    private long totalRides;
    private long completedRides;
    private long scheduledRides;
    private long activeRides;
    private long cancelledRides;
    private long rejectedRides;
    private long pendingApprovalRides;
    private double completionRate;
    private double cancellationRate;
    private double averageSchedulingLeadTimeHours;
    private long totalActiveDrivers;
    private long totalActiveVehicles;
    private long totalUniquePassengers;
}
