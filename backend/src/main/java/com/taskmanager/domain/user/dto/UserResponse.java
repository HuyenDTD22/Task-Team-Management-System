package com.taskmanager.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class UserResponse {

    private final UUID id;
    private final String email;
    private final String fullName;
    private final String avatarUrl;
    private final String systemRole;
    private final boolean active;
    private final Instant createdAt;
}
