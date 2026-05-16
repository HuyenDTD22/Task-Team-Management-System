package com.taskmanager.domain.workspace.mapper;

import com.taskmanager.common.enums.WorkspaceRole;
import com.taskmanager.domain.workspace.dto.WorkspaceMemberResponse;
import com.taskmanager.domain.workspace.dto.WorkspaceResponse;
import com.taskmanager.domain.workspace.dto.WorkspaceSummaryResponse;
import com.taskmanager.domain.workspace.entity.Workspace;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface WorkspaceMapper {

    // ─── Member response ────────────────────────────────────────────────────────

    @Mapping(target = "userId",    source = "user.id")
    @Mapping(target = "fullName",  source = "user.fullName")
    @Mapping(target = "email",     source = "user.email")
    @Mapping(target = "avatarUrl", source = "user.avatarUrl")
    @Mapping(target = "role",      source = "role")
    @Mapping(target = "joinedAt",  source = "joinedAt")
    WorkspaceMemberResponse toMemberResponse(WorkspaceMember member);

    // ─── Workspace responses (multi-source: entity + computed fields) ───────────

    WorkspaceResponse toResponse(Workspace workspace, WorkspaceRole currentUserRole, long memberCount);

    WorkspaceSummaryResponse toSummaryResponse(Workspace workspace, WorkspaceRole currentUserRole, long memberCount);
}
