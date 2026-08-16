package com.corporate.rides.dto;

import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VerificationStatus;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private UUID id;
    private UUID organizationId;
    private String organizationName;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String department;
    private UserRole role;
    private UserStatus status;
    private VerificationStatus verificationStatus;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
