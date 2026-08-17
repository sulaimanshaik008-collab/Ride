package com.corporate.rides.controller;

import com.corporate.rides.dto.ApiResponse;
import com.corporate.rides.dto.LoginRequestDto;
import com.corporate.rides.dto.UserProfileDto;
import com.corporate.rides.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser() {
        UserProfileDto profile = authService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success(profile, "User profile retrieved successfully"));
    }

    @GetMapping("/demo-users")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getDemoUsers() {
        List<UserProfileDto> users = authService.getAvailableDemoUsers();
        return ResponseEntity.ok(ApiResponse.success(users, "Demo users retrieved successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserProfileDto>> login(@Valid @RequestBody LoginRequestDto request) {
        UserProfileDto profile = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Logged in successfully"));
    }
}
