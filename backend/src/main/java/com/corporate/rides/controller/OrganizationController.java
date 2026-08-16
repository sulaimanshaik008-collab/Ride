package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<OrganizationResponseDto>> getCurrentOrganization() {
        OrganizationResponseDto org = organizationService.getCurrentOrganization();
        return ResponseEntity.ok(ApiResponse.success(org, "Organization details retrieved successfully"));
    }

    @PutMapping("/current")
    public ResponseEntity<ApiResponse<OrganizationResponseDto>> updateCurrentOrganization(
            @Valid @RequestBody UpdateOrganizationRequestDto request) {
        OrganizationResponseDto updated = organizationService.updateCurrentOrganization(request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Organization updated successfully"));
    }

    @GetMapping("/current/users")
    public ResponseEntity<ApiResponse<Page<UserResponseDto>>> getOrganizationUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection.toUpperCase()), sortBy);
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), sort);

        Page<UserResponseDto> users = organizationService.getOrganizationUsers(role, status, search, pageRequest);
        return ResponseEntity.ok(ApiResponse.success(users, "Organization users retrieved successfully"));
    }

    @GetMapping("/current/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponseDto>> getOrganizationUserById(@PathVariable UUID userId) {
        UserResponseDto user = organizationService.getOrganizationUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user, "User details retrieved successfully"));
    }

    @PostMapping("/current/users")
    public ResponseEntity<ApiResponse<UserResponseDto>> createOrganizationUser(
            @Valid @RequestBody CreateUserRequestDto request) {
        UserResponseDto created = organizationService.createOrganizationUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "User created successfully in organization"));
    }

    @PatchMapping("/current/users/{userId}/role")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequestDto request) {
        UserResponseDto updated = organizationService.updateUserRole(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User role updated successfully"));
    }

    @PatchMapping("/current/users/{userId}/status")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequestDto request) {
        UserResponseDto updated = organizationService.updateUserStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated successfully"));
    }

    @GetMapping("/current/summary")
    public ResponseEntity<ApiResponse<OrganizationSummaryDto>> getOrganizationSummary() {
        OrganizationSummaryDto summary = organizationService.getOrganizationSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Organization summary retrieved successfully"));
    }
}
