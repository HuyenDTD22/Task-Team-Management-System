package com.taskmanager.domain.sprint.specification;

import com.taskmanager.common.enums.SprintStatus;
import com.taskmanager.domain.sprint.entity.Sprint;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class SprintSpecification {

    private SprintSpecification() {}

    public static Specification<Sprint> hasProject(UUID projectId) {
        return (root, query, cb) -> cb.equal(root.get("projectId"), projectId);
    }

    public static Specification<Sprint> hasStatus(SprintStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }
}
