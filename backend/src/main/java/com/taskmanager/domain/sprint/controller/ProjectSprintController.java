package com.taskmanager.domain.sprint.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.sprint.dto.CreateSprintRequest;
import com.taskmanager.domain.sprint.dto.SprintFilterParams;
import com.taskmanager.domain.sprint.dto.SprintResponse;
import com.taskmanager.domain.sprint.dto.SprintSummaryResponse;
import com.taskmanager.domain.sprint.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.PROJECTS + "/{projectId}/sprints")
@RequiredArgsConstructor
public class ProjectSprintController {

    private final SprintService sprintService;

    @PostMapping
    public ResponseEntity<ApiResponse<SprintResponse>> createSprint(
            @PathVariable UUID projectId,
            @RequestBody @Valid CreateSprintRequest request) {
        SprintResponse response = sprintService.createSprint(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sprint created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SprintSummaryResponse>>> getProjectSprints(
            @PathVariable UUID projectId,
            @ModelAttribute @Valid SprintFilterParams params) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.getProjectSprints(projectId, params)));
    }
}
