package com.corporate.rides.config;

import com.corporate.rides.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrincipal {
    private UUID userId;
    private UUID organizationId;
    private String organizationName;
    private String email;
    private String fullName;
    private UserRole role;
}
