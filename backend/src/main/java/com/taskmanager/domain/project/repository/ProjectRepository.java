package com.taskmanager.domain.project.repository;

import com.taskmanager.domain.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, JpaSpecificationExecutor<Project> {

    List<Project> findByWorkspaceId(UUID workspaceId);

    boolean existsByWorkspaceIdAndKey(UUID workspaceId, String key);

    // Eager-loads workspace to avoid lazy-load in ProjectService for single-entity ops
    @Query("SELECT p FROM Project p JOIN FETCH p.workspace WHERE p.id = :id")
    Optional<Project> findByIdWithWorkspace(UUID id);

    // Atomically increments the task counter; must be called within an active @Transactional context.
    @Modifying
    @Query("UPDATE Project p SET p.taskCounter = p.taskCounter + 1 WHERE p.id = :id")
    int incrementTaskCounter(@Param("id") UUID id);

    @Query("SELECT p.taskCounter FROM Project p WHERE p.id = :id")
    int getTaskCounter(@Param("id") UUID id);
}
