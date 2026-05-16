package com.taskmanager.domain.workspace.dto;

import com.taskmanager.common.enums.WorkspaceRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class UpdateMemberRoleRequest {

    @NotNull(message = "Role is required")
    private WorkspaceRole role;
}
