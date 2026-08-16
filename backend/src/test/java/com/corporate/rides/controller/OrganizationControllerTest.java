package com.corporate.rides.controller;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.enums.OrganizationStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.service.OrganizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class OrganizationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrganizationService organizationService;

    private UUID orgId;
    private UUID adminUserId;
    private OrganizationResponseDto orgDto;
    private UserResponseDto userDto;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        adminUserId = UUID.randomUUID();

        orgDto = OrganizationResponseDto.builder()
                .id(orgId)
                .name("Acme Corp")
                .organizationCode("ACME")
                .status(OrganizationStatus.ACTIVE)
                .timezone("UTC")
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        userDto = UserResponseDto.builder()
                .id(adminUserId)
                .organizationId(orgId)
                .organizationName("Acme Corp")
                .email("admin@acme.com")
                .fullName("Alice Admin")
                .role(UserRole.CORPORATE_ADMIN)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/organizations/current returns 200 OK")
    void testGetCurrentOrganization() throws Exception {
        when(organizationService.getCurrentOrganization()).thenReturn(orgDto);

        mockMvc.perform(get("/api/v1/organizations/current")
                .header("X-User-Email", "admin.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Acme Corp"));
    }

    @Test
    @DisplayName("PUT /api/v1/organizations/current updates settings")
    void testUpdateCurrentOrganization() throws Exception {
        UpdateOrganizationRequestDto request = UpdateOrganizationRequestDto.builder()
                .name("Updated Corp Name")
                .contactEmail("admin@updated.com")
                .timezone("America/New_York")
                .build();

        when(organizationService.updateCurrentOrganization(any())).thenReturn(orgDto);

        mockMvc.perform(put("/api/v1/organizations/current")
                .header("X-User-Email", "admin.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/organizations/current/users returns paginated list")
    void testGetOrganizationUsers() throws Exception {
        when(organizationService.getOrganizationUsers(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(userDto)));

        mockMvc.perform(get("/api/v1/organizations/current/users")
                .header("X-User-Email", "admin.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].email").value("admin@acme.com"));
    }

    @Test
    @DisplayName("POST /api/v1/organizations/current/users creates user")
    void testCreateOrganizationUser() throws Exception {
        CreateUserRequestDto request = CreateUserRequestDto.builder()
                .email("new@acme.com")
                .fullName("New Person")
                .role(UserRole.EMPLOYEE)
                .build();

        when(organizationService.createOrganizationUser(any())).thenReturn(userDto);

        mockMvc.perform(post("/api/v1/organizations/current/users")
                .header("X-User-Email", "admin.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/organizations/current/users/{userId}/role updates role")
    void testUpdateUserRole() throws Exception {
        UpdateUserRoleRequestDto request = UpdateUserRoleRequestDto.builder()
                .role(UserRole.TRANSPORT_MANAGER)
                .build();

        when(organizationService.updateUserRole(eq(adminUserId), any())).thenReturn(userDto);

        mockMvc.perform(patch("/api/v1/organizations/current/users/" + adminUserId + "/role")
                .header("X-User-Email", "admin.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/organizations/current/users/{userId}/status updates status")
    void testUpdateUserStatus() throws Exception {
        UpdateUserStatusRequestDto request = UpdateUserStatusRequestDto.builder()
                .status(UserStatus.SUSPENDED)
                .build();

        when(organizationService.updateUserStatus(eq(adminUserId), any())).thenReturn(userDto);

        mockMvc.perform(patch("/api/v1/organizations/current/users/" + adminUserId + "/status")
                .header("X-User-Email", "admin.acme@corporate.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
