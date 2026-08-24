package com.corporate.rides;

import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.OrganizationStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.service.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAuditIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private RateLimiterService rateLimiterService;

    private Organization orgA;
    private Organization orgB;
    private User employeeUser;
    private User driverUser;
    private User managerUser;
    private User suspendedUser;

    @BeforeEach
    void setUp() {
        rateLimiterService.reset();

        orgA = organizationRepository.findByCode("ACME_TEST_ORG_A").orElseGet(() ->
                organizationRepository.save(Organization.builder()
                        .name("Acme Test Org A")
                        .code("ACME_TEST_ORG_A")
                        .status(OrganizationStatus.ACTIVE)
                        .build()));

        orgB = organizationRepository.findByCode("BETA_TEST_ORG_B").orElseGet(() ->
                organizationRepository.save(Organization.builder()
                        .name("Beta Test Org B")
                        .code("BETA_TEST_ORG_B")
                        .status(OrganizationStatus.ACTIVE)
                        .build()));

        employeeUser = userRepository.findByEmail("emp.sec@org-a.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(orgA)
                        .email("emp.sec@org-a.com")
                        .fullName("Sec Employee")
                        .role(UserRole.EMPLOYEE)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));

        driverUser = userRepository.findByEmail("driver.sec@org-a.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(orgA)
                        .email("driver.sec@org-a.com")
                        .fullName("Sec Driver")
                        .role(UserRole.DRIVER)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));

        managerUser = userRepository.findByEmail("manager.sec@org-a.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(orgA)
                        .email("manager.sec@org-a.com")
                        .fullName("Sec Manager")
                        .role(UserRole.TRANSPORT_MANAGER)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));

        suspendedUser = userRepository.findByEmail("suspended.sec@org-a.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(orgA)
                        .email("suspended.sec@org-a.com")
                        .fullName("Sec Suspended")
                        .role(UserRole.EMPLOYEE)
                        .status(UserStatus.SUSPENDED)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));
    }

    @Test
    @DisplayName("Security RBAC: Employee cannot access manager driver creation endpoint")
    void testEmployeeCannotAccessDriverCreation() throws Exception {
        String driverPayload = """
                {
                    "fullName": "New Driver",
                    "email": "new.driver@acme.com",
                    "phoneNumber": "+15550001111",
                    "licenseNumber": "LIC-9999",
                    "licenseExpiryDate": "2028-12-31"
                }
                """;

        mockMvc.perform(post("/api/v1/drivers")
                        .header("X-User-Email", employeeUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(driverPayload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security RBAC: Driver cannot create vehicles")
    void testDriverCannotCreateVehicle() throws Exception {
        String vehiclePayload = """
                {
                    "registrationNumber": "REG-SEC-01",
                    "make": "Toyota",
                    "model": "Camry",
                    "vehicleType": "SEDAN",
                    "seatingCapacity": 4
                }
                """;

        mockMvc.perform(post("/api/v1/vehicles")
                        .header("X-User-Email", driverUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vehiclePayload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security RBAC: Suspended user account is rejected with HTTP 403")
    void testSuspendedUserForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/rides")
                        .header("X-User-Email", suspendedUser.getEmail()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Account is suspended. Please contact your corporate administrator."));
    }

    @Test
    @DisplayName("Security RBAC: Employee cannot access organization settings")
    void testEmployeeCannotAccessOrgSettings() throws Exception {
        String orgPayload = """
                {
                    "name": "Unauthorized Org Update"
                }
                """;
        mockMvc.perform(put("/api/v1/organizations/current")
                        .header("X-User-Email", employeeUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orgPayload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Tenant Isolation: Manager cannot access non-existent or cross-tenant ride")
    void testCrossTenantRideAccessBlocked() throws Exception {
        UUID fakeRideId = UUID.randomUUID();
        mockMvc.perform(get("/api/v1/rides/" + fakeRideId)
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isNotFound());
    }
}
