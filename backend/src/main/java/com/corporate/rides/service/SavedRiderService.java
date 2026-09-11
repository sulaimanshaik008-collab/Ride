package com.corporate.rides.service;

import com.corporate.rides.dto.CreateSavedRiderRequestDto;
import com.corporate.rides.dto.SavedRiderResponseDto;

import java.util.List;
import java.util.UUID;

public interface SavedRiderService {
    List<SavedRiderResponseDto> getSavedRiders();
    SavedRiderResponseDto createSavedRider(CreateSavedRiderRequestDto request);
    void deleteSavedRider(UUID riderId);
}
