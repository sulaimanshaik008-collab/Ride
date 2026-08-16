package com.corporate.rides.service;

import com.corporate.rides.dto.*;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OrganizationService {
    OrganizationResponseDto getCurrentOrganization();
    OrganizationResponseDto updateCurrentOrganization(UpdateOrganizationRequestDto request);
    Page<UserResponseDto> getOrganizationUsers(UserRole role, UserStatus status, String search, Pageable pageable);
    UserResponseDto getOrganizationUserById(UUID userId);
    UserResponseDto createOrganizationUser(CreateUserRequestDto request);
    UserResponseDto updateUserRole(UUID userId, UpdateUserRoleRequestDto request);
    UserResponseDto updateUserStatus(UUID userId, UpdateUserStatusRequestDto request);
    OrganizationSummaryDto getOrganizationSummary();
}
