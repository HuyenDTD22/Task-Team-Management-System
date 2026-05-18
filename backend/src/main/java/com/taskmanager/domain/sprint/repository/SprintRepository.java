package com.taskmanager.domain.sprint.repository;

import com.taskmanager.common.enums.SprintStatus;
import com.taskmanager.domain.sprint.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, UUID>, JpaSpecificationExecutor<Sprint> {

    // Used in startSprint() before triggering DB unique index — fast service-layer check
    boolean existsByProjectIdAndStatus(UUID projectId, SprintStatus status);

    // JOIN FETCH project + workspace so getSprintById() and service RBAC checks don't lazy-load
    @Query("""
            SELECT s FROM Sprint s
            JOIN FETCH s.project p
            JOIN FETCH p.workspace
            WHERE s.id = :id
            """)
    Optional<Sprint> findByIdWithProject(@Param("id") UUID id);
}
