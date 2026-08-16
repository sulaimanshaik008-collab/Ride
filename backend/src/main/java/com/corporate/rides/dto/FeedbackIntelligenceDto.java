package com.corporate.rides.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackIntelligenceDto {

    private List<DriverAlert> driverPerformanceAlerts;
    private List<VehicleAlert> vehicleInspectionAlerts;
    private List<RouteAlert> routeQualityAlerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverAlert {
        private UUID driverId;
        private String driverName;
        private long lowRatingCount;
        private double averageRating;
        private String recommendation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleAlert {
        private UUID vehicleId;
        private String registrationNumber;
        private long complaintCount;
        private double averageRating;
        private String recommendation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteAlert {
        private String pickupLocation;
        private String destination;
        private long tripCount;
        private double averageRating;
        private String recommendation;
    }
}
