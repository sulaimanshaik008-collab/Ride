package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentOptionsResponseDto {

    private List<DriverResponseDto> eligibleDrivers;
    private List<VehicleResponseDto> eligibleVehicles;
}
