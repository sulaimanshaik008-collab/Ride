package com.corporate.rides.service;

import com.corporate.rides.dto.NotificationResponseDto;
import com.corporate.rides.dto.UnreadCountResponseDto;
import com.corporate.rides.entity.Notification;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    Notification createNotification(
            User recipient,
            Ride ride,
            NotificationType type,
            String title,
            String message,
            NotificationChannelType channel
    );

    Page<NotificationResponseDto> getUserNotifications(Pageable pageable, Boolean unreadOnly);

    UnreadCountResponseDto getUnreadCount();

    NotificationResponseDto markAsRead(UUID notificationId);

    int markAllAsRead();
}
