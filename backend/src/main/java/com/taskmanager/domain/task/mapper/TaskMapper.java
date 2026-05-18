package com.taskmanager.domain.task.mapper;

import com.taskmanager.domain.task.dto.TaskResponse;
import com.taskmanager.domain.task.dto.TaskSummaryResponse;
import com.taskmanager.domain.task.dto.UserSummary;
import com.taskmanager.domain.task.entity.Task;
import com.taskmanager.domain.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface TaskMapper {

    // ─── UserSummary conversion (auto-discovered by MapStruct for nested mapping) ─

    @Mapping(target = "name", source = "fullName")
    UserSummary toUserSummary(User user);

    // ─── Full task detail ────────────────────────────────────────────────────────
    // Task loaded via findByIdWithDetails (all @ManyToOne associations JOIN FETCHed).
    // assignee and reporter are auto-converted via toUserSummary(User).

    @Mapping(target = "projectId",  source = "project.id")
    @Mapping(target = "projectKey", source = "project.key")
    TaskResponse toResponse(Task task);

    // ─── Task list (multi-source) ────────────────────────────────────────────────
    // assignee is pre-fetched from a batch user map and may be null (unassigned task).
    // reporter is always non-null.
    // Scalar columns (assigneeId, reporterId, projectId) avoid lazy-loading associations.

    @Mapping(target = "id",              source = "task.id")
    @Mapping(target = "taskKey",         source = "task.taskKey")
    @Mapping(target = "title",           source = "task.title")
    @Mapping(target = "status",          source = "task.status")
    @Mapping(target = "priority",        source = "task.priority")
    @Mapping(target = "storyPoints",     source = "task.storyPoints")
    @Mapping(target = "dueDate",         source = "task.dueDate")
    @Mapping(target = "projectId",       source = "task.projectId")
    @Mapping(target = "sprintId",        source = "task.sprintId")
    @Mapping(target = "assigneeId",      source = "task.assigneeId")
    @Mapping(target = "assigneeName",    source = "assignee.fullName")
    @Mapping(target = "assigneeAvatarUrl", source = "assignee.avatarUrl")
    @Mapping(target = "reporterId",      source = "task.reporterId")
    @Mapping(target = "reporterName",    source = "reporter.fullName")
    @Mapping(target = "createdAt",       source = "task.createdAt")
    TaskSummaryResponse toSummaryResponse(Task task, User assignee, User reporter);
}
