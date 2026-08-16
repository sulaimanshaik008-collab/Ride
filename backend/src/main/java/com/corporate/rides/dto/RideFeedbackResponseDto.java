package com.corporate.rides.dto;

import com.corporate.rides.enums.FeedbackReviewStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideFeedbackResponseDto {
    private UUID id;
    private UUID organizationId;
    private UUID rideId;
    private String bookingReference;
    private LocalDate bookingDate;
    private LocalTime pickupTime;
    private String pickupLocation;
    private String destination;

    private UUID employeeId;
    private String employeeName;
    private String employeeEmail;

    private UUID driverId;
    private String driverName;

    private UUID vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleMakeModel;

    private Integer rating;
    private String comments;
    private FeedbackReviewStatus reviewStatus;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
