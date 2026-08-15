package com.corporate.rides.controller;

import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    private Organization organization;
    private User manager;
    private User employee;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Ctrl Analytics Org")
                .code("CTRL_ANALYTICS_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.mgr@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Analytics Controller Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Analytics Controller Employee")
                .role(UserRole.EMPLOYEE)
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/overview - Manager Success")
    void getOverview_Manager_Success() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/overview")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalRides", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/overview - Employee Access Denied")
    void getOverview_Employee_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/overview")
                        .header("X-User-Email", employee.getEmail()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/rides - Manager Success")
    void getRides_Manager_Success() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/rides")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", isA(java.util.List.class)));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/drivers - Manager Success")
    void getDrivers_Manager_Success() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/drivers")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/vehicles - Manager Success")
    void getVehicles_Manager_Success() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/vehicles")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/export - Export CSV Success")
    void exportCsv_Manager_Success() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/export")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv"))
                .andExpect(content().string(containsString("Booking Reference")));
    }
}
