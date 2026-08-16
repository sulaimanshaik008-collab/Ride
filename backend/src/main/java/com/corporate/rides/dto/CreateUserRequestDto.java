package com.corporate.rides.dto;

import com.corporate.rides.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequestDto {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @Size(max = 30, message = "Phone number cannot exceed 30 characters")
    private String phoneNumber;

    @Size(max = 100, message = "Department cannot exceed 100 characters")
    private String department;

    @NotNull(message = "Role is required")
    private UserRole role;
}
