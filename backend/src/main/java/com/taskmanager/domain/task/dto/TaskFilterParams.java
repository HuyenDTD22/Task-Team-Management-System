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

    /** true = only return tasks with sprintId = null (backlog). Ignored when false. */
    private boolean backlog = false;

    /** Zero-based page index. */
    @Min(0)
    private int page = 0;

    /** Allowed values: 5–100. Upper bound 100 supports board view fetching all column tasks. */
    @Min(5) @Max(100)
    private int size = 10;

    /** Sort field: title | status | priority | dueDate | createdAt | updatedAt. Defaults to createdAt. */
    private String sortBy = "createdAt";

    /** Sort direction: asc | desc. Defaults to desc. */
    private String sortDir = "desc";
}
