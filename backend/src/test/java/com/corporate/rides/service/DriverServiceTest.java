package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.CreateDriverRequestDto;
import com.corporate.rides.dto.DriverResponseDto;
import com.corporate.rides.dto.UpdateDriverAvailabilityRequestDto;
import com.corporate.rides.dto.UpdateDriverStatusRequestDto;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class DriverServiceTest {

    @Autowired
    private DriverService driverService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Organization organization;
    private User manager;
    private User employee;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Driver Test Org")
                .code("DRV_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("mgr.test@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Transport Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("emp.test@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(manager.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(manager.getEmail())
                .fullName(manager.getFullName())
                .role(manager.getRole())
                .build();

        UserContextHolder.setContext(principal);
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    void testCreateDriver_Success() {
        CreateDriverRequestDto request = CreateDriverRequestDto.builder()
                .fullName("Michael Schumacher")
                .email("schumi@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .phoneNumber("+1 (555) 999-0011")
                .department("Executive Transport")
                .licenseNumber("DL-F1-001")
                .licenseExpiryDate(LocalDate.now().plusYears(3))
                .build();

        DriverResponseDto response = driverService.createDriver(request);

        assertNotNull(response.getId());
        assertNotNull(response.getUserId());
        assertEquals("Michael Schumacher", response.getFullName());
        assertEquals("DL-F1-001", response.getLicenseNumber());
        assertEquals(DriverStatus.ACTIVE, response.getDriverStatus());
        assertEquals(DriverAvailability.AVAILABLE, response.getAvailabilityStatus());
        assertFalse(response.isLicenseExpired());
    }

    @Test
    void testCreateDriver_DuplicateLicense_ThrowsException() {
        String license = "DL-DUP-100";
        CreateDriverRequestDto req1 = CreateDriverRequestDto.builder()
                .fullName("Driver One")
                .email("d1@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .phoneNumber("+1 555-001")
                .licenseNumber(license)
                .licenseExpiryDate(LocalDate.now().plusYears(1))
                .build();

        driverService.createDriver(req1);

        CreateDriverRequestDto req2 = CreateDriverRequestDto.builder()
                .fullName("Driver Two")
                .email("d2@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .phoneNumber("+1 555-002")
                .licenseNumber(license)
                .licenseExpiryDate(LocalDate.now().plusYears(1))
                .build();

        assertThrows(InvalidBookingException.class, () -> driverService.createDriver(req2));
    }

    @Test
    void testDriver_RoleRestriction_EmployeeDenied() {
        UserPrincipal empPrincipal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(employee.getEmail())
                .fullName(employee.getFullName())
                .role(UserRole.EMPLOYEE)
                .build();

        UserContextHolder.setContext(empPrincipal);

        CreateDriverRequestDto request = CreateDriverRequestDto.builder()
                .fullName("Illegal Driver")
                .email("illegal@test.com")
                .phoneNumber("+1 555-999")
                .licenseNumber("DL-ILLEGAL")
                .licenseExpiryDate(LocalDate.now().plusYears(1))
                .build();

        assertThrows(UnauthorizedAccessException.class, () -> driverService.createDriver(request));
    }

    @Test
    void testDriverStatus_InactiveForcesUnavailable() {
        CreateDriverRequestDto createReq = CreateDriverRequestDto.builder()
                .fullName("Lando Norris")
                .email("lando@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .phoneNumber("+1 555-444")
                .licenseNumber("DL-MCLAREN-4")
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .build();

        DriverResponseDto driver = driverService.createDriver(createReq);

        UpdateDriverStatusRequestDto statusReq = UpdateDriverStatusRequestDto.builder()
                .driverStatus(DriverStatus.INACTIVE)
                .statusNotes("On sabbatical")
                .build();

        DriverResponseDto updated = driverService.updateDriverStatus(driver.getId(), statusReq);

        assertEquals(DriverStatus.INACTIVE, updated.getDriverStatus());
        assertEquals(DriverAvailability.UNAVAILABLE, updated.getAvailabilityStatus());

        UpdateDriverAvailabilityRequestDto availReq = UpdateDriverAvailabilityRequestDto.builder()
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build();

        assertThrows(InvalidBookingException.class, () -> driverService.updateDriverAvailability(driver.getId(), availReq));
    }
}
