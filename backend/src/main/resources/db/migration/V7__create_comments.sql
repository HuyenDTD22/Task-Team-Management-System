-- ──────────────────────────────────────────────────────────────────────────────
-- V7: Comments (Phase 3)
--
-- No created_by/updated_by columns: user_id IS the author.
-- This matches the WorkspaceMember/ProjectMember pattern (no BaseEntity separation).
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL,
    user_id     UUID NOT NULL,
    content     TEXT NOT NULL,
    edited      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_comments_task_id ON comments(task_id) WHERE deleted_at IS NULL;
