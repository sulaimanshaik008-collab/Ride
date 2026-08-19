package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RideSchedulingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideRepository rideRepository;

    private Organization acmeOrg;
    private User managerUser;
    private User employeeUser;
    private Ride testRide;

    @BeforeEach
    void setUp() {
        acmeOrg = organizationRepository.save(Organization.builder()
                .name("Acme Scheduling Controller Corp")
                .code("SCHED_CTRL_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        managerUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("sched.mgr@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Acme Fleet Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employeeUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("sched.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Acme Regular Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        testRide = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-CTRL-888")
                .organization(acmeOrg)
                .employee(employeeUser)
                .pickupLocation("North Residence Park")
                .destination("HQ Tower 1")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(8, 30))
                .status(RideStatus.PENDING_APPROVAL)
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/rides/schedulable - Success by Transport Manager")
    void getSchedulableRides_Success() throws Exception {
        mockMvc.perform(get("/api/v1/rides/schedulable")
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].bookingReference", is("RIDE-CTRL-888")));
    }

    @Test
    @DisplayName("GET /api/v1/rides/schedulable - 403 Forbidden for Employee")
    void getSchedulableRides_ForbiddenForEmployee() throws Exception {
        mockMvc.perform(get("/api/v1/rides/schedulable")
                        .header("X-User-Email", employeeUser.getEmail()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/rides/{id}/schedule - Schedule Approved/Pending Ride")
    void scheduleRide_Success() throws Exception {
        ScheduleRideRequestDto request = ScheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(1))
                .scheduledPickupTime(LocalTime.of(8, 45))
                .notes("Assigned to morning van route")
                .build();

        mockMvc.perform(post("/api/v1/rides/{id}/schedule", testRide.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SCHEDULED")))
                .andExpect(jsonPath("$.data.pickupTime", is("08:45:00")));
    }

    @Test
    @DisplayName("PATCH /api/v1/rides/{id}/reschedule - Reschedule Scheduled Ride")
    void rescheduleRide_Success() throws Exception {
        // First schedule
        testRide.setStatus(RideStatus.SCHEDULED);
        rideRepository.save(testRide);

        RescheduleRideRequestDto request = RescheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(2))
                .scheduledPickupTime(LocalTime.of(9, 15))
                .rescheduleReason("Delayed flight arrival")
                .build();

        mockMvc.perform(patch("/api/v1/rides/{id}/reschedule", testRide.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SCHEDULED")))
                .andExpect(jsonPath("$.data.pickupTime", is("09:15:00")));
    }

    @Test
    @DisplayName("GET /api/v1/rides/scheduled - List and Search Scheduled Rides")
    void getScheduledRides_Success() throws Exception {
        testRide.setStatus(RideStatus.SCHEDULED);
        rideRepository.save(testRide);

        mockMvc.perform(get("/api/v1/rides/scheduled")
                        .header("X-User-Email", managerUser.getEmail())
                        .param("status", "SCHEDULED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].status", is("SCHEDULED")));
    }

    @Test
    @DisplayName("POST /api/v1/rides/{id}/approve - Approve Ride Request by Transport Manager")
    void approveRide_Success() throws Exception {
        mockMvc.perform(post("/api/v1/rides/{id}/approve", testRide.getId())
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SCHEDULED")));
    }
}
