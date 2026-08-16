package com.corporate.rides.dto;

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
public class UserProfileDto {
    private UUID id;
    private UUID organizationId;
    private String organizationName;
    private String organizationCode;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String department;
    private UserRole role;
}
