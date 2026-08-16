package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.OrganizationStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.provider.EmployeeVerificationProvider;
import com.corporate.rides.provider.ManualEmployeeVerificationProvider;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private EmployeeVerificationService employeeVerificationService;

    @InjectMocks
    private OrganizationServiceImpl organizationService;

    private UUID orgId;
    private UUID adminUserId;
    private UUID regularUserId;
    private Organization organization;
    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        adminUserId = UUID.randomUUID();
        regularUserId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .name("Acme Corp")
                .code("ACME")
                .contactEmail("contact@acme.com")
                .contactPhone("+1 555-0100")
                .address("123 Corporate Way")
                .timezone("America/New_York")
                .status(OrganizationStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        adminUser = User.builder()
                .id(adminUserId)
                .organization(organization)
                .email("admin@acme.com")
                .fullName("Alice Admin")
                .role(UserRole.CORPORATE_ADMIN)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        regularUser = User.builder()
                .id(regularUserId)
                .organization(organization)
                .email("emp@acme.com")
                .fullName("Bob Employee")
                .role(UserRole.EMPLOYEE)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        UserPrincipal principal = UserPrincipal.builder()
                .userId(adminUserId)
                .organizationId(orgId)
                .organizationName("Acme Corp")
                .email("admin@acme.com")
                .fullName("Alice Admin")
                .role(UserRole.CORPORATE_ADMIN)
                .build();

        UserContextHolder.setContext(principal);
    }

    @Test
    @DisplayName("Should retrieve current organization successfully")
    void testGetCurrentOrganization() {
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));

        OrganizationResponseDto result = organizationService.getCurrentOrganization();

        assertNotNull(result);
        assertEquals("Acme Corp", result.getName());
        assertEquals("ACME", result.getOrganizationCode());
    }

    @Test
    @DisplayName("Should update current organization settings")
    void testUpdateCurrentOrganization() {
        UpdateOrganizationRequestDto request = UpdateOrganizationRequestDto.builder()
                .name("Acme Enterprise")
                .contactEmail("updated@acme.com")
                .contactPhone("+1 555-9999")
                .address("456 Market St")
                .timezone("America/Chicago")
                .build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationRepository.save(any(Organization.class))).thenAnswer(i -> i.getArgument(0));

        OrganizationResponseDto result = organizationService.updateCurrentOrganization(request);

        assertNotNull(result);
        assertEquals("Acme Enterprise", result.getName());
        assertEquals("updated@acme.com", result.getContactEmail());
    }

    @Test
    @DisplayName("Should search and list organization users with pagination")
    void testGetOrganizationUsers() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        when(userRepository.searchOrganizationUsers(eq(orgId), isNull(), isNull(), isNull(), eq(pageRequest)))
                .thenReturn(new PageImpl<>(List.of(adminUser, regularUser)));

        Page<UserResponseDto> result = organizationService.getOrganizationUsers(null, null, null, pageRequest);

        assertEquals(2, result.getTotalElements());
    }

    @Test
    @DisplayName("Should create user and run automated verification")
    void testCreateOrganizationUser() {
        CreateUserRequestDto request = CreateUserRequestDto.builder()
                .email("new.emp@acme.com")
                .fullName("Charlie New")
                .phoneNumber("+1 555-7777")
                .department("Engineering")
                .role(UserRole.EMPLOYEE)
                .build();

        when(userRepository.findByEmail("new.emp@acme.com")).thenReturn(Optional.empty());
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(employeeVerificationService.verifyEmployee(any(User.class))).thenReturn(VerificationStatus.VERIFIED);
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponseDto result = organizationService.createOrganizationUser(request);

        assertNotNull(result);
        assertEquals("new.emp@acme.com", result.getEmail());
        assertEquals(VerificationStatus.VERIFIED, result.getVerificationStatus());
    }

    @Test
    @DisplayName("Should block Corporate Admin from creating SYSTEM_ADMIN user")
    void testBlockPromoteToSystemAdmin() {
        CreateUserRequestDto request = CreateUserRequestDto.builder()
                .email("sysadmin@acme.com")
                .fullName("Unauthorized SysAdmin")
                .role(UserRole.SYSTEM_ADMIN)
                .build();

        assertThrows(UnauthorizedAccessException.class, () -> {
            organizationService.createOrganizationUser(request);
        });
    }

    @Test
    @DisplayName("Should protect last active Corporate Admin from demotion")
    void testLastAdminProtectionDemotion() {
        when(userRepository.findByIdAndOrganizationId(adminUserId, orgId)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByOrganizationIdAndRoleAndStatus(orgId, UserRole.CORPORATE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(1L);

        UpdateUserRoleRequestDto request = UpdateUserRoleRequestDto.builder()
                .role(UserRole.EMPLOYEE)
                .build();

        assertThrows(InvalidBookingException.class, () -> {
            organizationService.updateUserRole(adminUserId, request);
        });
    }

    @Test
    @DisplayName("Should protect last active Corporate Admin from deactivation")
    void testLastAdminProtectionDeactivation() {
        when(userRepository.findByIdAndOrganizationId(adminUserId, orgId)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByOrganizationIdAndRoleAndStatus(orgId, UserRole.CORPORATE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(1L);

        UpdateUserStatusRequestDto request = UpdateUserStatusRequestDto.builder()
                .status(UserStatus.DEACTIVATED)
                .build();

        assertThrows(InvalidBookingException.class, () -> {
            organizationService.updateUserStatus(adminUserId, request);
        });
    }

    @Test
    @DisplayName("Should retrieve organization summary metrics correctly")
    void testGetOrganizationSummary() {
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(userRepository.countByOrganizationId(orgId)).thenReturn(10L);
        when(userRepository.countByOrganizationIdAndStatus(orgId, UserStatus.ACTIVE)).thenReturn(8L);
        when(userRepository.countByOrganizationIdAndStatus(orgId, UserStatus.SUSPENDED)).thenReturn(2L);
        when(driverRepository.countByOrganizationId(orgId)).thenReturn(4L);
        when(driverRepository.countByOrganizationIdAndDriverStatus(orgId, DriverStatus.ACTIVE)).thenReturn(3L);
        when(vehicleRepository.countByOrganizationId(orgId)).thenReturn(5L);
        when(vehicleRepository.countByOrganizationIdAndVehicleStatus(orgId, VehicleStatus.ACTIVE)).thenReturn(4L);
        when(userRepository.countByOrganizationIdAndRole(eq(orgId), any())).thenReturn(2L);

        OrganizationSummaryDto summary = organizationService.getOrganizationSummary();

        assertNotNull(summary);
        assertEquals(10L, summary.getTotalUsers());
        assertEquals(8L, summary.getActiveUsers());
        assertEquals(4L, summary.getTotalDrivers());
        assertEquals(5L, summary.getTotalVehicles());
    }
}
