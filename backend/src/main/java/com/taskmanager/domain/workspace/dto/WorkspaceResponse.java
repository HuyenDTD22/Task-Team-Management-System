package com.taskmanager.domain.workspace.dto;

import com.taskmanager.common.enums.WorkspaceRole;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class WorkspaceResponse {

    private final UUID id;
    private final String name;
    private final String slug;
    private final String description;
    private final UUID ownerId;
    private final WorkspaceRole currentUserRole;
    private final long memberCount;
    private final Instant createdAt;
}
