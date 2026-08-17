package com.corporate.rides.controller;

import com.corporate.rides.dto.LoginRequestDto;
import com.corporate.rides.dto.UserProfileDto;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @Test
    void testLogin_Success() throws Exception {
        UserProfileDto mockProfile = UserProfileDto.builder()
                .id(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .organizationName("Acme Corp")
                .organizationCode("ACME")
                .email("zoro@gmail.com")
                .fullName("Zoro")
                .role(UserRole.EMPLOYEE)
                .build();

        when(authService.login(org.mockito.ArgumentMatchers.any(LoginRequestDto.class))).thenReturn(mockProfile);

        LoginRequestDto request = new LoginRequestDto();
        request.setEmail("zoro@gmail.com");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("zoro@gmail.com"))
                .andExpect(jsonPath("$.data.fullName").value("Zoro"));
    }

    @Test
    void testGetCurrentUser_Success() throws Exception {
        UserProfileDto mockProfile = UserProfileDto.builder()
                .id(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .organizationName("Acme Corp")
                .organizationCode("ACME")
                .email("employee.acme@corporate.com")
                .fullName("Acme Employee")
                .role(UserRole.EMPLOYEE)
                .build();

        when(authService.getCurrentUserProfile()).thenReturn(mockProfile);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("employee.acme@corporate.com"));
    }

    @Test
    void testGetDemoUsers_Success() throws Exception {
        UserProfileDto user1 = UserProfileDto.builder()
                .id(UUID.randomUUID())
                .email("employee.acme@corporate.com")
                .fullName("Employee")
                .role(UserRole.EMPLOYEE)
                .build();

        when(authService.getAvailableDemoUsers()).thenReturn(List.of(user1));

        mockMvc.perform(get("/api/v1/auth/demo-users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].email").value("employee.acme@corporate.com"));
    }
}
