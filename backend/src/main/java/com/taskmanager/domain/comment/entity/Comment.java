package com.taskmanager.domain.comment.entity;

import com.taskmanager.domain.task.entity.Task;
import com.taskmanager.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

// Does NOT extend BaseEntity: user_id IS the author; no created_by/updated_by separation needed.
// Same pattern as WorkspaceMember and ProjectMember.
@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@SQLRestriction("deleted_at IS NULL")
@SQLDelete(sql = "UPDATE comments SET deleted_at = NOW() WHERE id = ?")
@EntityListeners(AuditingEntityListener.class)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    // Scalar duplicate — avoids lazy-loading the full Task graph in RBAC checks
    @Column(name = "task_id", insertable = false, updatable = false)
    private UUID taskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Scalar duplicate — avoids lazy-loading user for author checks
    @Column(name = "user_id", insertable = false, updatable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parentComment;

    // Scalar duplicate — used for validation checks without lazy-loading parent graph
    @Column(name = "parent_id", insertable = false, updatable = false)
    private UUID parentId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private boolean edited = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
