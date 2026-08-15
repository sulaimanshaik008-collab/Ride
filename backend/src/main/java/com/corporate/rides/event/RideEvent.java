package com.corporate.rides.event;

import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideEvent {
    private NotificationType eventType;
    private Ride ride;
    private User actor;
    private String customTitle;
    private String customMessage;
}
