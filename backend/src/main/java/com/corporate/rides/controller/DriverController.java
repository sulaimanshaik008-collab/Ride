package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @PostMapping
    public ResponseEntity<ApiResponse<DriverResponseDto>> createDriver(@Valid @RequestBody CreateDriverRequestDto request) {
        DriverResponseDto driver = driverService.createDriver(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(driver, "Driver created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DriverResponseDto>>> searchDrivers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) DriverStatus status,
            @RequestParam(required = false) DriverAvailability availability) {
        List<DriverResponseDto> drivers = driverService.searchDrivers(search, status, availability);
        return ResponseEntity.ok(ApiResponse.success(drivers, "Drivers retrieved successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<DriverResponseDto>> getSelfDriverProfile() {
        DriverResponseDto driver = driverService.getSelfDriverProfile();
        return ResponseEntity.ok(ApiResponse.success(driver, "Driver profile retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DriverResponseDto>> getDriverById(@PathVariable UUID id) {
        DriverResponseDto driver = driverService.getDriverById(id);
        return ResponseEntity.ok(ApiResponse.success(driver, "Driver details retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DriverResponseDto>> updateDriver(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDriverRequestDto request) {
        DriverResponseDto driver = driverService.updateDriver(id, request);
        return ResponseEntity.ok(ApiResponse.success(driver, "Driver details updated successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DriverResponseDto>> updateDriverStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDriverStatusRequestDto request) {
        DriverResponseDto driver = driverService.updateDriverStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(driver, "Driver status updated successfully"));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<DriverResponseDto>> updateDriverAvailability(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDriverAvailabilityRequestDto request) {
        DriverResponseDto driver = driverService.updateDriverAvailability(id, request);
        return ResponseEntity.ok(ApiResponse.success(driver, "Driver availability updated successfully"));
    }
}
