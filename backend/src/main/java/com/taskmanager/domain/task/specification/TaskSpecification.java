package com.taskmanager.domain.task.specification;

import com.taskmanager.common.enums.TaskPriority;
import com.taskmanager.common.enums.TaskStatus;
import com.taskmanager.domain.task.entity.Task;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class TaskSpecification {

    private TaskSpecification() {}

    public static Specification<Task> hasProject(UUID projectId) {
        return (root, query, cb) -> cb.equal(root.get("projectId"), projectId);
    }

    public static Specification<Task> hasStatus(TaskStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Task> hasPriority(TaskPriority priority) {
        return (root, query, cb) -> {
            if (priority == null) return cb.conjunction();
            return cb.equal(root.get("priority"), priority);
        };
    }

    public static Specification<Task> hasAssignee(UUID assigneeId) {
        return (root, query, cb) -> {
            if (assigneeId == null) return cb.conjunction();
            return cb.equal(root.get("assigneeId"), assigneeId);
        };
    }

    public static Specification<Task> titleContains(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("title")), "%" + search.toLowerCase().trim() + "%");
        };
    }

    public static Specification<Task> hasSprintId(UUID sprintId) {
        return (root, query, cb) -> {
            if (sprintId == null) return cb.conjunction();
            return cb.equal(root.get("sprintId"), sprintId);
        };
    }

    public static Specification<Task> isInBacklog() {
        return (root, query, cb) -> cb.isNull(root.get("sprintId"));
    }
}
