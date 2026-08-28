package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.CompleteRideRequestDto;
import com.corporate.rides.dto.RideResponseDto;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;
import com.corporate.rides.enums.VerificationStatus;
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
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class RideCompletionAndContactSharingTest {

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

    private Organization org1;
    private Organization org2;
    private User employee1;
    private User employee2;
    private User driverUser1;
    private User driverUser2;
    private User managerUser;
    private Driver driver1;
    private Driver driver2;
    private Vehicle vehicle1;
    private Ride assignedRide;

    @BeforeEach
    void setUp() {
        org1 = organizationRepository.save(Organization.builder()
                .name("Acme Corp A")
                .code("ACME_A_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        org2 = organizationRepository.save(Organization.builder()
                .name("Beta Corp B")
                .code("BETA_B_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        employee1 = userRepository.save(User.builder()
                .organization(org1)
                .email("emp1." + UUID.randomUUID().toString().substring(0, 5) + "@acme.com")
                .fullName("Alice Employee")
                .phoneNumber("+91 98765 11111")
                .role(UserRole.EMPLOYEE)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        employee2 = userRepository.save(User.builder()
                .organization(org1)
                .email("emp2." + UUID.randomUUID().toString().substring(0, 5) + "@acme.com")
                .fullName("Bob Colleague")
                .phoneNumber("+91 98765 22222")
                .role(UserRole.EMPLOYEE)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        driverUser1 = userRepository.save(User.builder()
                .organization(org1)
                .email("drv1." + UUID.randomUUID().toString().substring(0, 5) + "@acme.com")
                .fullName("Dave Driver")
                .phoneNumber("+91 98765 33333")
                .role(UserRole.DRIVER)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        driverUser2 = userRepository.save(User.builder()
                .organization(org1)
                .email("drv2." + UUID.randomUUID().toString().substring(0, 5) + "@acme.com")
                .fullName("Dan OtherDriver")
                .phoneNumber("+91 98765 44444")
                .role(UserRole.DRIVER)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        managerUser = userRepository.save(User.builder()
                .organization(org1)
                .email("mgr." + UUID.randomUUID().toString().substring(0, 5) + "@acme.com")
                .fullName("Mary Manager")
                .phoneNumber("+91 98765 55555")
                .role(UserRole.TRANSPORT_MANAGER)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        driver1 = driverRepository.save(Driver.builder()
                .user(driverUser1)
                .organization(org1)
                .licenseNumber("LIC-" + UUID.randomUUID().toString().substring(0, 8))
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.ON_TRIP)
                .build());

        driver2 = driverRepository.save(Driver.builder()
                .user(driverUser2)
                .organization(org1)
                .licenseNumber("LIC-" + UUID.randomUUID().toString().substring(0, 8))
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());

        vehicle1 = vehicleRepository.save(Vehicle.builder()
                .organization(org1)
                .registrationNumber("REG-" + UUID.randomUUID().toString().substring(0, 6))
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Camry")
                .seatingCapacity(4)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.ON_TRIP)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .build());

        assignedRide = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-COMP-" + UUID.randomUUID().toString().substring(0, 6))
                .organization(org1)
                .employee(employee1)
                .driver(driver1)
                .vehicle(vehicle1)
                .pickupLocation("Tech Park Building A")
                .destination("Downtown HQ")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.of(14, 30))
                .status(RideStatus.IN_PROGRESS)
                .build());
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    private void setAuthContext(User user) {
        UserPrincipal principal = UserPrincipal.builder()
                .userId(user.getId())
                .organizationId(user.getOrganization().getId())
                .organizationName(user.getOrganization().getName())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
        UserContextHolder.setContext(principal);
    }

    @Test
    @DisplayName("Part L 1: Employee sees assigned driver's phone number")
    void testEmployee_SeesAssignedDriverPhone() {
        setAuthContext(employee1);

        RideResponseDto dto = rideService.getRideById(assignedRide.getId());

        assertNotNull(dto);
        assertEquals(driverUser1.getFullName(), dto.getDriverName());
        assertEquals(driverUser1.getPhoneNumber(), dto.getDriverPhone());
        assertEquals("Toyota Camry", dto.getVehicleMakeModel());
    }

    @Test
    @DisplayName("Part L 2: Employee cannot see unrelated ride's driver phone")
    void testEmployee_CannotSeeUnrelatedRideDriverPhone() {
        setAuthContext(employee2);

        // Employee 2 is trying to view Employee 1's ride
        assertThrows(UnauthorizedAccessException.class, () -> rideService.getRideById(assignedRide.getId()));
    }

    @Test
    @DisplayName("Part L 3: Driver sees assigned employee's phone number")
    void testDriver_SeesAssignedEmployeePhone() {
        setAuthContext(driverUser1);

        RideResponseDto dto = rideService.getRideById(assignedRide.getId());

        assertNotNull(dto);
        assertEquals(employee1.getFullName(), dto.getEmployeeName());
        assertEquals(employee1.getPhoneNumber(), dto.getEmployeePhone());
    }

    @Test
    @DisplayName("Part L 4: Driver cannot see unrelated employee's phone or complete another's ride")
    void testDriver_CannotCompleteAnotherDriverRide() {
        setAuthContext(driverUser2);

        assertThrows(UnauthorizedAccessException.class, () -> rideService.completeTrip(assignedRide.getId()));
    }

    @Test
    @DisplayName("Part L 6, 9, 10: Driver can complete assigned ride, setting status to COMPLETED and releasing driver and vehicle")
    void testDriver_CompleteRide_ReleasesDriverAndVehicle() {
        setAuthContext(driverUser1);

        CompleteRideRequestDto request = CompleteRideRequestDto.builder()
                .driverNotes("Smooth ride, reached on time")
                .completionRemarks("Trip ended at main gate")
                .completionTime(OffsetDateTime.now())
                .build();

        RideResponseDto completed = rideService.completeTrip(assignedRide.getId(), request);

        assertNotNull(completed);
        assertEquals(RideStatus.COMPLETED, completed.getStatus());
        assertNotNull(completed.getCompletedAt());
        assertEquals("Smooth ride, reached on time", completed.getDriverNotes());
        assertEquals("Trip ended at main gate", completed.getCompletionRemarks());

        // Verify driver availability released to AVAILABLE
        Driver updatedDriver = driverRepository.findById(driver1.getId()).orElseThrow();
        assertEquals(DriverAvailability.AVAILABLE, updatedDriver.getAvailabilityStatus());

        // Verify vehicle availability released to AVAILABLE
        Vehicle updatedVehicle = vehicleRepository.findById(vehicle1.getId()).orElseThrow();
        assertEquals(VehicleAvailability.AVAILABLE, updatedVehicle.getAvailabilityStatus());
    }

    @Test
    @DisplayName("Part L 8: Completed ride cannot be completed twice")
    void testCompleteRide_DuplicateCompletion_Rejected() {
        setAuthContext(driverUser1);

        rideService.completeTrip(assignedRide.getId());

        assertThrows(InvalidBookingException.class, () -> rideService.completeTrip(assignedRide.getId()));
    }

    @Test
    @DisplayName("Part L 5 & Part C: Manager can view completed trips report")
    void testManager_GetCompletedTripsReport() {
        // Complete the ride first
        setAuthContext(driverUser1);
        rideService.completeTrip(assignedRide.getId(), CompleteRideRequestDto.builder().driverNotes("Done").build());

        // Now manager views report
        setAuthContext(managerUser);
        List<RideResponseDto> completedTrips = rideService.getCompletedTrips(null, null, null, null);

        assertNotNull(completedTrips);
        assertFalse(completedTrips.isEmpty());
        assertTrue(completedTrips.stream().anyMatch(r -> r.getId().equals(assignedRide.getId())));

        RideResponseDto reportItem = completedTrips.stream().filter(r -> r.getId().equals(assignedRide.getId())).findFirst().orElseThrow();
        assertEquals(RideStatus.COMPLETED, reportItem.getStatus());
        assertEquals(driverUser1.getFullName(), reportItem.getDriverName());
        assertEquals(employee1.getFullName(), reportItem.getEmployeeName());
        assertEquals("Done", reportItem.getDriverNotes());
    }

    @Test
    @DisplayName("Part L 18: Cross-tenant ride access is rejected")
    void testCrossTenant_AccessRejected() {
        User crossTenantManager = userRepository.save(User.builder()
                .organization(org2)
                .email("cross.mgr." + UUID.randomUUID().toString().substring(0, 5) + "@beta.com")
                .fullName("Cross Tenant Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        setAuthContext(crossTenantManager);

        assertThrows(Exception.class, () -> rideService.getRideById(assignedRide.getId()));
        assertThrows(Exception.class, () -> rideService.completeTrip(assignedRide.getId()));
    }
}
