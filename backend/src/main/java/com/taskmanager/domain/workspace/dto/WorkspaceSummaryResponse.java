package com.taskmanager.domain.workspace.dto;

import com.taskmanager.common.enums.WorkspaceRole;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class WorkspaceSummaryResponse {

    private final UUID id;
    private final String name;
    private final String slug;
    private final WorkspaceRole currentUserRole;
    private final long memberCount;
}
