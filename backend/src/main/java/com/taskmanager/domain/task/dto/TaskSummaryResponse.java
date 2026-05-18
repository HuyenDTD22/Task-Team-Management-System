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
public class TaskSummaryResponse {

    private final UUID id;
    private final String taskKey;
    private final String title;
    private final TaskStatus status;
    private final TaskPriority priority;
    private final Integer storyPoints;
    private final LocalDate dueDate;

    private final UUID projectId;
    private final UUID sprintId;

    private final UUID assigneeId;
    private final String assigneeName;
    private final String assigneeAvatarUrl;

    private final UUID reporterId;
    private final String reporterName;

    private final Instant createdAt;
}
