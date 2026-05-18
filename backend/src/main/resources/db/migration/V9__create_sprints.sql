-- ──────────────────────────────────────────────────────────────────────────────
-- V9: Sprints (Phase 4)
--
-- Creates the sprints table and adds the FK from tasks.sprint_id (deferred from V6).
-- The partial unique index on (project_id) WHERE status = 'ACTIVE' enforces
-- one-active-sprint-per-project at the DB level — safety net for concurrent
-- startSprint() requests that pass the service-layer existsByProjectIdAndStatus check.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE sprints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,
    goal            TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PLANNED',
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID,
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_sprints_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_sprints_cby     FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT fk_sprints_uby     FOREIGN KEY (updated_by)  REFERENCES users(id),
    CONSTRAINT chk_sprints_status CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED'))
);

-- Only one ACTIVE sprint per project at any time
CREATE UNIQUE INDEX uq_sprints_one_active_per_project
    ON sprints(project_id)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;

CREATE INDEX idx_sprints_project_id     ON sprints(project_id)         WHERE deleted_at IS NULL;
CREATE INDEX idx_sprints_project_status ON sprints(project_id, status) WHERE deleted_at IS NULL;

-- ── Add FK from tasks.sprint_id → sprints.id (column exists since V6) ─────────
-- ON DELETE SET NULL: if a sprint is hard-deleted, tasks go to backlog automatically.
-- Soft delete (Phase 4 default) handles this in service layer first.
ALTER TABLE tasks
    ADD CONSTRAINT fk_tasks_sprint
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL;
