package com.corporate.rides.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteRideRequestDto {

    @Size(max = 500, message = "Driver notes must not exceed 500 characters")
    private String driverNotes;

    @Size(max = 500, message = "Completion remarks must not exceed 500 characters")
    private String completionRemarks;

    private OffsetDateTime completionTime;
}
