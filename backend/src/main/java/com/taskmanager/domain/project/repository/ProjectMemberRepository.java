package com.taskmanager.domain.project.repository;

import com.taskmanager.common.enums.ProjectRole;
import com.taskmanager.domain.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    // ─── Projection ─────────────────────────────────────────────────────────────

    interface MemberCountView {
        UUID getProjectId();
        Long getMemberCount();
    }
}
