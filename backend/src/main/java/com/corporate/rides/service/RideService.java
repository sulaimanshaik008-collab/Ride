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

    // Feature 4 — Ride Scheduling Methods
    List<RideResponseDto> getSchedulableRides();
    RideResponseDto scheduleRide(UUID rideId, ScheduleRideRequestDto request);
    RideResponseDto rescheduleRide(UUID rideId, RescheduleRideRequestDto request);
    List<RideResponseDto> getScheduledRides(String search, LocalDate bookingDate, RideStatus status);

    // Feature 5 — Driver & Vehicle Assignment Methods
    List<RideResponseDto> getPendingAssignmentRides();
    AssignmentOptionsResponseDto getAssignmentOptions(UUID rideId);
    RideResponseDto assignRideResources(UUID rideId, AssignRideRequestDto request);
    RideResponseDto replaceRideAssignment(UUID rideId, AssignRideRequestDto request);
    RideResponseDto unassignRideResources(UUID rideId);

    // Feature 6 — Real-Time Ride Tracking & Trip Monitoring Methods
    RideResponseDto startTrip(UUID rideId);
    LocationResponseDto updateLocation(UUID rideId, LocationUpdateDto dto);
    LocationResponseDto getLatestLocation(UUID rideId);
    List<LocationResponseDto> getLocationHistory(UUID rideId);
    RideResponseDto completeTrip(UUID rideId);
    List<RideResponseDto> getActiveTrips();
    List<RideResponseDto> getDriverAssignedTrips();
}
