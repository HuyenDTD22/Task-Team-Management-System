package com.taskmanager.domain.task.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.task.dto.*;
import com.taskmanager.domain.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.TASKS)
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<MyTaskSummaryResponse>>> getMyTasks(
            @ModelAttribute @Valid TaskFilterParams params) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks(params)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.updateTask(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> changeTaskStatus(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateTaskStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.changeTaskStatus(id, request)));
    }

    @PatchMapping("/{id}/assignee")
    public ResponseEntity<ApiResponse<TaskResponse>> assignTask(
            @PathVariable UUID id,
            @RequestBody @Valid AssignTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.assignTask(id, request)));
    }
}
