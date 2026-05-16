package com.taskmanager.domain.project.dto;

import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.common.enums.ProjectStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class ProjectResponse {

    private final UUID id;
    private final UUID workspaceId;
    private final String workspaceName;
    private final String name;
    private final String key;
    private final String description;
    private final ProjectStatus status;
    private final ProjectRole currentUserRole;
    private final long memberCount;
    private final Instant createdAt;
}
