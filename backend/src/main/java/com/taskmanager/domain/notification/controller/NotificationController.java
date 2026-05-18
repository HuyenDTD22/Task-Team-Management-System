package com.taskmanager.domain.notification.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.notification.dto.NotificationFilterParams;
import com.taskmanager.domain.notification.dto.NotificationResponse;
import com.taskmanager.domain.notification.service.NotificationService;
import com.taskmanager.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.NOTIFICATIONS)
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getNotifications(
            @ModelAttribute @Valid NotificationFilterParams params) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        PageResponse<NotificationResponse> page = notificationService.getNotifications(
                currentUserId, params.getIsRead(), params.getPage(), params.getSize());
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        long count = notificationService.countUnread(SecurityUtil.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable UUID id) {
        NotificationResponse response = notificationService.markAsRead(id, SecurityUtil.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead(SecurityUtil.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }
}
