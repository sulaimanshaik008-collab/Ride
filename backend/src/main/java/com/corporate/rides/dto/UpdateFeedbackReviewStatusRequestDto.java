package com.corporate.rides.dto;

import com.corporate.rides.enums.FeedbackReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFeedbackReviewStatusRequestDto {

    @NotNull(message = "Review status is required")
    private FeedbackReviewStatus reviewStatus;
}
