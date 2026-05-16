-- ──────────────────────────────────────────────────────────────────────────────
-- V5: Projects & Project Members
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,
    key             VARCHAR(10)  NOT NULL,
    description     TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID,
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_cby       FOREIGN KEY (created_by)   REFERENCES users(id),
    CONSTRAINT fk_projects_uby       FOREIGN KEY (updated_by)   REFERENCES users(id),
    CONSTRAINT uq_project_key_ws     UNIQUE (workspace_id, key),
    CONSTRAINT chk_projects_status   CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_projects_workspace_id ON projects(workspace_id) WHERE deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL,
    user_id         UUID NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'DEVELOPER',
    joined_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pm_project     FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_user        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT uq_pm_user_proj   UNIQUE (project_id, user_id),
    CONSTRAINT chk_pm_role       CHECK (role IN ('MANAGER', 'DEVELOPER', 'VIEWER'))
);

CREATE INDEX idx_pm_project_id ON project_members(project_id);
CREATE INDEX idx_pm_user_id    ON project_members(user_id);
