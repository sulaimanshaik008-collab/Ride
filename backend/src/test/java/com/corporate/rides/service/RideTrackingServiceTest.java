package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.*;
import com.corporate.rides.enums.*;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class RideTrackingServiceTest {

    @Autowired
    private RideService rideService;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RideLocationRepository rideLocationRepository;

    private Organization organization;
    private User manager;
    private User employee;
    private User driverUser;
    private Driver driver;
    private Vehicle vehicle;
    private Ride assignedRide;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Tracking Test Org")
                .code("TRACK_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("mgr.track@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Tracking Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("emp.track@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Tracking Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        driverUser = userRepository.save(User.builder()
                .organization(organization)
                .email("drv.track@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Tracking Driver")
                .phoneNumber("+1-555-0188")
                .role(UserRole.DRIVER)
                .build());

        driver = driverRepository.save(Driver.builder()
                .user(driverUser)
                .organization(organization)
                .licenseNumber("DL-TRACK-888")
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .organization(organization)
                .registrationNumber("KA-03-TRACK-88")
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Corolla")
                .seatingCapacity(4)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .build());

        assignedRide = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-TRACK-888")
                .organization(organization)
                .employee(employee)
                .driver(driver)
                .vehicle(vehicle)
                .pickupLocation("Indiranagar 100ft Rd")
                .destination("Koramangala Sony World")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.now())
                .status(RideStatus.ASSIGNED)
                .employeeVerifiedAt(java.time.OffsetDateTime.now())
                .build());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(driverUser.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(driverUser.getEmail())
                .fullName(driverUser.getFullName())
                .role(UserRole.DRIVER)
                .build();

        UserContextHolder.setContext(principal);
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    void testStartTrip_DriverSuccess() {
        RideResponseDto started = rideService.startTrip(assignedRide.getId());
        assertNotNull(started);
        assertEquals(RideStatus.IN_PROGRESS, started.getStatus());
    }

    @Test
    void testUpdateLocation_ValidCoordinates_Success() {
        rideService.startTrip(assignedRide.getId());

        LocationUpdateDto dto = LocationUpdateDto.builder()
                .latitude(12.9716)
                .longitude(77.5946)
                .accuracy(5.0)
                .speed(35.5)
                .heading(90.0)
                .recordedAt(OffsetDateTime.now())
                .build();

        LocationResponseDto loc = rideService.updateLocation(assignedRide.getId(), dto);

        assertNotNull(loc);
        assertEquals(12.9716, loc.getLatitude());
        assertEquals(77.5946, loc.getLongitude());
        assertFalse(loc.getIsStale());
    }

    @Test
    void testUpdateLocation_InvalidLatitude_ThrowsException() {
        rideService.startTrip(assignedRide.getId());

        LocationUpdateDto dto = LocationUpdateDto.builder()
                .latitude(105.0)
                .longitude(77.5946)
                .build();

        assertThrows(InvalidBookingException.class, () -> rideService.updateLocation(assignedRide.getId(), dto));
    }

    @Test
    void testGetLatestLocation_Success() {
        rideService.startTrip(assignedRide.getId());

        LocationUpdateDto dto = LocationUpdateDto.builder()
                .latitude(12.9352)
                .longitude(77.6245)
                .accuracy(4.0)
                .speed(28.0)
                .heading(180.0)
                .recordedAt(OffsetDateTime.now())
                .build();

        rideService.updateLocation(assignedRide.getId(), dto);

        UserPrincipal empPrincipal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(employee.getEmail())
                .fullName(employee.getFullName())
                .role(UserRole.EMPLOYEE)
                .build();
        UserContextHolder.setContext(empPrincipal);

        LocationResponseDto latest = rideService.getLatestLocation(assignedRide.getId());

        assertNotNull(latest);
        assertEquals(12.9352, latest.getLatitude());
        assertEquals(77.6245, latest.getLongitude());
        assertFalse(latest.getIsStale());
    }

    @Test
    void testCompleteTrip_Success() {
        rideService.startTrip(assignedRide.getId());

        RideResponseDto completed = rideService.completeTrip(assignedRide.getId());

        assertNotNull(completed);
        assertEquals(RideStatus.COMPLETED, completed.getStatus());
    }
}
