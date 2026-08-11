package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
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
class DriverControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    private Organization acmeOrg;
    private User managerUser;
    private User employeeUser;
    private User driverUser;
    private Driver testDriver;

    @BeforeEach
    void setUp() {
        acmeOrg = organizationRepository.save(Organization.builder()
                .name("Acme Controller Test Corp")
                .code("ACME_CTRL_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        managerUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("ctrl.mgr@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Acme Transport Manager")
                .phoneNumber("+1 555-100")
                .department("Fleet Management")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employeeUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("ctrl.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Acme Regular Employee")
                .phoneNumber("+1 555-200")
                .department("Engineering")
                .role(UserRole.EMPLOYEE)
                .build());

        driverUser = userRepository.save(User.builder()
                .organization(acmeOrg)
                .email("ctrl.drv@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Carlos Sainz")
                .phoneNumber("+1 555-300")
                .department("Fleet Operations")
                .role(UserRole.DRIVER)
                .build());

        testDriver = driverRepository.save(Driver.builder()
                .user(driverUser)
                .organization(acmeOrg)
                .licenseNumber("DL-CTRL-555")
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());
    }

    @Test
    @DisplayName("POST /api/v1/drivers - Success by Transport Manager")
    void createDriver_Success() throws Exception {
        CreateDriverRequestDto request = CreateDriverRequestDto.builder()
                .fullName("Charles Leclerc")
                .email("charles@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .phoneNumber("+1 555-1616")
                .department("Scuderia Shuttle")
                .licenseNumber("DL-FERRARI-16")
                .licenseExpiryDate(LocalDate.now().plusYears(3))
                .build();

        mockMvc.perform(post("/api/v1/drivers")
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Charles Leclerc")))
                .andExpect(jsonPath("$.data.licenseNumber", is("DL-FERRARI-16")))
                .andExpect(jsonPath("$.data.driverStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.availabilityStatus", is("AVAILABLE")));
    }

    @Test
    @DisplayName("POST /api/v1/drivers - 403 Forbidden when Employee calls API")
    void createDriver_ForbiddenForEmployee() throws Exception {
        CreateDriverRequestDto request = CreateDriverRequestDto.builder()
                .fullName("Illegal Driver")
                .email("illegal@test.com")
                .phoneNumber("+1 555-999")
                .licenseNumber("DL-ILLEGAL-01")
                .licenseExpiryDate(LocalDate.now().plusYears(1))
                .build();

        mockMvc.perform(post("/api/v1/drivers")
                        .header("X-User-Email", employeeUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/drivers - List and Filter Drivers")
    void searchDrivers_Success() throws Exception {
        mockMvc.perform(get("/api/v1/drivers")
                        .header("X-User-Email", managerUser.getEmail())
                        .param("status", "ACTIVE")
                        .param("availability", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].licenseNumber", is("DL-CTRL-555")));
    }

    @Test
    @DisplayName("GET /api/v1/drivers/me - Authenticated Driver Profile")
    void getSelfDriverProfile_Success() throws Exception {
        mockMvc.perform(get("/api/v1/drivers/me")
                        .header("X-User-Email", driverUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Carlos Sainz")))
                .andExpect(jsonPath("$.data.licenseNumber", is("DL-CTRL-555")));
    }

    @Test
    @DisplayName("GET /api/v1/drivers/{id} - Get Driver Details By ID")
    void getDriverById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/drivers/{id}", testDriver.getId())
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(testDriver.getId().toString())))
                .andExpect(jsonPath("$.data.fullName", is("Carlos Sainz")));
    }

    @Test
    @DisplayName("PUT /api/v1/drivers/{id} - Update Driver Personal & License Info")
    void updateDriver_Success() throws Exception {
        UpdateDriverRequestDto request = UpdateDriverRequestDto.builder()
                .fullName("Carlos Sainz Jr.")
                .phoneNumber("+1 555-3333")
                .department("Executive Fleet")
                .licenseNumber("DL-CTRL-555-UPDATED")
                .licenseExpiryDate(LocalDate.now().plusYears(4))
                .build();

        mockMvc.perform(put("/api/v1/drivers/{id}", testDriver.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Carlos Sainz Jr.")))
                .andExpect(jsonPath("$.data.licenseNumber", is("DL-CTRL-555-UPDATED")));
    }

    @Test
    @DisplayName("PATCH /api/v1/drivers/{id}/status - Deactivate Driver Forces Unavailable")
    void updateDriverStatus_Success() throws Exception {
        UpdateDriverStatusRequestDto request = UpdateDriverStatusRequestDto.builder()
                .driverStatus(DriverStatus.INACTIVE)
                .statusNotes("On leave")
                .build();

        mockMvc.perform(patch("/api/v1/drivers/{id}/status", testDriver.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.driverStatus", is("INACTIVE")))
                .andExpect(jsonPath("$.data.availabilityStatus", is("UNAVAILABLE")));
    }

    @Test
    @DisplayName("PATCH /api/v1/drivers/{id}/availability - Driver Toggle Availability")
    void updateDriverAvailability_Success() throws Exception {
        UpdateDriverAvailabilityRequestDto request = UpdateDriverAvailabilityRequestDto.builder()
                .availabilityStatus(DriverAvailability.OFF_DUTY)
                .build();

        mockMvc.perform(patch("/api/v1/drivers/{id}/availability", testDriver.getId())
                        .header("X-User-Email", driverUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.availabilityStatus", is("OFF_DUTY")));
    }
}
