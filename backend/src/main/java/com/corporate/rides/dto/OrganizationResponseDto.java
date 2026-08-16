package com.corporate.rides.dto;

import com.corporate.rides.enums.OrganizationStatus;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationResponseDto {
    private UUID id;
    private String name;
    private String organizationCode;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String timezone;
    private OrganizationStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
