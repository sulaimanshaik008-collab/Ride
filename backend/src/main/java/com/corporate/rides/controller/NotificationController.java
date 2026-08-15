package com.corporate.rides.controller;

import com.corporate.rides.dto.ApiResponse;
import com.corporate.rides.dto.NotificationResponseDto;
import com.corporate.rides.dto.UnreadCountResponseDto;
import com.corporate.rides.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponseDto>>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean unreadOnly) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponseDto> notifications = notificationService.getUserNotifications(pageable, unreadOnly);
        return ResponseEntity.ok(ApiResponse.success(notifications, "Notifications retrieved successfully"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountResponseDto>> getUnreadCount() {
        UnreadCountResponseDto count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success(count, "Unread count retrieved successfully"));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponseDto>> markAsRead(@PathVariable UUID id) {
        NotificationResponseDto notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(notification, "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead() {
        int updatedCount = notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success(Map.of("markedCount", updatedCount), "All notifications marked as read"));
    }
}
