package com.corporate.rides.dto;

import com.corporate.rides.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequestDto {

    @NotNull(message = "Role is required")
    private UserRole role;
}
