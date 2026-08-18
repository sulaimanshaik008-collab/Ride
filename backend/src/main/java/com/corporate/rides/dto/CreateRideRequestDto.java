package com.corporate.rides.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateRideRequestDto {

    @NotBlank(message = "Pickup location is required")
    @Size(min = 3, max = 255, message = "Pickup location must be between 3 and 255 characters")
    private String pickupLocation;

    private Double pickupLatitude;
    private Double pickupLongitude;

    @NotBlank(message = "Destination is required")
    @Size(min = 3, max = 255, message = "Destination must be between 3 and 255 characters")
    private String destination;

    private Double destinationLatitude;
    private Double destinationLongitude;

    @NotNull(message = "Booking date is required")
    @FutureOrPresent(message = "Booking date cannot be in the past")
    private LocalDate bookingDate;

    @NotNull(message = "Pickup time is required")
    private LocalTime pickupTime;

    @Size(max = 500, message = "Booking notes cannot exceed 500 characters")
    private String bookingNotes;
}
