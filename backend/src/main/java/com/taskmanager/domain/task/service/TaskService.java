package com.taskmanager.domain.task.service;

import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.common.enums.WorkspaceRole;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.project.entity.Project;
import com.taskmanager.domain.project.entity.ProjectMember;
import com.taskmanager.domain.project.repository.ProjectMemberRepository;
import com.taskmanager.domain.project.repository.ProjectRepository;
import com.taskmanager.domain.task.dto.*;
import com.taskmanager.domain.task.entity.Task;
import com.taskmanager.domain.task.mapper.TaskMapper;
import com.taskmanager.domain.task.repository.TaskRepository;
import com.taskmanager.domain.task.specification.TaskSpecification;
import com.taskmanager.domain.user.entity.User;
import com.taskmanager.domain.user.repository.UserRepository;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import com.taskmanager.domain.workspace.repository.WorkspaceMemberRepository;
import com.taskmanager.exception.ErrorCode;
import com.taskmanager.exception.ForbiddenException;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("title", "status", "priority", "dueDate", "createdAt", "updatedAt");

    // ─── Create ──────────────────────────────────────────────────────────────────

    public TaskResponse createTask(UUID projectId, CreateTaskRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        UUID workspaceId = project.getWorkspace().getId();

        WorkspaceMember wsMember = getWsMember(workspaceId, currentUserId);
        ProjectMember projMember = getProjMember(projectId, currentUserId);

        boolean isWsAdmin   = wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN);
        boolean isDeveloper = projMember != null && projMember.getRole().isAtLeast(ProjectRole.DEVELOPER);

        if (!isWsAdmin && !isDeveloper) {
            throw new ForbiddenException("Only project members (DEVELOPER+) or workspace admins can create tasks");
        }

        if (request.getAssigneeId() != null
                && !projectMemberRepository.existsByProjectIdAndUserId(projectId, request.getAssigneeId())) {
            throw new ForbiddenException("Assignee must be a member of this project");
        }

        // Atomically increment and read the task counter within this transaction
        projectRepository.incrementTaskCounter(projectId);
        int counter = projectRepository.getTaskCounter(projectId);

        User reporter = userRepository.getReferenceById(currentUserId);
        User assignee = request.getAssigneeId() != null
                ? userRepository.getReferenceById(request.getAssigneeId())
                : null;

        Task task = new Task();
        task.setProject(project);
        task.setReporter(reporter);
        task.setAssignee(assignee);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setTaskKey(project.getKey() + "-" + counter);
        task.setStatus(request.getStatus() != null ? request.getStatus() : task.getStatus());
        task.setPriority(request.getPriority() != null ? request.getPriority() : task.getPriority());
        task.setStoryPoints(request.getStoryPoints());
        task.setDueDate(request.getDueDate());
        task = taskRepository.save(task);

        log.info("Task created: {} ({}) in project {} by user: {}",
                task.getId(), task.getTaskKey(), projectId, currentUserId);
        return buildTaskResponse(task);
    }

    // ─── List ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<TaskSummaryResponse> getProjectTasks(UUID projectId, TaskFilterParams params) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        requireProjectAccess(projectId, project.getWorkspace().getId(), currentUserId);

        Specification<Task> spec = Specification
                .where(TaskSpecification.hasProject(projectId))
                .and(TaskSpecification.hasStatus(params.getStatus()))
                .and(TaskSpecification.hasPriority(params.getPriority()))
                .and(TaskSpecification.hasAssignee(params.getAssigneeId()))
                .and(params.isBacklog()
                        ? TaskSpecification.isInBacklog()
                        : TaskSpecification.hasSprintId(params.getSprintId()))
                .and(TaskSpecification.titleContains(params.getSearch()));

        Pageable pageable = buildPageable(params.getPage(), params.getSize(),
                params.getSortBy(), params.getSortDir());

        Page<Task> taskPage = taskRepository.findAll(spec, pageable);

        // N+1 prevention: collect scalar IDs (no lazy loading) then batch-fetch users
        Set<UUID> assigneeIds = taskPage.getContent().stream()
                .map(Task::getAssigneeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<UUID> reporterIds = taskPage.getContent().stream()
                .map(Task::getReporterId)
                .collect(Collectors.toSet());

        Set<UUID> allUserIds = Stream.concat(assigneeIds.stream(), reporterIds.stream())
                .collect(Collectors.toSet());

        Map<UUID, User> userMap = userRepository.findAllById(allUserIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Page<TaskSummaryResponse> responsePage = taskPage.map(t ->
                taskMapper.toSummaryResponse(
                        t,
                        userMap.get(t.getAssigneeId()),
                        userMap.get(t.getReporterId())
                ));

        return PageResponse.from(responsePage);
    }

    // ─── My Tasks ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<MyTaskSummaryResponse> getMyTasks(TaskFilterParams params) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        Specification<Task> spec = Specification
                .where(TaskSpecification.hasAssignee(currentUserId))
                .and(TaskSpecification.isAccessibleByUser(currentUserId))
                .and(TaskSpecification.hasStatus(params.getStatus()))
                .and(TaskSpecification.hasPriority(params.getPriority()))
                .and(TaskSpecification.titleContains(params.getSearch()));

        Pageable pageable = buildPageable(params.getPage(), params.getSize(),
                params.getSortBy(), params.getSortDir());

        Page<Task> taskPage = taskRepository.findAll(spec, pageable);

        Set<UUID> assigneeIds = taskPage.getContent().stream()
                .map(Task::getAssigneeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<UUID> reporterIds = taskPage.getContent().stream()
                .map(Task::getReporterId)
                .collect(Collectors.toSet());

        Set<UUID> allUserIds = Stream.concat(assigneeIds.stream(), reporterIds.stream())
                .collect(Collectors.toSet());

        Map<UUID, User> userMap = userRepository.findAllById(allUserIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Set<UUID> projectIds = taskPage.getContent().stream()
                .map(Task::getProjectId)
                .collect(Collectors.toSet());

        Map<UUID, String> projectNameMap = projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, Project::getName));

        Page<MyTaskSummaryResponse> responsePage = taskPage.map(t -> {
            User assignee = userMap.get(t.getAssigneeId());
            User reporter = userMap.get(t.getReporterId());
            return MyTaskSummaryResponse.builder()
                    .id(t.getId())
                    .taskKey(t.getTaskKey())
                    .title(t.getTitle())
                    .status(t.getStatus())
                    .priority(t.getPriority())
                    .storyPoints(t.getStoryPoints())
                    .dueDate(t.getDueDate())
                    .projectId(t.getProjectId())
                    .projectName(projectNameMap.getOrDefault(t.getProjectId(), "Unknown"))
                    .sprintId(t.getSprintId())
                    .assigneeId(t.getAssigneeId())
                    .assigneeName(assignee != null ? assignee.getFullName() : null)
                    .assigneeAvatarUrl(assignee != null ? assignee.getAvatarUrl() : null)
                    .reporterId(t.getReporterId())
                    .reporterName(reporter != null ? reporter.getFullName() : null)
                    .createdAt(t.getCreatedAt())
                    .build();
        });

        return PageResponse.from(responsePage);
    }

    // ─── Get one ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID taskId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = findTaskWithDetailsOrThrow(taskId);
        requireProjectAccess(task.getProject().getId(), task.getProject().getWorkspace().getId(), currentUserId);
        return taskMapper.toResponse(task);
    }

    // ─── Update ──────────────────────────────────────────────────────────────────

    public TaskResponse updateTask(UUID taskId, UpdateTaskRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = findTaskWithDetailsOrThrow(taskId);
        UUID projectId   = task.getProject().getId();
        UUID workspaceId = task.getProject().getWorkspace().getId();

        WorkspaceMember wsMember  = getWsMember(workspaceId, currentUserId);
        ProjectMember   projMember = getProjMember(projectId, currentUserId);

        boolean isWsAdmin  = wsMember  != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN);
        boolean isManager  = projMember != null && projMember.getRole().isAtLeast(ProjectRole.MANAGER);
        boolean isAssignee = currentUserId.equals(task.getAssigneeId());

        if (!isWsAdmin && !isManager && !isAssignee) {
            throw new ForbiddenException("Insufficient permissions to update this task");
        }

        boolean canEditPlanningFields = isWsAdmin || isManager;

        if (!canEditPlanningFields) {
            // Assignee-only path: block changes to planning fields (backend safety net)
            if (!Objects.equals(request.getTitle(), task.getTitle())) {
                throw new ForbiddenException("Only MANAGER or workspace ADMIN can edit the task title");
            }
            if (request.getPriority() != null && request.getPriority() != task.getPriority()) {
                throw new ForbiddenException("Only MANAGER or workspace ADMIN can edit task priority");
            }
            if (!Objects.equals(request.getDueDate(), task.getDueDate())) {
                throw new ForbiddenException("Only MANAGER or workspace ADMIN can edit the due date");
            }
            if (!Objects.equals(request.getStoryPoints(), task.getStoryPoints())) {
                throw new ForbiddenException("Only MANAGER or workspace ADMIN can edit story points");
            }
        }

        if (canEditPlanningFields) {
            if (request.getAssigneeId() != null
                    && !projectMemberRepository.existsByProjectIdAndUserId(projectId, request.getAssigneeId())) {
                throw new ForbiddenException("Assignee must be a member of this project");
            }
            task.setTitle(request.getTitle());
            if (request.getPriority() != null) task.setPriority(request.getPriority());
            task.setStoryPoints(request.getStoryPoints());
            task.setDueDate(request.getDueDate());
            User newAssignee = request.getAssigneeId() != null
                    ? userRepository.getReferenceById(request.getAssigneeId())
                    : null;
            task.setAssignee(newAssignee);
        }

        // Description is settable by both MANAGER and assignee
        task.setDescription(request.getDescription());

        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────────

    public void deleteTask(UUID taskId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = findTaskWithDetailsOrThrow(taskId);
        requireManagerOrWorkspaceAdmin(task.getProject().getId(), task.getProject().getWorkspace().getId(), currentUserId);
        taskRepository.delete(task);
        log.info("Task {} deleted by user: {}", taskId, currentUserId);
    }

    // ─── Change status ───────────────────────────────────────────────────────────

    public TaskResponse changeTaskStatus(UUID taskId, UpdateTaskStatusRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = findTaskWithDetailsOrThrow(taskId);
        UUID projectId   = task.getProject().getId();
        UUID workspaceId = task.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdminOrAssignee(projectId, workspaceId, currentUserId, task.getAssigneeId());

        task.setStatus(request.getStatus());
        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    // ─── Assign ──────────────────────────────────────────────────────────────────

    public TaskResponse assignTask(UUID taskId, AssignTaskRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = findTaskWithDetailsOrThrow(taskId);
        UUID projectId   = task.getProject().getId();
        UUID workspaceId = task.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        if (request.getAssigneeId() != null
                && !projectMemberRepository.existsByProjectIdAndUserId(projectId, request.getAssigneeId())) {
            throw new ForbiddenException("Assignee must be a member of this project");
        }

        User newAssignee = request.getAssigneeId() != null
                ? userRepository.getReferenceById(request.getAssigneeId())
                : null;
        task.setAssignee(newAssignee);
        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    // ─── RBAC helpers ────────────────────────────────────────────────────────────

    private WorkspaceMember getWsMember(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId).orElse(null);
    }

    private ProjectMember getProjMember(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId).orElse(null);
    }

    private void requireProjectAccess(UUID projectId, UUID workspaceId, UUID userId) {
        WorkspaceMember wsMember   = getWsMember(workspaceId, userId);
        ProjectMember  projMember  = getProjMember(projectId, userId);
        boolean isWsAdmin = wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN);
        if (!isWsAdmin && projMember == null) {
            throw new ForbiddenException();
        }
    }

    private void requireManagerOrWorkspaceAdmin(UUID projectId, UUID workspaceId, UUID userId) {
        WorkspaceMember wsMember  = getWsMember(workspaceId, userId);
        if (wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN)) return;

        ProjectMember projMember = getProjMember(projectId, userId);
        if (projMember != null && projMember.getRole().isAtLeast(ProjectRole.MANAGER)) return;

        throw new ForbiddenException("Only project MANAGER or workspace ADMIN/OWNER can perform this action");
    }

    private void requireManagerOrWorkspaceAdminOrAssignee(UUID projectId, UUID workspaceId,
                                                          UUID userId, UUID assigneeId) {
        WorkspaceMember wsMember = getWsMember(workspaceId, userId);
        if (wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN)) return;

        ProjectMember projMember = getProjMember(projectId, userId);
        if (projMember != null && projMember.getRole().isAtLeast(ProjectRole.MANAGER)) return;

        if (userId.equals(assigneeId)) return;

        throw new ForbiddenException("Only project MANAGER, workspace ADMIN/OWNER, or the assignee can perform this action");
    }

    // ─── Load helpers ────────────────────────────────────────────────────────────

    private Project findProjectOrThrow(UUID projectId) {
        return projectRepository.findByIdWithWorkspace(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private Task findTaskWithDetailsOrThrow(UUID taskId) {
        return taskRepository.findByIdWithDetails(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TASK_NOT_FOUND));
    }

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        String field = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort.Order order = "asc".equalsIgnoreCase(sortDir)
                ? Sort.Order.asc(field).nullsLast()
                : Sort.Order.desc(field).nullsLast();
        return PageRequest.of(page, size, Sort.by(order));
    }

    // Builds TaskResponse from a task already loaded with all associations in memory.
    // Avoids an extra DB query after save/update operations.
    private TaskResponse buildTaskResponse(Task task) {
        return taskMapper.toResponse(task);
    }
}
