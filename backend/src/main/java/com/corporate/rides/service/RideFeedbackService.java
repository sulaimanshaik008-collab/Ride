package com.corporate.rides.service;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.FeedbackReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface RideFeedbackService {
    RideFeedbackResponseDto submitRideFeedback(CreateRideFeedbackRequestDto request);
    List<RideFeedbackResponseDto> getMyFeedbackHistory();
    RideFeedbackResponseDto getFeedbackById(UUID id);
    Page<RideFeedbackResponseDto> getOrganizationFeedback(Integer rating, FeedbackReviewStatus reviewStatus, UUID driverId, UUID vehicleId, String search, Pageable pageable);
    FeedbackSummaryDto getFeedbackSummary();
    FeedbackIntelligenceDto getFeedbackIntelligence();
    RideFeedbackResponseDto updateFeedbackReviewStatus(UUID id, UpdateFeedbackReviewStatusRequestDto request);
}
