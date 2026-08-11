package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.CancelRideRequestDto;
import com.corporate.rides.dto.CreateRideRequestDto;
import com.corporate.rides.dto.RideResponseDto;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
@Transactional
public class RideServiceTest {

    @Autowired
    private RideService rideService;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private User employee;
    private Organization organization;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Test Org")
                .code("TEST_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("test.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(employee.getEmail())
                .fullName(employee.getFullName())
                .role(employee.getRole())
                .build();

        UserContextHolder.setContext(principal);
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    void testCreateRide_Success() {
        CreateRideRequestDto request = CreateRideRequestDto.builder()
                .pickupLocation("123 Main St")
                .destination("Corporate HQ Gate 1")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(9, 0))
                .bookingNotes("Test booking note")
                .build();

        RideResponseDto response = rideService.createRide(request);

        assertNotNull(response.getId());
        assertNotNull(response.getBookingReference());
        assertTrue(response.getBookingReference().startsWith("RIDE-"));
        assertEquals("123 Main St", response.getPickupLocation());
        assertEquals("Corporate HQ Gate 1", response.getDestination());
        assertEquals(RideStatus.PENDING_APPROVAL, response.getStatus());
    }

    @Test
    void testCreateRide_SamePickupAndDestination_ThrowsException() {
        CreateRideRequestDto request = CreateRideRequestDto.builder()
                .pickupLocation("Corporate HQ Gate 1")
                .destination("Corporate HQ Gate 1")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(9, 0))
                .build();

        assertThrows(InvalidBookingException.class, () -> rideService.createRide(request));
    }

    @Test
    void testCancelRide_EligibleStatus_Success() {
        CreateRideRequestDto createRequest = CreateRideRequestDto.builder()
                .pickupLocation("Home Residence")
                .destination("Office HQ")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(8, 0))
                .build();

        RideResponseDto createdRide = rideService.createRide(createRequest);

        CancelRideRequestDto cancelRequest = CancelRideRequestDto.builder()
                .cancellationReason("Schedule conflict")
                .build();

        RideResponseDto cancelledRide = rideService.cancelRide(createdRide.getId(), cancelRequest);

        assertEquals(RideStatus.CANCELLED, cancelledRide.getStatus());
        assertEquals("Schedule conflict", cancelledRide.getCancellationReason());
        assertNotNull(cancelledRide.getCancelledAt());
    }
}
