package com.taskmanager.domain.notification.service;

import com.taskmanager.common.enums.NotificationEntityType;
import com.taskmanager.common.enums.NotificationType;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.notification.dto.NotificationResponse;
import com.taskmanager.domain.notification.entity.Notification;
import com.taskmanager.domain.notification.repository.NotificationRepository;
import com.taskmanager.domain.user.entity.User;
import com.taskmanager.domain.user.repository.UserRepository;
import com.taskmanager.exception.ErrorCode;
import com.taskmanager.exception.ForbiddenException;
import com.taskmanager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Creates a notification for a user. Intended to be called from other services
     * wrapped in try/catch so a notification failure never rolls back the triggering operation.
     */
    @Transactional
    public void createNotification(UUID userId, NotificationType type,
                                   String title, String message,
                                   NotificationEntityType entityType, UUID entityId) {
        User user = userRepository.getReferenceById(userId);
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(UUID userId, Boolean isRead, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> result = (isRead == null)
                ? notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, isRead, pageable);
        return PageResponse.from(result.map(NotificationResponse::from));
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countByUserIdAndRead(userId, false);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!notification.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException();
        }
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
        }
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId, Instant.now());
    }
}
