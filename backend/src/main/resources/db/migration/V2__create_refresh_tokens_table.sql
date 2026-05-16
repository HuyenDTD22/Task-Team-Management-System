-- V2: Refresh tokens — supports multi-device login and token rotation

CREATE TABLE refresh_tokens (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL,
    token       VARCHAR(512)  NOT NULL,
    expires_at  TIMESTAMPTZ   NOT NULL,
    revoked     BOOLEAN       NOT NULL DEFAULT FALSE,
    revoked_at  TIMESTAMPTZ,
    device_info VARCHAR(255),                                    -- Optional: User-Agent
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_users FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_refresh_tokens_token UNIQUE (token)
);

-- Fast lookup by user (list/revoke all sessions)
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Fast token validation — partial index excludes already-revoked tokens
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token)
    WHERE revoked = FALSE;

COMMENT ON TABLE  refresh_tokens             IS 'JWT refresh tokens — one row per active device/session';
COMMENT ON COLUMN refresh_tokens.device_info IS 'Optional User-Agent for session display';
