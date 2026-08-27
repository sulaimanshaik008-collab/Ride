package com.corporate.rides.service;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.RideStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RideService {
    RideResponseDto createRide(CreateRideRequestDto request);
    List<RideResponseDto> getEmployeeRides();
    RideResponseDto getRideById(UUID rideId);
    RideResponseDto cancelRide(UUID rideId, CancelRideRequestDto request);

    // Feature 4 — Ride Scheduling & Manager Request Management Methods
    List<RideResponseDto> getSchedulableRides();
    RideResponseDto approveRide(UUID rideId);
    RideResponseDto rejectRideRequest(UUID rideId, RejectRideRequestDto request);
    RideResponseDto scheduleRide(UUID rideId, ScheduleRideRequestDto request);
    RideResponseDto rescheduleRide(UUID rideId, RescheduleRideRequestDto request);
    List<RideResponseDto> getScheduledRides(String search, LocalDate bookingDate, RideStatus status);

    // Feature 5 — Driver & Vehicle Assignment Methods
    List<RideResponseDto> getPendingAssignmentRides();
    AssignmentOptionsResponseDto getAssignmentOptions(UUID rideId);
    RideResponseDto assignRideResources(UUID rideId, AssignRideRequestDto request);
    RideResponseDto replaceRideAssignment(UUID rideId, AssignRideRequestDto request);
    RideResponseDto unassignRideResources(UUID rideId);

    // Feature 6 & 11 — Real-Time Ride Tracking & Trip Completion Methods
    RideResponseDto startTrip(UUID rideId);
    LocationResponseDto updateLocation(UUID rideId, LocationUpdateDto dto);
    LocationResponseDto getLatestLocation(UUID rideId);
    List<LocationResponseDto> getLocationHistory(UUID rideId);
    RideResponseDto completeTrip(UUID rideId);
    RideResponseDto completeTrip(UUID rideId, CompleteRideRequestDto request);
    List<RideResponseDto> getActiveTrips();
    List<RideResponseDto> getDriverAssignedTrips();
    List<RideResponseDto> getCompletedTrips(String search, UUID driverId, LocalDate fromDate, LocalDate toDate);

    // Feature 7 — Driver Operations Methods
    RideResponseDto acceptRideAssignment(UUID rideId);
    RideResponseDto rejectRideAssignment(UUID rideId, RejectRideRequestDto request);
    RideResponseDto verifyEmployeeForRide(UUID rideId, EmployeeVerificationRequestDto request);
    List<RideResponseDto> getDriverTodayRides();
    List<RideResponseDto> getDriverRideHistory(LocalDate from, LocalDate to, RideStatus status);
}
