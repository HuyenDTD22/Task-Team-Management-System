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

    // Used in completeSprint() — moves only incomplete tasks to backlog; DONE tasks retain sprintId (historical)
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Task t SET t.sprintId = null WHERE t.sprintId = :sprintId AND t.status <> com.taskmanager.common.enums.TaskStatus.DONE")
    int clearSprintFromIncompleteTasks(@Param("sprintId") UUID sprintId);

    // Used in deleteSprint() — moves all tasks to backlog before soft-deleting a PLANNED sprint
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Task t SET t.sprintId = null WHERE t.sprintId = :sprintId")
    int clearAllSprintTasks(@Param("sprintId") UUID sprintId);
}
