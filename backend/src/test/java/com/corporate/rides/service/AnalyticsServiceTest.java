package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.AnalyticsOverviewDto;
import com.corporate.rides.dto.DriverAnalyticsDto;
import com.corporate.rides.dto.PeakHourAnalyticsDto;
import com.corporate.rides.dto.RideTrendDto;
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
public class AnalyticsServiceTest {

    @Autowired
    private AnalyticsService analyticsService;

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
    private User manager;
    private User driverUser;
    private User employee;
    private Driver driver;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Analytics Test Org")
                .code("ANALYTICS_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("mgr.analytics@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Analytics Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        driverUser = userRepository.save(User.builder()
                .organization(organization)
                .email("drv.analytics@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Analytics Driver")
                .role(UserRole.DRIVER)
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("emp.analytics@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Analytics Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        driver = driverRepository.save(Driver.builder()
                .user(driverUser)
                .organization(organization)
                .licenseNumber("LIC-" + UUID.randomUUID().toString().substring(0, 6))
                .licenseExpiryDate(LocalDate.now().plusYears(1))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .organization(organization)
                .registrationNumber("REG-" + UUID.randomUUID().toString().substring(0, 6))
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Camry")
                .seatingCapacity(4)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .build());

        // Create mock rides
        rideRepository.save(Ride.builder()
                .bookingReference("RIDE-ANALYTICS-001")
                .organization(organization)
                .employee(employee)
                .driver(driver)
                .vehicle(vehicle)
                .pickupLocation("Campus A")
                .destination("Campus B")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.of(8, 30))
                .status(RideStatus.COMPLETED)
                .build());

        rideRepository.save(Ride.builder()
                .bookingReference("RIDE-ANALYTICS-002")
                .organization(organization)
                .employee(employee)
                .pickupLocation("Campus A")
                .destination("Campus B")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.of(8, 45))
                .status(RideStatus.CANCELLED)
                .build());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(manager.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(manager.getEmail())
                .fullName(manager.getFullName())
                .role(UserRole.TRANSPORT_MANAGER)
                .build();

        UserContextHolder.setContext(principal);
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    void testGetOverviewAnalytics_Success() {
        AnalyticsOverviewDto overview = analyticsService.getOverviewAnalytics(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));

        assertNotNull(overview);
        assertEquals(2, overview.getTotalRides());
        assertEquals(1, overview.getCompletedRides());
        assertEquals(1, overview.getCancelledRides());
        assertEquals(50.0, overview.getCompletionRate());
        assertEquals(50.0, overview.getCancellationRate());
    }

    @Test
    void testGetRideTrends_Success() {
        List<RideTrendDto> trends = analyticsService.getRideTrends(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));

        assertNotNull(trends);
        assertFalse(trends.isEmpty());
    }

    @Test
    void testGetDriverAnalytics_Success() {
        List<DriverAnalyticsDto> driverStats = analyticsService.getDriverAnalytics(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));

        assertNotNull(driverStats);
        assertEquals(1, driverStats.size());
        assertEquals("Analytics Driver", driverStats.get(0).getDriverName());
        assertEquals(1, driverStats.get(0).getCompletedTrips());
    }

    @Test
    void testGetPeakHourAnalytics_Success() {
        List<PeakHourAnalyticsDto> peakHours = analyticsService.getPeakHourAnalytics(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));

        assertNotNull(peakHours);
        assertEquals(24, peakHours.size());
        PeakHourAnalyticsDto hour8 = peakHours.stream().filter(p -> p.getHour() == 8).findFirst().orElse(null);
        assertNotNull(hour8);
        assertEquals(2, hour8.getRideCount());
    }

    @Test
    void testInvalidDateRange_ThrowsException() {
        assertThrows(InvalidBookingException.class, () -> {
            analyticsService.getOverviewAnalytics(LocalDate.now().plusDays(5), LocalDate.now());
        });
    }

    @Test
    void testEmployeeAccess_Forbidden() {
        UserPrincipal empPrincipal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .email(employee.getEmail())
                .role(UserRole.EMPLOYEE)
                .build();
        UserContextHolder.setContext(empPrincipal);

        assertThrows(UnauthorizedAccessException.class, () -> {
            analyticsService.getOverviewAnalytics(null, null);
        });
    }
}
