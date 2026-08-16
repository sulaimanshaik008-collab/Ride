package com.corporate.rides.dto;

import com.corporate.rides.enums.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleMaintenanceRequestDto {

    @NotNull(message = "Maintenance status is required")
    private MaintenanceStatus maintenanceStatus;
}
