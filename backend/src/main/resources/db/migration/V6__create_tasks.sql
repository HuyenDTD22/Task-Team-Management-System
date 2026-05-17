-- ──────────────────────────────────────────────────────────────────────────────
-- V6: Tasks (Phase 3)
--
-- Adds task_counter to projects for atomic task key generation (e.g., PROJ-1).
-- Sprint FK is intentionally omitted — sprints table is created in Phase 4 (V8).
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE projects ADD COLUMN task_counter INT NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL,
    sprint_id       UUID,                           -- NULL = backlog; FK to sprints added in V8
    assignee_id     UUID,                           -- NULL = unassigned
    reporter_id     UUID NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    task_key        VARCHAR(20) NOT NULL,            -- e.g., "PROJ-42" (generated)
    status          VARCHAR(20)  NOT NULL DEFAULT 'TODO',
    priority        VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    story_points    INT,
    due_date        DATE,
    position        INT NOT NULL DEFAULT 0,         -- reserved for Kanban ordering (Phase 5)
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID,
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_tasks_project    FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee   FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL,
    CONSTRAINT fk_tasks_reporter   FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_tasks_cby        FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT fk_tasks_uby        FOREIGN KEY (updated_by)  REFERENCES users(id),
    CONSTRAINT uq_task_key_project UNIQUE (project_id, task_key),
    CONSTRAINT chk_tasks_status    CHECK (status   IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')),
    CONSTRAINT chk_tasks_priority  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX idx_tasks_project_id     ON tasks(project_id)          WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status)   WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee_id    ON tasks(assignee_id)          WHERE deleted_at IS NULL;
