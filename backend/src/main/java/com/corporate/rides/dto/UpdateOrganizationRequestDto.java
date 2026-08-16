package com.corporate.rides.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrganizationRequestDto {

    @NotBlank(message = "Organization name is required")
    @Size(max = 100, message = "Organization name cannot exceed 100 characters")
    private String name;

    @Email(message = "Contact email must be valid")
    @Size(max = 150, message = "Contact email cannot exceed 150 characters")
    private String contactEmail;

    @Size(max = 30, message = "Contact phone cannot exceed 30 characters")
    private String contactPhone;

    @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;

    @Size(max = 50, message = "Timezone cannot exceed 50 characters")
    private String timezone;
}
