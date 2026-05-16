package com.taskmanager.domain.project.dto;

import com.taskmanager.common.enums.ProjectRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.UUID;

@Getter
public class AddProjectMemberRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Role is required")
    private ProjectRole role;
}
