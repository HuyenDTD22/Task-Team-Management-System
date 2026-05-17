# Database Design — Task & Team Management System

> Version: 1.0 | Last updated: 2026-05-12
> Database: PostgreSQL 16

---

## 1. Design Principles

### 1.1 Primary Key Strategy — UUID v7

Dùng **UUID v7** (time-ordered UUID) cho tất cả primary keys.

```sql
-- Sử dụng gen_random_uuid() của PostgreSQL
-- hoặc gen từ Java application (Java UUID library)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**Tại sao UUID thay vì BIGSERIAL (auto-increment)?**
- Không expose thứ tự tạo record (bảo mật)
- An toàn cho distributed systems (unique globally)
- Có thể generate ID trước khi insert vào DB
- Dễ migrate/merge data giữa các environments

**Tại sao UUID v7 thay vì UUID v4?**
- UUID v7 có time component → **sortable theo thời gian**
- Tốt hơn cho B-tree index (sequential inserts)
- UUID v4 hoàn toàn random → index fragmentation

### 1.2 Soft Delete

```sql
deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
-- NULL = chưa xóa
-- Có giá trị = đã bị xóa tại thời điểm đó
```

**Lý do dùng Soft Delete:**
- Cho phép restore dữ liệu khi xóa nhầm
- Giữ lịch sử audit
- Foreign key không bị broken khi record bị "xóa"
- Cần thêm `WHERE deleted_at IS NULL` vào mọi query

**Trong Spring Data JPA:**
```java
@Where(clause = "deleted_at IS NULL")  // Tự động filter
@SQLDelete(sql = "UPDATE table SET deleted_at = NOW() WHERE id = ?")
```

### 1.3 Audit Fields

Mọi table phải có:

```sql
created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
created_by  UUID REFERENCES users(id),
updated_by  UUID REFERENCES users(id)
```

Trong Spring Boot, dùng `@EntityListeners(AuditingEntityListener.class)` + `@EnableJpaAuditing`.

### 1.4 Naming Convention

| Thành phần | Convention | Ví dụ |
|------------|-----------|-------|
| Table | `snake_case`, plural | `workspace_members` |
| Column | `snake_case` | `created_at`, `project_id` |
| Primary key | `id` | `id UUID` |
| Foreign key | `{table_singular}_id` | `workspace_id`, `user_id` |
| Enum column | `snake_case` | `task_status`, `sprint_status` |
| Enum value (PostgreSQL) | `UPPER_SNAKE_CASE` | `IN_PROGRESS`, `TODO` |
| Index | `idx_{table}_{columns}` | `idx_tasks_project_id` |
| Unique constraint | `uq_{table}_{columns}` | `uq_users_email` |
| Foreign key constraint | `fk_{table}_{ref_table}` | `fk_tasks_projects` |

---

## 2. Entity Relationship Diagram (ERD)

```
users
  │
  ├──< refresh_tokens (1 user : N tokens)
  │
  ├──< workspace_members >──< workspaces
  │                               │
  │                               └──< projects
  │                                       │
  │         users >──< project_members >──┤
  │                                       │
  │                               ├──< sprints
  │                               │
  │                               └──< tasks
  │                                       │
  │         users >──────────────── assignee
  │                                       │
  │                               ├──< comments (user → comment)
  │                               ├──< task_labels >──< labels
  │                               └──< attachments

notifications
  └── user_id → users
```

---

## 3. Table Definitions

### 3.1 Table: `users`

```sql
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(255)    NOT NULL,
    password_hash    VARCHAR(255)    NOT NULL,
    full_name        VARCHAR(100)    NOT NULL,
    avatar_url       VARCHAR(500),
    avatar_public_id VARCHAR(255),               -- Cloudinary public ID for delete/replace
    system_role      VARCHAR(20)     NOT NULL DEFAULT 'ROLE_USER',
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_system_role CHECK (system_role IN ('ROLE_USER', 'ROLE_ADMIN'))
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

**Notes:**
- `system_role` chỉ có 2 giá trị: user thường và admin
- `password_hash` lưu BCrypt hash, không bao giờ lưu plain text
- `avatar_url` lưu Cloudinary secure URL, `avatar_public_id` lưu ID để delete/replace file cũ
- `deleted_at` cho phép soft delete (deactivate account)

---

### 3.2 Table: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    token           VARCHAR(512) NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMP WITH TIME ZONE,
    device_info     VARCHAR(255),   -- optional: user agent
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token   ON refresh_tokens(token) WHERE revoked = FALSE;
```

**Notes:**
- Một user có nhiều refresh tokens (multi-device login)
- `revoked = TRUE` khi logout hoặc token rotation
- Cần job để cleanup expired/revoked tokens định kỳ

---

### 3.3 Table: `workspaces`

```sql
CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL,   -- URL-friendly identifier
    description     TEXT,
    owner_id        UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uq_workspaces_slug UNIQUE (slug),
    CONSTRAINT fk_workspaces_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id) WHERE deleted_at IS NULL;
```

**Notes:**
- `slug` dùng cho URL: `/workspaces/my-team`
- `owner_id` luôn trỏ tới người tạo workspace (có thể transfer)

---

### 3.4 Table: `workspace_members`

```sql
CREATE TABLE workspace_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    user_id         UUID NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    invited_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_wm_workspace  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_wm_user       FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT uq_wm_user_workspace UNIQUE (workspace_id, user_id),
    CONSTRAINT chk_wm_role CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

CREATE INDEX idx_wm_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_wm_user_id      ON workspace_members(user_id);
```

**Notes:**
- Composite unique: mỗi user chỉ có 1 role trong 1 workspace
- Cascade delete: xóa workspace → xóa tất cả members

---

### 3.5 Table: `projects`

```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,
    key             VARCHAR(10)  NOT NULL,   -- Prefix cho task key: "PROJ-123"
    description     TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT uq_project_key_workspace UNIQUE (workspace_id, key),
    CONSTRAINT chk_projects_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_projects_workspace_id ON projects(workspace_id) WHERE deleted_at IS NULL;
```

**Notes:**
- `key` là prefix ngắn để tạo task identifier: `TASK-1`, `PROJ-42`
- `status`: ACTIVE (đang làm) hoặc ARCHIVED (đã archive, không xóa)

---

### 3.6 Table: `project_members`

```sql
CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL,
    user_id         UUID NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'DEVELOPER',
    joined_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pm_project    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_user       FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT uq_pm_user_project UNIQUE (project_id, user_id),
    CONSTRAINT chk_pm_role CHECK (role IN ('MANAGER', 'DEVELOPER', 'VIEWER'))
);

CREATE INDEX idx_pm_project_id ON project_members(project_id);
CREATE INDEX idx_pm_user_id    ON project_members(user_id);
```

---

### 3.7 Table: `sprints`

```sql
CREATE TABLE sprints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,
    goal            TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PLANNED',
    start_date      DATE,
    end_date        DATE,
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_sprints_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT chk_sprints_status CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED')),
    CONSTRAINT chk_sprints_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

-- Chỉ 1 sprint ACTIVE per project tại một thời điểm
CREATE UNIQUE INDEX uq_sprints_one_active_per_project
    ON sprints(project_id)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;

CREATE INDEX idx_sprints_project_id ON sprints(project_id) WHERE deleted_at IS NULL;
```

**Notes:**
- Partial unique index đảm bảo chỉ 1 sprint ACTIVE per project — enforced tại DB level
- `started_at` và `completed_at` là timestamp chính xác (khác với `start_date` là ngày dự kiến)

---

### 3.8 Table: `tasks`

```sql
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL,
    sprint_id       UUID,                   -- NULL = backlog
    assignee_id     UUID,                   -- NULL = unassigned
    reporter_id     UUID NOT NULL,          -- người tạo task
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    task_key        VARCHAR(20),            -- e.g., "PROJ-42" (generated)
    status          VARCHAR(20)  NOT NULL DEFAULT 'TODO',
    priority        VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    story_points    SMALLINT,               -- optional, for estimation
    due_date        DATE,
    position        INTEGER,                -- order trong cột trên Kanban board
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_tasks_project    FOREIGN KEY (project_id)  REFERENCES projects(id)  ON DELETE CASCADE,
    CONSTRAINT fk_tasks_sprint     FOREIGN KEY (sprint_id)   REFERENCES sprints(id)   ON DELETE SET NULL,
    CONSTRAINT fk_tasks_assignee   FOREIGN KEY (assignee_id) REFERENCES users(id)     ON DELETE SET NULL,
    CONSTRAINT fk_tasks_reporter   FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT chk_tasks_status    CHECK (status   IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')),
    CONSTRAINT chk_tasks_priority  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX idx_tasks_project_id   ON tasks(project_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_sprint_id    ON tasks(sprint_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee_id  ON tasks(assignee_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status       ON tasks(project_id, status) WHERE deleted_at IS NULL;
```

**Notes:**
- `sprint_id = NULL` → task ở backlog
- `assignee_id = NULL` → task chưa được assign
- `position` dùng để sort trong Kanban column
- `task_key` được generate tự động: `{project.key}-{sequence}`

---

### 3.9 Table: `labels`

```sql
CREATE TABLE labels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL,
    name            VARCHAR(50)  NOT NULL,
    color           VARCHAR(7)   NOT NULL DEFAULT '#6366f1',  -- hex color
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_labels_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uq_labels_name_project UNIQUE (project_id, name)
);
```

---

### 3.10 Table: `task_labels` (Many-to-Many junction)

```sql
CREATE TABLE task_labels (
    task_id     UUID NOT NULL,
    label_id    UUID NOT NULL,

    PRIMARY KEY (task_id, label_id),
    CONSTRAINT fk_tl_task  FOREIGN KEY (task_id)  REFERENCES tasks(id)  ON DELETE CASCADE,
    CONSTRAINT fk_tl_label FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);
```

---

### 3.11 Table: `comments`

```sql
CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL,
    user_id     UUID NOT NULL,
    content     TEXT NOT NULL,
    edited      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id)  ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_comments_task_id ON comments(task_id) WHERE deleted_at IS NULL;
```

---

### 3.12 Table: `attachments`

```sql
CREATE TABLE attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL,
    uploaded_by     UUID NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_size       BIGINT       NOT NULL,       -- bytes
    mime_type       VARCHAR(100) NOT NULL,
    storage_key     VARCHAR(500) NOT NULL,       -- S3 key hoặc local path
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_attachments_task FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

---

### 3.13 Table: `notifications`

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT,
    entity_type     VARCHAR(50),    -- 'TASK', 'COMMENT', 'SPRINT', etc.
    entity_id       UUID,           -- ID của entity liên quan
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
    WHERE is_read = FALSE;
```

---

## 4. Index Strategy

### Các Index quan trọng và lý do

| Index | Trên table | Lý do |
|-------|-----------|-------|
| `idx_users_email` | `users(email)` | Login query luôn tìm theo email |
| `idx_refresh_tokens_token` | `refresh_tokens(token)` WHERE not revoked | Token validation per request |
| `idx_tasks_project_id` | `tasks(project_id)` | Load all tasks of project |
| `idx_tasks_sprint_id` | `tasks(sprint_id)` | Load sprint board |
| `idx_tasks_assignee_id` | `tasks(assignee_id)` | "My tasks" view |
| `idx_tasks_status` | `tasks(project_id, status)` | Filter by status in board |
| `idx_comments_task_id` | `comments(task_id)` | Load comments of task |
| `idx_notifications_user_unread` | `notifications(user_id)` WHERE unread | Unread badge count |

### Khi nào NOT cần index:
- Columns hiếm khi query WHERE
- Columns với ít distinct values (boolean columns — partial index tốt hơn)
- Bảng nhỏ (< 1000 rows)

---

## 5. Flyway Migration Strategy

```
backend/src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_refresh_tokens_table.sql
├── V3__add_avatar_public_id_to_users.sql    # Cloudinary public ID for avatar management
├── V4__create_workspaces_tables.sql
├── V5__create_projects_tables.sql
├── V6__create_tasks.sql                     # Phase 3: tasks + task_counter on projects (sprint FK added in Phase 4)
├── V7__create_comments.sql                  # Phase 3: comments
├── V8__add_comment_parent.sql               # Phase 3 polish: parent_id for one-level nested comments
├── V9__create_sprints.sql                   # Phase 4: sprints + sprint FK on tasks
├── V9__create_labels_tables.sql
├── V10__create_attachments_table.sql
└── V11__create_notifications_table.sql
```

**Convention:**
- Format: `V{version}__{description}.sql` (2 underscores)
- Version tăng dần, không bao giờ skip
- Mỗi migration file chỉ làm 1 việc logic
- **KHÔNG BAO GIỜ sửa file migration đã commit** — tạo file mới để alter
- Test migration trên local trước khi push

---

## 6. Soft Delete Query Pattern

Với `@Where(clause = "deleted_at IS NULL")` trong JPA Entity:

```java
// Tự động filter deleted records
List<Task> findByProjectId(UUID projectId);
// → SELECT * FROM tasks WHERE project_id = ? AND deleted_at IS NULL

// Để include deleted records (admin use case):
@Query("SELECT t FROM Task t WHERE t.projectId = :id")
List<Task> findAllIncludingDeleted(@Param("id") UUID id);
```

---

## 7. Common Data Integrity Rules

| Rule | Implementation |
|------|---------------|
| Email unique | `UNIQUE constraint` + application-level check |
| 1 active sprint per project | `UNIQUE partial index` WHERE status='ACTIVE' |
| Member role trong workspace | `CHECK constraint` |
| Task status valid values | `CHECK constraint` |
| Sprint end_date >= start_date | `CHECK constraint` |
| Cascade delete workspace → projects → tasks | `ON DELETE CASCADE` |
| Nullify task assignee khi user bị xóa | `ON DELETE SET NULL` |
