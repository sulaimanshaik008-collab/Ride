package com.corporate.rides.dto;

import com.corporate.rides.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverMonthlyPayoutDto {
    private UUID driverId;
    private String driverName;
    private String driverPhone;
    private String driverEmail;
    private String licenseNumber;
    private String vehiclePlateNumber;
    private String vehicleModel;
    private String month; // e.g. "2026-09"
    private Long completedRidesCount;
    private Double totalEarnings;
    private Double totalDistanceKm;
    private PaymentStatus paymentStatus;
    private OffsetDateTime paidAt;
    private String paymentReference;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankAccountName;
    private String upiId;
}
