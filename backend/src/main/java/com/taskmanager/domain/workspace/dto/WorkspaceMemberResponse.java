package com.taskmanager.domain.workspace.dto;

import com.taskmanager.common.enums.WorkspaceRole;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class WorkspaceMemberResponse {

    private final UUID userId;
    private final String fullName;
    private final String email;
    private final String avatarUrl;
    private final WorkspaceRole role;
    private final Instant joinedAt;
}
