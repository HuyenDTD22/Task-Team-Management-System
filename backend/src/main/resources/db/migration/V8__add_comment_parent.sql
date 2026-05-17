-- Allow one-level nested (threaded) comments.
-- parent_id NULL = root comment; non-null = reply to a root comment.
-- CommentService enforces that a reply cannot target another reply.
ALTER TABLE comments
    ADD COLUMN parent_id UUID NULL
        CONSTRAINT fk_comments_parent REFERENCES comments(id);

CREATE INDEX idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL AND deleted_at IS NULL;
