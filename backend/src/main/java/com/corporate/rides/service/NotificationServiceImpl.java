package com.corporate.rides.service;

import com.corporate.rides.channel.NotificationChannel;
import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.NotificationResponseDto;
import com.corporate.rides.dto.UnreadCountResponseDto;
import com.corporate.rides.entity.Notification;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.ChannelStatus;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.enums.NotificationType;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final List<NotificationChannel> notificationChannels;

    @Override
    @Transactional
    public Notification createNotification(
            User recipient,
            Ride ride,
            NotificationType type,
            String title,
            String message,
            NotificationChannelType channelType
    ) {
        if (recipient == null) {
            log.warn("Cannot create notification: recipient is null for type {}", type);
            return null;
        }

        NotificationChannelType targetChannel = channelType != null ? channelType : NotificationChannelType.IN_APP;

        Notification notification = Notification.builder()
                .organization(recipient.getOrganization())
                .recipient(recipient)
                .ride(ride)
                .notificationType(type)
                .title(title)
                .message(message)
                .channel(targetChannel)
                .channelStatus(ChannelStatus.DELIVERED)
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build();

        NotificationChannel channel = notificationChannels.stream()
                .filter(c -> c.getChannelType() == targetChannel)
                .findFirst()
                .orElse(null);

        if (channel != null) {
            ChannelStatus status = channel.sendNotification(notification);
            notification.setChannelStatus(status);
        }

        Notification saved = notificationRepository.save(notification);
        log.info("Saved notification {} of type {} for user {}", saved.getId(), type, recipient.getEmail());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getUserNotifications(Pageable pageable, Boolean unreadOnly) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Page<Notification> page;
        if (Boolean.TRUE.equals(unreadOnly)) {
            page = notificationRepository.findUnreadByOrganizationIdAndRecipientId(
                    currentUser.getOrganizationId(),
                    currentUser.getUserId(),
                    pageable
            );
        } else {
            page = notificationRepository.findByOrganizationIdAndRecipientId(
                    currentUser.getOrganizationId(),
                    currentUser.getUserId(),
                    pageable
            );
        }

        return page.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponseDto getUnreadCount() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        long count = notificationRepository.countUnreadByOrganizationIdAndRecipientId(
                currentUser.getOrganizationId(),
                currentUser.getUserId()
        );
        return UnreadCountResponseDto.builder().unreadCount(count).build();
    }

    @Override
    @Transactional
    public NotificationResponseDto markAsRead(UUID notificationId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Notification notification = notificationRepository.findByIdAndOrganizationIdAndRecipientId(
                notificationId,
                currentUser.getOrganizationId(),
                currentUser.getUserId()
        ).orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(OffsetDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return mapToDto(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        return notificationRepository.markAllAsRead(
                currentUser.getOrganizationId(),
                currentUser.getUserId(),
                OffsetDateTime.now()
        );
    }

    private UserPrincipal getCurrentUserPrincipal() {
        UserPrincipal currentUser = UserContextHolder.getContext();
        if (currentUser == null || currentUser.getUserId() == null || currentUser.getOrganizationId() == null) {
            throw new UnauthorizedAccessException("Authentication required. Tenant context missing.");
        }
        return currentUser;
    }

    private NotificationResponseDto mapToDto(Notification n) {
        return NotificationResponseDto.builder()
                .id(n.getId())
                .organizationId(n.getOrganization().getId())
                .recipientUserId(n.getRecipient().getId())
                .rideId(n.getRide() != null ? n.getRide().getId() : null)
                .bookingReference(n.getRide() != null ? n.getRide().getBookingReference() : null)
                .notificationType(n.getNotificationType())
                .title(n.getTitle())
                .message(n.getMessage())
                .channel(n.getChannel())
                .channelStatus(n.getChannelStatus())
                .isRead(n.getIsRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
