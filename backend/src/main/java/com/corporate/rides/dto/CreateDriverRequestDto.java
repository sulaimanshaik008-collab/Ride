package com.corporate.rides.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDriverRequestDto {

    @NotBlank(message = "Driver full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(min = 5, max = 30, message = "Phone number must be between 5 and 30 characters")
    private String phoneNumber;

    @Size(max = 100, message = "Department cannot exceed 100 characters")
    private String department;

    @NotBlank(message = "License number is required")
    @Size(min = 3, max = 50, message = "License number must be between 3 and 50 characters")
    private String licenseNumber;

    @NotNull(message = "License expiry date is required")
    @Future(message = "Driver license must not be expired upon creation")
    private LocalDate licenseExpiryDate;
}
