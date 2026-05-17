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
public class UpdateTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Task title must not exceed 255 characters")
    private String title;

    /** Null clears the description (PUT semantics). */
    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    /** Null unassigns the task (PUT semantics). */
    private UUID assigneeId;

    /** Null clears story points. */
    private Integer storyPoints;

    /** Null clears the due date. */
    private LocalDate dueDate;
}
