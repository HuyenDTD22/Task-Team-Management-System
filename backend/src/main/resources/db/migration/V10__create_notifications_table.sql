CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    entity_type VARCHAR(50),
    entity_id   UUID,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
    WHERE is_read = FALSE;

CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
