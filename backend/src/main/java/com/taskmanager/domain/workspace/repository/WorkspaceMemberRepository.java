package com.taskmanager.domain.workspace.repository;

import com.taskmanager.common.enums.WorkspaceRole;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, UUID> {

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    boolean existsByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    // Eager-loads user to avoid N+1 when mapping member responses
    @Query("SELECT wm FROM WorkspaceMember wm JOIN FETCH wm.user WHERE wm.workspace.id = :workspaceId")
    List<WorkspaceMember> findByWorkspaceIdWithUser(UUID workspaceId);

    @Query("SELECT wm.workspace.id FROM WorkspaceMember wm WHERE wm.user.id = :userId")
    List<UUID> findWorkspaceIdsByUserId(UUID userId);

    // Batch: user's roles across multiple workspaces (avoids per-workspace query in list)
    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.user.id = :userId AND wm.workspace.id IN :workspaceIds")
    List<WorkspaceMember> findByUserIdAndWorkspaceIdIn(UUID userId, List<UUID> workspaceIds);

    // Batch: member counts per workspace — returns interface projection mapped by alias
    @Query("""
            SELECT wm.workspace.id AS workspaceId, COUNT(wm) AS memberCount
            FROM WorkspaceMember wm
            WHERE wm.workspace.id IN :workspaceIds
            GROUP BY wm.workspace.id
            """)
    List<MemberCountView> countMembersByWorkspaceIds(List<UUID> workspaceIds);

    long countByWorkspaceId(UUID workspaceId);

    void deleteByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    boolean existsByWorkspaceIdAndUserIdAndRole(UUID workspaceId, UUID userId, WorkspaceRole role);

    // ─── Projection ─────────────────────────────────────────────────────────────

    interface MemberCountView {
        UUID getWorkspaceId();
        Long getMemberCount();
    }
}
