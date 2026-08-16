package com.corporate.rides.dto;

import com.corporate.rides.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserStatusRequestDto {

    @NotNull(message = "Status is required")
    private UserStatus status;
}
