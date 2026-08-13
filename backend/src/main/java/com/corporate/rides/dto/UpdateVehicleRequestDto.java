package com.corporate.rides.dto;

import com.corporate.rides.enums.VehicleType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleRequestDto {

    @NotBlank(message = "Registration number is required")
    @Size(min = 2, max = 50, message = "Registration number must be between 2 and 50 characters")
    private String registrationNumber;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    @NotBlank(message = "Vehicle make is required")
    @Size(min = 2, max = 50, message = "Vehicle make must be between 2 and 50 characters")
    private String make;

    @NotBlank(message = "Vehicle model is required")
    @Size(min = 1, max = 50, message = "Vehicle model must be between 1 and 50 characters")
    private String model;

    @Min(value = 1900, message = "Manufacturing year must be valid")
    private Integer manufacturingYear;

    @NotNull(message = "Seating capacity is required")
    @Positive(message = "Seating capacity must be greater than zero")
    private Integer seatingCapacity;

    private LocalDate insuranceExpiryDate;

    private LocalDate permitExpiryDate;
}
