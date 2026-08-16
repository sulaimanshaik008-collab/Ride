package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final EmployeeVerificationService employeeVerificationService;

    private UserPrincipal getAuthenticatedUser() {
        UserPrincipal principal = UserContextHolder.getContext();
        if (principal == null || principal.getUserId() == null || principal.getOrganizationId() == null) {
            throw new UnauthorizedAccessException("Authentication required to access organization management");
        }
        return principal;
    }

    private void verifyAdminRole(UserPrincipal principal) {
        if (principal.getRole() != UserRole.CORPORATE_ADMIN && principal.getRole() != UserRole.SYSTEM_ADMIN) {
            throw new UnauthorizedAccessException("Access denied. Corporate administrator or system administrator role required.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationResponseDto getCurrentOrganization() {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        Organization org = organizationRepository.findById(principal.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return mapToOrganizationDto(org);
    }

    @Override
    @Transactional
    public OrganizationResponseDto updateCurrentOrganization(UpdateOrganizationRequestDto request) {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        Organization org = organizationRepository.findById(principal.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        org.setName(request.getName().trim());
        if (request.getContactEmail() != null) {
            org.setContactEmail(request.getContactEmail().trim());
        }
        if (request.getContactPhone() != null) {
            org.setContactPhone(request.getContactPhone().trim());
        }
        if (request.getAddress() != null) {
            org.setAddress(request.getAddress().trim());
        }
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            org.setTimezone(request.getTimezone().trim());
        }

        Organization saved = organizationRepository.save(org);
        log.info("Organization settings updated for organization: {}", saved.getId());
        return mapToOrganizationDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDto> getOrganizationUsers(UserRole role, UserStatus status, String search, Pageable pageable) {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        String sanitizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<User> usersPage = userRepository.searchOrganizationUsers(
                principal.getOrganizationId(),
                role,
                status,
                sanitizedSearch,
                pageable
        );

        return usersPage.map(this::mapToUserDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getOrganizationUserById(UUID userId) {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        User user = userRepository.findByIdAndOrganizationId(userId, principal.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found in organization"));

        return mapToUserDto(user);
    }

    @Override
    @Transactional
    public UserResponseDto createOrganizationUser(CreateUserRequestDto request) {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        if (request.getRole() == UserRole.SYSTEM_ADMIN && principal.getRole() != UserRole.SYSTEM_ADMIN) {
            throw new UnauthorizedAccessException("Corporate Administrators cannot assign the SYSTEM_ADMIN role");
        }

        if (userRepository.findByEmail(request.getEmail().trim()).isPresent()) {
            throw new InvalidBookingException("A user with email " + request.getEmail() + " already exists");
        }

        Organization org = organizationRepository.findById(principal.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User newUser = User.builder()
                .organization(org)
                .email(request.getEmail().trim().toLowerCase())
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .role(request.getRole())
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        // Perform automated verification
        VerificationStatus vStatus = employeeVerificationService.verifyEmployee(newUser);
        newUser.setVerificationStatus(vStatus);

        User saved = userRepository.save(newUser);
        log.info("Created new user {} ({}) in organization {}", saved.getEmail(), saved.getRole(), org.getName());
        return mapToUserDto(saved);
    }

    @Override
    @Transactional
    public UserResponseDto updateUserRole(UUID userId, UpdateUserRoleRequestDto request) {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        User targetUser = userRepository.findByIdAndOrganizationId(userId, principal.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found in organization"));

        if (request.getRole() == UserRole.SYSTEM_ADMIN && principal.getRole() != UserRole.SYSTEM_ADMIN) {
            throw new UnauthorizedAccessException("Corporate Administrators cannot promote users to SYSTEM_ADMIN");
        }

        // Rule 9: Last-admin protection
        if (targetUser.getRole() == UserRole.CORPORATE_ADMIN && request.getRole() != UserRole.CORPORATE_ADMIN) {
            long activeAdminCount = userRepository.countByOrganizationIdAndRoleAndStatus(
                    principal.getOrganizationId(),
                    UserRole.CORPORATE_ADMIN,
                    UserStatus.ACTIVE
            );
            if (activeAdminCount <= 1) {
                throw new InvalidBookingException("Cannot demote the only active Corporate Administrator in this organization");
            }
        }

        targetUser.setRole(request.getRole());
        User saved = userRepository.save(targetUser);
        log.info("Updated role for user {} to {}", saved.getId(), saved.getRole());
        return mapToUserDto(saved);
    }

    @Override
    @Transactional
    public UserResponseDto updateUserStatus(UUID userId, UpdateUserStatusRequestDto request) {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        User targetUser = userRepository.findByIdAndOrganizationId(userId, principal.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found in organization"));

        // Rule 9: Last-admin protection
        if (targetUser.getRole() == UserRole.CORPORATE_ADMIN && request.getStatus() != UserStatus.ACTIVE) {
            long activeAdminCount = userRepository.countByOrganizationIdAndRoleAndStatus(
                    principal.getOrganizationId(),
                    UserRole.CORPORATE_ADMIN,
                    UserStatus.ACTIVE
            );
            if (activeAdminCount <= 1) {
                throw new InvalidBookingException("Cannot deactivate or suspend the only active Corporate Administrator in this organization");
            }
        }

        targetUser.setStatus(request.getStatus());
        User saved = userRepository.save(targetUser);
        log.info("Updated status for user {} to {}", saved.getId(), saved.getStatus());
        return mapToUserDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationSummaryDto getOrganizationSummary() {
        UserPrincipal principal = getAuthenticatedUser();
        verifyAdminRole(principal);

        UUID orgId = principal.getOrganizationId();
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        long totalUsers = userRepository.countByOrganizationId(orgId);
        long activeUsers = userRepository.countByOrganizationIdAndStatus(orgId, UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByOrganizationIdAndStatus(orgId, UserStatus.SUSPENDED);

        long totalDrivers = driverRepository.countByOrganizationId(orgId);
        long activeDrivers = driverRepository.countByOrganizationIdAndDriverStatus(orgId, DriverStatus.ACTIVE);

        long totalVehicles = vehicleRepository.countByOrganizationId(orgId);
        long activeVehicles = vehicleRepository.countByOrganizationIdAndVehicleStatus(orgId, VehicleStatus.ACTIVE);

        Map<String, Long> roleDistribution = new HashMap<>();
        for (UserRole role : UserRole.values()) {
            long count = userRepository.countByOrganizationIdAndRole(orgId, role);
            if (count > 0) {
                roleDistribution.put(role.name(), count);
            }
        }

        return OrganizationSummaryDto.builder()
                .organizationId(org.getId())
                .organizationName(org.getName())
                .organizationCode(org.getCode())
                .status(org.getStatus())
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .totalDrivers(totalDrivers)
                .activeDrivers(activeDrivers)
                .totalVehicles(totalVehicles)
                .activeVehicles(activeVehicles)
                .roleDistribution(roleDistribution)
                .build();
    }

    private OrganizationResponseDto mapToOrganizationDto(Organization org) {
        return OrganizationResponseDto.builder()
                .id(org.getId())
                .name(org.getName())
                .organizationCode(org.getCode())
                .contactEmail(org.getContactEmail())
                .contactPhone(org.getContactPhone())
                .address(org.getAddress())
                .timezone(org.getTimezone() != null ? org.getTimezone() : "UTC")
                .status(org.getStatus())
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }

    private UserResponseDto mapToUserDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .organizationId(user.getOrganization().getId())
                .organizationName(user.getOrganization().getName())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .department(user.getDepartment())
                .role(user.getRole())
                .status(user.getStatus())
                .verificationStatus(user.getVerificationStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
