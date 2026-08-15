package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeakHourAnalyticsDto {
    private int hour;
    private String timeSlotLabel; // e.g. "08:00 - 09:00"
    private long rideCount;
    private double percentageOfDailyDemand;
    private String demandLevel; // "NORMAL", "HIGH_DEMAND", "SURGE"
}
