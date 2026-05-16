package com.taskmanager.domain.workspace.service;

import com.taskmanager.common.enums.WorkspaceRole;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.user.entity.User;
import com.taskmanager.domain.user.repository.UserRepository;
import com.taskmanager.domain.workspace.dto.*;
import com.taskmanager.domain.workspace.entity.Workspace;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import com.taskmanager.domain.workspace.mapper.WorkspaceMapper;
import com.taskmanager.domain.workspace.repository.WorkspaceMemberRepository;
import com.taskmanager.domain.workspace.repository.WorkspaceRepository;
import com.taskmanager.domain.workspace.specification.WorkspaceSpecification;
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
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final WorkspaceMapper workspaceMapper;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("name", "createdAt", "updatedAt");

    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        String slug = generateUniqueSlug(request.getName());

        Workspace workspace = new Workspace();
        workspace.setName(request.getName());
        workspace.setSlug(slug);
        workspace.setDescription(request.getDescription());
        workspace.setOwnerId(currentUserId);
        workspace = workspaceRepository.save(workspace);

        WorkspaceMember owner = new WorkspaceMember();
        owner.setWorkspace(workspace);
        owner.setUser(currentUser);
        owner.setRole(WorkspaceRole.OWNER);
        owner.setJoinedAt(Instant.now());
        workspaceMemberRepository.save(owner);

        log.info("Workspace created: {} (slug: {}) by user: {}", workspace.getId(), slug, currentUserId);
        return workspaceMapper.toResponse(workspace, WorkspaceRole.OWNER, 1L);
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkspaceSummaryResponse> getMyWorkspaces(WorkspaceFilterParams params) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        Specification<Workspace> spec = Specification
                .where(WorkspaceSpecification.memberOfUser(currentUserId))
                .and(WorkspaceSpecification.nameContains(params.getSearch()));

        Pageable pageable = buildPageable(params.getPage(), params.getSize(),
                params.getSortBy(), params.getSortDir());

        Page<Workspace> workspacePage = workspaceRepository.findAll(spec, pageable);
        List<UUID> ids = workspacePage.getContent().stream().map(Workspace::getId).toList();

        if (ids.isEmpty()) {
            return PageResponse.from(workspacePage.map(ws -> workspaceMapper.toSummaryResponse(ws, null, 0L)));
        }

        // Batch 1: current user's role in each workspace on this page (1 query)
        Map<UUID, WorkspaceRole> roleMap = workspaceMemberRepository
                .findByUserIdAndWorkspaceIdIn(currentUserId, ids)
                .stream()
                .collect(Collectors.toMap(
                        wm -> wm.getWorkspace().getId(),
                        WorkspaceMember::getRole
                ));

        // Batch 2: member counts for all workspaces on this page (1 query)
        Map<UUID, Long> countMap = workspaceMemberRepository
                .countMembersByWorkspaceIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        WorkspaceMemberRepository.MemberCountView::getWorkspaceId,
                        WorkspaceMemberRepository.MemberCountView::getMemberCount
                ));

        Page<WorkspaceSummaryResponse> responsePage = workspacePage.map(ws ->
                workspaceMapper.toSummaryResponse(
                        ws,
                        roleMap.get(ws.getId()),
                        countMap.getOrDefault(ws.getId(), 0L)
                ));

        return PageResponse.from(responsePage);
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceById(UUID workspaceId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Workspace workspace = findWorkspaceOrThrow(workspaceId);

        WorkspaceMember membership = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, currentUserId)
                .orElseThrow(ForbiddenException::new);

        long count = workspaceMemberRepository.countByWorkspaceId(workspaceId);
        return workspaceMapper.toResponse(workspace, membership.getRole(), count);
    }

    public WorkspaceResponse updateWorkspace(UUID workspaceId, UpdateWorkspaceRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Workspace workspace = findWorkspaceOrThrow(workspaceId);
        WorkspaceMember membership = requireWorkspaceMembership(workspaceId, currentUserId);

        if (!membership.getRole().isAtLeast(WorkspaceRole.ADMIN)) {
            throw new ForbiddenException("Only workspace ADMIN or OWNER can update workspace settings");
        }

        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        workspace = workspaceRepository.save(workspace);

        long count = workspaceMemberRepository.countByWorkspaceId(workspaceId);
        return workspaceMapper.toResponse(workspace, membership.getRole(), count);
    }

    public void deleteWorkspace(UUID workspaceId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Workspace workspace = findWorkspaceOrThrow(workspaceId);
        WorkspaceMember membership = requireWorkspaceMembership(workspaceId, currentUserId);

        if (membership.getRole() != WorkspaceRole.OWNER) {
            throw new ForbiddenException("Only workspace OWNER can delete the workspace");
        }

        workspaceRepository.delete(workspace);
        log.info("Workspace {} deleted by user: {}", workspaceId, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getMembers(UUID workspaceId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        findWorkspaceOrThrow(workspaceId);
        requireWorkspaceMembership(workspaceId, currentUserId);

        // JOIN FETCH user to avoid N+1 per member
        return workspaceMemberRepository.findByWorkspaceIdWithUser(workspaceId).stream()
                .map(workspaceMapper::toMemberResponse)
                .toList();
    }

    public WorkspaceMemberResponse addMember(UUID workspaceId, AddMemberRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Workspace workspace = findWorkspaceOrThrow(workspaceId);
        WorkspaceMember currentMembership = requireWorkspaceMembership(workspaceId, currentUserId);

        if (!currentMembership.getRole().isAtLeast(WorkspaceRole.ADMIN)) {
            throw new ForbiddenException("Only ADMIN or OWNER can add workspace members");
        }

        if (request.getRole() == WorkspaceRole.OWNER) {
            throw new ForbiddenException("Cannot assign OWNER role directly");
        }

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, request.getUserId())) {
            throw new ConflictException(ErrorCode.WORKSPACE_MEMBER_ALREADY_EXISTS);
        }

        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        WorkspaceMember member = new WorkspaceMember();
        member.setWorkspace(workspace);
        member.setUser(targetUser);
        member.setRole(request.getRole());
        member.setJoinedAt(Instant.now());
        member.setInvitedBy(currentUserId);
        workspaceMemberRepository.save(member);

        log.info("Member {} added to workspace {} with role {} by user: {}",
                request.getUserId(), workspaceId, request.getRole(), currentUserId);
        return workspaceMapper.toMemberResponse(member);
    }

    public WorkspaceMemberResponse updateMemberRole(UUID workspaceId, UUID targetUserId, UpdateMemberRoleRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        findWorkspaceOrThrow(workspaceId);
        WorkspaceMember currentMembership = requireWorkspaceMembership(workspaceId, currentUserId);

        if (currentMembership.getRole() != WorkspaceRole.OWNER) {
            throw new ForbiddenException("Only workspace OWNER can change member roles");
        }

        if (targetUserId.equals(currentUserId)) {
            throw new ForbiddenException("Cannot change your own role. Transfer ownership instead");
        }

        if (request.getRole() == WorkspaceRole.OWNER) {
            throw new ForbiddenException("Cannot assign OWNER role directly");
        }

        WorkspaceMember targetMembership = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORKSPACE_MEMBER_NOT_FOUND));

        targetMembership.setRole(request.getRole());
        workspaceMemberRepository.save(targetMembership);

        return workspaceMapper.toMemberResponse(targetMembership);
    }

    public void removeMember(UUID workspaceId, UUID targetUserId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        findWorkspaceOrThrow(workspaceId);
        WorkspaceMember currentMembership = requireWorkspaceMembership(workspaceId, currentUserId);

        if (!currentMembership.getRole().isAtLeast(WorkspaceRole.ADMIN)) {
            throw new ForbiddenException("Only ADMIN or OWNER can remove workspace members");
        }

        WorkspaceMember targetMembership = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORKSPACE_MEMBER_NOT_FOUND));

        if (targetMembership.getRole() == WorkspaceRole.OWNER) {
            throw new ConflictException(ErrorCode.CANNOT_REMOVE_OWNER);
        }

        workspaceMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, targetUserId);
        log.info("Member {} removed from workspace {} by user: {}", targetUserId, workspaceId, currentUserId);
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

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        String field = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = Sort.by("asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC, field);
        return PageRequest.of(page, size, sort);
    }

    private String generateUniqueSlug(String name) {
        String base = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        if (base.isEmpty()) {
            base = "workspace";
        }

        String slug = base;
        int attempt = 1;
        while (workspaceRepository.existsBySlug(slug)) {
            slug = base + "-" + attempt++;
        }
        return slug;
    }
}
