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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class RideAssignmentServiceTest {

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

    private Organization organization;
    private User manager;
    private User employee;
    private Driver driver;
    private Vehicle vehicle;
    private Ride scheduledRide;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Assign Test Org")
                .code("ASSIGN_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("mgr.assign@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Transport Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("emp.assign@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        User driverUser = userRepository.save(User.builder()
                .organization(organization)
                .email("drv.assign@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Fleet Driver One")
                .phoneNumber("+1-555-0199")
                .role(UserRole.DRIVER)
                .build());

        driver = driverRepository.save(Driver.builder()
                .user(driverUser)
                .organization(organization)
                .licenseNumber("DL-ASSIGN-101")
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .organization(organization)
                .registrationNumber("KA-01-ASSIGN-77")
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Camry")
                .seatingCapacity(4)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .insuranceExpiryDate(LocalDate.now().plusYears(1))
                .permitExpiryDate(LocalDate.now().plusYears(1))
                .build());

        scheduledRide = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-ASSIGN-001")
                .organization(organization)
                .employee(employee)
                .pickupLocation("Residency Road")
                .destination("Tech Park Hub")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(10, 0))
                .status(RideStatus.SCHEDULED)
                .build());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(manager.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(manager.getEmail())
                .fullName(manager.getFullName())
                .role(manager.getRole())
                .build();

        UserContextHolder.setContext(principal);
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    void testGetPendingAssignmentRides_Success() {
        List<RideResponseDto> pending = rideService.getPendingAssignmentRides();
        assertNotNull(pending);
        assertTrue(pending.stream().anyMatch(r -> r.getId().equals(scheduledRide.getId())));
    }

    @Test
    void testGetAssignmentOptions_Success() {
        AssignmentOptionsResponseDto options = rideService.getAssignmentOptions(scheduledRide.getId());
        assertNotNull(options);
        assertTrue(options.getEligibleDrivers().stream().anyMatch(d -> d.getId().equals(driver.getId())));
        assertTrue(options.getEligibleVehicles().stream().anyMatch(v -> v.getId().equals(vehicle.getId())));
    }

    @Test
    void testAssignRideResources_Success() {
        AssignRideRequestDto request = AssignRideRequestDto.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle.getId())
                .build();

        RideResponseDto assigned = rideService.assignRideResources(scheduledRide.getId(), request);

        assertNotNull(assigned);
        assertEquals(RideStatus.ASSIGNED, assigned.getStatus());
        assertEquals(driver.getId(), assigned.getDriverId());
        assertEquals(vehicle.getId(), assigned.getVehicleId());
        assertEquals(driver.getUser().getFullName(), assigned.getDriverName());
        assertEquals(vehicle.getRegistrationNumber(), assigned.getVehicleRegistration());
    }

    @Test
    void testAssignRideResources_DriverConflict_ThrowsException() {
        AssignRideRequestDto request1 = AssignRideRequestDto.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle.getId())
                .build();
        rideService.assignRideResources(scheduledRide.getId(), request1);

        Ride ride2 = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-ASSIGN-002")
                .organization(organization)
                .employee(employee)
                .pickupLocation("Point A")
                .destination("Point B")
                .bookingDate(scheduledRide.getBookingDate())
                .pickupTime(LocalTime.of(10, 15))
                .status(RideStatus.SCHEDULED)
                .build());

        Vehicle vehicle2 = vehicleRepository.save(Vehicle.builder()
                .organization(organization)
                .registrationNumber("KA-01-ASSIGN-88")
                .vehicleType(VehicleType.SUV)
                .make("Ford")
                .model("Endeavour")
                .seatingCapacity(6)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .build());

        AssignRideRequestDto request2 = AssignRideRequestDto.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle2.getId())
                .build();

        assertThrows(InvalidBookingException.class, () -> rideService.assignRideResources(ride2.getId(), request2));
    }

    @Test
    void testUnassignRideResources_Success() {
        AssignRideRequestDto request = AssignRideRequestDto.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle.getId())
                .build();
        rideService.assignRideResources(scheduledRide.getId(), request);

        RideResponseDto unassigned = rideService.unassignRideResources(scheduledRide.getId());

        assertEquals(RideStatus.SCHEDULED, unassigned.getStatus());
        assertNull(unassigned.getDriverId());
        assertNull(unassigned.getVehicleId());
    }

    @Test
    void testAssignRideResources_EmployeeDenied() {
        UserPrincipal empPrincipal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(employee.getEmail())
                .fullName(employee.getFullName())
                .role(UserRole.EMPLOYEE)
                .build();

        UserContextHolder.setContext(empPrincipal);

        AssignRideRequestDto request = AssignRideRequestDto.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle.getId())
                .build();

        assertThrows(UnauthorizedAccessException.class, () -> rideService.assignRideResources(scheduledRide.getId(), request));
    }
}
