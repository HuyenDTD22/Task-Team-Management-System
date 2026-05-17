package com.taskmanager.domain.task.repository;

import com.taskmanager.domain.task.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    // Loads all @ManyToOne associations needed for TaskResponse (safe: single row, no row multiplication)
    @Query("""
            SELECT t FROM Task t
            LEFT JOIN FETCH t.assignee
            JOIN FETCH t.reporter
            JOIN FETCH t.project p
            JOIN FETCH p.workspace
            WHERE t.id = :id
            """)
    Optional<Task> findByIdWithDetails(@Param("id") UUID id);
}
