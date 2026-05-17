package com.taskmanager.domain.comment.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class CommentResponse {

    private final UUID id;
    private final UUID taskId;
    private final UUID parentId;
    private final UUID userId;
    private final String userName;
    private final String userAvatarUrl;
    private final String content;
    private final boolean edited;
    private final Instant createdAt;
    private final Instant updatedAt;
}
