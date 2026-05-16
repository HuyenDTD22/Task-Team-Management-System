-- ──────────────────────────────────────────────────────────────────────────────
-- V4: Workspace & Workspace Members
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    description     TEXT,
    owner_id        UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID,
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uq_workspaces_slug    UNIQUE (slug),
    CONSTRAINT fk_workspaces_owner   FOREIGN KEY (owner_id)    REFERENCES users(id),
    CONSTRAINT fk_workspaces_cby     FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT fk_workspaces_uby     FOREIGN KEY (updated_by)  REFERENCES users(id)
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id) WHERE deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE workspace_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    user_id         UUID NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    invited_by      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_wm_workspace      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_wm_user           FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT fk_wm_invited_by     FOREIGN KEY (invited_by)   REFERENCES users(id),
    CONSTRAINT uq_wm_user_workspace UNIQUE (workspace_id, user_id),
    CONSTRAINT chk_wm_role          CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

CREATE INDEX idx_wm_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_wm_user_id      ON workspace_members(user_id);
