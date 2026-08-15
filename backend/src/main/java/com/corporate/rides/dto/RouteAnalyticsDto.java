package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteAnalyticsDto {
    private String pickupLocation;
    private String destination;
    private String routeName;
    private long totalRequests;
    private long completedRides;
    private long cancelledRides;
    private double demandPercentage;
}
