package com.taskmanager.domain.sprint.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.domain.sprint.dto.SprintResponse;
import com.taskmanager.domain.sprint.dto.UpdateSprintRequest;
import com.taskmanager.domain.sprint.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.SPRINTS)
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SprintResponse>> getSprintById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.getSprintById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SprintResponse>> updateSprint(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateSprintRequest request) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.updateSprint(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSprint(@PathVariable UUID id) {
        sprintService.deleteSprint(id);
        return ResponseEntity.ok(ApiResponse.success("Sprint deleted successfully"));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<SprintResponse>> startSprint(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.startSprint(id)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<SprintResponse>> completeSprint(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.completeSprint(id)));
    }

    @PostMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<Void>> addTaskToSprint(
            @PathVariable UUID id,
            @PathVariable UUID taskId) {
        sprintService.addTaskToSprint(id, taskId);
        return ResponseEntity.ok(ApiResponse.success("Task added to sprint"));
    }

    @DeleteMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<Void>> removeTaskFromSprint(
            @PathVariable UUID id,
            @PathVariable UUID taskId) {
        sprintService.removeTaskFromSprint(id, taskId);
        return ResponseEntity.ok(ApiResponse.success("Task removed from sprint"));
    }
}
