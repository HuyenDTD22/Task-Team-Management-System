-- V1: Users table
-- gen_random_uuid() is provided by pgcrypto (bundled with PostgreSQL 13+)

CREATE TABLE users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    full_name     VARCHAR(100)  NOT NULL,
    avatar_url    VARCHAR(500),
    system_role   VARCHAR(20)   NOT NULL DEFAULT 'ROLE_USER',
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by    UUID,
    updated_by    UUID,
    deleted_at    TIMESTAMPTZ,                                   -- NULL = active

    CONSTRAINT uq_users_email      UNIQUE (email),
    CONSTRAINT chk_users_system_role CHECK (system_role IN ('ROLE_USER', 'ROLE_ADMIN'))
);

-- Partial index: fast login lookups, excludes soft-deleted rows
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

COMMENT ON COLUMN users.password_hash IS 'BCrypt hash — never store plain text';
COMMENT ON COLUMN users.deleted_at    IS 'Soft delete: NULL = active';
