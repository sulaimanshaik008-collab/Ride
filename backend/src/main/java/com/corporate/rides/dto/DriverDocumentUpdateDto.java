package com.corporate.rides.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDocumentUpdateDto {

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    @NotNull(message = "License expiry date is required")
    private LocalDate licenseExpiryDate;

    private String vehiclePlateNumber;

    private String vehicleModel;

    private String documentUrl;

    private String insuranceNumber;

    private LocalDate insuranceExpiryDate;

    private String bankAccountNumber;

    private String bankIfscCode;

    private String bankAccountName;

    private String upiId;
}
