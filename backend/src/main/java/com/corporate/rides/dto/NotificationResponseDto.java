package com.corporate.rides.dto;

import com.corporate.rides.enums.ChannelStatus;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.enums.NotificationType;
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
public class NotificationResponseDto {

    private UUID id;
    private UUID organizationId;
    private UUID recipientUserId;
    private UUID rideId;
    private String bookingReference;
    private NotificationType notificationType;
    private String title;
    private String message;
    private NotificationChannelType channel;
    private ChannelStatus channelStatus;
    private Boolean isRead;
    private OffsetDateTime readAt;
    private OffsetDateTime createdAt;
}
