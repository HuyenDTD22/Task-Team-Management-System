package com.taskmanager.domain.workspace.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.project.dto.CreateProjectRequest;
import com.taskmanager.domain.project.dto.ProjectFilterParams;
import com.taskmanager.domain.project.dto.ProjectResponse;
import com.taskmanager.domain.project.dto.ProjectSummaryResponse;
import com.taskmanager.domain.project.service.ProjectService;
import com.taskmanager.domain.workspace.dto.*;
import com.taskmanager.domain.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.WORKSPACES)
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
            @RequestBody @Valid CreateWorkspaceRequest request) {
        WorkspaceResponse response = workspaceService.createWorkspace(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Workspace created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<WorkspaceSummaryResponse>>> getMyWorkspaces(
            @ModelAttribute @Valid WorkspaceFilterParams params) {
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getMyWorkspaces(params)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspace(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getWorkspaceById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateWorkspaceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(workspaceService.updateWorkspace(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(@PathVariable UUID id) {
        workspaceService.deleteWorkspace(id);
        return ResponseEntity.ok(ApiResponse.success("Workspace deleted successfully"));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>> getMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getMembers(id)));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> addMember(
            @PathVariable UUID id,
            @RequestBody @Valid AddMemberRequest request) {
        WorkspaceMemberResponse response = workspaceService.addMember(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Member added successfully"));
    }

    @PatchMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> updateMemberRole(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateMemberRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(workspaceService.updateMemberRole(id, userId, request)));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        workspaceService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully"));
    }

    // ─── Projects (workspace-scoped) ────────────────────────────────────────────

    @PostMapping("/{id}/projects")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @PathVariable UUID id,
            @RequestBody @Valid CreateProjectRequest request) {
        ProjectResponse response = projectService.createProject(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Project created successfully"));
    }

    @GetMapping("/{id}/projects")
    public ResponseEntity<ApiResponse<PageResponse<ProjectSummaryResponse>>> getWorkspaceProjects(
            @PathVariable UUID id,
            @ModelAttribute @Valid ProjectFilterParams params) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getWorkspaceProjects(id, params)));
    }
}
