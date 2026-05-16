package com.taskmanager.domain.project.repository;

import com.taskmanager.domain.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
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
}
