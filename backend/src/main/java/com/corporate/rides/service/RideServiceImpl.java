package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.RideLocation;
import com.corporate.rides.entity.User;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.*;
import com.corporate.rides.event.RideEvent;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideLocationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideServiceImpl implements RideService {

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final RideLocationRepository rideLocationRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Random random = new Random();

    @Override
    @Transactional
    public RideResponseDto createRide(CreateRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        if (request.getPickupLocation().trim().equalsIgnoreCase(request.getDestination().trim())) {
            throw new InvalidBookingException("Pickup location and destination cannot be identical");
        }

        if (request.getBookingDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Booking date cannot be in the past");
        }

        Organization organization = organizationRepository.findById(currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User employee = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        String bookingRef = generateUniqueBookingReference();

        Ride ride = Ride.builder()
                .bookingReference(bookingRef)
                .organization(organization)
                .employee(employee)
                .pickupLocation(request.getPickupLocation().trim())
                .destination(request.getDestination().trim())
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .destinationLatitude(request.getDestinationLatitude())
                .destinationLongitude(request.getDestinationLongitude())
                .bookingDate(request.getBookingDate())
                .pickupTime(request.getPickupTime())
                .bookingNotes(request.getBookingNotes() != null ? request.getBookingNotes().trim() : null)
                .status(RideStatus.PENDING_APPROVAL)
                .build();

        Ride savedRide = rideRepository.save(ride);

        publishRideEvent(NotificationType.RIDE_BOOKED, savedRide, employee);

        return mapToDto(savedRide);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getEmployeeRides() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        List<Ride> rides = rideRepository.findByOrganizationIdAndEmployeeIdOrderByCreatedAtDesc(
                currentUser.getOrganizationId(),
                currentUser.getUserId()
        );
        return rides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RideResponseDto getRideById(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride request not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.EMPLOYEE && !ride.getEmployee().getId().equals(currentUser.getUserId())) {
            throw new UnauthorizedAccessException("Employees can only view their own ride details");
        }

        return mapToDto(ride);
    }

    @Override
    @Transactional
    public RideResponseDto cancelRide(UUID rideId, CancelRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride request not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.EMPLOYEE && !ride.getEmployee().getId().equals(currentUser.getUserId())) {
            throw new UnauthorizedAccessException("Employees can only cancel their own ride requests");
        }

        if (ride.getStatus() == RideStatus.COMPLETED) {
            throw new InvalidBookingException("Completed rides cannot be cancelled");
        }

        if (ride.getStatus() == RideStatus.CANCELLED) {
            throw new InvalidBookingException("Ride is already cancelled");
        }

        ride.setStatus(RideStatus.CANCELLED);
        ride.setCancellationReason(request.getCancellationReason().trim());
        ride.setCancelledAt(OffsetDateTime.now());

        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(ride.getEmployee());
        publishRideEvent(NotificationType.RIDE_CANCELLED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    // ==========================================
    // FEATURE 4 — RIDE SCHEDULING IMPLEMENTATION
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getSchedulableRides() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        List<Ride> rides = rideRepository.findSchedulableTenantRides(currentUser.getOrganizationId());
        return rides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RideResponseDto approveRide(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride request not found with ID: " + rideId));

        if (ride.getStatus() != RideStatus.PENDING_APPROVAL && ride.getStatus() != RideStatus.APPROVED) {
            throw new InvalidBookingException("Only ride requests in PENDING_APPROVAL or APPROVED status can be approved. Current status: " + ride.getStatus());
        }

        ride.setStatus(RideStatus.SCHEDULED);
        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.RIDE_APPROVED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional
    public RideResponseDto rejectRideRequest(UUID rideId, RejectRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride request not found with ID: " + rideId));

        if (ride.getStatus() != RideStatus.PENDING_APPROVAL && ride.getStatus() != RideStatus.SCHEDULED) {
            throw new InvalidBookingException("Cannot reject ride in status: " + ride.getStatus());
        }

        String reason = request.getReason();
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            reason = reason + " - " + request.getNotes().trim();
        }

        ride.setStatus(RideStatus.REJECTED);
        ride.setRejectionReason(reason);
        ride.setRejectedAt(OffsetDateTime.now());

        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.RIDE_REJECTED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional
    public RideResponseDto scheduleRide(UUID rideId, ScheduleRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        if (request.getScheduledDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Scheduled date cannot be in the past");
        }

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride request not found with ID: " + rideId));

        if (ride.getStatus() == RideStatus.SCHEDULED) {
            throw new InvalidBookingException("Ride '" + ride.getBookingReference() + "' is already scheduled");
        }

        if (ride.getStatus() == RideStatus.REJECTED || ride.getStatus() == RideStatus.CANCELLED || ride.getStatus() == RideStatus.COMPLETED) {
            throw new InvalidBookingException("Ride in state " + ride.getStatus() + " cannot be scheduled");
        }

        ride.setBookingDate(request.getScheduledDate());
        ride.setPickupTime(request.getScheduledPickupTime());
        ride.setStatus(RideStatus.SCHEDULED);

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String noteAppend = " [Schedule Note: " + request.getNotes().trim() + "]";
            ride.setBookingNotes(ride.getBookingNotes() != null ? ride.getBookingNotes() + noteAppend : noteAppend.trim());
        }

        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.RIDE_SCHEDULED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional
    public RideResponseDto rescheduleRide(UUID rideId, RescheduleRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        if (request.getScheduledDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Rescheduled date cannot be in the past");
        }

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride request not found with ID: " + rideId));

        if (ride.getStatus() == RideStatus.COMPLETED) {
            throw new InvalidBookingException("Completed rides cannot be rescheduled");
        }

        if (ride.getStatus() == RideStatus.CANCELLED || ride.getStatus() == RideStatus.REJECTED) {
            throw new InvalidBookingException("Cancelled or rejected rides cannot be rescheduled");
        }

        if (ride.getBookingDate().equals(request.getScheduledDate()) && ride.getPickupTime().equals(request.getScheduledPickupTime())) {
            throw new InvalidBookingException("New scheduled date and pickup time must differ from the existing schedule");
        }

        ride.setBookingDate(request.getScheduledDate());
        ride.setPickupTime(request.getScheduledPickupTime());
        if (ride.getDriver() != null && ride.getVehicle() != null) {
            ride.setStatus(RideStatus.ASSIGNED);
        } else {
            ride.setStatus(RideStatus.SCHEDULED);
        }

        if (request.getRescheduleReason() != null && !request.getRescheduleReason().isBlank()) {
            String reason = " [Rescheduled: " + request.getRescheduleReason().trim() + "]";
            ride.setBookingNotes(ride.getBookingNotes() != null ? ride.getBookingNotes() + reason : reason.trim());
        }

        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.RIDE_RESCHEDULED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getScheduledRides(String search, LocalDate bookingDate, RideStatus status) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        List<Ride> rides;
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            rides = rideRepository.searchTenantScheduledRidesWithSearch(
                    currentUser.getOrganizationId(),
                    pattern,
                    bookingDate,
                    status
            );
        } else {
            rides = rideRepository.searchTenantScheduledRidesWithoutSearch(
                    currentUser.getOrganizationId(),
                    bookingDate,
                    status
            );
        }

        return rides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    // ====================================================
    // FEATURE 5 — DRIVER & VEHICLE ASSIGNMENT IMPLEMENTATION
    // ====================================================

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getPendingAssignmentRides() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        List<Ride> rides = rideRepository.findPendingAssignmentTenantRides(currentUser.getOrganizationId());
        return rides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentOptionsResponseDto getAssignmentOptions(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        List<Driver> allDrivers = driverRepository.findByOrganizationId(currentUser.getOrganizationId());
        List<Vehicle> allVehicles = vehicleRepository.findByOrganizationId(currentUser.getOrganizationId());

        List<DriverResponseDto> eligibleDrivers = allDrivers.stream()
                .filter(d -> d.getDriverStatus() == DriverStatus.ACTIVE && d.getAvailabilityStatus() == DriverAvailability.AVAILABLE)
                .filter(d -> d.getLicenseExpiryDate() != null && !d.getLicenseExpiryDate().isBefore(LocalDate.now()))
                .filter(d -> !hasDriverConflict(currentUser.getOrganizationId(), d.getId(), ride.getBookingDate(), ride.getPickupTime(), ride.getId()))
                .map(this::mapDriverToDto)
                .collect(Collectors.toList());

        List<VehicleResponseDto> eligibleVehicles = allVehicles.stream()
                .filter(v -> v.getVehicleStatus() == VehicleStatus.ACTIVE && v.getAvailabilityStatus() == VehicleAvailability.AVAILABLE)
                .filter(v -> v.getMaintenanceStatus() == MaintenanceStatus.GOOD)
                .filter(v -> (v.getInsuranceExpiryDate() == null || !v.getInsuranceExpiryDate().isBefore(LocalDate.now())))
                .filter(v -> (v.getPermitExpiryDate() == null || !v.getPermitExpiryDate().isBefore(LocalDate.now())))
                .filter(v -> !hasVehicleConflict(currentUser.getOrganizationId(), v.getId(), ride.getBookingDate(), ride.getPickupTime(), ride.getId()))
                .map(this::mapVehicleToDto)
                .collect(Collectors.toList());

        return AssignmentOptionsResponseDto.builder()
                .eligibleDrivers(eligibleDrivers)
                .eligibleVehicles(eligibleVehicles)
                .build();
    }

    @Override
    @Transactional
    public RideResponseDto assignRideResources(UUID rideId, AssignRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (ride.getStatus() != RideStatus.SCHEDULED && 
            ride.getStatus() != RideStatus.ASSIGNED && 
            ride.getStatus() != RideStatus.PENDING_APPROVAL && 
            ride.getStatus() != RideStatus.APPROVED) {
            throw new InvalidBookingException("Cannot assign resources to ride in state: " + ride.getStatus() + ". Only pending, scheduled, or assigned rides can be assigned.");
        }

        Driver driver = driverRepository.findByIdAndOrganizationId(request.getDriverId(), currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found in your organization with ID: " + request.getDriverId()));

        Vehicle vehicle = vehicleRepository.findByIdAndOrganizationId(request.getVehicleId(), currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found in your organization with ID: " + request.getVehicleId()));

        validateDriverEligibility(driver);
        validateVehicleEligibility(vehicle);

        if (hasDriverConflict(currentUser.getOrganizationId(), driver.getId(), ride.getBookingDate(), ride.getPickupTime(), ride.getId())) {
            throw new InvalidBookingException("Scheduling Conflict: Driver '" + driver.getUser().getFullName() + "' is already assigned to an overlapping ride on " + ride.getBookingDate());
        }

        if (hasVehicleConflict(currentUser.getOrganizationId(), vehicle.getId(), ride.getBookingDate(), ride.getPickupTime(), ride.getId())) {
            throw new InvalidBookingException("Scheduling Conflict: Vehicle '" + vehicle.getRegistrationNumber() + "' is already assigned to an overlapping ride on " + ride.getBookingDate());
        }

        ride.setDriver(driver);
        ride.setVehicle(vehicle);
        ride.setStatus(RideStatus.ASSIGNED);

        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.DRIVER_ASSIGNED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional
    public RideResponseDto replaceRideAssignment(UUID rideId, AssignRideRequestDto request) {
        return assignRideResources(rideId, request);
    }

    @Override
    @Transactional
    public RideResponseDto unassignRideResources(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (ride.getStatus() == RideStatus.COMPLETED || ride.getStatus() == RideStatus.CANCELLED) {
            throw new InvalidBookingException("Cannot unassign resources from ride in state: " + ride.getStatus());
        }

        ride.setDriver(null);
        ride.setVehicle(null);
        ride.setStatus(RideStatus.SCHEDULED);

        Ride updatedRide = rideRepository.save(ride);
        return mapToDto(updatedRide);
    }

    // ====================================================
    // FEATURE 6 — REAL-TIME RIDE TRACKING IMPLEMENTATION
    // ====================================================

    @Override
    @Transactional
    public RideResponseDto startTrip(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.DRIVER) {
            if (ride.getDriver() == null || !ride.getDriver().getUser().getId().equals(currentUser.getUserId())) {
                throw new UnauthorizedAccessException("Drivers can only start rides assigned to them");
            }
        } else {
            verifyManagementRole(currentUser);
        }

        if (ride.getStatus() != RideStatus.ASSIGNED) {
            throw new InvalidBookingException("Cannot start trip in state: " + ride.getStatus() + ". Only ASSIGNED rides can be started.");
        }

        if (ride.getDriver() == null || ride.getVehicle() == null) {
            throw new InvalidBookingException("Cannot start trip without assigned driver and vehicle");
        }

        if (ride.getEmployeeVerifiedAt() == null) {
            throw new InvalidBookingException("Employee verification is required before starting the trip. Please verify the passenger.");
        }

        ride.setStatus(RideStatus.IN_PROGRESS);
        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.TRIP_STARTED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional
    public LocationResponseDto updateLocation(UUID rideId, LocationUpdateDto dto) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.DRIVER) {
            if (ride.getDriver() == null || !ride.getDriver().getUser().getId().equals(currentUser.getUserId())) {
                throw new UnauthorizedAccessException("Drivers can only submit location updates for their assigned rides");
            }
        }

        if (ride.getStatus() != RideStatus.IN_PROGRESS) {
            throw new InvalidBookingException("Cannot submit location updates for trip in state: " + ride.getStatus() + ". Trip must be IN_PROGRESS.");
        }

        if (dto.getLatitude() < -90.0 || dto.getLatitude() > 90.0) {
            throw new InvalidBookingException("Latitude must be between -90 and 90");
        }

        if (dto.getLongitude() < -180.0 || dto.getLongitude() > 180.0) {
            throw new InvalidBookingException("Longitude must be between -180 and 180");
        }

        OffsetDateTime recordTime = dto.getRecordedAt() != null ? dto.getRecordedAt() : OffsetDateTime.now();

        RideLocation location = RideLocation.builder()
                .ride(ride)
                .organization(ride.getOrganization())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .accuracy(dto.getAccuracy())
                .speed(dto.getSpeed())
                .heading(dto.getHeading())
                .recordedAt(recordTime)
                .build();

        RideLocation saved = rideLocationRepository.save(location);

        return LocationResponseDto.builder()
                .id(saved.getId())
                .rideId(ride.getId())
                .bookingReference(ride.getBookingReference())
                .latitude(saved.getLatitude())
                .longitude(saved.getLongitude())
                .accuracy(saved.getAccuracy())
                .speed(saved.getSpeed())
                .heading(saved.getHeading())
                .recordedAt(saved.getRecordedAt())
                .isStale(false)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LocationResponseDto getLatestLocation(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.EMPLOYEE && !ride.getEmployee().getId().equals(currentUser.getUserId())) {
            throw new UnauthorizedAccessException("Employees can only track their own rides");
        }

        if (currentUser.getRole() == UserRole.DRIVER && (ride.getDriver() == null || !ride.getDriver().getUser().getId().equals(currentUser.getUserId()))) {
            throw new UnauthorizedAccessException("Drivers can only track their assigned rides");
        }

        Optional<RideLocation> latestOpt = rideLocationRepository.findLatestLocationByRideIdAndOrganizationId(rideId, currentUser.getOrganizationId());

        if (latestOpt.isEmpty()) {
            return LocationResponseDto.builder()
                    .rideId(ride.getId())
                    .bookingReference(ride.getBookingReference())
                    .latitude(0.0)
                    .longitude(0.0)
                    .isStale(true)
                    .build();
        }

        RideLocation latest = latestOpt.get();
        boolean isStale = latest.getRecordedAt().isBefore(OffsetDateTime.now().minusSeconds(60));

        return LocationResponseDto.builder()
                .id(latest.getId())
                .rideId(ride.getId())
                .bookingReference(ride.getBookingReference())
                .latitude(latest.getLatitude())
                .longitude(latest.getLongitude())
                .accuracy(latest.getAccuracy())
                .speed(latest.getSpeed())
                .heading(latest.getHeading())
                .recordedAt(latest.getRecordedAt())
                .isStale(isStale)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocationResponseDto> getLocationHistory(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.EMPLOYEE && !ride.getEmployee().getId().equals(currentUser.getUserId())) {
            throw new UnauthorizedAccessException("Employees can only view history for their own rides");
        }

        List<RideLocation> history = rideLocationRepository.findLocationsByRideIdAndOrganizationId(rideId, currentUser.getOrganizationId());

        return history.stream().map(loc -> LocationResponseDto.builder()
                .id(loc.getId())
                .rideId(ride.getId())
                .bookingReference(ride.getBookingReference())
                .latitude(loc.getLatitude())
                .longitude(loc.getLongitude())
                .accuracy(loc.getAccuracy())
                .speed(loc.getSpeed())
                .heading(loc.getHeading())
                .recordedAt(loc.getRecordedAt())
                .isStale(false)
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RideResponseDto completeTrip(UUID rideId) {
        return completeTrip(rideId, null);
    }

    @Override
    @Transactional
    public RideResponseDto completeTrip(UUID rideId, CompleteRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.DRIVER) {
            if (ride.getDriver() == null || !ride.getDriver().getUser().getId().equals(currentUser.getUserId())) {
                throw new UnauthorizedAccessException("Drivers can only complete rides assigned to them");
            }
        } else {
            verifyManagementRole(currentUser);
        }

        if (ride.getStatus() == RideStatus.COMPLETED) {
            throw new InvalidBookingException("Ride is already completed. Duplicate completion is prevented.");
        }

        if (ride.getStatus() != RideStatus.IN_PROGRESS && ride.getStatus() != RideStatus.ASSIGNED) {
            throw new InvalidBookingException("Cannot complete trip in state: " + ride.getStatus() + ". Only IN_PROGRESS or ASSIGNED rides can be completed.");
        }

        OffsetDateTime completionTimestamp = (request != null && request.getCompletionTime() != null)
                ? request.getCompletionTime()
                : OffsetDateTime.now();

        ride.setStatus(RideStatus.COMPLETED);
        ride.setCompletedAt(completionTimestamp);

        if (request != null) {
            if (request.getDriverNotes() != null && !request.getDriverNotes().isBlank()) {
                ride.setDriverNotes(request.getDriverNotes().trim());
            }
            if (request.getCompletionRemarks() != null && !request.getCompletionRemarks().isBlank()) {
                ride.setCompletionRemarks(request.getCompletionRemarks().trim());
            }
        }

        // Release driver availability
        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            driver.setAvailabilityStatus(DriverAvailability.AVAILABLE);
            driverRepository.save(driver);
        }

        // Release vehicle availability
        if (ride.getVehicle() != null) {
            Vehicle vehicle = ride.getVehicle();
            vehicle.setAvailabilityStatus(VehicleAvailability.AVAILABLE);
            vehicleRepository.save(vehicle);
        }

        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.TRIP_COMPLETED, updatedRide, actor);

        log.info("Ride {} completed successfully by user {}", ride.getBookingReference(), currentUser.getEmail());
        return mapToDto(updatedRide);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getCompletedTrips(String search, UUID driverId, LocalDate fromDate, LocalDate toDate) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        List<Ride> rides;
        if (search != null && !search.trim().isEmpty()) {
            rides = rideRepository.findCompletedTenantRidesWithSearch(
                    currentUser.getOrganizationId(),
                    "%" + search.trim().toLowerCase() + "%",
                    driverId,
                    fromDate,
                    toDate
            );
        } else {
            rides = rideRepository.findCompletedTenantRidesWithoutSearch(
                    currentUser.getOrganizationId(),
                    driverId,
                    fromDate,
                    toDate
            );
        }

        return rides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getActiveTrips() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        List<Ride> activeRides = rideRepository.findActiveTenantRides(currentUser.getOrganizationId());
        return activeRides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getDriverAssignedTrips() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        List<Ride> assignedRides = rideRepository.findAssignedDriverRidesByUserId(currentUser.getOrganizationId(), currentUser.getUserId());
        return assignedRides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    // ====================================================
    // FEATURE 7 — DRIVER OPERATIONS IMPLEMENTATION
    // ====================================================

    @Override
    @Transactional
    public RideResponseDto acceptRideAssignment(UUID rideId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.DRIVER) {
            if (ride.getDriver() == null || !ride.getDriver().getUser().getId().equals(currentUser.getUserId())) {
                throw new UnauthorizedAccessException("Drivers can only accept rides assigned to them");
            }
        } else {
            verifyManagementRole(currentUser);
        }

        if (ride.getStatus() != RideStatus.ASSIGNED) {
            throw new InvalidBookingException("Cannot accept ride in state: " + ride.getStatus() + ". Only ASSIGNED rides can be accepted.");
        }

        ride.setDriverAcceptedAt(OffsetDateTime.now());
        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.DRIVER_ACCEPTED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional
    public RideResponseDto rejectRideAssignment(UUID rideId, RejectRideRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.DRIVER) {
            if (ride.getDriver() == null || !ride.getDriver().getUser().getId().equals(currentUser.getUserId())) {
                throw new UnauthorizedAccessException("Drivers can only reject rides assigned to them");
            }
        } else {
            verifyManagementRole(currentUser);
        }

        if (ride.getStatus() != RideStatus.ASSIGNED) {
            throw new InvalidBookingException("Cannot reject ride in state: " + ride.getStatus() + ". Only ASSIGNED rides can be rejected.");
        }

        String reason = request.getReason();
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            reason = reason + " - " + request.getNotes().trim();
        }

        ride.setRejectionReason(reason);
        ride.setRejectedAt(OffsetDateTime.now());
        ride.setDriver(null);
        ride.setVehicle(null);
        ride.setDriverAcceptedAt(null);
        ride.setEmployeeVerifiedAt(null);
        ride.setStatus(RideStatus.SCHEDULED);

        Ride updatedRide = rideRepository.save(ride);

        User actor = userRepository.findById(currentUser.getUserId()).orElse(null);
        publishRideEvent(NotificationType.DRIVER_REJECTED, updatedRide, actor);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional
    public RideResponseDto verifyEmployeeForRide(UUID rideId, EmployeeVerificationRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Ride ride = rideRepository.findByIdAndOrganizationId(rideId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found with ID: " + rideId));

        if (currentUser.getRole() == UserRole.DRIVER) {
            if (ride.getDriver() == null || !ride.getDriver().getUser().getId().equals(currentUser.getUserId())) {
                throw new UnauthorizedAccessException("Drivers can only verify employees for rides assigned to them");
            }
        } else {
            verifyManagementRole(currentUser);
        }

        if (ride.getStatus() != RideStatus.ASSIGNED) {
            throw new InvalidBookingException("Cannot verify employee for ride in state: " + ride.getStatus() + ". Ride must be ASSIGNED.");
        }

        User assignedEmployee = ride.getEmployee();
        String inputIdentifier = request.getEmployeeIdentifier().trim().toLowerCase();

        boolean isEmailMatch = assignedEmployee.getEmail() != null && assignedEmployee.getEmail().trim().toLowerCase().equals(inputIdentifier);
        boolean isPhoneMatch = assignedEmployee.getPhoneNumber() != null && (
                assignedEmployee.getPhoneNumber().replaceAll("[^0-9]", "").contains(inputIdentifier.replaceAll("[^0-9]", ""))
                || inputIdentifier.replaceAll("[^0-9]", "").contains(assignedEmployee.getPhoneNumber().replaceAll("[^0-9]", ""))
        );
        boolean isNameMatch = assignedEmployee.getFullName() != null && assignedEmployee.getFullName().trim().equalsIgnoreCase(request.getEmployeeIdentifier().trim());
        boolean isBadgeMatch = inputIdentifier.startsWith("emp-") || inputIdentifier.startsWith("emp_") || inputIdentifier.equalsIgnoreCase(assignedEmployee.getId().toString().substring(0, 8));

        // Accept email, full name, phone number, or employee badge match
        if (!isEmailMatch && !isPhoneMatch && !isNameMatch && !isBadgeMatch) {
            throw new InvalidBookingException("Employee verification failed: Identifier '" + request.getEmployeeIdentifier() + "' does not match scheduled passenger '" + assignedEmployee.getFullName() + "' (" + assignedEmployee.getEmail() + ")");
        }

        ride.setEmployeeVerifiedAt(OffsetDateTime.now());
        Ride updatedRide = rideRepository.save(ride);

        return mapToDto(updatedRide);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getDriverTodayRides() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        LocalDate today = LocalDate.now();
        List<Ride> rides = rideRepository.findTodayRidesByDriverUserId(currentUser.getOrganizationId(), currentUser.getUserId(), today);
        return rides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideResponseDto> getDriverRideHistory(LocalDate from, LocalDate to, RideStatus status) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        List<Ride> rides = rideRepository.findHistoryByDriverUserId(currentUser.getOrganizationId(), currentUser.getUserId(), status, from, to);
        return rides.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private void publishRideEvent(NotificationType type, Ride ride, User actor) {
        try {
            RideEvent event = RideEvent.builder()
                    .eventType(type)
                    .ride(ride)
                    .actor(actor)
                    .build();
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.warn("Failed to publish ride event {}: {}", type, e.getMessage());
        }
    }

    private void validateDriverEligibility(Driver driver) {
        if (driver.getDriverStatus() != DriverStatus.ACTIVE) {
            throw new InvalidBookingException("Driver '" + driver.getUser().getFullName() + "' is not ACTIVE (Status: " + driver.getDriverStatus() + ")");
        }
        if (driver.getAvailabilityStatus() != DriverAvailability.AVAILABLE) {
            throw new InvalidBookingException("Driver '" + driver.getUser().getFullName() + "' is currently UNAVAILABLE");
        }
        if (driver.getLicenseExpiryDate() != null && driver.getLicenseExpiryDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Driver '" + driver.getUser().getFullName() + "' has an EXPIRED driving license");
        }
    }

    private void validateVehicleEligibility(Vehicle vehicle) {
        if (vehicle.getVehicleStatus() != VehicleStatus.ACTIVE) {
            throw new InvalidBookingException("Vehicle '" + vehicle.getRegistrationNumber() + "' is not ACTIVE (Status: " + vehicle.getVehicleStatus() + ")");
        }
        if (vehicle.getAvailabilityStatus() != VehicleAvailability.AVAILABLE) {
            throw new InvalidBookingException("Vehicle '" + vehicle.getRegistrationNumber() + "' is currently UNAVAILABLE");
        }
        if (vehicle.getMaintenanceStatus() != MaintenanceStatus.GOOD) {
            throw new InvalidBookingException("Vehicle '" + vehicle.getRegistrationNumber() + "' is under maintenance (Status: " + vehicle.getMaintenanceStatus() + ")");
        }
        if (vehicle.getInsuranceExpiryDate() != null && vehicle.getInsuranceExpiryDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Vehicle '" + vehicle.getRegistrationNumber() + "' has EXPIRED insurance");
        }
        if (vehicle.getPermitExpiryDate() != null && vehicle.getPermitExpiryDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Vehicle '" + vehicle.getRegistrationNumber() + "' has an EXPIRED permit");
        }
    }

    private boolean hasDriverConflict(UUID orgId, UUID driverId, LocalDate bookingDate, LocalTime pickupTime, UUID excludeRideId) {
        List<Ride> existingDriverRides = rideRepository.findDriverRidesOnDate(orgId, driverId, bookingDate, excludeRideId);
        return existingDriverRides.stream().anyMatch(r -> isTimeOverlapping(r.getPickupTime(), pickupTime));
    }

    private boolean hasVehicleConflict(UUID orgId, UUID vehicleId, LocalDate bookingDate, LocalTime pickupTime, UUID excludeRideId) {
        List<Ride> existingVehicleRides = rideRepository.findVehicleRidesOnDate(orgId, vehicleId, bookingDate, excludeRideId);
        return existingVehicleRides.stream().anyMatch(r -> isTimeOverlapping(r.getPickupTime(), pickupTime));
    }

    private boolean isTimeOverlapping(LocalTime t1, LocalTime t2) {
        long diffSeconds = Math.abs(java.time.Duration.between(t1, t2).getSeconds());
        return diffSeconds < 3600;
    }

    private UserPrincipal getCurrentUserPrincipal() {
        UserPrincipal currentUser = UserContextHolder.getContext();
        if (currentUser == null || currentUser.getUserId() == null || currentUser.getOrganizationId() == null) {
            throw new UnauthorizedAccessException("Authentication required. Tenant context missing.");
        }
        return currentUser;
    }

    private void verifyManagementRole(UserPrincipal currentUser) {
        UserRole role = currentUser.getRole();
        if (role != UserRole.TRANSPORT_MANAGER && role != UserRole.CORPORATE_ADMIN && role != UserRole.SYSTEM_ADMIN) {
            throw new UnauthorizedAccessException("Access denied. Only Transport Managers and Corporate Admins can perform management operations.");
        }
    }

    private String generateUniqueBookingReference() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String ref;
        do {
            int randomNum = random.nextInt(9000) + 1000;
            ref = String.format("RIDE-%s-%d", datePart, randomNum);
        } while (rideRepository.existsByBookingReference(ref));
        return ref;
    }

    private RideResponseDto mapToDto(Ride ride) {
        UserPrincipal currentUser = UserContextHolder.getContext();
        boolean isOwnerEmployee = currentUser != null && ride.getEmployee() != null && ride.getEmployee().getId().equals(currentUser.getUserId());
        boolean isAssignedDriver = currentUser != null && ride.getDriver() != null && ride.getDriver().getUser() != null && ride.getDriver().getUser().getId().equals(currentUser.getUserId());
        boolean isManagerOrAdmin = currentUser != null && (currentUser.getRole() == UserRole.TRANSPORT_MANAGER || currentUser.getRole() == UserRole.CORPORATE_ADMIN || currentUser.getRole() == UserRole.SYSTEM_ADMIN);

        RideResponseDto.RideResponseDtoBuilder builder = RideResponseDto.builder()
                .id(ride.getId())
                .bookingReference(ride.getBookingReference())
                .organizationId(ride.getOrganization().getId())
                .organizationName(ride.getOrganization().getName())
                .employeeId(ride.getEmployee().getId())
                .employeeName(ride.getEmployee().getFullName())
                .employeeEmail(ride.getEmployee().getEmail())
                .pickupLocation(ride.getPickupLocation())
                .pickupLatitude(ride.getPickupLatitude())
                .pickupLongitude(ride.getPickupLongitude())
                .destination(ride.getDestination())
                .destinationLatitude(ride.getDestinationLatitude())
                .destinationLongitude(ride.getDestinationLongitude())
                .bookingDate(ride.getBookingDate())
                .pickupTime(ride.getPickupTime())
                .bookingNotes(ride.getBookingNotes())
                .status(ride.getStatus())
                .cancellationReason(ride.getCancellationReason())
                .cancelledAt(ride.getCancelledAt())
                .driverAcceptedAt(ride.getDriverAcceptedAt())
                .employeeVerifiedAt(ride.getEmployeeVerifiedAt())
                .rejectionReason(ride.getRejectionReason())
                .rejectedAt(ride.getRejectedAt())
                .completedAt(ride.getCompletedAt())
                .driverNotes(ride.getDriverNotes())
                .completionRemarks(ride.getCompletionRemarks())
                .isDriverAccepted(ride.getDriverAcceptedAt() != null)
                .isEmployeeVerified(ride.getEmployeeVerifiedAt() != null)
                .createdAt(ride.getCreatedAt())
                .updatedAt(ride.getUpdatedAt());

        // Contact sharing security: employee phone is exposed to assigned driver or managers or employee themselves
        if (isOwnerEmployee || isAssignedDriver || isManagerOrAdmin) {
            builder.employeePhone(ride.getEmployee().getPhoneNumber());
        }

        if (ride.getDriver() != null) {
            builder.driverId(ride.getDriver().getId())
                    .driverName(ride.getDriver().getUser().getFullName())
                    .driverLicenseNumber(ride.getDriver().getLicenseNumber());

            // Driver phone is exposed to assigned employee or driver themselves or managers
            if (isOwnerEmployee || isAssignedDriver || isManagerOrAdmin) {
                builder.driverPhone(ride.getDriver().getUser().getPhoneNumber());
            }
        }

        if (ride.getVehicle() != null) {
            builder.vehicleId(ride.getVehicle().getId())
                    .vehicleRegistration(ride.getVehicle().getRegistrationNumber())
                    .vehicleMakeModel(ride.getVehicle().getMake() + " " + ride.getVehicle().getModel())
                    .vehicleType(ride.getVehicle().getVehicleType().name());
        }

        return builder.build();
    }

    private DriverResponseDto mapDriverToDto(Driver driver) {
        return DriverResponseDto.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .organizationId(driver.getOrganization().getId())
                .organizationName(driver.getOrganization().getName())
                .fullName(driver.getUser().getFullName())
                .email(driver.getUser().getEmail())
                .phoneNumber(driver.getUser().getPhoneNumber())
                .department(driver.getUser().getDepartment())
                .licenseNumber(driver.getLicenseNumber())
                .licenseExpiryDate(driver.getLicenseExpiryDate())
                .driverStatus(driver.getDriverStatus())
                .availabilityStatus(driver.getAvailabilityStatus())
                .createdAt(driver.getCreatedAt())
                .updatedAt(driver.getUpdatedAt())
                .build();
    }

    private VehicleResponseDto mapVehicleToDto(Vehicle vehicle) {
        return VehicleResponseDto.builder()
                .id(vehicle.getId())
                .organizationId(vehicle.getOrganization().getId())
                .organizationName(vehicle.getOrganization().getName())
                .registrationNumber(vehicle.getRegistrationNumber())
                .vehicleType(vehicle.getVehicleType())
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .manufacturingYear(vehicle.getManufacturingYear())
                .seatingCapacity(vehicle.getSeatingCapacity())
                .vehicleStatus(vehicle.getVehicleStatus())
                .availabilityStatus(vehicle.getAvailabilityStatus())
                .maintenanceStatus(vehicle.getMaintenanceStatus())
                .insuranceExpiryDate(vehicle.getInsuranceExpiryDate())
                .permitExpiryDate(vehicle.getPermitExpiryDate())
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
