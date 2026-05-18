package com.taskmanager.domain.notification.dto;

import com.taskmanager.common.enums.NotificationEntityType;
import com.taskmanager.common.enums.NotificationType;
import com.taskmanager.domain.notification.entity.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class NotificationResponse {

    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationEntityType entityType;
    private UUID entityId;
    private boolean read;
    private Instant readAt;
    private Instant createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .read(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
