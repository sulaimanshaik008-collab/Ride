package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.*;
import com.corporate.rides.enums.FeedbackReviewStatus;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.enums.NotificationType;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.RideFeedbackRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideFeedbackServiceImpl implements RideFeedbackService {

    private final RideFeedbackRepository feedbackRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private UserPrincipal getAuthenticatedUser() {
        UserPrincipal principal = UserContextHolder.getContext();
        if (principal == null || principal.getUserId() == null || principal.getOrganizationId() == null) {
            throw new UnauthorizedAccessException("Authentication required. Security context missing.");
        }
        return principal;
    }

    private void verifyManagementRole(UserPrincipal principal) {
        if (principal.getRole() != UserRole.TRANSPORT_MANAGER &&
            principal.getRole() != UserRole.CORPORATE_ADMIN &&
            principal.getRole() != UserRole.SYSTEM_ADMIN) {
            throw new UnauthorizedAccessException("Access denied. Management or Administrator role required.");
        }
    }

    @Override
    @Transactional
    public RideFeedbackResponseDto submitRideFeedback(CreateRideFeedbackRequestDto request) {
        UserPrincipal currentUser = getAuthenticatedUser();
        UUID orgId = currentUser.getOrganizationId();
        UUID empId = currentUser.getUserId();

        // 1. Validate ride exists within tenant
        Ride ride = rideRepository.findByIdAndOrganizationId(request.getRideId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found"));

        // 2. Validate ride ownership (Employee must be the rider)
        if (!ride.getEmployee().getId().equals(empId)) {
            throw new UnauthorizedAccessException("You can only submit feedback for your own rides");
        }

        // 3. Validate ride is COMPLETED
        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new InvalidBookingException("Feedback can only be submitted for COMPLETED rides. Current status: " + ride.getStatus());
        }

        // 4. Validate duplicate feedback
        if (feedbackRepository.existsByRideIdAndEmployeeId(ride.getId(), empId)) {
            throw new InvalidBookingException("Feedback has already been submitted for this ride");
        }

        // 5. Anti-Gravity Low-Rating Intelligence
        FeedbackReviewStatus reviewStatus = FeedbackReviewStatus.NORMAL;
        if (request.getRating() <= 2) {
            reviewStatus = FeedbackReviewStatus.NEEDS_REVIEW;
        }

        RideFeedback feedback = RideFeedback.builder()
                .organization(ride.getOrganization())
                .ride(ride)
                .employee(ride.getEmployee())
                .driver(ride.getDriver())
                .vehicle(ride.getVehicle())
                .rating(request.getRating())
                .comments(request.getComments() != null ? request.getComments().trim() : null)
                .reviewStatus(reviewStatus)
                .build();

        RideFeedback saved = feedbackRepository.save(feedback);
        log.info("Feedback submitted for ride {} with rating {} (ReviewStatus: {})", ride.getBookingReference(), saved.getRating(), saved.getReviewStatus());

        // 6. Automated Escalation Notifications on Low Rating
        if (saved.getRating() <= 2) {
            escalateLowRating(saved, ride);
        }

        return mapToDto(saved);
    }

    private void escalateLowRating(RideFeedback feedback, Ride ride) {
        try {
            List<User> managers = userRepository.findByOrganizationId(ride.getOrganization().getId())
                    .stream()
                    .filter(u -> u.getRole() == UserRole.TRANSPORT_MANAGER || u.getRole() == UserRole.CORPORATE_ADMIN)
                    .toList();

            String driverName = ride.getDriver() != null ? ride.getDriver().getUser().getFullName() : "Unassigned";
            String title = "Low Ride Rating (" + feedback.getRating() + "★) Alert";
            String message = "Ride " + ride.getBookingReference() + " completed by " + driverName +
                    " received a low rating of " + feedback.getRating() + "/5." +
                    (feedback.getComments() != null && !feedback.getComments().isBlank() ? " Comments: \"" + feedback.getComments() + "\"" : "");

            for (User manager : managers) {
                // Dispatch IN_APP notification
                notificationService.createNotification(
                        manager,
                        ride,
                        NotificationType.LOW_RIDE_RATING,
                        title,
                        message,
                        NotificationChannelType.IN_APP
                );

                // Dispatch SMS notification if phone is present
                if (manager.getPhoneNumber() != null && !manager.getPhoneNumber().isBlank()) {
                    notificationService.createNotification(
                            manager,
                            ride,
                            NotificationType.LOW_RIDE_RATING,
                            title,
                            message,
                            NotificationChannelType.SMS
                    );
                }
            }

            // Check for repeated low ratings for driver
            if (ride.getDriver() != null) {
                OffsetDateTime thirtyDaysAgo = OffsetDateTime.now().minusDays(30);
                List<RideFeedback> recentLowRatings = feedbackRepository.findLowRatingsForDriverSince(
                        ride.getOrganization().getId(),
                        ride.getDriver().getId(),
                        thirtyDaysAgo
                );

                if (recentLowRatings.size() >= 2) {
                    for (User manager : managers) {
                        notificationService.createNotification(
                                manager,
                                ride,
                                NotificationType.DRIVER_FEEDBACK_ESCALATION,
                                "Driver Feedback Escalation",
                                "Driver " + driverName + " has received " + recentLowRatings.size() + " low ratings in the past 30 days. Performance review recommended.",
                                NotificationChannelType.IN_APP
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to dispatch low-rating manager notifications: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideFeedbackResponseDto> getMyFeedbackHistory() {
        UserPrincipal currentUser = getAuthenticatedUser();
        List<RideFeedback> list = feedbackRepository.findByEmployeeIdOrderByCreatedAtDesc(currentUser.getUserId());
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RideFeedbackResponseDto getFeedbackById(UUID id) {
        UserPrincipal currentUser = getAuthenticatedUser();
        RideFeedback feedback = feedbackRepository.findByIdAndOrganizationId(id, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));

        if (currentUser.getRole() == UserRole.EMPLOYEE && !feedback.getEmployee().getId().equals(currentUser.getUserId())) {
            throw new UnauthorizedAccessException("Access denied to requested feedback record");
        }

        return mapToDto(feedback);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RideFeedbackResponseDto> getOrganizationFeedback(
            Integer rating, FeedbackReviewStatus reviewStatus, UUID driverId, UUID vehicleId, String search, Pageable pageable) {
        UserPrincipal currentUser = getAuthenticatedUser();
        verifyManagementRole(currentUser);

        String sanitizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<RideFeedback> page = feedbackRepository.searchTenantFeedback(
                currentUser.getOrganizationId(),
                rating,
                reviewStatus,
                driverId,
                vehicleId,
                sanitizedSearch,
                pageable
        );

        return page.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackSummaryDto getFeedbackSummary() {
        UserPrincipal currentUser = getAuthenticatedUser();
        verifyManagementRole(currentUser);

        UUID orgId = currentUser.getOrganizationId();
        long total = feedbackRepository.countByOrganizationId(orgId);
        Double avgRating = feedbackRepository.calculateAverageRatingByOrganizationId(orgId);

        long c5 = feedbackRepository.countByOrganizationIdAndRating(orgId, 5);
        long c4 = feedbackRepository.countByOrganizationIdAndRating(orgId, 4);
        long c3 = feedbackRepository.countByOrganizationIdAndRating(orgId, 3);
        long c2 = feedbackRepository.countByOrganizationIdAndRating(orgId, 2);
        long c1 = feedbackRepository.countByOrganizationIdAndRating(orgId, 1);

        long needsReview = feedbackRepository.countByOrganizationIdAndReviewStatus(orgId, FeedbackReviewStatus.NEEDS_REVIEW);
        long escalated = feedbackRepository.countByOrganizationIdAndReviewStatus(orgId, FeedbackReviewStatus.ESCALATED);
        long reviewed = feedbackRepository.countByOrganizationIdAndReviewStatus(orgId, FeedbackReviewStatus.REVIEWED);

        Map<Integer, Long> dist = new HashMap<>();
        dist.put(5, c5);
        dist.put(4, c4);
        dist.put(3, c3);
        dist.put(2, c2);
        dist.put(1, c1);

        return FeedbackSummaryDto.builder()
                .totalFeedback(total)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .fiveStarCount(c5)
                .fourStarCount(c4)
                .threeStarCount(c3)
                .twoStarCount(c2)
                .oneStarCount(c1)
                .needsReviewCount(needsReview)
                .escalatedCount(escalated)
                .reviewedCount(reviewed)
                .ratingDistribution(dist)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackIntelligenceDto getFeedbackIntelligence() {
        UserPrincipal currentUser = getAuthenticatedUser();
        verifyManagementRole(currentUser);

        UUID orgId = currentUser.getOrganizationId();

        // 1. Driver Performance Alert Patterns
        List<Object[]> driverRows = feedbackRepository.findDriverPerformanceRankings(orgId);
        List<FeedbackIntelligenceDto.DriverAlert> driverAlerts = new ArrayList<>();
        for (Object[] row : driverRows) {
            UUID dId = (UUID) row[0];
            String dName = (String) row[1];
            long count = ((Number) row[2]).longValue();
            double avg = ((Number) row[3]).doubleValue();

            if (avg <= 3.0 && count >= 1) {
                driverAlerts.add(FeedbackIntelligenceDto.DriverAlert.builder()
                        .driverId(dId)
                        .driverName(dName)
                        .lowRatingCount(count)
                        .averageRating(Math.round(avg * 10.0) / 10.0)
                        .recommendation("Driver satisfaction rating is below standard threshold (≤3.0★). Performance review recommended.")
                        .build());
            }
        }

        // 2. Vehicle Inspection Alert Patterns
        List<Object[]> vehicleRows = feedbackRepository.findVehicleInspectionAlerts(orgId);
        List<FeedbackIntelligenceDto.VehicleAlert> vehicleAlerts = new ArrayList<>();
        for (Object[] row : vehicleRows) {
            UUID vId = (UUID) row[0];
            String vReg = (String) row[1];
            long count = ((Number) row[2]).longValue();
            double avg = ((Number) row[3]).doubleValue();

            vehicleAlerts.add(FeedbackIntelligenceDto.VehicleAlert.builder()
                    .vehicleId(vId)
                    .registrationNumber(vReg)
                    .complaintCount(count)
                    .averageRating(Math.round(avg * 10.0) / 10.0)
                    .recommendation("Vehicle has received recurring complaints. Maintenance and comfort inspection recommended.")
                    .build());
        }

        // 3. Route Quality Alert Patterns
        List<Object[]> routeRows = feedbackRepository.findRouteQualityAlerts(orgId);
        List<FeedbackIntelligenceDto.RouteAlert> routeAlerts = new ArrayList<>();
        for (Object[] row : routeRows) {
            String pickup = (String) row[0];
            String dest = (String) row[1];
            long count = ((Number) row[2]).longValue();
            double avg = ((Number) row[3]).doubleValue();

            routeAlerts.add(FeedbackIntelligenceDto.RouteAlert.builder()
                    .pickupLocation(pickup)
                    .destination(dest)
                    .tripCount(count)
                    .averageRating(Math.round(avg * 10.0) / 10.0)
                    .recommendation("Route exhibits recurring low satisfaction scores. Transit schedule or route timing review advised.")
                    .build());
        }

        return FeedbackIntelligenceDto.builder()
                .driverPerformanceAlerts(driverAlerts)
                .vehicleInspectionAlerts(vehicleAlerts)
                .routeQualityAlerts(routeAlerts)
                .build();
    }

    @Override
    @Transactional
    public RideFeedbackResponseDto updateFeedbackReviewStatus(UUID id, UpdateFeedbackReviewStatusRequestDto request) {
        UserPrincipal currentUser = getAuthenticatedUser();
        verifyManagementRole(currentUser);

        RideFeedback feedback = feedbackRepository.findByIdAndOrganizationId(id, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));

        feedback.setReviewStatus(request.getReviewStatus());
        RideFeedback saved = feedbackRepository.save(feedback);
        log.info("Feedback {} review status updated to {}", saved.getId(), saved.getReviewStatus());

        return mapToDto(saved);
    }

    private RideFeedbackResponseDto mapToDto(RideFeedback f) {
        return RideFeedbackResponseDto.builder()
                .id(f.getId())
                .organizationId(f.getOrganization().getId())
                .rideId(f.getRide().getId())
                .bookingReference(f.getRide().getBookingReference())
                .bookingDate(f.getRide().getBookingDate())
                .pickupTime(f.getRide().getPickupTime())
                .pickupLocation(f.getRide().getPickupLocation())
                .destination(f.getRide().getDestination())
                .employeeId(f.getEmployee().getId())
                .employeeName(f.getEmployee().getFullName())
                .employeeEmail(f.getEmployee().getEmail())
                .driverId(f.getDriver() != null ? f.getDriver().getId() : null)
                .driverName(f.getDriver() != null ? f.getDriver().getUser().getFullName() : "Unassigned")
                .vehicleId(f.getVehicle() != null ? f.getVehicle().getId() : null)
                .vehicleRegistrationNumber(f.getVehicle() != null ? f.getVehicle().getRegistrationNumber() : "Unassigned")
                .vehicleMakeModel(f.getVehicle() != null ? (f.getVehicle().getMake() + " " + f.getVehicle().getModel()) : "")
                .rating(f.getRating())
                .comments(f.getComments())
                .reviewStatus(f.getReviewStatus())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}
