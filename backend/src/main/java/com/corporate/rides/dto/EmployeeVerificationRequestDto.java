package com.corporate.rides.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeVerificationRequestDto {

    @NotBlank(message = "Employee identifier is required")
    private String employeeIdentifier;

    private String verificationMethod;
}
