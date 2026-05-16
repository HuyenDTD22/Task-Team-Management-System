package com.taskmanager.domain.workspace.dto;

import com.taskmanager.common.enums.WorkspaceRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.UUID;

@Getter
public class AddMemberRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Role is required")
    private WorkspaceRole role;
}
