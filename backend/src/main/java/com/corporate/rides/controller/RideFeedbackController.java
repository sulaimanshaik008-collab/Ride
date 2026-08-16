package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.FeedbackReviewStatus;
import com.corporate.rides.service.RideFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
public class RideFeedbackController {

    private final RideFeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<ApiResponse<RideFeedbackResponseDto>> submitRideFeedback(
            @Valid @RequestBody CreateRideFeedbackRequestDto request) {
        RideFeedbackResponseDto feedback = feedbackService.submitRideFeedback(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(feedback, "Feedback submitted successfully"));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<RideFeedbackResponseDto>>> getMyFeedbackHistory() {
        List<RideFeedbackResponseDto> list = feedbackService.getMyFeedbackHistory();
        return ResponseEntity.ok(ApiResponse.success(list, "My feedback history retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RideFeedbackResponseDto>> getFeedbackById(@PathVariable UUID id) {
        RideFeedbackResponseDto feedback = feedbackService.getFeedbackById(id);
        return ResponseEntity.ok(ApiResponse.success(feedback, "Feedback retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RideFeedbackResponseDto>>> getOrganizationFeedback(
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) FeedbackReviewStatus reviewStatus,
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection.toUpperCase()), sortBy);
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), sort);

        Page<RideFeedbackResponseDto> feedbackPage = feedbackService.getOrganizationFeedback(
                rating, reviewStatus, driverId, vehicleId, search, pageRequest
        );
        return ResponseEntity.ok(ApiResponse.success(feedbackPage, "Organization feedback retrieved successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<FeedbackSummaryDto>> getFeedbackSummary() {
        FeedbackSummaryDto summary = feedbackService.getFeedbackSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Feedback summary retrieved successfully"));
    }

    @GetMapping("/intelligence")
    public ResponseEntity<ApiResponse<FeedbackIntelligenceDto>> getFeedbackIntelligence() {
        FeedbackIntelligenceDto intelligence = feedbackService.getFeedbackIntelligence();
        return ResponseEntity.ok(ApiResponse.success(intelligence, "Feedback intelligence patterns retrieved successfully"));
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<ApiResponse<RideFeedbackResponseDto>> updateFeedbackReviewStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFeedbackReviewStatusRequestDto request) {
        RideFeedbackResponseDto updated = feedbackService.updateFeedbackReviewStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Feedback review status updated successfully"));
    }
}
