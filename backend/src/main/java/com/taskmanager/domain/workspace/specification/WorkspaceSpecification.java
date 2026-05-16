package com.taskmanager.domain.workspace.specification;

import com.taskmanager.domain.workspace.entity.Workspace;
import com.taskmanager.domain.workspace.entity.WorkspaceMember;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class WorkspaceSpecification {

    private WorkspaceSpecification() {}

    /**
     * Filters workspaces to those the given user is a member of.
     * Uses a subquery on workspace_members to avoid mapping @OneToMany on Workspace entity.
     */
    public static Specification<Workspace> memberOfUser(UUID userId) {
        return (root, query, cb) -> {
            var sub = query.subquery(UUID.class);
            var wm  = sub.from(WorkspaceMember.class);
            sub.select(wm.get("workspace").get("id"))
               .where(cb.equal(wm.get("user").get("id"), userId));
            return root.get("id").in(sub);
        };
    }

    public static Specification<Workspace> nameContains(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase().trim() + "%");
        };
    }
}
