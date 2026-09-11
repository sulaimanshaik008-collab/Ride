package com.corporate.rides.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPayoutRequestDto {

    @NotBlank(message = "Month is required (e.g. 2026-09)")
    private String month;

    private String paymentReference;

    private String remarks;
}
