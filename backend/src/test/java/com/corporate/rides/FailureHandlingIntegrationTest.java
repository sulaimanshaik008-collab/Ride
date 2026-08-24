package com.corporate.rides;

import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.*;
import com.corporate.rides.repository.*;
import com.corporate.rides.service.RateLimiterService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FailureHandlingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RateLimiterService rateLimiterService;

    private Organization org;
    private User employee;

    @BeforeEach
    void setUp() {
        rateLimiterService.reset();

        org = organizationRepository.findByCode("FAIL_CORP").orElseGet(() ->
                organizationRepository.save(Organization.builder()
                        .name("Fail Test Corp")
                        .code("FAIL_CORP")
                        .status(OrganizationStatus.ACTIVE)
                        .build()));

        employee = userRepository.findByEmail("emp.fail@corporate.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(org)
                        .email("emp.fail@corporate.com")
                        .fullName("Fail Employee")
                        .role(UserRole.EMPLOYEE)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));
    }

    @Test
    @DisplayName("Failure: Invalid booking with missing pickup location should return HTTP 400")
    void testInvalidBookingMissingPickup() throws Exception {
        CreateRideRequestDto invalidReq = CreateRideRequestDto.builder()
                .pickupLocation("") // Invalid: blank
                .destination("Destination")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(10, 0))
                .build();

        mockMvc.perform(post("/api/v1/rides")
                        .header("X-User-Email", employee.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Failure: Accessing invalid / non-existent ride ID should return HTTP 404")
    void testNonExistentRide() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(get("/api/v1/rides/" + randomId)
                        .header("X-User-Email", employee.getEmail()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Failure: Invalid feedback rating (< 1 or > 5) should return HTTP 400")
    void testInvalidFeedbackRating() throws Exception {
        CreateRideFeedbackRequestDto badRating = CreateRideFeedbackRequestDto.builder()
                .rideId(UUID.randomUUID())
                .rating(6) // Invalid rating
                .comments("Out of range")
                .build();

        mockMvc.perform(post("/api/v1/feedback")
                        .header("X-User-Email", employee.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRating)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Failure: Malformed request JSON should return HTTP 400 with user-friendly error")
    void testMalformedJsonPayload() throws Exception {
        mockMvc.perform(post("/api/v1/rides")
                        .header("X-User-Email", employee.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid json body"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Malformed request payload or invalid parameters"));
    }
}
