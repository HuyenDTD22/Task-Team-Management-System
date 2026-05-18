package com.taskmanager.domain.task.repository;

import com.taskmanager.domain.task.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
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

    // Dashboard stats — count queries scoped to a specific user (deleted_at filter applied by @SQLRestriction)
    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status <> com.taskmanager.common.enums.TaskStatus.DONE")
    long countActiveTasksForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.dueDate < CURRENT_DATE AND t.status <> com.taskmanager.common.enums.TaskStatus.DONE")
    long countOverdueTasksForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status = com.taskmanager.common.enums.TaskStatus.DONE")
    long countDoneTasksForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status = com.taskmanager.common.enums.TaskStatus.TODO")
    long countTodoTasksForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status = com.taskmanager.common.enums.TaskStatus.IN_PROGRESS")
    long countInProgressTasksForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status = com.taskmanager.common.enums.TaskStatus.IN_REVIEW")
    long countInReviewTasksForUser(@Param("userId") UUID userId);

    // Fix 4: unassign tasks in a project when project member is removed
    @Modifying
    @Query("UPDATE Task t SET t.assignee = null WHERE t.assignee.id = :userId AND t.projectId = :projectId")
    int unassignUserFromProjectTasks(@Param("userId") UUID userId, @Param("projectId") UUID projectId);

    // Fix 3: unassign tasks across workspace when workspace member is removed (cascade)
    @Modifying
    @Query("UPDATE Task t SET t.assignee = null WHERE t.assignee.id = :userId AND t.projectId IN (SELECT p.id FROM Project p WHERE p.workspace.id = :workspaceId AND p.deletedAt IS NULL)")
    int unassignUserFromWorkspaceTasks(@Param("userId") UUID userId, @Param("workspaceId") UUID workspaceId);
}
