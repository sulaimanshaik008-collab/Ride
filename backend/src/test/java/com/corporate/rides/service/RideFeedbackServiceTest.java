package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.*;
import com.corporate.rides.enums.FeedbackReviewStatus;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.RideFeedbackRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RideFeedbackServiceTest {

    @Mock
    private RideFeedbackRepository feedbackRepository;

    @Mock
    private RideRepository rideRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private RideFeedbackServiceImpl feedbackService;

    private UUID orgId;
    private UUID empId;
    private UUID rideId;
    private Organization organization;
    private User employee;
    private Ride completedRide;
    private Ride scheduledRide;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        empId = UUID.randomUUID();
        rideId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .name("Acme Corp")
                .code("ACME")
                .build();

        employee = User.builder()
                .id(empId)
                .organization(organization)
                .email("emp@acme.com")
                .fullName("John Employee")
                .role(UserRole.EMPLOYEE)
                .build();

        completedRide = Ride.builder()
                .id(rideId)
                .bookingReference("RIDE-1001")
                .organization(organization)
                .employee(employee)
                .pickupLocation("Location A")
                .destination("Location B")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.of(9, 0))
                .status(RideStatus.COMPLETED)
                .build();

        scheduledRide = Ride.builder()
                .id(UUID.randomUUID())
                .bookingReference("RIDE-1002")
                .organization(organization)
                .employee(employee)
                .status(RideStatus.SCHEDULED)
                .build();

        UserPrincipal principal = UserPrincipal.builder()
                .userId(empId)
                .organizationId(orgId)
                .organizationName("Acme Corp")
                .email("emp@acme.com")
                .fullName("John Employee")
                .role(UserRole.EMPLOYEE)
                .build();

        UserContextHolder.setContext(principal);
    }

    @Test
    @DisplayName("Should successfully submit 5-star feedback for a completed ride")
    void testSubmitValidFeedback() {
        CreateRideFeedbackRequestDto request = CreateRideFeedbackRequestDto.builder()
                .rideId(rideId)
                .rating(5)
                .comments("Smooth driving and on time!")
                .build();

        when(rideRepository.findByIdAndOrganizationId(rideId, orgId)).thenReturn(Optional.of(completedRide));
        when(feedbackRepository.existsByRideIdAndEmployeeId(rideId, empId)).thenReturn(false);
        when(feedbackRepository.save(any(RideFeedback.class))).thenAnswer(i -> {
            RideFeedback f = i.getArgument(0);
            f.setId(UUID.randomUUID());
            f.setCreatedAt(OffsetDateTime.now());
            f.setUpdatedAt(OffsetDateTime.now());
            return f;
        });

        RideFeedbackResponseDto result = feedbackService.submitRideFeedback(request);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        assertEquals(FeedbackReviewStatus.NORMAL, result.getReviewStatus());
        assertEquals("Smooth driving and on time!", result.getComments());
    }

    @Test
    @DisplayName("Should detect low rating (<=2 stars) and mark as NEEDS_REVIEW with escalation")
    void testSubmitLowRatingFeedback() {
        CreateRideFeedbackRequestDto request = CreateRideFeedbackRequestDto.builder()
                .rideId(rideId)
                .rating(1)
                .comments("Driver was late and vehicle was not clean.")
                .build();

        when(rideRepository.findByIdAndOrganizationId(rideId, orgId)).thenReturn(Optional.of(completedRide));
        when(feedbackRepository.existsByRideIdAndEmployeeId(rideId, empId)).thenReturn(false);
        when(userRepository.findByOrganizationId(orgId)).thenReturn(Collections.emptyList());
        when(feedbackRepository.save(any(RideFeedback.class))).thenAnswer(i -> {
            RideFeedback f = i.getArgument(0);
            f.setId(UUID.randomUUID());
            f.setCreatedAt(OffsetDateTime.now());
            f.setUpdatedAt(OffsetDateTime.now());
            return f;
        });

        RideFeedbackResponseDto result = feedbackService.submitRideFeedback(request);

        assertNotNull(result);
        assertEquals(1, result.getRating());
        assertEquals(FeedbackReviewStatus.NEEDS_REVIEW, result.getReviewStatus());
    }

    @Test
    @DisplayName("Should block feedback submission for non-completed rides")
    void testBlockFeedbackForIncompleteRide() {
        CreateRideFeedbackRequestDto request = CreateRideFeedbackRequestDto.builder()
                .rideId(scheduledRide.getId())
                .rating(5)
                .build();

        when(rideRepository.findByIdAndOrganizationId(scheduledRide.getId(), orgId)).thenReturn(Optional.of(scheduledRide));

        assertThrows(InvalidBookingException.class, () -> {
            feedbackService.submitRideFeedback(request);
        });
    }

    @Test
    @DisplayName("Should block duplicate feedback submission for the same ride")
    void testBlockDuplicateFeedback() {
        CreateRideFeedbackRequestDto request = CreateRideFeedbackRequestDto.builder()
                .rideId(rideId)
                .rating(4)
                .build();

        when(rideRepository.findByIdAndOrganizationId(rideId, orgId)).thenReturn(Optional.of(completedRide));
        when(feedbackRepository.existsByRideIdAndEmployeeId(rideId, empId)).thenReturn(true);

        assertThrows(InvalidBookingException.class, () -> {
            feedbackService.submitRideFeedback(request);
        });
    }

    @Test
    @DisplayName("Should block feedback submission for another employee's ride")
    void testBlockFeedbackForOtherEmployeeRide() {
        User otherEmp = User.builder().id(UUID.randomUUID()).build();
        Ride otherRide = Ride.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .employee(otherEmp)
                .status(RideStatus.COMPLETED)
                .build();

        CreateRideFeedbackRequestDto request = CreateRideFeedbackRequestDto.builder()
                .rideId(otherRide.getId())
                .rating(5)
                .build();

        when(rideRepository.findByIdAndOrganizationId(otherRide.getId(), orgId)).thenReturn(Optional.of(otherRide));

        assertThrows(UnauthorizedAccessException.class, () -> {
            feedbackService.submitRideFeedback(request);
        });
    }

    @Test
    @DisplayName("Should calculate feedback summary metrics correctly for managers")
    void testGetFeedbackSummary() {
        UserPrincipal managerPrincipal = UserPrincipal.builder()
                .userId(UUID.randomUUID())
                .organizationId(orgId)
                .role(UserRole.TRANSPORT_MANAGER)
                .build();
        UserContextHolder.setContext(managerPrincipal);

        when(feedbackRepository.countByOrganizationId(orgId)).thenReturn(25L);
        when(feedbackRepository.calculateAverageRatingByOrganizationId(orgId)).thenReturn(4.2);
        when(feedbackRepository.countByOrganizationIdAndRating(orgId, 5)).thenReturn(12L);
        when(feedbackRepository.countByOrganizationIdAndRating(orgId, 4)).thenReturn(8L);
        when(feedbackRepository.countByOrganizationIdAndRating(orgId, 3)).thenReturn(3L);
        when(feedbackRepository.countByOrganizationIdAndRating(orgId, 2)).thenReturn(1L);
        when(feedbackRepository.countByOrganizationIdAndRating(orgId, 1)).thenReturn(1L);
        when(feedbackRepository.countByOrganizationIdAndReviewStatus(orgId, FeedbackReviewStatus.NEEDS_REVIEW)).thenReturn(2L);

        FeedbackSummaryDto summary = feedbackService.getFeedbackSummary();

        assertNotNull(summary);
        assertEquals(25L, summary.getTotalFeedback());
        assertEquals(4.2, summary.getAverageRating());
        assertEquals(12L, summary.getFiveStarCount());
        assertEquals(2L, summary.getNeedsReviewCount());
    }

    @Test
    @DisplayName("Should allow managers to update feedback review status")
    void testUpdateFeedbackReviewStatus() {
        UserPrincipal managerPrincipal = UserPrincipal.builder()
                .userId(UUID.randomUUID())
                .organizationId(orgId)
                .role(UserRole.TRANSPORT_MANAGER)
                .build();
        UserContextHolder.setContext(managerPrincipal);

        UUID feedbackId = UUID.randomUUID();
        RideFeedback feedback = RideFeedback.builder()
                .id(feedbackId)
                .organization(organization)
                .ride(completedRide)
                .employee(employee)
                .rating(1)
                .reviewStatus(FeedbackReviewStatus.NEEDS_REVIEW)
                .build();

        when(feedbackRepository.findByIdAndOrganizationId(feedbackId, orgId)).thenReturn(Optional.of(feedback));
        when(feedbackRepository.save(any(RideFeedback.class))).thenAnswer(i -> i.getArgument(0));

        UpdateFeedbackReviewStatusRequestDto request = UpdateFeedbackReviewStatusRequestDto.builder()
                .reviewStatus(FeedbackReviewStatus.REVIEWED)
                .build();

        RideFeedbackResponseDto result = feedbackService.updateFeedbackReviewStatus(feedbackId, request);

        assertNotNull(result);
        assertEquals(FeedbackReviewStatus.REVIEWED, result.getReviewStatus());
    }
}
