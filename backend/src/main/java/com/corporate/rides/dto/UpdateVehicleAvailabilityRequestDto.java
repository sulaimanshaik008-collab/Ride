package com.corporate.rides.dto;

import com.corporate.rides.enums.VehicleAvailability;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleAvailabilityRequestDto {

    @NotNull(message = "Availability status is required")
    private VehicleAvailability availabilityStatus;
}
