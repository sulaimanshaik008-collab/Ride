package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.*;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.repository.VehicleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    private Organization acmeOrg;
    private User managerUser;
    private User employeeUser;
    private User driverUser;
    private Vehicle testVehicle;

    @BeforeEach
    void setUp() {
        acmeOrg = organizationRepository.save(Organization.builder()
                .name("Acme Vehicle Controller Corp")
                .code("VHC_CTRL_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        managerUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("vhc.mgr@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Acme Fleet Manager")
                .phoneNumber("+1 555-1100")
                .department("Fleet Operations")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employeeUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("vhc.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Acme Regular Employee")
                .phoneNumber("+1 555-1200")
                .department("Sales")
                .role(UserRole.EMPLOYEE)
                .build());

        driverUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("vhc.drv@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Acme Shuttle Driver")
                .phoneNumber("+1 555-1300")
                .department("Transport")
                .role(UserRole.DRIVER)
                .build());

        testVehicle = vehicleRepository.save(Vehicle.builder()
                .organization(acmeOrg)
                .registrationNumber("V-CTRL-101")
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Camry")
                .manufacturingYear(2023)
                .seatingCapacity(4)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .insuranceExpiryDate(LocalDate.now().plusYears(2))
                .permitExpiryDate(LocalDate.now().plusYears(2))
                .build());
    }

    @Test
    @DisplayName("POST /api/v1/vehicles - Success by Transport Manager")
    void createVehicle_Success() throws Exception {
        CreateVehicleRequestDto request = CreateVehicleRequestDto.builder()
                .registrationNumber("V-NEW-505")
                .vehicleType(VehicleType.SUV)
                .make("Ford")
                .model("Explorer")
                .manufacturingYear(2024)
                .seatingCapacity(7)
                .insuranceExpiryDate(LocalDate.now().plusYears(1))
                .permitExpiryDate(LocalDate.now().plusYears(1))
                .build();

        mockMvc.perform(post("/api/v1/vehicles")
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.registrationNumber", is("V-NEW-505")))
                .andExpect(jsonPath("$.data.vehicleType", is("SUV")))
                .andExpect(jsonPath("$.data.vehicleStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.availabilityStatus", is("AVAILABLE")));
    }

    @Test
    @DisplayName("POST /api/v1/vehicles - 403 Forbidden when Employee calls API")
    void createVehicle_ForbiddenForEmployee() throws Exception {
        CreateVehicleRequestDto request = CreateVehicleRequestDto.builder()
                .registrationNumber("V-ILLEGAL-999")
                .vehicleType(VehicleType.SEDAN)
                .make("Honda")
                .model("Civic")
                .seatingCapacity(4)
                .build();

        mockMvc.perform(post("/api/v1/vehicles")
                        .header("X-User-Email", employeeUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/vehicles - List and Filter Vehicles")
    void searchVehicles_Success() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles")
                        .header("X-User-Email", managerUser.getEmail())
                        .param("status", "ACTIVE")
                        .param("availability", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].registrationNumber", is("V-CTRL-101")));
    }

    @Test
    @DisplayName("GET /api/v1/vehicles/{id} - Get Vehicle Details By ID")
    void getVehicleById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles/{id}", testVehicle.getId())
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(testVehicle.getId().toString())))
                .andExpect(jsonPath("$.data.registrationNumber", is("V-CTRL-101")));
    }

    @Test
    @DisplayName("PUT /api/v1/vehicles/{id} - Update Vehicle Information")
    void updateVehicle_Success() throws Exception {
        UpdateVehicleRequestDto request = UpdateVehicleRequestDto.builder()
                .registrationNumber("V-CTRL-101-UPDATED")
                .vehicleType(VehicleType.SEDAN)
                .make("Toyota")
                .model("Camry Hybrid")
                .manufacturingYear(2024)
                .seatingCapacity(4)
                .insuranceExpiryDate(LocalDate.now().plusYears(3))
                .permitExpiryDate(LocalDate.now().plusYears(3))
                .build();

        mockMvc.perform(put("/api/v1/vehicles/{id}", testVehicle.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.registrationNumber", is("V-CTRL-101-UPDATED")))
                .andExpect(jsonPath("$.data.model", is("Camry Hybrid")));
    }

    @Test
    @DisplayName("PATCH /api/v1/vehicles/{id}/status - Update Vehicle Lifecycle Status")
    void updateVehicleStatus_Success() throws Exception {
        UpdateVehicleStatusRequestDto request = UpdateVehicleStatusRequestDto.builder()
                .vehicleStatus(VehicleStatus.INACTIVE)
                .build();

        mockMvc.perform(patch("/api/v1/vehicles/{id}/status", testVehicle.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.vehicleStatus", is("INACTIVE")))
                .andExpect(jsonPath("$.data.availabilityStatus", is("UNAVAILABLE")));
    }

    @Test
    @DisplayName("PATCH /api/v1/vehicles/{id}/maintenance - Update Vehicle Maintenance State")
    void updateVehicleMaintenance_Success() throws Exception {
        UpdateVehicleMaintenanceRequestDto request = UpdateVehicleMaintenanceRequestDto.builder()
                .maintenanceStatus(MaintenanceStatus.MAINTENANCE)
                .build();

        mockMvc.perform(patch("/api/v1/vehicles/{id}/maintenance", testVehicle.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.maintenanceStatus", is("MAINTENANCE")))
                .andExpect(jsonPath("$.data.availabilityStatus", is("MAINTENANCE")));
    }
}
