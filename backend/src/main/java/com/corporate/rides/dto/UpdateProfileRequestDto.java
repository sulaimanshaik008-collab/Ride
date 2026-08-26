package com.corporate.rides.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDto {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Pattern(regexp = "^[\\p{L} .'-]+$", message = "Full name contains invalid characters")
    private String fullName;

    @Pattern(
        regexp = "^(\\+?[0-9]{1,4}[\\s-]?)?(\\(?[0-9]{2,5}\\)?[\\s-]?)?[0-9]{3,5}[\\s-]?[0-9]{3,5}$|^$",
        message = "Invalid phone number format. Please provide a valid phone number with optional country code."
    )
    private String phoneNumber;

    @Size(max = 100, message = "Department must not exceed 100 characters")
    private String department;
}
