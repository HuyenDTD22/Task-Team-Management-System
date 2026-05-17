package com.taskmanager.domain.task.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.task.dto.CreateTaskRequest;
import com.taskmanager.domain.task.dto.TaskFilterParams;
import com.taskmanager.domain.task.dto.TaskResponse;
import com.taskmanager.domain.task.dto.TaskSummaryResponse;
import com.taskmanager.domain.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.PROJECTS + "/{projectId}/tasks")
@RequiredArgsConstructor
public class ProjectTaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable UUID projectId,
            @RequestBody @Valid CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Task created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TaskSummaryResponse>>> getProjectTasks(
            @PathVariable UUID projectId,
            @ModelAttribute @Valid TaskFilterParams params) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getProjectTasks(projectId, params)));
    }
}
