package com.corporate.rides.dto;

import com.corporate.rides.enums.OrganizationStatus;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationSummaryDto {
    private UUID organizationId;
    private String organizationName;
    private String organizationCode;
    private OrganizationStatus status;
    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long totalDrivers;
    private long activeDrivers;
    private long totalVehicles;
    private long activeVehicles;
    private Map<String, Long> roleDistribution;
}
