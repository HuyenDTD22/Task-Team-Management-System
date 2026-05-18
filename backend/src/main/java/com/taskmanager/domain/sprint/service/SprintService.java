package com.taskmanager.domain.sprint.service;

import com.taskmanager.common.enums.NotificationEntityType;
import com.taskmanager.common.enums.NotificationType;
import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.common.enums.SprintStatus;
import com.taskmanager.common.enums.WorkspaceRole;
import com.taskmanager.domain.notification.service.NotificationService;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.project.entity.Project;
import com.taskmanager.domain.project.entity.ProjectMember;
import com.taskmanager.domain.project.repository.ProjectMemberRepository;
import com.taskmanager.domain.project.repository.ProjectRepository;
import com.taskmanager.domain.sprint.dto.*;
import com.taskmanager.domain.sprint.entity.Sprint;
import com.taskmanager.domain.sprint.mapper.SprintMapper;
import com.taskmanager.domain.sprint.repository.SprintRepository;
import com.taskmanager.domain.sprint.specification.SprintSpecification;
import com.taskmanager.domain.task.entity.Task;
import com.taskmanager.domain.task.repository.TaskRepository;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import com.taskmanager.domain.workspace.repository.WorkspaceMemberRepository;
import com.taskmanager.exception.*;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final TaskRepository taskRepository;
    private final SprintMapper sprintMapper;
    private final NotificationService notificationService;

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("name", "startDate", "endDate", "createdAt");

    // ─── Create ──────────────────────────────────────────────────────────────────

    public SprintResponse createSprint(UUID projectId, CreateSprintRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        UUID workspaceId = project.getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);
        validateSprintDates(request.getStartDate(), request.getEndDate());

        Sprint sprint = new Sprint();
        sprint.setProject(project);
        sprint.setName(request.getName().trim());
        sprint.setGoal(request.getGoal());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());
        sprint = sprintRepository.save(sprint);

        log.info("Sprint created: {} in project {} by user: {}", sprint.getId(), projectId, currentUserId);
        return sprintMapper.toResponse(sprint);
    }

    // ─── List ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<SprintSummaryResponse> getProjectSprints(UUID projectId, SprintFilterParams params) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        requireProjectAccess(projectId, project.getWorkspace().getId(), currentUserId);

        Specification<Sprint> spec = Specification
                .where(SprintSpecification.hasProject(projectId))
                .and(SprintSpecification.hasStatus(params.getStatus()));

        Pageable pageable = buildPageable(params.getPage(), params.getSize(),
                params.getSortBy(), params.getSortDir());

        Page<SprintSummaryResponse> responsePage = sprintRepository
                .findAll(spec, pageable)
                .map(sprintMapper::toSummaryResponse);

        return PageResponse.from(responsePage);
    }

    // ─── Get one ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SprintResponse getSprintById(UUID sprintId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Sprint sprint = findSprintOrThrow(sprintId);
        requireProjectAccess(sprint.getProjectId(), sprint.getProject().getWorkspace().getId(), currentUserId);
        return sprintMapper.toResponse(sprint);
    }

    // ─── Update ──────────────────────────────────────────────────────────────────

    public SprintResponse updateSprint(UUID sprintId, UpdateSprintRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Sprint sprint = findSprintOrThrow(sprintId);
        UUID projectId = sprint.getProjectId();
        UUID workspaceId = sprint.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        if (sprint.getStatus() != SprintStatus.PLANNED) {
            throw new BusinessException(ErrorCode.SPRINT_NOT_PLANNED);
        }

        validateSprintDates(request.getStartDate(), request.getEndDate());

        // Always apply — null clears the field (intentional partial update)
        sprint.setName(request.getName().trim());
        sprint.setGoal(request.getGoal());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());

        sprint = sprintRepository.save(sprint);
        log.info("Sprint updated: {} by user: {}", sprintId, currentUserId);
        return sprintMapper.toResponse(sprint);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────────

    public void deleteSprint(UUID sprintId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Sprint sprint = findSprintOrThrow(sprintId);
        UUID projectId = sprint.getProjectId();
        UUID workspaceId = sprint.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        if (sprint.getStatus() != SprintStatus.PLANNED) {
            throw new BusinessException(ErrorCode.SPRINT_NOT_PLANNED);
        }

        // Move any tasks back to backlog before soft-deleting to avoid orphan sprintId references
        taskRepository.clearAllSprintTasks(sprintId);
        sprintRepository.delete(sprint);

        log.info("Sprint deleted: {} by user: {}", sprintId, currentUserId);
    }

    // ─── Start ───────────────────────────────────────────────────────────────────

    public SprintResponse startSprint(UUID sprintId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Sprint sprint = findSprintOrThrow(sprintId);
        UUID projectId = sprint.getProjectId();
        UUID workspaceId = sprint.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        if (sprint.getStatus() != SprintStatus.PLANNED) {
            throw new BusinessException(ErrorCode.SPRINT_NOT_PLANNED);
        }

        if (sprintRepository.existsByProjectIdAndStatus(projectId, SprintStatus.ACTIVE)) {
            throw new ConflictException(ErrorCode.SPRINT_ALREADY_ACTIVE);
        }

        sprint.setStatus(SprintStatus.ACTIVE);
        if (sprint.getStartDate() == null) {
            sprint.setStartDate(LocalDate.now());
        }

        sprint = sprintRepository.save(sprint);
        log.info("Sprint started: {} in project {} by user: {}", sprintId, projectId, currentUserId);

        notifyProjectMembers(projectId, NotificationType.SPRINT_STARTED,
                "Sprint started: " + sprint.getName(),
                "A new sprint has started in your project");

        return sprintMapper.toResponse(sprint);
    }

    // ─── Complete ────────────────────────────────────────────────────────────────

    public SprintResponse completeSprint(UUID sprintId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Sprint sprint = findSprintOrThrow(sprintId);
        UUID projectId = sprint.getProjectId();
        UUID workspaceId = sprint.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        if (sprint.getStatus() != SprintStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.SPRINT_NOT_ACTIVE);
        }

        // DONE tasks retain sprintId (historical record).
        // Incomplete tasks (TODO/IN_PROGRESS/IN_REVIEW) go back to backlog.
        taskRepository.clearSprintFromIncompleteTasks(sprintId);
        sprint.setStatus(SprintStatus.COMPLETED);

        sprint = sprintRepository.save(sprint);
        log.info("Sprint completed: {} in project {} by user: {}", sprintId, projectId, currentUserId);

        notifyProjectMembers(projectId, NotificationType.SPRINT_COMPLETED,
                "Sprint completed: " + sprint.getName(),
                "The sprint has been completed. Incomplete tasks moved to backlog");

        return sprintMapper.toResponse(sprint);
    }

    // ─── Task assignment ─────────────────────────────────────────────────────────

    public void addTaskToSprint(UUID sprintId, UUID taskId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Sprint sprint = findSprintOrThrow(sprintId);
        UUID projectId = sprint.getProjectId();
        UUID workspaceId = sprint.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        if (sprint.getStatus() == SprintStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Cannot add tasks to a COMPLETED sprint");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TASK_NOT_FOUND));

        if (!task.getProjectId().equals(projectId)) {
            throw new BusinessException(ErrorCode.TASK_NOT_IN_PROJECT);
        }

        task.setSprintId(sprintId);
        taskRepository.save(task);
    }

    public void removeTaskFromSprint(UUID sprintId, UUID taskId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Sprint sprint = findSprintOrThrow(sprintId);
        UUID projectId = sprint.getProjectId();
        UUID workspaceId = sprint.getProject().getWorkspace().getId();

        requireManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TASK_NOT_FOUND));

        if (!sprintId.equals(task.getSprintId())) {
            throw new BusinessException(ErrorCode.TASK_NOT_IN_PROJECT,
                    "Task does not belong to this sprint");
        }

        task.setSprintId(null);
        taskRepository.save(task);
    }

    // ─── RBAC helpers (mirrors TaskService pattern exactly) ──────────────────────

    private WorkspaceMember getWsMember(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId).orElse(null);
    }

    private ProjectMember getProjMember(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId).orElse(null);
    }

    private void requireProjectAccess(UUID projectId, UUID workspaceId, UUID userId) {
        WorkspaceMember wsMember  = getWsMember(workspaceId, userId);
        ProjectMember  projMember = getProjMember(projectId, userId);
        boolean isWsAdmin = wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN);
        if (!isWsAdmin && projMember == null) {
            throw new ForbiddenException();
        }
    }

    private void requireManagerOrWorkspaceAdmin(UUID projectId, UUID workspaceId, UUID userId) {
        WorkspaceMember wsMember = getWsMember(workspaceId, userId);
        if (wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN)) return;

        ProjectMember projMember = getProjMember(projectId, userId);
        if (projMember != null && projMember.getRole().isAtLeast(ProjectRole.MANAGER)) return;

        throw new ForbiddenException("Only project MANAGER or workspace ADMIN/OWNER can perform this action");
    }

    // ─── Load helpers ────────────────────────────────────────────────────────────

    private Sprint findSprintOrThrow(UUID sprintId) {
        return sprintRepository.findByIdWithProject(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SPRINT_NOT_FOUND));
    }

    private Project findProjectOrThrow(UUID projectId) {
        return projectRepository.findByIdWithWorkspace(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        String field = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = Sort.by("asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC, field);
        return PageRequest.of(page, size, sort);
    }

    // ─── Validation helpers ──────────────────────────────────────────────────────

    private void validateSprintDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "End date cannot be before start date");
        }
    }

    private void notifyProjectMembers(UUID projectId, NotificationType type, String title, String message) {
        try {
            List<ProjectMember> members = projectMemberRepository.findByProjectIdWithUser(projectId);
            for (ProjectMember member : members) {
                notificationService.createNotification(
                        member.getUser().getId(), type, title, message,
                        NotificationEntityType.PROJECT, projectId);
            }
        } catch (Exception ex) {
            log.warn("Failed to create {} notifications for project {}: {}", type, projectId, ex.getMessage());
        }
    }
}
