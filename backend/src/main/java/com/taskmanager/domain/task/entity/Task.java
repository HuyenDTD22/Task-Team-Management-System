package com.taskmanager.domain.task.entity;

import com.taskmanager.common.entity.BaseEntity;
import com.taskmanager.common.enums.TaskPriority;
import com.taskmanager.common.enums.TaskStatus;
import com.taskmanager.domain.project.entity.Project;
import com.taskmanager.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@SQLRestriction("deleted_at IS NULL")
@SQLDelete(sql = "UPDATE tasks SET deleted_at = NOW() WHERE id = ?")
public class Task extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // Scalar duplicate for list queries — avoids lazy-loading the full Project graph
    @Column(name = "project_id", insertable = false, updatable = false)
    private UUID projectId;

    // sprint_id stored as plain UUID; no @ManyToOne until Sprint entity is created in Phase 4
    @Column(name = "sprint_id")
    private UUID sprintId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    // Scalar duplicate — avoids lazy-loading assignee in list queries
    @Column(name = "assignee_id", insertable = false, updatable = false)
    private UUID assigneeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    // Scalar duplicate — avoids lazy-loading reporter in list queries
    @Column(name = "reporter_id", insertable = false, updatable = false)
    private UUID reporterId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "task_key", nullable = false, length = 20)
    private String taskKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "story_points")
    private Integer storyPoints;

    @Column(name = "due_date")
    private LocalDate dueDate;

    // Reserved for Kanban column ordering (Phase 5 — drag-and-drop)
    @Column(nullable = false)
    private int position = 0;
}
