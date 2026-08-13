package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.*;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class VehicleServiceTest {

    @Autowired
    private VehicleService vehicleService;

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
                .name("Vehicle Test Org")
                .code("VHC_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("mgr.vhc@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Test Fleet Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("emp.vhc@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
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
    void testCreateVehicle_Success() {
        CreateVehicleRequestDto request = CreateVehicleRequestDto.builder()
                .registrationNumber("V-ACME-001")
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Camry")
                .manufacturingYear(2023)
                .seatingCapacity(4)
                .insuranceExpiryDate(LocalDate.now().plusYears(1))
                .permitExpiryDate(LocalDate.now().plusYears(1))
                .build();

        VehicleResponseDto response = vehicleService.createVehicle(request);

        assertNotNull(response.getId());
        assertEquals("V-ACME-001", response.getRegistrationNumber());
        assertEquals(VehicleType.SEDAN, response.getVehicleType());
        assertEquals(VehicleStatus.ACTIVE, response.getVehicleStatus());
        assertEquals(VehicleAvailability.AVAILABLE, response.getAvailabilityStatus());
        assertEquals(MaintenanceStatus.GOOD, response.getMaintenanceStatus());
        assertFalse(response.getIsInsuranceExpired());
        assertFalse(response.getIsPermitExpired());
    }

    @Test
    void testCreateVehicle_InvalidCapacity_ThrowsException() {
        CreateVehicleRequestDto request = CreateVehicleRequestDto.builder()
                .registrationNumber("V-ZERO-CAP")
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Corolla")
                .manufacturingYear(2022)
                .seatingCapacity(0) // Invalid seating capacity
                .build();

        assertThrows(InvalidBookingException.class, () -> vehicleService.createVehicle(request));
    }

    @Test
    void testCreateVehicle_DuplicateRegistration_ThrowsException() {
        String reg = "V-DUP-999";
        CreateVehicleRequestDto req1 = CreateVehicleRequestDto.builder()
                .registrationNumber(reg)
                .vehicleType(VehicleType.SUV)
                .make("Ford")
                .model("Explorer")
                .seatingCapacity(6)
                .build();

        vehicleService.createVehicle(req1);

        CreateVehicleRequestDto req2 = CreateVehicleRequestDto.builder()
                .registrationNumber(reg)
                .vehicleType(VehicleType.SEDAN)
                .make("Honda")
                .model("Civic")
                .seatingCapacity(4)
                .build();

        assertThrows(InvalidBookingException.class, () -> vehicleService.createVehicle(req2));
    }

    @Test
    void testVehicle_EmployeeRoleDenied() {
        UserPrincipal empPrincipal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(employee.getEmail())
                .fullName(employee.getFullName())
                .role(UserRole.EMPLOYEE)
                .build();

        UserContextHolder.setContext(empPrincipal);

        CreateVehicleRequestDto request = CreateVehicleRequestDto.builder()
                .registrationNumber("V-ILLEGAL")
                .vehicleType(VehicleType.SEDAN)
                .make("Honda")
                .model("Civic")
                .seatingCapacity(4)
                .build();

        assertThrows(UnauthorizedAccessException.class, () -> vehicleService.createVehicle(request));
    }

    @Test
    void testVehicleStatus_InactiveForcesUnavailable() {
        CreateVehicleRequestDto createReq = CreateVehicleRequestDto.builder()
                .registrationNumber("V-STATUS-TEST")
                .vehicleType(VehicleType.VAN)
                .make("Mercedes")
                .model("Sprinter")
                .seatingCapacity(12)
                .build();

        VehicleResponseDto vehicle = vehicleService.createVehicle(createReq);

        UpdateVehicleStatusRequestDto statusReq = UpdateVehicleStatusRequestDto.builder()
                .vehicleStatus(VehicleStatus.INACTIVE)
                .build();

        VehicleResponseDto updated = vehicleService.updateVehicleStatus(vehicle.getId(), statusReq);

        assertEquals(VehicleStatus.INACTIVE, updated.getVehicleStatus());
        assertEquals(VehicleAvailability.UNAVAILABLE, updated.getAvailabilityStatus());

        UpdateVehicleAvailabilityRequestDto availReq = UpdateVehicleAvailabilityRequestDto.builder()
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .build();

        assertThrows(InvalidBookingException.class, () -> vehicleService.updateVehicleAvailability(vehicle.getId(), availReq));
    }

    @Test
    void testVehicleMaintenance_MaintenanceStatusForcesMaintenanceAvailability() {
        CreateVehicleRequestDto createReq = CreateVehicleRequestDto.builder()
                .registrationNumber("V-MAINT-TEST")
                .vehicleType(VehicleType.BUS)
                .make("Volvo")
                .model("B11R")
                .seatingCapacity(40)
                .build();

        VehicleResponseDto vehicle = vehicleService.createVehicle(createReq);

        UpdateVehicleMaintenanceRequestDto maintReq = UpdateVehicleMaintenanceRequestDto.builder()
                .maintenanceStatus(MaintenanceStatus.MAINTENANCE)
                .build();

        VehicleResponseDto updated = vehicleService.updateVehicleMaintenance(vehicle.getId(), maintReq);

        assertEquals(MaintenanceStatus.MAINTENANCE, updated.getMaintenanceStatus());
        assertEquals(VehicleAvailability.MAINTENANCE, updated.getAvailabilityStatus());

        UpdateVehicleAvailabilityRequestDto availReq = UpdateVehicleAvailabilityRequestDto.builder()
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .build();

        assertThrows(InvalidBookingException.class, () -> vehicleService.updateVehicleAvailability(vehicle.getId(), availReq));
    }
}
