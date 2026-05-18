package com.taskmanager.domain.project.repository;

import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.domain.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

    // Eager-loads user to avoid N+1 when mapping member responses
    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.user WHERE pm.project.id = :projectId")
    List<ProjectMember> findByProjectIdWithUser(UUID projectId);

    long countByProjectId(UUID projectId);

    // Replaces findByProjectId + Java-level filter in removeProjectMember
    long countByProjectIdAndRole(UUID projectId, ProjectRole role);

    void deleteByProjectIdAndUserId(UUID projectId, UUID userId);

    // Batch: user's roles across multiple projects (avoids per-project query in list)
    @Query("SELECT pm FROM ProjectMember pm WHERE pm.user.id = :userId AND pm.project.id IN :projectIds")
    List<ProjectMember> findByUserIdAndProjectIdIn(UUID userId, List<UUID> projectIds);

    // Batch: member counts per project — returns interface projection mapped by alias
    @Query("""
            SELECT pm.project.id AS projectId, COUNT(pm) AS memberCount
            FROM ProjectMember pm
            WHERE pm.project.id IN :projectIds
            GROUP BY pm.project.id
            """)
    List<MemberCountView> countMembersByProjectIds(List<UUID> projectIds);

    // Fix 3: guard — count projects in workspace where user is the sole MANAGER
    @Query("""
            SELECT COUNT(DISTINCT pm.project.id) FROM ProjectMember pm
            WHERE pm.user.id = :userId
            AND pm.role = com.taskmanager.common.enums.ProjectRole.MANAGER
            AND pm.project.id IN (SELECT p.id FROM Project p WHERE p.workspace.id = :workspaceId AND p.deletedAt IS NULL)
            AND 1 = (SELECT COUNT(pm2) FROM ProjectMember pm2
                     WHERE pm2.project.id = pm.project.id
                     AND pm2.role = com.taskmanager.common.enums.ProjectRole.MANAGER)
            """)
    long countProjectsWhereUserIsLastManager(@Param("userId") UUID userId, @Param("workspaceId") UUID workspaceId);

    // Fix 3: cascade — remove user from all projects in the workspace
    @Modifying
    @Query("DELETE FROM ProjectMember pm WHERE pm.user.id = :userId AND pm.project.id IN (SELECT p.id FROM Project p WHERE p.workspace.id = :workspaceId AND p.deletedAt IS NULL)")
    int deleteByUserIdAndWorkspaceId(@Param("userId") UUID userId, @Param("workspaceId") UUID workspaceId);

    // ─── Projection ─────────────────────────────────────────────────────────────

    interface MemberCountView {
        UUID getProjectId();
        Long getMemberCount();
    }
}
