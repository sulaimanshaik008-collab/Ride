package com.corporate.rides.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverVerificationDto {

    @NotNull(message = "Approved status is required")
    private Boolean approved;

    private String rejectionReason;
}
