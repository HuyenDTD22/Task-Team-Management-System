package com.taskmanager.domain.project.dto;

import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.common.enums.ProjectStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class ProjectSummaryResponse {

    private final UUID id;
    private final String name;
    private final String key;
    private final ProjectStatus status;
    private final ProjectRole currentUserRole;
    private final long memberCount;
}
