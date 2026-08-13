package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;
import com.corporate.rides.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponseDto>> createVehicle(@Valid @RequestBody CreateVehicleRequestDto request) {
        VehicleResponseDto vehicle = vehicleService.createVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(vehicle, "Vehicle created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleResponseDto>>> searchVehicles(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) VehicleType vehicleType,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) VehicleAvailability availability,
            @RequestParam(required = false) MaintenanceStatus maintenance) {
        List<VehicleResponseDto> vehicles = vehicleService.searchVehicles(search, vehicleType, status, availability, maintenance);
        return ResponseEntity.ok(ApiResponse.success(vehicles, "Vehicles retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> getVehicleById(@PathVariable UUID id) {
        VehicleResponseDto vehicle = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(ApiResponse.success(vehicle, "Vehicle details retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> updateVehicle(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVehicleRequestDto request) {
        VehicleResponseDto vehicle = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(ApiResponse.success(vehicle, "Vehicle details updated successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> updateVehicleStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVehicleStatusRequestDto request) {
        VehicleResponseDto vehicle = vehicleService.updateVehicleStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(vehicle, "Vehicle status updated successfully"));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> updateVehicleAvailability(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVehicleAvailabilityRequestDto request) {
        VehicleResponseDto vehicle = vehicleService.updateVehicleAvailability(id, request);
        return ResponseEntity.ok(ApiResponse.success(vehicle, "Vehicle availability updated successfully"));
    }

    @PatchMapping("/{id}/maintenance")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> updateVehicleMaintenance(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVehicleMaintenanceRequestDto request) {
        VehicleResponseDto vehicle = vehicleService.updateVehicleMaintenance(id, request);
        return ResponseEntity.ok(ApiResponse.success(vehicle, "Vehicle maintenance status updated successfully"));
    }
}
