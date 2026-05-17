package com.taskmanager.domain.task.dto;

import com.taskmanager.common.enums.TaskPriority;
import com.taskmanager.common.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Task title must not exceed 255 characters")
    private String title;

    private String description;

    /** Defaults to TODO if not provided. */
    private TaskStatus status;

    /** Defaults to MEDIUM if not provided. */
    private TaskPriority priority;

    /** Optional; assignee must be a project member. */
    private UUID assigneeId;

    private Integer storyPoints;

    private LocalDate dueDate;
}
