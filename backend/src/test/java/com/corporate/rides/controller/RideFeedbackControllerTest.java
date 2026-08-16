package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.FeedbackReviewStatus;
import com.corporate.rides.service.RideFeedbackService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RideFeedbackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RideFeedbackService feedbackService;

    private UUID feedbackId;
    private UUID rideId;
    private RideFeedbackResponseDto responseDto;

    @BeforeEach
    void setUp() {
        feedbackId = UUID.randomUUID();
        rideId = UUID.randomUUID();

        responseDto = RideFeedbackResponseDto.builder()
                .id(feedbackId)
                .rideId(rideId)
                .bookingReference("RIDE-1001")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.of(9, 0))
                .pickupLocation("Office A")
                .destination("HQ B")
                .employeeId(UUID.randomUUID())
                .employeeName("John Employee")
                .employeeEmail("employee.acme@corporate.com")
                .driverName("John Driver")
                .vehicleRegistrationNumber("REG-ACME-101")
                .rating(5)
                .comments("Great ride!")
                .reviewStatus(FeedbackReviewStatus.NORMAL)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/feedback submits feedback")
    void testSubmitRideFeedback() throws Exception {
        CreateRideFeedbackRequestDto request = CreateRideFeedbackRequestDto.builder()
                .rideId(rideId)
                .rating(5)
                .comments("Great ride!")
                .build();

        when(feedbackService.submitRideFeedback(any())).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/feedback")
                .header("X-User-Email", "employee.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rating").value(5));
    }

    @Test
    @DisplayName("GET /api/v1/feedback/my returns employee feedback history")
    void testGetMyFeedbackHistory() throws Exception {
        when(feedbackService.getMyFeedbackHistory()).thenReturn(List.of(responseDto));

        mockMvc.perform(get("/api/v1/feedback/my")
                .header("X-User-Email", "employee.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].bookingReference").value("RIDE-1001"));
    }

    @Test
    @DisplayName("GET /api/v1/feedback returns manager feedback page")
    void testGetOrganizationFeedback() throws Exception {
        when(feedbackService.getOrganizationFeedback(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(responseDto)));

        mockMvc.perform(get("/api/v1/feedback")
                .header("X-User-Email", "manager.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].rating").value(5));
    }

    @Test
    @DisplayName("GET /api/v1/feedback/summary returns summary stats")
    void testGetFeedbackSummary() throws Exception {
        FeedbackSummaryDto summary = FeedbackSummaryDto.builder()
                .totalFeedback(10)
                .averageRating(4.5)
                .fiveStarCount(6)
                .needsReviewCount(1)
                .build();

        when(feedbackService.getFeedbackSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/v1/feedback/summary")
                .header("X-User-Email", "manager.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.averageRating").value(4.5));
    }

    @Test
    @DisplayName("PATCH /api/v1/feedback/{id}/review updates review status")
    void testUpdateFeedbackReviewStatus() throws Exception {
        UpdateFeedbackReviewStatusRequestDto request = UpdateFeedbackReviewStatusRequestDto.builder()
                .reviewStatus(FeedbackReviewStatus.REVIEWED)
                .build();

        responseDto.setReviewStatus(FeedbackReviewStatus.REVIEWED);
        when(feedbackService.updateFeedbackReviewStatus(eq(feedbackId), any())).thenReturn(responseDto);

        mockMvc.perform(patch("/api/v1/feedback/" + feedbackId + "/review")
                .header("X-User-Email", "manager.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reviewStatus").value("REVIEWED"));
    }
}
