package com.taskmanager.domain.project.dto;

import com.taskmanager.common.enums.ProjectRole;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class ProjectMemberResponse {

    private final UUID userId;
    private final String fullName;
    private final String email;
    private final String avatarUrl;
    private final ProjectRole role;
    private final Instant joinedAt;
}
