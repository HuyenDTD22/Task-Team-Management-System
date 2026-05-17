package com.taskmanager.domain.task.dto;

import com.taskmanager.common.enums.TaskPriority;
import com.taskmanager.common.enums.TaskStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class TaskResponse {

    private final UUID id;
    private final String taskKey;
    private final String title;
    private final String description;
    private final TaskStatus status;
    private final TaskPriority priority;
    private final Integer storyPoints;
    private final LocalDate dueDate;
    private final int position;

    private final UUID projectId;
    private final String projectKey;
    private final UUID sprintId;

    private final UserSummary assignee;
    private final UserSummary reporter;

    private final Instant createdAt;
    private final Instant updatedAt;
    private final UUID createdBy;
    private final UUID updatedBy;
}
