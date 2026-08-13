package com.corporate.rides.service;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;

import java.util.List;
import java.util.UUID;

public interface VehicleService {

    VehicleResponseDto createVehicle(CreateVehicleRequestDto request);

    List<VehicleResponseDto> searchVehicles(
            String search,
            VehicleType vehicleType,
            VehicleStatus vehicleStatus,
            VehicleAvailability availabilityStatus,
            MaintenanceStatus maintenanceStatus
    );

    VehicleResponseDto getVehicleById(UUID vehicleId);

    VehicleResponseDto updateVehicle(UUID vehicleId, UpdateVehicleRequestDto request);

    VehicleResponseDto updateVehicleStatus(UUID vehicleId, UpdateVehicleStatusRequestDto request);

    VehicleResponseDto updateVehicleAvailability(UUID vehicleId, UpdateVehicleAvailabilityRequestDto request);

    VehicleResponseDto updateVehicleMaintenance(UUID vehicleId, UpdateVehicleMaintenanceRequestDto request);
}
