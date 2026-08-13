package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
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
public class RideSchedulingServiceTest {

    @Autowired
    private RideService rideService;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Organization organization;
    private User manager;
    private User employee;
    private Ride testRide;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Ride Sched Test Org")
                .code("SCHED_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("mgr.sched@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Transport Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("emp.sched@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        testRide = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-SCHED-001")
                .organization(organization)
                .employee(employee)
                .pickupLocation("Home Address")
                .destination("Office Tower B")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(9, 0))
                .status(RideStatus.PENDING_APPROVAL)
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
    void testGetSchedulableRides_Success() {
        List<RideResponseDto> schedulable = rideService.getSchedulableRides();
        assertNotNull(schedulable);
        assertTrue(schedulable.stream().anyMatch(r -> r.getId().equals(testRide.getId())));
    }

    @Test
    void testScheduleRide_Success() {
        ScheduleRideRequestDto request = ScheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(1))
                .scheduledPickupTime(LocalTime.of(9, 30))
                .notes("Scheduled for morning shuttle")
                .build();

        RideResponseDto response = rideService.scheduleRide(testRide.getId(), request);

        assertNotNull(response);
        assertEquals(RideStatus.SCHEDULED, response.getStatus());
        assertEquals(LocalTime.of(9, 30), response.getPickupTime());
    }

    @Test
    void testScheduleRide_AlreadyScheduled_ThrowsException() {
        ScheduleRideRequestDto request = ScheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(1))
                .scheduledPickupTime(LocalTime.of(9, 30))
                .build();

        rideService.scheduleRide(testRide.getId(), request);

        assertThrows(InvalidBookingException.class, () -> rideService.scheduleRide(testRide.getId(), request));
    }

    @Test
    void testRescheduleRide_Success() {
        ScheduleRideRequestDto schedReq = ScheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(1))
                .scheduledPickupTime(LocalTime.of(9, 0))
                .build();
        rideService.scheduleRide(testRide.getId(), schedReq);

        RescheduleRideRequestDto rescheduleReq = RescheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(2))
                .scheduledPickupTime(LocalTime.of(10, 15))
                .rescheduleReason("Shift time change")
                .build();

        RideResponseDto rescheduled = rideService.rescheduleRide(testRide.getId(), rescheduleReq);

        assertEquals(RideStatus.SCHEDULED, rescheduled.getStatus());
        assertEquals(LocalDate.now().plusDays(2), rescheduled.getBookingDate());
        assertEquals(LocalTime.of(10, 15), rescheduled.getPickupTime());
    }

    @Test
    void testScheduleRide_EmployeeDenied() {
        UserPrincipal empPrincipal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(employee.getEmail())
                .fullName(employee.getFullName())
                .role(UserRole.EMPLOYEE)
                .build();

        UserContextHolder.setContext(empPrincipal);

        ScheduleRideRequestDto request = ScheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(1))
                .scheduledPickupTime(LocalTime.of(9, 0))
                .build();

        assertThrows(UnauthorizedAccessException.class, () -> rideService.scheduleRide(testRide.getId(), request));
    }
}
