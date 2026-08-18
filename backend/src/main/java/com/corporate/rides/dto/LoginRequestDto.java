package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {
    private String email;
    private String fullName;
    private String phoneNumber;
    private String department;
    private String organizationName;
    private String role;
}
