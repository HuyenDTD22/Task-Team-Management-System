package com.taskmanager.domain.task.dto;

import com.taskmanager.common.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTaskStatusRequest {

    @NotNull(message = "Status is required")
    private TaskStatus status;
}
