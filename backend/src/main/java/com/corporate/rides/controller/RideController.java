package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.service.RideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;

    @PostMapping
    public ResponseEntity<ApiResponse<RideResponseDto>> createRide(@Valid @RequestBody CreateRideRequestDto request) {
        RideResponseDto ride = rideService.createRide(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ride, "Ride requested successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getEmployeeRides() {
        List<RideResponseDto> rides = rideService.getEmployeeRides();
        return ResponseEntity.ok(ApiResponse.success(rides, "Employee rides retrieved successfully"));
    }

    // Static subpaths before /{id} to avoid Spring MVC treating 'driver' or 'active' as a UUID {id}
    @GetMapping("/driver/today")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getDriverTodayRides() {
        List<RideResponseDto> rides = rideService.getDriverTodayRides();
        return ResponseEntity.ok(ApiResponse.success(rides, "Today's assigned schedule retrieved successfully"));
    }

    @GetMapping("/driver/history")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getDriverRideHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) RideStatus status) {
        List<RideResponseDto> history = rideService.getDriverRideHistory(from, to, status);
        return ResponseEntity.ok(ApiResponse.success(history, "Driver trip history retrieved successfully"));
    }

    @GetMapping("/driver-assigned")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getDriverAssignedTrips() {
        List<RideResponseDto> assigned = rideService.getDriverAssignedTrips();
        return ResponseEntity.ok(ApiResponse.success(assigned, "Driver assigned trips retrieved successfully"));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getActiveTrips() {
        List<RideResponseDto> active = rideService.getActiveTrips();
        return ResponseEntity.ok(ApiResponse.success(active, "Active trips retrieved successfully"));
    }

    @GetMapping("/schedulable")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getSchedulableRides() {
        List<RideResponseDto> rides = rideService.getSchedulableRides();
        return ResponseEntity.ok(ApiResponse.success(rides, "Schedulable ride requests retrieved successfully"));
    }

    @GetMapping("/completed")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getCompletedTrips(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<RideResponseDto> completed = rideService.getCompletedTrips(search, driverId, from, to);
        return ResponseEntity.ok(ApiResponse.success(completed, "Completed rides report retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RideResponseDto>> getRideById(@PathVariable UUID id) {
        RideResponseDto ride = rideService.getRideById(id);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride details retrieved successfully"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<RideResponseDto>> cancelRide(
            @PathVariable UUID id,
            @Valid @RequestBody CancelRideRequestDto request) {
        RideResponseDto ride = rideService.cancelRide(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride cancelled successfully"));
    }

    // ==========================================
    // FEATURE 4 — RIDE SCHEDULING & APPROVAL ENDPOINTS
    // ==========================================

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<RideResponseDto>> approveRide(@PathVariable UUID id) {
        RideResponseDto ride = rideService.approveRide(id);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride request approved successfully and marked for scheduling"));
    }

    @PostMapping("/{id}/reject-request")
    public ResponseEntity<ApiResponse<RideResponseDto>> rejectRideRequest(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRideRequestDto request) {
        RideResponseDto ride = rideService.rejectRideRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride request rejected successfully"));
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<ApiResponse<RideResponseDto>> scheduleRide(
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleRideRequestDto request) {
        RideResponseDto ride = rideService.scheduleRide(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride scheduled successfully"));
    }

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<ApiResponse<RideResponseDto>> rescheduleRide(
            @PathVariable UUID id,
            @Valid @RequestBody RescheduleRideRequestDto request) {
        RideResponseDto ride = rideService.rescheduleRide(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride rescheduled successfully"));
    }

    @GetMapping("/scheduled")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getScheduledRides(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate,
            @RequestParam(required = false) RideStatus status) {
        List<RideResponseDto> rides = rideService.getScheduledRides(search, bookingDate, status);
        return ResponseEntity.ok(ApiResponse.success(rides, "Scheduled rides retrieved successfully"));
    }

    // ====================================================
    // FEATURE 5 — DRIVER & VEHICLE ASSIGNMENT ENDPOINTS
    // ====================================================

    @GetMapping("/assignment-pending")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getPendingAssignmentRides() {
        List<RideResponseDto> rides = rideService.getPendingAssignmentRides();
        return ResponseEntity.ok(ApiResponse.success(rides, "Pending assignment rides retrieved successfully"));
    }

    @GetMapping("/{id}/assignment-options")
    public ResponseEntity<ApiResponse<AssignmentOptionsResponseDto>> getAssignmentOptions(@PathVariable UUID id) {
        AssignmentOptionsResponseDto options = rideService.getAssignmentOptions(id);
        return ResponseEntity.ok(ApiResponse.success(options, "Eligible drivers and vehicles retrieved successfully"));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<RideResponseDto>> assignRideResources(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRideRequestDto request) {
        RideResponseDto ride = rideService.assignRideResources(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Driver and vehicle assigned successfully"));
    }

    @PatchMapping("/{id}/assignment")
    public ResponseEntity<ApiResponse<RideResponseDto>> replaceRideAssignment(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRideRequestDto request) {
        RideResponseDto ride = rideService.replaceRideAssignment(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride assignment updated successfully"));
    }

    @DeleteMapping("/{id}/assignment")
    public ResponseEntity<ApiResponse<RideResponseDto>> unassignRideResources(@PathVariable UUID id) {
        RideResponseDto ride = rideService.unassignRideResources(id);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride resources unassigned successfully"));
    }

    // ====================================================
    // FEATURE 6 — REAL-TIME RIDE TRACKING ENDPOINTS
    // ====================================================

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<RideResponseDto>> startTrip(@PathVariable UUID id) {
        RideResponseDto ride = rideService.startTrip(id);
        return ResponseEntity.ok(ApiResponse.success(ride, "Trip started successfully. Real-time tracking is active."));
    }

    @PostMapping("/{id}/location")
    public ResponseEntity<ApiResponse<LocationResponseDto>> updateLocation(
            @PathVariable UUID id,
            @Valid @RequestBody LocationUpdateDto request) {
        LocationResponseDto loc = rideService.updateLocation(id, request);
        return ResponseEntity.ok(ApiResponse.success(loc, "Location update saved successfully"));
    }

    @GetMapping("/{id}/location")
    public ResponseEntity<ApiResponse<LocationResponseDto>> getLatestLocation(@PathVariable UUID id) {
        LocationResponseDto loc = rideService.getLatestLocation(id);
        return ResponseEntity.ok(ApiResponse.success(loc, "Latest location retrieved successfully"));
    }

    @GetMapping("/{id}/location/history")
    public ResponseEntity<ApiResponse<List<LocationResponseDto>>> getLocationHistory(@PathVariable UUID id) {
        List<LocationResponseDto> history = rideService.getLocationHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history, "Location history retrieved successfully"));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<RideResponseDto>> completeTrip(
            @PathVariable UUID id,
            @RequestBody(required = false) CompleteRideRequestDto request) {
        RideResponseDto ride = rideService.completeTrip(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Trip completed successfully. Real-time tracking stopped."));
    }

    // ====================================================
    // FEATURE 7 — DRIVER OPERATIONS CONTROLLER ENDPOINTS
    // ====================================================

    @PostMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<RideResponseDto>> acceptRideAssignment(@PathVariable UUID id) {
        RideResponseDto ride = rideService.acceptRideAssignment(id);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride assignment accepted successfully. Please proceed to pickup location."));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<RideResponseDto>> rejectRideAssignment(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRideRequestDto request) {
        RideResponseDto ride = rideService.rejectRideAssignment(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Ride assignment rejected. Transport manager has been notified."));
    }

    @PostMapping("/{id}/verify-employee")
    public ResponseEntity<ApiResponse<RideResponseDto>> verifyEmployeeForRide(
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeVerificationRequestDto request) {
        RideResponseDto ride = rideService.verifyEmployeeForRide(id, request);
        return ResponseEntity.ok(ApiResponse.success(ride, "Employee passenger verified successfully. You may now start the ride."));
    }
}
