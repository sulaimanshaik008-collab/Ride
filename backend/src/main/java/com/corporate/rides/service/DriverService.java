package com.corporate.rides.service;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;

import java.util.List;
import java.util.UUID;

public interface DriverService {
    DriverResponseDto createDriver(CreateDriverRequestDto request);
    List<DriverResponseDto> searchDrivers(String search, DriverStatus status, DriverAvailability availability);
    DriverResponseDto getDriverById(UUID driverId);
    DriverResponseDto getSelfDriverProfile();
    DriverResponseDto updateDriver(UUID driverId, UpdateDriverRequestDto request);
    DriverResponseDto updateDriverStatus(UUID driverId, UpdateDriverStatusRequestDto request);
    DriverResponseDto updateDriverAvailability(UUID driverId, UpdateDriverAvailabilityRequestDto request);

    // Document Verification & Onboarding
    DriverResponseDto updateSelfDriverDocuments(DriverDocumentUpdateDto request);
    DriverResponseDto verifyDriverDocuments(UUID driverId, DriverVerificationDto request);

    // Monthly Earnings & Payouts
    DriverMonthlyPayoutDto getSelfDriverMonthlyPayout(String month);
    List<DriverMonthlyPayoutDto> getAllDriversMonthlyPayouts(String month);
    DriverMonthlyPayoutDto processDriverMonthlyPayout(UUID driverId, ProcessPayoutRequestDto request);
}
