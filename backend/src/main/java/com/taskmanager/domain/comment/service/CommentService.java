package com.taskmanager.domain.comment.service;

import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.common.enums.WorkspaceRole;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.comment.dto.*;
import com.taskmanager.domain.comment.entity.Comment;
import com.taskmanager.domain.comment.mapper.CommentMapper;
import com.taskmanager.domain.comment.repository.CommentRepository;
import com.taskmanager.domain.comment.specification.CommentSpecification;
import com.taskmanager.domain.project.repository.ProjectMemberRepository;
import com.taskmanager.domain.task.entity.Task;
import com.taskmanager.domain.task.repository.TaskRepository;
import com.taskmanager.domain.user.entity.User;
import com.taskmanager.domain.user.repository.UserRepository;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import com.taskmanager.domain.workspace.repository.WorkspaceMemberRepository;
import com.taskmanager.exception.BusinessException;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    // ─── Add comment ─────────────────────────────────────────────────────────────

    public CommentResponse addComment(UUID taskId, CreateCommentRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = findTaskOrThrow(taskId);
        requireDeveloperOrWorkspaceAdmin(task.getProject().getId(), task.getProject().getWorkspace().getId(), currentUserId);

        User author = userRepository.getReferenceById(currentUserId);

        Comment comment = new Comment();
        comment.setTask(task);
        comment.setUser(author);
        comment.setContent(request.getContent());

        if (request.getParentId() != null) {
            Comment parent = findCommentOrThrow(request.getParentId());
            if (!parent.getTaskId().equals(taskId)) {
                throw new BusinessException(ErrorCode.INVALID_COMMENT_PARENT);
            }
            if (parent.getParentId() != null) {
                throw new BusinessException(ErrorCode.INVALID_COMMENT_PARENT);
            }
            comment.setParentComment(parent);
        }

        comment = commentRepository.save(comment);

        // Load user for response (getReferenceById may not have fullName/avatarUrl)
        User fullAuthor = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        log.info("Comment added to task {} by user: {}", taskId, currentUserId);
        return commentMapper.toResponse(comment, fullAuthor);
    }

    // ─── List comments ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getTaskComments(UUID taskId, CommentFilterParams params) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = findTaskOrThrow(taskId);
        requireProjectAccess(task.getProject().getId(), task.getProject().getWorkspace().getId(), currentUserId);

        Sort sort = Sort.by("asc".equalsIgnoreCase(params.getSortDir())
                ? Sort.Direction.ASC : Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);

        Page<Comment> commentPage = commentRepository.findAll(
                CommentSpecification.hasTask(taskId), pageable);

        // N+1 prevention: batch-fetch users
        Set<UUID> userIds = commentPage.getContent().stream()
                .map(Comment::getUserId)
                .collect(Collectors.toSet());

        Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Page<CommentResponse> responsePage = commentPage.map(c ->
                commentMapper.toResponse(c, userMap.get(c.getUserId())));

        return PageResponse.from(responsePage);
    }

    // ─── Update comment ──────────────────────────────────────────────────────────

    public CommentResponse updateComment(UUID commentId, UpdateCommentRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Comment comment = findCommentOrThrow(commentId);

        if (!currentUserId.equals(comment.getUserId())) {
            throw new ForbiddenException("Only the comment author can edit their comment");
        }

        comment.setContent(request.getContent());
        comment.setEdited(true);
        commentRepository.save(comment);

        User author = userRepository.findById(comment.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        return commentMapper.toResponse(comment, author);
    }

    // ─── Delete comment ──────────────────────────────────────────────────────────

    public void deleteComment(UUID commentId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Comment comment = findCommentOrThrow(commentId);
        Task task = findTaskOrThrow(comment.getTaskId());

        boolean isAuthor    = currentUserId.equals(comment.getUserId());
        boolean isWsAdmin   = isWorkspaceAdmin(task.getProject().getWorkspace().getId(), currentUserId);
        boolean isProjMgr   = isProjectManager(task.getProject().getId(), currentUserId);

        if (!isAuthor && !isWsAdmin && !isProjMgr) {
            throw new ForbiddenException("Only the comment author, project MANAGER, or workspace ADMIN/OWNER can delete this comment");
        }

        commentRepository.delete(comment);
        log.info("Comment {} deleted by user: {}", commentId, currentUserId);
    }

    // ─── RBAC helpers ────────────────────────────────────────────────────────────

    private void requireDeveloperOrWorkspaceAdmin(UUID projectId, UUID workspaceId, UUID userId) {
        WorkspaceMember wsMember = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, userId).orElse(null);
        if (wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN)) return;

        boolean isDeveloper = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(pm -> pm.getRole().isAtLeast(ProjectRole.DEVELOPER))
                .orElse(false);
        if (isDeveloper) return;

        throw new ForbiddenException("Only project members (DEVELOPER+) or workspace admins can add comments");
    }

    private void requireProjectAccess(UUID projectId, UUID workspaceId, UUID userId) {
        WorkspaceMember wsMember  = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, userId).orElse(null);
        boolean isWsAdmin = wsMember != null && wsMember.getRole().isAtLeast(WorkspaceRole.ADMIN);
        if (isWsAdmin) return;

        boolean isProjMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, userId);
        if (!isProjMember) throw new ForbiddenException();
    }

    private boolean isWorkspaceAdmin(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .map(wm -> wm.getRole().isAtLeast(WorkspaceRole.ADMIN))
                .orElse(false);
    }

    private boolean isProjectManager(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(pm -> pm.getRole().isAtLeast(ProjectRole.MANAGER))
                .orElse(false);
    }

    // ─── Load helpers ────────────────────────────────────────────────────────────

    private Task findTaskOrThrow(UUID taskId) {
        return taskRepository.findByIdWithDetails(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TASK_NOT_FOUND));
    }

    private Comment findCommentOrThrow(UUID commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.COMMENT_NOT_FOUND));
    }
}
