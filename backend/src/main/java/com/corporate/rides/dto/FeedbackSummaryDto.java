package com.corporate.rides.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackSummaryDto {
    private long totalFeedback;
    private double averageRating;
    private long fiveStarCount;
    private long fourStarCount;
    private long threeStarCount;
    private long twoStarCount;
    private long oneStarCount;
    private long needsReviewCount;
    private long escalatedCount;
    private long reviewedCount;
    private Map<Integer, Long> ratingDistribution;
}
