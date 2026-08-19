package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.*;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.repository.VehicleRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DriverOperationsServiceTest {

    @Autowired
    private RideService rideService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RideRepository rideRepository;

    private Organization organization;
    private User employeeUser;
    private User driverUser;
    private Driver driver;
    private Vehicle vehicle;
    private Ride assignedRide;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Driver Ops Test Corp " + UUID.randomUUID())
                .code("DRV_TEST_" + UUID.randomUUID().toString().substring(0, 6))
                .build());

        employeeUser = userRepository.save(User.builder()
                .organization(organization)
                .email("passenger." + UUID.randomUUID() + "@corp.com")
                .fullName("Rahul Passenger")
                .phoneNumber("+1 555 123 4567")
                .role(UserRole.EMPLOYEE)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        driverUser = userRepository.save(User.builder()
                .organization(organization)
                .email("driver." + UUID.randomUUID() + "@corp.com")
                .fullName("John Driver")
                .phoneNumber("+1 555 987 6543")
                .role(UserRole.DRIVER)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        driver = driverRepository.save(Driver.builder()
                .user(driverUser)
                .organization(organization)
                .licenseNumber("DL-DRV-" + UUID.randomUUID().toString().substring(0, 5))
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .organization(organization)
                .registrationNumber("KA-01-DRV-" + UUID.randomUUID().toString().substring(0, 4))
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Innova")
                .manufacturingYear(2024)
                .seatingCapacity(6)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .build());

        assignedRide = rideRepository.save(Ride.builder()
                .organization(organization)
                .employee(employeeUser)
                .driver(driver)
                .vehicle(vehicle)
                .bookingReference("RIDE-" + UUID.randomUUID().toString().substring(0, 8))
                .pickupLocation("ABC Corporate Office")
                .destination("Guindy Office")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.of(8, 30))
                .status(RideStatus.ASSIGNED)
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
    @DisplayName("Driver can accept assigned ride")
    void testAcceptRideAssignment_Success() {
        RideResponseDto accepted = rideService.acceptRideAssignment(assignedRide.getId());
        assertNotNull(accepted);
        assertTrue(accepted.getIsDriverAccepted());
        assertNotNull(accepted.getDriverAcceptedAt());
    }

    @Test
    @DisplayName("Driver can reject assigned ride with reason")
    void testRejectRideAssignment_Success() {
        RejectRideRequestDto rejectReq = RejectRideRequestDto.builder()
                .reason("Vehicle issue")
                .notes("Flat tyre before pickup")
                .build();

        RideResponseDto rejected = rideService.rejectRideAssignment(assignedRide.getId(), rejectReq);
        assertNotNull(rejected);
        assertEquals(RideStatus.SCHEDULED, rejected.getStatus());
        assertNull(rejected.getDriverId());
        assertNull(rejected.getVehicleId());
        assertTrue(rejected.getRejectionReason().contains("Vehicle issue"));
    }

    @Test
    @DisplayName("Driver can verify passenger using corporate email")
    void testVerifyEmployeeForRide_Success() {
        EmployeeVerificationRequestDto verifyReq = EmployeeVerificationRequestDto.builder()
                .employeeIdentifier(employeeUser.getEmail())
                .build();

        RideResponseDto verified = rideService.verifyEmployeeForRide(assignedRide.getId(), verifyReq);
        assertNotNull(verified);
        assertTrue(verified.getIsEmployeeVerified());
        assertNotNull(verified.getEmployeeVerifiedAt());
    }

    @Test
    @DisplayName("Driver starting ride without verification throws exception")
    void testStartRide_WithoutVerification_Fails() {
        assertThrows(InvalidBookingException.class, () -> {
            rideService.startTrip(assignedRide.getId());
        });
    }

    @Test
    @DisplayName("Driver starting ride after verification succeeds")
    void testStartRide_AfterVerification_Success() {
        EmployeeVerificationRequestDto verifyReq = EmployeeVerificationRequestDto.builder()
                .employeeIdentifier(employeeUser.getEmail())
                .build();
        rideService.verifyEmployeeForRide(assignedRide.getId(), verifyReq);

        RideResponseDto started = rideService.startTrip(assignedRide.getId());
        assertNotNull(started);
        assertEquals(RideStatus.IN_PROGRESS, started.getStatus());
    }

    @Test
    @DisplayName("Driver completing active ride updates status to COMPLETED")
    void testCompleteTrip_Success() {
        EmployeeVerificationRequestDto verifyReq = EmployeeVerificationRequestDto.builder()
                .employeeIdentifier(employeeUser.getEmail())
                .build();
        rideService.verifyEmployeeForRide(assignedRide.getId(), verifyReq);
        rideService.startTrip(assignedRide.getId());

        RideResponseDto completed = rideService.completeTrip(assignedRide.getId());
        assertNotNull(completed);
        assertEquals(RideStatus.COMPLETED, completed.getStatus());
    }

    @Test
    @DisplayName("Driver can fetch today's itinerary")
    void testGetDriverTodayRides_Success() {
        List<RideResponseDto> todayRides = rideService.getDriverTodayRides();
        assertNotNull(todayRides);
        assertEquals(1, todayRides.size());
        assertEquals(assignedRide.getBookingReference(), todayRides.get(0).getBookingReference());
    }
}
