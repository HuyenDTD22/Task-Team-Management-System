# Project Roadmap — Task & Team Management System

> Version: 1.0 | Last updated: 2026-05-18
> Target: Solo Developer | Timeline: ~17 tuần (có thể điều chỉnh)

---

## Overview

```
Phase 0: Foundation Setup          [Week 1-2]   ████████░░░░░░░░░░  Foundation
Phase 1: Auth & User               [Week 3-4]   ████████████░░░░░░  PRIORITY 1 ⭐
Phase 2: Workspace & Project       [Week 5-6]   ████████████░░░░░░  PRIORITY 1 ⭐
Phase 3: Task Management Core      [Week 7-9]   ██████████████████  PRIORITY 1 ⭐
Phase 4: Sprint Management         [Week 10-11] ██████████████████  ✅ DONE
Phase 5: Frontend Development      [Week 12-15] ████████████████░░  PRIORITY 1 ⭐
Phase 6: Docker & Deployment       [Week 16-17] ████████████░░░░░░  PRIORITY 1 ⭐
Phase 7: Advanced Features         [Week 18+]   Optional            PRIORITY 3
```

**Tổng MVP**: ~17 tuần (làm nghiêm túc 4-6 giờ/ngày)
**Tối thiểu cho CV**: Phase 0-3 + Phase 6 (~10 tuần)

---

## Phase 0: Foundation Setup
**Timeline**: Week 1-2 | **Priority**: CRITICAL | **Difficulty**: ⭐⭐

### Mục tiêu
Thiết lập project skeleton hoàn chỉnh, đủ để bắt đầu code feature.

### Tasks

#### 0.1 Project Structure Setup
- [ ] Khởi tạo Spring Boot project (Spring Initializr)
  - Java 21, Maven, Spring Boot 3.x
  - Dependencies: Spring Web, Spring Security, Spring Data JPA, PostgreSQL Driver, Flyway, Lombok, Validation
- [ ] Tạo cấu trúc package theo DDD lite (xem SYSTEM_ARCHITECTURE.md)
- [ ] Khởi tạo React + Vite + TypeScript project
  - `npm create vite@latest frontend -- --template react-ts`
- [ ] Install frontend dependencies: TailwindCSS, Axios, React Query, React Router, React Hook Form, Zod

#### 0.2 Database Setup
- [ ] Cài đặt PostgreSQL local (hoặc dùng Docker)
- [ ] Tạo database `taskmanager`
- [ ] Cấu hình Flyway migrations
- [ ] Tạo migration V1: users table

#### 0.3 Base Code
- [ ] Tạo `ApiResponse<T>` wrapper class
- [ ] Tạo `BaseEntity` với audit fields
- [ ] Tạo `GlobalExceptionHandler` skeleton
- [ ] Tạo `ErrorCode` enum
- [ ] Tạo Axios instance với interceptors (frontend)

#### 0.4 Configuration
- [ ] `application.yml` với environment variables
- [ ] `application-dev.yml` cho local development
- [ ] `.env.example` file
- [ ] `.gitignore` update (thêm `.env`, `target/`, `node_modules/`)

### Deliverables
- Project chạy được: `mvn spring-boot:run` và `npm run dev`
- `/api/v1/health` endpoint trả về 200 OK
- Database connection hoạt động

### CV Talking Points
*"Set up enterprise-grade Spring Boot 3 project with domain-driven package structure, Flyway migrations, and global exception handling from day one."*

---

## Phase 1: Authentication & User Management
**Timeline**: Week 3-4 | **Priority**: CRITICAL | **Difficulty**: ⭐⭐⭐

### Mục tiêu
Hoàn thiện auth system với JWT + refresh token rotation. Đây là nền tảng security của cả hệ thống.

### Tasks

#### 1.1 Database
- [ ] Migration V2: `refresh_tokens` table
- [ ] Migration V3: update `users` table (thêm columns nếu cần)

#### 1.2 User Entity & Repository
- [ ] `User` entity với `@EntityListeners(AuditingEntityListener.class)`
- [ ] `UserRepository` với custom queries
- [ ] `UserDetailsServiceImpl` (Spring Security integration)

#### 1.3 JWT Infrastructure
- [ ] `JwtService`: generate, validate, parse JWT
- [ ] `JwtAuthenticationFilter`: extract token, set SecurityContext
- [ ] `SecurityConfig`: configure filter chain, disable CSRF, CORS

#### 1.4 Auth Endpoints
- [ ] `POST /api/v1/auth/register`
  - Validate input (email format, password strength, name)
  - Check email uniqueness
  - Hash password BCrypt
  - Return user profile (không return password)
- [ ] `POST /api/v1/auth/login`
  - Verify credentials
  - Generate access token (JWT)
  - Generate refresh token (UUID)
  - Save refresh token to DB
  - Return access token in body + refresh token in HttpOnly Cookie
- [ ] `POST /api/v1/auth/refresh`
  - Extract refresh token from Cookie
  - Validate: exists, not expired, not revoked
  - Rotate: revoke old, create new
  - Return new access token
- [ ] `POST /api/v1/auth/logout`
  - Revoke refresh token
  - Clear Cookie

#### 1.5 User Profile Endpoints
- [ ] `GET /api/v1/users/me` — get current user profile
- [ ] `PATCH /api/v1/users/me` — update profile (name, avatar_url)
- [ ] `PATCH /api/v1/users/me/password` — change password

### Testing này nên làm gì
- Test tất cả endpoints bằng Postman/Bruno
- Verify JWT claims không chứa sensitive data
- Verify refresh token rotation (dùng old token sau khi rotate → 401)
- Verify HttpOnly cookie được set

### Difficulty Rating
| Sub-task | Độ khó |
|----------|--------|
| Entity + Repository | ⭐⭐ |
| JWT Service | ⭐⭐⭐ |
| Security Config | ⭐⭐⭐ |
| Refresh Token Rotation | ⭐⭐⭐⭐ |
| Auth Endpoints | ⭐⭐⭐ |

### CV Talking Points
*"Implemented stateless JWT authentication with refresh token rotation strategy, HttpOnly secure cookies to prevent XSS, and BCrypt password hashing. Designed for multi-device login support."*

---

## Phase 2: Workspace & Project Management
**Timeline**: Week 5-6 | **Priority**: HIGH | **Difficulty**: ⭐⭐⭐

### Mục tiêu
CRUD cho workspace và project với role-based access control.

### Tasks

#### 2.1 Database
- [ ] Migration V4: `workspaces`, `workspace_members`
- [ ] Migration V5: `projects`, `project_members`

#### 2.2 Workspace
- [ ] `Workspace` + `WorkspaceMember` entities
- [ ] `WorkspaceRepository`, `WorkspaceMemberRepository`
- [ ] `WorkspaceService`:
  - `createWorkspace()` — tạo workspace, tự add creator làm OWNER
  - `getWorkspaceById()` — với membership check
  - `updateWorkspace()` — chỉ OWNER/ADMIN
  - `deleteWorkspace()` — chỉ OWNER, soft delete
  - `inviteMember()` — thêm user vào workspace
  - `removeMember()` — xóa member
  - `updateMemberRole()` — đổi role
- [ ] `WorkspaceController` với tất cả endpoints

#### 2.3 Project
- [ ] `Project` + `ProjectMember` entities
- [ ] `ProjectService`:
  - `createProject()` — trong workspace, phải là workspace ADMIN+
  - `getProjectById()` — membership check
  - `updateProject()` — MANAGER only
  - `archiveProject()` — MANAGER only
  - `inviteProjectMember()` — phải là workspace member trước
  - `removeProjectMember()`
- [ ] `ProjectController`

#### 2.4 Authorization Helper
- [ ] `SecurityUtil.getCurrentUser()` — lấy user từ SecurityContext
- [ ] Helper methods kiểm tra workspace/project membership và role

### Endpoints Summary

```
POST   /api/v1/workspaces
GET    /api/v1/workspaces
GET    /api/v1/workspaces/{id}
PUT    /api/v1/workspaces/{id}
DELETE /api/v1/workspaces/{id}
GET    /api/v1/workspaces/{id}/members
POST   /api/v1/workspaces/{id}/members
PATCH  /api/v1/workspaces/{id}/members/{userId}
DELETE /api/v1/workspaces/{id}/members/{userId}

POST   /api/v1/workspaces/{id}/projects
GET    /api/v1/workspaces/{id}/projects
GET    /api/v1/projects/{id}
PUT    /api/v1/projects/{id}
POST   /api/v1/projects/{id}/archive
GET    /api/v1/projects/{id}/members
POST   /api/v1/projects/{id}/members
DELETE /api/v1/projects/{id}/members/{userId}
```

### CV Talking Points
*"Designed a multi-tenant workspace system with hierarchical role-based access control (OWNER > ADMIN > MEMBER at workspace level; MANAGER > DEVELOPER > VIEWER at project level), enforced at the service layer."*

---

## Phase 3: Task Management Core ✅ COMPLETED
**Timeline**: Week 7-9 | **Priority**: CRITICAL | **Difficulty**: ⭐⭐⭐⭐

**Completed**: Task CRUD + Comment CRUD, full RBAC, URL-based filter/pagination, task detail slide-over panel, assign/unassign, threaded comments (V8 parent_id), ConfirmDialog replacing native confirm(), comment timestamps with time.

**RBAC polish completed**: Field-level task permissions enforced in backend (`TaskService`, `CommentService`) and frontend (`getTaskPermissions()` utility). `changeTaskStatus` restricted to MANAGER/wsAdmin/assignee. `updateTask` splits planning fields (title, priority, dueDate, storyPoints — MANAGER+ only) from content fields (description — assignee OK). `addComment` restricted to DEVELOPER+ (VIEWER read-only). Frontend gates Create Task, Delete, title edit, description edit, status select, assignee select, and comment form per role + assignee context.

### Mục tiêu
Core business module — CRUD task đầy đủ với filtering, pagination, và permission checks.

### Tasks

#### 3.1 Database
- [ ] Migration V6: `tasks` table
- [ ] Migration V7: `comments` table
- [ ] Migration V8: `labels`, `task_labels` tables

#### 3.2 Task CRUD
- [ ] `Task` entity với tất cả fields
- [ ] `TaskRepository` với custom queries + Specification (filtering)
- [ ] `TaskService`:
  - `createTask()` — validate project membership
  - `getTaskById()` — với permission check
  - `updateTask()` — chỉ MANAGER hoặc assignee
  - `deleteTask()` — chỉ MANAGER, soft delete
  - `updateTaskStatus()` — MANAGER hoặc assignee
  - `assignTask()` — MANAGER only
  - `getTasksByProject()` — với filtering + pagination
  - `getMyTasks()` — tasks assigned to current user
  - `moveToSprint()` / `moveToBacklog()` — MANAGER only

#### 3.3 Task Filtering & Pagination
- [ ] Spring Data JPA `Specification` để filter:
  - `status`, `priority`, `assigneeId`, `sprintId`, `search` (title contains)
- [ ] Pageable với `sortBy`, `sortDir`
- [ ] `TaskFilter` request object (query params → object)

#### 3.4 Comments
- [ ] `Comment` entity
- [ ] `CommentService`:
  - `addComment()` — bất kỳ project member
  - `updateComment()` — chỉ author
  - `deleteComment()` — author hoặc MANAGER
  - `getCommentsByTask()` — paginated
- [ ] `CommentController`

### Endpoints Summary

```
POST   /api/v1/projects/{id}/tasks
GET    /api/v1/projects/{id}/tasks          # with filters & pagination
GET    /api/v1/tasks/{id}
PUT    /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
PATCH  /api/v1/tasks/{id}/status
PATCH  /api/v1/tasks/{id}/assignee
PATCH  /api/v1/tasks/{id}/sprint

POST   /api/v1/tasks/{id}/comments
GET    /api/v1/tasks/{id}/comments
PUT    /api/v1/comments/{id}
DELETE /api/v1/comments/{id}
```

### Difficulty Rating
| Sub-task | Độ khó |
|----------|--------|
| Task Entity + Basic CRUD | ⭐⭐⭐ |
| Permission logic trong Service | ⭐⭐⭐⭐ |
| Specification/Filtering | ⭐⭐⭐ |
| Comment system | ⭐⭐ |

### CV Talking Points
*"Built a flexible task management system with JPA Specification-based dynamic filtering, role-aware permission checks at service layer, and soft-delete strategy for data integrity."*

---

## Phase 4: Sprint Management ✅ COMPLETED
**Timeline**: Week 10-11 | **Priority**: MEDIUM | **Difficulty**: ⭐⭐⭐

**Completed**: Sprint CRUD + lifecycle (PLANNED → ACTIVE → COMPLETED), sprint-task assignment (add/remove), V9 Flyway migration (sprints table + tasks.sprint_id FK back-fill), SprintService with full RBAC (MANAGER/wsAdmin for mutations, any member for view), `completeSprint` moves incomplete tasks to backlog while DONE tasks keep sprintId (historical record), partial unique index `uq_sprints_one_active_per_project` for concurrent-safe active sprint enforcement. Frontend: Sprints tab in ProjectDetailPage, SprintList component with accordion cards, CreateSprintModal and inline Edit modal, SprintStatusBadge, Sprint field in TaskDetailPanel meta grid (single `useProjectSprints` call with fallback `useSprint`). `DataIntegrityViolationException` added to GlobalExceptionHandler for DB-level race condition safety.

**Post-testing UX polish applied**: `TaskSummaryResponse` extended with `sprintId` field (backend + frontend), Task List table shows Sprint column (sprint name or "Backlog"). Sprint dropdown options in TaskDetailPanel now include start/end dates. SprintList accordion cards show task count + top-5 task preview via `SprintTaskPreview` sub-component. Start/complete sprint errors now show `AlertDialog` modal instead of inline text. RBAC bug fixed: `ProjectResponse` includes `currentWorkspaceRole` so wsADMIN + project DEVELOPER correctly sees sprint management UI. Sprint task preview now shows due date per task and is sorted by due date DESC NULLS LAST (latest first, no due date last); backend `TaskService.buildPageable()` updated to use `Sort.Order.nullsLast()` for correct PostgreSQL NULL ordering. **Phase 4 is stable and complete.**

Deferred to Phase 5: sprint board route, sprint selector in TaskFilters, backlog named section, velocity/burndown.

### Mục tiêu
Quản lý sprint lifecycle: PLANNED → ACTIVE → COMPLETED.

### Tasks

#### 4.1 Database
- [ ] Migration V9: `sprints` table (với partial unique index cho active sprint)

#### 4.2 Sprint Service
- [ ] `Sprint` entity
- [ ] `SprintRepository`
- [ ] `SprintService`:
  - `createSprint()` — MANAGER only
  - `updateSprint()` — chỉ khi status = PLANNED
  - `startSprint()` — check không có active sprint khác
  - `completeSprint()`:
    - Lấy tất cả tasks chưa DONE
    - Move về backlog (sprint_id = NULL)
    - Cập nhật sprint status = COMPLETED
  - `getSprintsByProject()` — list với tasks
  - `addTaskToSprint()` — từ backlog
  - `removeTaskFromSprint()` — về backlog

### Endpoints Summary

```
POST   /api/v1/projects/{id}/sprints
GET    /api/v1/projects/{id}/sprints
GET    /api/v1/sprints/{id}
PUT    /api/v1/sprints/{id}
DELETE /api/v1/sprints/{id}
POST   /api/v1/sprints/{id}/start
POST   /api/v1/sprints/{id}/complete
GET    /api/v1/sprints/{id}/tasks
POST   /api/v1/sprints/{id}/tasks/{taskId}
DELETE /api/v1/sprints/{id}/tasks/{taskId}
```

### CV Talking Points
*"Implemented sprint lifecycle management with database-enforced constraint (partial unique index) ensuring only one active sprint per project at any time."*

---

## Phase 5: Frontend Development ✅ COMPLETED
**Timeline**: Week 12-15 | **Priority**: HIGH | **Difficulty**: ⭐⭐⭐

**Completed**: Kanban board ("Board" tab in `ProjectDetailPage`) with `@dnd-kit/core` + `@dnd-kit/sortable` drag-and-drop status change per RBAC (MANAGER/wsAdmin drag any card; DEVELOPER drags own cards only). Sprint selector + backlog filter in `TaskFilters`/`TaskList`. `BacklogSection` in Sprints tab with per-row "Add to Sprint" inline UI. "View Board" button on ACTIVE sprint cards. `MyTasksPage` at `/tasks` — cross-project assigned-task list with Project column, click opens task panel in project context. Backend: `GET /tasks/me` endpoint (`MyTaskSummaryResponse` with `projectName`), `isAccessibleByUser` JPA Specification, `backlog` filter in `TaskFilterParams`, `size` max relaxed to 100 for board view. `task.mine` query key integrated in cache invalidation matrix for all task/sprint mutations.

### Mục tiêu
React frontend với Kanban board, connect tất cả API endpoints.

### Tasks

#### 5.1 Foundation (Week 12)
- [x] Axios instance với JWT interceptor và auto-refresh
- [x] React Router với ProtectedRoute và PublicRoute
- [x] Auth store (Zustand hoặc Context)
- [x] Layout component (Sidebar + Header)
- [x] Login / Register pages

#### 5.2 Workspace & Project (Week 13)
- [x] Workspace list, create, detail pages
- [x] Project list, create pages
- [x] Member management UI
- [x] React Query hooks cho workspace/project APIs

#### 5.3 Kanban Board (Week 14)
- [x] Kanban board component với columns (TODO, IN_PROGRESS, IN_REVIEW, DONE)
- [x] Task card component với priority badge, assignee avatar, due date
- [x] Task create/edit modal
- [x] Drag and drop status update (`@dnd-kit/core`)
- [x] Task detail side panel với comments

#### 5.4 Sprint & Backlog (Week 15)
- [x] Backlog view (tasks không thuộc sprint)
- [x] Sprint list với active indicator
- [x] Start/complete sprint UI
- [x] Move task to sprint từ backlog
- [x] My Tasks page (`/tasks`) — cross-project personal task view

### CV Talking Points
*"Built responsive React frontend with TypeScript, TanStack Query for server state management, automatic JWT token refresh via Axios interceptors, and a Kanban board with drag-and-drop task management."*

---

## Phase 6: Docker & Deployment
**Timeline**: Week 16-17 | **Priority**: HIGH | **Difficulty**: ⭐⭐⭐

### Mục tiêu
Containerize toàn bộ application và deploy lên AWS EC2.

### Tasks

#### 6.1 Dockerize (Week 16)
- [ ] Backend `Dockerfile` (multi-stage build)
- [ ] Frontend `Dockerfile` (multi-stage build)
- [ ] `docker-compose.yml` (local dev)
- [ ] `docker-compose.prod.yml` (production)
- [ ] Nginx `nginx.conf`
- [ ] `.env.example` đầy đủ
- [ ] Test: `docker compose up` — tất cả services hoạt động

#### 6.2 AWS EC2 Setup (Week 17)
- [ ] Launch EC2 instance (t3.small, Ubuntu 22.04)
- [ ] Configure Security Groups (22, 80, 443)
- [ ] SSH key setup
- [ ] Install Docker + Docker Compose
- [ ] Clone repo, tạo `.env` file
- [ ] `docker compose -f docker-compose.prod.yml up -d`
- [ ] Test deployment từ browser

#### 6.3 (Optional) HTTPS
- [ ] Domain setup
- [ ] Certbot Let's Encrypt SSL
- [ ] Nginx HTTPS config

### CV Talking Points
*"Deployed full-stack application on AWS EC2 using Docker Compose with Nginx reverse proxy, multi-stage Docker builds for minimal image sizes, and environment-based configuration management."*

---

## Phase 7: Advanced Features
**Timeline**: Week 18+ | **Priority**: LOW | **Difficulty**: Varies

### Chọn 1-2 feature để thêm vào CV

| Feature | Difficulty | CV Impact | Ghi chú |
|---------|-----------|-----------|---------|
| Email notifications (JavaMail + Thymeleaf) | ⭐⭐⭐ | Medium | Cần SMTP server |
| Real-time notifications (SSE) | ⭐⭐⭐ | High | Server-Sent Events, không cần WebSocket |
| File attachments (AWS S3) | ⭐⭐⭐ | High | AWS SDK integration |
| Activity log / audit trail | ⭐⭐ | Medium | Spring AOP cho logging |
| Advanced search (fulltext) | ⭐⭐⭐ | Medium | PostgreSQL tsvector |
| GitHub Actions CI/CD | ⭐⭐ | High | Tự động test + deploy |
| Subtasks | ⭐⭐ | Low | Self-referential FK |
| Labels/tags filtering | ⭐⭐ | Low | Đã có table, chỉ cần UI |
| Swagger/OpenAPI docs | ⭐ | High | springdoc-openapi |

**Recommendation cho CV**: Ưu tiên **GitHub Actions CI/CD** + **Swagger docs** vì impact cao, implement nhanh.

---

## Implementation Order — Rationale

### Tại sao làm theo thứ tự này?

```
Auth trước → Mọi thứ khác cần authentication
  ↓
Workspace → Workspace là container của Project
  ↓
Project → Project chứa Sprint và Task
  ↓
Task → Core business value của system
  ↓
Sprint → Quản lý Task groups
  ↓
Frontend → Backend APIs phải stable trước
  ↓
Deploy → Cần có code để deploy
```

### Dependency Map

```
Phase 0 (Foundation) ← không phụ thuộc gì
Phase 1 (Auth)       ← cần Phase 0
Phase 2 (Workspace)  ← cần Phase 1 (auth required)
Phase 3 (Task)       ← cần Phase 2 (project required)
Phase 4 (Sprint)     ← cần Phase 3 (task management)
Phase 5 (Frontend)   ← cần Phase 1-4 (APIs must be ready)
Phase 6 (Deploy)     ← cần Phase 5 (something to deploy)
Phase 7 (Advanced)   ← cần Phase 6 (MVP deployed)
```

---

## Timeline Summary

| Phase | Tuần | Điểm khó nhất | Rủi ro |
|-------|------|---------------|--------|
| 0. Foundation | 1-2 | Security config | Underestimate setup time |
| 1. Auth | 3-4 | Refresh token rotation | JWT complexity |
| 2. Workspace/Project | 5-6 | RBAC enforcement | Over-engineering |
| 3. Task Management | 7-9 | Permission matrix | Scope creep |
| 4. Sprint | 10-11 | Sprint completion logic | Edge cases |
| 5. Frontend | 12-15 | Kanban DnD | UI complexity |
| 6. Deploy | 16-17 | EC2 networking | Docker debugging |
| 7. Advanced | 18+ | Varies | Never finishing |

**Lời khuyên**: Làm Phase 0-3 + Phase 6 trước. Đó là **MVP tối thiểu** để demo và đưa vào CV. Frontend và advanced features có thể làm sau.

---

## Common Blockers & Cách Tránh

| Blocker | Prevention |
|---------|-----------|
| Spring Security config quá phức tạp | Đọc docs, bắt đầu từ permit-all, dần add restrictions |
| JPA N+1 query problem | Dùng `@EntityGraph` hoặc JOIN FETCH sớm |
| Docker containers không kết nối được nhau | Dùng service name thay vì `localhost` |
| Frontend CORS issues | Config CORS backend đúng, không dùng wildcard `*` khi có credentials |
| JWT decode fail | Verify secret key consistent giữa generate và validate |
| Git conflicts | Commit thường xuyên, feature branches nhỏ |
| Scope creep | Stick to MVP features, advanced features là separate phase |
