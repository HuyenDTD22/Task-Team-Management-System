package com.taskmanager.domain.project.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.domain.project.dto.*;
import com.taskmanager.domain.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.PROJECTS)
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(projectService.updateProject(id, request)));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ProjectResponse>> archiveProject(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.archiveProject(id)));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getProjectMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectMembers(id)));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> addProjectMember(
            @PathVariable UUID id,
            @RequestBody @Valid AddProjectMemberRequest request) {
        ProjectMemberResponse response = projectService.addProjectMember(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Member added successfully"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeProjectMember(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        projectService.removeProjectMember(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully"));
    }
}
