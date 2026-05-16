package com.taskmanager.domain.project.specification;

import com.taskmanager.common.enums.ProjectStatus;
import com.taskmanager.domain.project.entity.Project;
import com.taskmanager.domain.project.entity.ProjectMember;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class ProjectSpecification {

    private ProjectSpecification() {}

    public static Specification<Project> inWorkspace(UUID workspaceId) {
        return (root, query, cb) -> cb.equal(root.get("workspace").get("id"), workspaceId);
    }

    public static Specification<Project> nameContains(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase().trim() + "%");
        };
    }

    public static Specification<Project> hasStatus(ProjectStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Project> memberOfUser(UUID userId) {
        return (root, query, cb) -> {
            var sub = query.subquery(UUID.class);
            var pm  = sub.from(ProjectMember.class);
            sub.select(pm.get("project").get("id"))
               .where(cb.equal(pm.get("user").get("id"), userId));
            return root.get("id").in(sub);
        };
    }
}
