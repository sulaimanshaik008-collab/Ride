package com.corporate.rides.dto;

import com.corporate.rides.enums.DriverStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDriverStatusRequestDto {

    @NotNull(message = "Driver status is required")
    private DriverStatus driverStatus;

    @Size(max = 500, message = "Status reason notes cannot exceed 500 characters")
    private String statusNotes;
}
