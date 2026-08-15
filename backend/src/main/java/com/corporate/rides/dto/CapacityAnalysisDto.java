package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CapacityAnalysisDto {
    private int hour;
    private String timeSlotLabel;
    private long requestedRides;
    private long availableFleetSeats;
    private long capacityGap; // positive = surplus, negative = deficit
    private String capacityStatus; // "SURPLUS", "BALANCED", "CAPACITY_RISK"
}
