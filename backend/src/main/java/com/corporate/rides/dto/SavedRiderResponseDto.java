package com.corporate.rides.dto;

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
public class SavedRiderResponseDto {
    private UUID id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phoneNumber;
    private String countryCode;
    private String initials;
    private OffsetDateTime createdAt;
}
