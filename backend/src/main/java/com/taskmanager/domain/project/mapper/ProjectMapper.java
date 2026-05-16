package com.taskmanager.domain.project.mapper;

import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.domain.project.dto.ProjectMemberResponse;
import com.taskmanager.domain.project.dto.ProjectResponse;
import com.taskmanager.domain.project.dto.ProjectSummaryResponse;
import com.taskmanager.domain.project.entity.Project;
import com.taskmanager.domain.project.entity.ProjectMember;
import com.taskmanager.domain.workspace.entity.Workspace;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ProjectMapper {

    // ─── Member response ────────────────────────────────────────────────────────

    @Mapping(target = "userId",    source = "user.id")
    @Mapping(target = "fullName",  source = "user.fullName")
    @Mapping(target = "email",     source = "user.email")
    @Mapping(target = "avatarUrl", source = "user.avatarUrl")
    @Mapping(target = "role",      source = "role")
    @Mapping(target = "joinedAt",  source = "joinedAt")
    ProjectMemberResponse toMemberResponse(ProjectMember member);

    // ─── Project responses (multi-source: entity + computed fields) ─────────────
    // Explicit @Mapping required where Project and Workspace share field names
    // (id, name, description, createdAt) to resolve ambiguity.

    @Mapping(target = "id",            source = "project.id")
    @Mapping(target = "name",          source = "project.name")
    @Mapping(target = "description",   source = "project.description")
    @Mapping(target = "createdAt",     source = "project.createdAt")
    @Mapping(target = "workspaceId",   source = "workspace.id")
    @Mapping(target = "workspaceName", source = "workspace.name")
    ProjectResponse toResponse(Project project, Workspace workspace, ProjectRole currentUserRole, long memberCount);

    @Mapping(target = "id",     source = "project.id")
    @Mapping(target = "name",   source = "project.name")
    @Mapping(target = "key",    source = "project.key")
    @Mapping(target = "status", source = "project.status")
    ProjectSummaryResponse toSummaryResponse(Project project, ProjectRole currentUserRole, long memberCount);
}
