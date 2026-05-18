package com.taskmanager.domain.task.dto;

import com.taskmanager.common.enums.TaskPriority;
import com.taskmanager.common.enums.TaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class TaskFilterParams {

    private String search;

    /** null = all statuses; TODO | IN_PROGRESS | IN_REVIEW | DONE = filter by status. */
    private TaskStatus status;

    /** null = all priorities; LOW | MEDIUM | HIGH | CRITICAL = filter by priority. */
    private TaskPriority priority;

    /** null = all assignees; provide a UUID to filter by specific assignee. */
    private UUID assigneeId;

    /** null = all sprints; provide a UUID to filter tasks in a specific sprint. */
    private UUID sprintId;

    /** Zero-based page index. */
    @Min(0)
    private int page = 0;

    /** Allowed values: 5–20. */
    @Min(5) @Max(20)
    private int size = 10;

    /** Sort field: title | status | priority | dueDate | createdAt | updatedAt. Defaults to createdAt. */
    private String sortBy = "createdAt";

    /** Sort direction: asc | desc. Defaults to desc. */
    private String sortDir = "desc";
}
