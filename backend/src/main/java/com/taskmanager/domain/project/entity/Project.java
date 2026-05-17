package com.taskmanager.domain.project.entity;

import com.taskmanager.common.entity.BaseEntity;
import com.taskmanager.common.enums.ProjectStatus;
import com.taskmanager.domain.workspace.entity.Workspace;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@SQLRestriction("deleted_at IS NULL")
@SQLDelete(sql = "UPDATE projects SET deleted_at = NOW() WHERE id = ?")
public class Project extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 100)
    private String name;

    // Short uppercase prefix used to generate task keys: "PROJ" → "PROJ-1"
    @Column(nullable = false, length = 10)
    private String key;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status = ProjectStatus.ACTIVE;

    // Monotonically increasing counter; used to generate task keys (e.g., PROJ-42).
    // Incremented atomically via ProjectRepository.incrementTaskCounter() within a transaction.
    @Column(name = "task_counter", nullable = false)
    private int taskCounter = 0;
}
