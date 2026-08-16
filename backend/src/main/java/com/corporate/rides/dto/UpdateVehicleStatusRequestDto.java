package com.corporate.rides.dto;

import com.corporate.rides.enums.VehicleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleStatusRequestDto {

    @NotNull(message = "Vehicle status is required")
    private VehicleStatus vehicleStatus;
}
