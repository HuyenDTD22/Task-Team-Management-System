package com.taskmanager.domain.comment.specification;

import com.taskmanager.domain.comment.entity.Comment;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class CommentSpecification {

    private CommentSpecification() {}

    public static Specification<Comment> hasTask(UUID taskId) {
        return (root, query, cb) -> cb.equal(root.get("taskId"), taskId);
    }
}
