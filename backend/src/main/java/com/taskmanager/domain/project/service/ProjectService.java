package com.taskmanager.domain.project.service;

import com.taskmanager.common.enums.NotificationEntityType;
import com.taskmanager.common.enums.NotificationType;
import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.common.enums.ProjectStatus;
import com.taskmanager.common.enums.WorkspaceRole;
import com.taskmanager.domain.notification.service.NotificationService;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.project.dto.*;
import com.taskmanager.domain.project.entity.Project;
import com.taskmanager.domain.project.entity.ProjectMember;
import com.taskmanager.domain.project.mapper.ProjectMapper;
import com.taskmanager.domain.project.repository.ProjectMemberRepository;
import com.taskmanager.domain.project.repository.ProjectRepository;
import com.taskmanager.domain.project.specification.ProjectSpecification;
import com.taskmanager.domain.user.entity.User;
import com.taskmanager.domain.user.repository.UserRepository;
import com.taskmanager.domain.workspace.entity.Workspace;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import com.taskmanager.domain.workspace.repository.WorkspaceMemberRepository;
import com.taskmanager.domain.task.repository.TaskRepository;
import com.taskmanager.domain.workspace.repository.WorkspaceRepository;
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

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;
    private final NotificationService notificationService;
    private final TaskRepository taskRepository;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("name", "createdAt", "updatedAt");

    public ProjectResponse createProject(UUID workspaceId, CreateProjectRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Workspace workspace = findWorkspaceOrThrow(workspaceId);
        WorkspaceMember workspaceMembership = requireWorkspaceMembership(workspaceId, currentUserId);

        if (!workspaceMembership.getRole().isAtLeast(WorkspaceRole.ADMIN)) {
            throw new ForbiddenException("Only workspace ADMIN or OWNER can create projects");
        }

        if (projectRepository.existsByWorkspaceIdAndKey(workspaceId, request.getKey())) {
            throw new ConflictException(ErrorCode.PROJECT_KEY_ALREADY_EXISTS);
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        Project project = new Project();
        project.setWorkspace(workspace);
        project.setName(request.getName());
        project.setKey(request.getKey());
        project.setDescription(request.getDescription());
        project = projectRepository.save(project);

        ProjectMember manager = new ProjectMember();
        manager.setProject(project);
        manager.setUser(currentUser);
        manager.setRole(ProjectRole.MANAGER);
        manager.setJoinedAt(Instant.now());
        projectMemberRepository.save(manager);

        log.info("Project created: {} (key: {}) in workspace {} by user: {}",
                project.getId(), request.getKey(), workspaceId, currentUserId);
        return projectMapper.toResponse(project, workspace, ProjectRole.MANAGER, workspaceMembership.getRole(), 1L);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectSummaryResponse> getWorkspaceProjects(UUID workspaceId, ProjectFilterParams params) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        findWorkspaceOrThrow(workspaceId);
        WorkspaceMember wsMembership = requireWorkspaceMembership(workspaceId, currentUserId);
        boolean isAdmin = wsMembership.getRole().isAtLeast(WorkspaceRole.ADMIN);

        Specification<Project> spec = Specification
                .where(ProjectSpecification.inWorkspace(workspaceId))
                .and(ProjectSpecification.nameContains(params.getSearch()))
                .and(ProjectSpecification.hasStatus(params.getStatus()));

        if (!isAdmin) {
            spec = spec.and(ProjectSpecification.memberOfUser(currentUserId));
        }

        Pageable pageable = buildPageable(params.getPage(), params.getSize(),
                params.getSortBy(), params.getSortDir());

        Page<Project> projectPage = projectRepository.findAll(spec, pageable);
        List<UUID> ids = projectPage.getContent().stream().map(Project::getId).toList();

        if (ids.isEmpty()) {
            return PageResponse.from(projectPage.map(p -> projectMapper.toSummaryResponse(p, null, 0L)));
        }

        // Batch 1: current user's role in each project on this page (1 query)
        Map<UUID, ProjectRole> roleMap = projectMemberRepository
                .findByUserIdAndProjectIdIn(currentUserId, ids)
                .stream()
                .collect(Collectors.toMap(
                        pm -> pm.getProject().getId(),
                        ProjectMember::getRole
                ));

        // Batch 2: member counts for all projects on this page (1 query)
        Map<UUID, Long> countMap = projectMemberRepository
                .countMembersByProjectIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        ProjectMemberRepository.MemberCountView::getProjectId,
                        ProjectMemberRepository.MemberCountView::getMemberCount
                ));

        Page<ProjectSummaryResponse> responsePage = projectPage.map(p ->
                projectMapper.toSummaryResponse(
                        p,
                        roleMap.get(p.getId()),
                        countMap.getOrDefault(p.getId(), 0L)
                ));

        return PageResponse.from(responsePage);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UUID projectId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        // JOIN FETCH workspace to avoid separate lazy-load query
        Project project = findProjectOrThrow(projectId);
        Workspace workspace = project.getWorkspace();

        Optional<ProjectMember> projectMembership = projectMemberRepository
                .findByProjectIdAndUserId(projectId, currentUserId);
        WorkspaceMember workspaceMembership = requireWorkspaceMembership(workspace.getId(), currentUserId);

        boolean isProjectMember  = projectMembership.isPresent();
        boolean isWorkspaceAdmin = workspaceMembership.getRole().isAtLeast(WorkspaceRole.ADMIN);

        if (!isProjectMember && !isWorkspaceAdmin) {
            throw new ForbiddenException();
        }

        ProjectRole effectiveRole = projectMembership.map(ProjectMember::getRole).orElse(null);
        WorkspaceRole currentWorkspaceRole = workspaceMembership.getRole();
        long count = projectMemberRepository.countByProjectId(projectId);
        return projectMapper.toResponse(project, workspace, effectiveRole, currentWorkspaceRole, count);
    }

    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        WorkspaceRole currentWorkspaceRole = requireProjectManagerOrWorkspaceAdmin(projectId, project.getWorkspace().getId(), currentUserId);

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project = projectRepository.save(project);

        Optional<ProjectMember> membership = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId);
        long count = projectMemberRepository.countByProjectId(projectId);
        return projectMapper.toResponse(project, project.getWorkspace(),
                membership.map(ProjectMember::getRole).orElse(null), currentWorkspaceRole, count);
    }

    public ProjectResponse archiveProject(UUID projectId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        WorkspaceRole currentWorkspaceRole = requireProjectManagerOrWorkspaceAdmin(projectId, project.getWorkspace().getId(), currentUserId);

        project.setStatus(ProjectStatus.ARCHIVED);
        project = projectRepository.save(project);

        log.info("Project {} archived by user: {}", projectId, currentUserId);
        Optional<ProjectMember> membership = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId);
        long count = projectMemberRepository.countByProjectId(projectId);
        return projectMapper.toResponse(project, project.getWorkspace(),
                membership.map(ProjectMember::getRole).orElse(null), currentWorkspaceRole, count);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(UUID projectId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        requireWorkspaceMembership(project.getWorkspace().getId(), currentUserId);

        // JOIN FETCH user to avoid N+1 per member
        return projectMemberRepository.findByProjectIdWithUser(projectId).stream()
                .map(projectMapper::toMemberResponse)
                .toList();
    }

    public ProjectMemberResponse addProjectMember(UUID projectId, AddProjectMemberRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        UUID workspaceId = project.getWorkspace().getId();
        requireProjectManagerOrWorkspaceAdmin(projectId, workspaceId, currentUserId);

        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, request.getUserId())) {
            throw new BusinessException(ErrorCode.USER_NOT_WORKSPACE_MEMBER);
        }

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, request.getUserId())) {
            throw new ConflictException(ErrorCode.PROJECT_MEMBER_ALREADY_EXISTS);
        }

        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(targetUser);
        member.setRole(request.getRole());
        member.setJoinedAt(Instant.now());
        projectMemberRepository.save(member);

        // Notify the added user
        try {
            notificationService.createNotification(
                    request.getUserId(),
                    NotificationType.PROJECT_MEMBER_ADDED,
                    "You have been added to a project",
                    "You are now a " + request.getRole().name() + " in project: " + project.getName(),
                    NotificationEntityType.PROJECT,
                    projectId);
        } catch (Exception ex) {
            log.warn("Failed to create PROJECT_MEMBER_ADDED notification for user {} in project {}: {}",
                    request.getUserId(), projectId, ex.getMessage());
        }

        log.info("Member {} added to project {} by user: {}", request.getUserId(), projectId, currentUserId);
        return projectMapper.toMemberResponse(member);
    }

    public void removeProjectMember(UUID projectId, UUID targetUserId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = findProjectOrThrow(projectId);
        requireProjectManagerOrWorkspaceAdmin(projectId, project.getWorkspace().getId(), currentUserId);

        ProjectMember targetMembership = projectMemberRepository
                .findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PROJECT_MEMBER_NOT_FOUND));

        // Dedicated count query instead of loading all members to filter in Java
        if (targetMembership.getRole() == ProjectRole.MANAGER
                && projectMemberRepository.countByProjectIdAndRole(projectId, ProjectRole.MANAGER) <= 1) {
            throw new ForbiddenException("Cannot remove the last MANAGER from a project");
        }

        taskRepository.unassignUserFromProjectTasks(targetUserId, projectId);
        projectMemberRepository.deleteByProjectIdAndUserId(projectId, targetUserId);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Workspace findWorkspaceOrThrow(UUID workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORKSPACE_NOT_FOUND));
    }

    private WorkspaceMember requireWorkspaceMembership(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(ForbiddenException::new);
    }

    private Project findProjectOrThrow(UUID projectId) {
        // JOIN FETCH workspace to avoid a separate lazy-load query on project.getWorkspace()
        return projectRepository.findByIdWithWorkspace(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private WorkspaceRole requireProjectManagerOrWorkspaceAdmin(UUID projectId, UUID workspaceId, UUID userId) {
        WorkspaceMember workspaceMembership = requireWorkspaceMembership(workspaceId, userId);
        if (workspaceMembership.getRole().isAtLeast(WorkspaceRole.ADMIN)) {
            return workspaceMembership.getRole();
        }

        ProjectMember projectMembership = projectMemberRepository
                .findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(ForbiddenException::new);

        if (projectMembership.getRole() != ProjectRole.MANAGER) {
            throw new ForbiddenException("Only project MANAGER or workspace ADMIN/OWNER can perform this action");
        }
        return workspaceMembership.getRole();
    }

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        String field = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = Sort.by("asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC, field);
        return PageRequest.of(page, size, sort);
    }
}
