package com.corporate.rides.controller;

import com.corporate.rides.dto.ApiResponse;
import com.corporate.rides.dto.CreateSavedRiderRequestDto;
import com.corporate.rides.dto.SavedRiderResponseDto;
import com.corporate.rides.service.SavedRiderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/riders")
@RequiredArgsConstructor
public class SavedRiderController {

    private final SavedRiderService savedRiderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedRiderResponseDto>>> getSavedRiders() {
        List<SavedRiderResponseDto> riders = savedRiderService.getSavedRiders();
        return ResponseEntity.ok(ApiResponse.success(riders, "Saved riders retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavedRiderResponseDto>> createSavedRider(
            @Valid @RequestBody CreateSavedRiderRequestDto request) {
        SavedRiderResponseDto rider = savedRiderService.createSavedRider(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rider, "Rider saved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSavedRider(@PathVariable UUID id) {
        savedRiderService.deleteSavedRider(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Saved rider deleted successfully"));
    }
}
