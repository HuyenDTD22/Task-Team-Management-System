package com.taskmanager.domain.task.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class AssignTaskRequest {

    /** null = unassign the task; otherwise must be a project member UUID. */
    private UUID assigneeId;
}
