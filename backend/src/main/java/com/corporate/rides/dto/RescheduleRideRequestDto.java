package com.corporate.rides.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleRideRequestDto {

    @NotNull(message = "New scheduled date is required")
    @FutureOrPresent(message = "New scheduled date cannot be in the past")
    private LocalDate scheduledDate;

    @NotNull(message = "New scheduled pickup time is required")
    private LocalTime scheduledPickupTime;

    private String rescheduleReason;
}
