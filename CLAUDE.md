# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 — Foundation | Spring Boot skeleton, DB, Flyway, base classes | ✅ Done |
| 1 — Auth & User | JWT auth, refresh token rotation, user profile, avatar (Cloudinary) | ✅ Done |
| 2 — Workspace & Project | Workspace/project CRUD + member RBAC, full frontend | ✅ Done |
| 3 — Task Management | Task CRUD, filtering, comments, RBAC polish (`My Tasks` deferred → Phase 5) | ✅ Done |
| 4 — Sprint Management | Sprint lifecycle (PLANNED → ACTIVE → COMPLETED) | ✅ Done |
| 5 — Frontend (advanced) | Kanban board, drag-and-drop, sprint UI, My Tasks personal view | ✅ Done |
| 6 — Dashboard & Notifications | Real Dashboard stats, Notification system | ✅ Done |
| 7 — Docker & Deploy | Dockerize, CI/CD, AWS EC2 | ✅ Done |

**DB migrations applied**: V1 (users) → V2 (refresh_tokens) → V3 (avatar_public_id) → V4 (workspaces + workspace_members) → V5 (projects + project_members) → V6 (tasks) → V7 (comments) → V8 (comment parent_id for threaded comments) → V9 (sprints + tasks.sprint_id FK) → V10 (notifications).

**Current focus**: Project complete — tất cả 8 phase (0–7) đã hoàn tất. Xem [DEPLOYMENT.md](DEPLOYMENT.md) để deploy lên EC2.

**Phase 7 completed**: Full Docker production stack. 8 files mới được tạo:
(1) **`frontend/Dockerfile`** — multi-stage (node:20-alpine build `dist/` → nginx:alpine serve). `npm ci` + `npm run build` → copy sang nginx image.
(2) **`frontend/nginx.conf`** — SPA routing (`try_files $uri $uri/ /index.html`); cache hashed assets 1 năm (`immutable`), `index.html` no-cache để đảm bảo browser luôn lấy bản mới nhất sau deploy.
(3) **`nginx/nginx.conf`** — reverse proxy: `/api/*` → `backend:8080`, `/` → `frontend:80`; `proxy_pass_header Set-Cookie` + `proxy_cookie_path /api/v1/auth /api/v1/auth` đảm bảo HttpOnly refresh token cookie đi qua đúng; gzip compression; security headers; `client_max_body_size 6m` match multipart limit.
(4) **`docker-compose.yml`** — 4-service production stack; backend + frontend dùng pre-built GHCR images (`ghcr.io/${GHCR_USERNAME}/task-team-management-system/{backend|frontend}:${IMAGE_TAG:-latest}`); chỉ nginx expose port 80; postgres không expose port; `APP_COOKIE_SECURE: "false"` fix (xem critical fix bên dưới).
(5) **`.env.example`** — template đầy đủ tất cả env vars, an toàn để commit.
(6) **`frontend/.dockerignore`** — loại node_modules, dist, .env* khỏi image build context.
(7) **`.github/workflows/ci-cd.yml`** — 3-job pipeline: `test` (PostgreSQL service container + `mvn test` với `-Dspring.datasource.*` override) → `build-and-push` (chỉ trên push `main`; build cả 2 images với GHA layer cache, tag `:sha-<7char>` + `:latest`, push GHCR) → `deploy` (`appleboy/ssh-action@v1` SSH vào EC2, `docker compose pull backend frontend && docker compose up -d --remove-orphans && docker image prune -f`).
(8) **`DEPLOYMENT.md`** — hướng dẫn EC2 setup step-by-step: cài Docker, clone repo, tạo `.env`, first deploy, verify, rollback, backup DB, troubleshooting table.

**Critical fix phát hiện trong Phase 7**: `AppProperties.java:14` có `cookieSecure = true` (default). Khi deploy HTTP (không HTTPS), browser chặn cookie có flag `Secure` → refresh token + login bị lỗi hoàn toàn. Fix: `APP_COOKIE_SECURE: "false"` trong backend service env của `docker-compose.yml` (Spring relaxed binding: `APP_COOKIE_SECURE` → `app.cookie-secure` → `AppProperties.cookieSecure`). **Không cần sửa Java code.**

**GitHub Secrets cần thiết** (Settings → Secrets → Actions): `EC2_HOST` (EC2 public IP), `EC2_SSH_KEY` (nội dung file .pem), `GHCR_USERNAME` (GitHub username). `GITHUB_TOKEN` tự động inject — không cần thêm thủ công.

**Phase 6 completed**: Real dashboard stats (`GET /api/v1/users/me/stats` → `UserStatsResponse { activeTaskCount, overdueTaskCount, doneTaskCount }`) via 3 JPQL count queries in `TaskRepository` (SQLRestriction handles soft-delete automatically). Dashboard rewritten with `useDashboardStats` hook (`staleTime: 0, refetchInterval: 60_000`), Upcoming Tasks panel (`useMyTasks` top 5 by due date), and enabled Quick Actions. Full notification system: V10 migration (`notifications` table, partial index on `is_read = FALSE`), `Notification` entity (does NOT extend `BaseEntity`, uses `@Builder.Default` for `read = false`), `NotificationService` hooked into `TaskService.assignTask()`, `CommentService.addComment()`, `SprintService.startSprint()/completeSprint()`, `ProjectService.addProjectMember()` — all hooks wrapped in try/catch so notification failure never rolls back parent transaction. Self-notification prevention at each hook. REST API: `GET/PATCH /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read` (ownership check throws `ForbiddenException`), `PATCH /notifications/read-all`. Frontend: bell icon in sidebar with red badge (polling 30s, "99+" cap), `/notifications` page with All/Unread filter toggle (URL param `?filter=unread`), pagination, "Mark all as read", click navigates to `/tasks?taskId=X` or `/projects/{id}[?tab=sprints]`.

**Phase 6 post-testing fixes**: Five bugs fixed. (1) **Notification bell position** — moved inside `<nav>` in `AppLayout.tsx`, below My Tasks nav item. (2) **Workspace add-member notification** — added `WORKSPACE_MEMBER_ADDED` to `NotificationType` + `WORKSPACE` to `NotificationEntityType` enums; `WorkspaceService.addMember()` now hooks notification with try/catch; frontend notification types + `NotificationItem` icon and navigation updated. (3) **Workspace member removal cascade** — `WorkspaceService.removeMember()` now: (a) guards with `countProjectsWhereUserIsLastManager()` (throws `WS_005` 409 if target is sole MANAGER of any project), (b) calls `taskRepository.unassignUserFromWorkspaceTasks()` to null-out assignee across the workspace, (c) calls `projectMemberRepository.deleteByUserIdAndWorkspaceId()` to cascade project memberships, then removes workspace membership. `removeWorkspaceMember` mutation also invalidates `task.all` + `task.mine()`. (4) **Task assignee inconsistency** — `ProjectService.removeProjectMember()` now calls `taskRepository.unassignUserFromProjectTasks()` before deleting the membership; `TaskDetailPanel` injects a ghost `<option>` for the current assignee when they're no longer in the members list; `removeProjectMember` mutation invalidates `task.byProject` + `task.mine()`. (5) **Dashboard task distribution chart** — `UserStatsResponse` extended with `todoCount`, `inProgressCount`, `inReviewCount`; `UserService.getMyStats()` populates them from 3 new `TaskRepository` JPQL count queries; new `TaskStatusChart` recharts donut component added between stats row and bottom grid in `DashboardPage`.

**Phase 5 completed**: Kanban board ("Board" tab in `ProjectDetailPage`) with `@dnd-kit` drag-and-drop status change, sprint selector and backlog filter in `TaskFilters`/`TaskList`, `BacklogSection` in Sprints tab with inline "Add to Sprint" per task, "View Board" button on ACTIVE sprint cards (routes to Board tab pre-filtered to that sprint), `GET /tasks/me` backend endpoint with `MyTaskSummaryResponse` (includes `projectName`), `MyTasksPage` at `/tasks` (cross-project assigned tasks, inline `TaskDetailPanel` overlay with per-task `useProject` role fetch), `isAccessibleByUser` JPA Specification for the `getMyTasks` query, `useChangeAnyTaskStatus` mutation hook for board DnD, `task.mine` query key added to cache invalidation matrix for all task/sprint mutations. `TaskFilterParams.size` max relaxed from 20 → 100 to support board `size=100` fetch. No new DB migrations needed.

**Phase 5 post-testing fixes**: Two bugs fixed after manual testing. (1) `MyTasksPage` previously used `navigate('/projects/:id?taskId=...')` which left the user on `ProjectDetailPage` after closing the panel; fixed by rendering `TaskDetailPanel` inline on `/tasks` using `taskId`+`taskProjectId` URL params and `useProject(taskProjectId)` to derive the correct role per task. (2) Sidebar `NAV_PLANNING` section ("Sprint Board", "Kanban" both `comingSoon: true`) was misleading users into thinking boards were not implemented; removed the entire section from `AppLayout` since boards are project-scoped and accessed via the Board tab inside a project. No backend changes.

**Phase 2 refactoring completed**: Mapper bug fixed (role + joinedAt now returned in member responses), MapStruct multi-source methods replace manual builders, N+1 queries eliminated via JOIN FETCH + batch projections, pagination/filter/search added to workspace and project list endpoints, full frontend UI for edit/member management, URL-based filter state.

**Phase 2 polish completed**: Project visibility bug fixed (MEMBER sees only their own projects), mutation cache invalidation gaps closed, polling-based permission sync added (staleTime:0 + refetchInterval 10–15s), 403 component-level handling in workspace/project detail pages, debounced controlled search inputs, UI typography/truncation fixes, pagination always-visible with page-size selector.

**Phase 3 completed**: Task CRUD + Comment CRUD with full RBAC, task filters/pagination (URL-based state), task detail slide-over panel, inline title/description editing, assign/unassign via project member select, threaded comments (one level deep, `parent_id` on `comments` table V8), custom `ConfirmDialog` replacing all native `confirm()` calls, comment timestamps with time, `ConfirmDialog` UI consistent with existing modal pattern. **Not implemented in Phase 3**: `My Tasks` personal view — the `/tasks` sidebar item (`AppLayout.tsx`) is a `comingSoon: true` placeholder (non-clickable, no route registered, no backend endpoint). Deferred to Phase 5.

**Phase 3 RBAC polish completed**: Field-level task permissions enforced in both backend and frontend. `getTaskPermissions()` utility (`features/task/utils/taskPermissions.ts`) computes per-field permissions from project role + assignee context. Backend `changeTaskStatus` restricted to MANAGER/wsAdmin/assignee only (was any DEVELOPER). `updateTask` now enforces planning-field vs. content-field split — assignees may only edit description; title/priority/dueDate/storyPoints are MANAGER+ only. `addComment` restricted to DEVELOPER+ (VIEWER read-only). Frontend: `canCreateTask`, `canDeleteTask`, `canEditTitle`, `canEditDescription`, `canChangeStatus`, `canAssignTask`, `canAddComment` all enforced with disabled selects, hidden buttons, and non-interactive elements.

**Phase 4 completed**: Sprint CRUD + lifecycle (PLANNED → ACTIVE → COMPLETED), sprint-task assignment, V9 migration (sprints table + tasks.sprint_id FK), SprintService with RBAC (MANAGER/wsAdmin only for mutations), `taskRepository.clearSprintFromIncompleteTasks()` on complete (DONE tasks keep sprintId for historical record), `taskRepository.clearAllSprintTasks()` on delete, partial unique index `uq_sprints_one_active_per_project` at DB level for concurrent safety. Frontend: Sprints tab in `ProjectDetailPage`, `SprintList` with accordion cards + inline Edit modal, Sprint field in `TaskDetailPanel` (single `useProjectSprints` fetch + fallback `useSprint`), `SprintStatusBadge`. `DataIntegrityViolationException` handler added to `GlobalExceptionHandler` for race-condition safety. Deferred to Phase 5: sprint board route, sprint selector in TaskFilters, backlog named section, velocity/burndown chart.

**Phase 4 UX polish (post-testing)**: `TaskSummaryResponse` now includes `sprintId` so the task list table can show which sprint each task belongs to. Task list `TaskList.tsx` has a new Sprint column (sprint name or "Backlog"). Sprint dropdown in `TaskDetailPanel` now shows start/end dates alongside sprint name for easier selection. `SprintList` expanded cards now show a task count + top-5 task preview (`SprintTaskPreview` sub-component, fetches `useProjectTasks(sprintId, size:5)` on expand). Start/complete sprint errors replaced inline warning with modal `AlertDialog` overlay ("Only one active sprint is allowed"). RBAC bug fixed: `ProjectResponse` now includes `currentWorkspaceRole` so wsADMIN + project DEVELOPER correctly sees Sprint management buttons. `AlertDialog` component added to `components/ui/`. Sprint column fix: `TaskList` sprint name lookup was broken because `size: 50` exceeded backend `@Max(20)` on `SprintFilterParams`, causing 400 validation failure; fixed to `size: 20`. Sprint task preview now shows due date per task (format: "MMM d" or "No due date") and is sorted by due date descending (latest first, no due date last). Backend `TaskService.buildPageable()` updated to use `Sort.Order.nullsLast()` so that `ORDER BY due_date DESC NULLS LAST` is generated — previously PostgreSQL defaulted to `NULLS FIRST` for DESC, floating tasks without due dates to the top. **Phase 4 is stable and complete.**

---

## Development Commands

### Start the database (dev)
```bash
docker compose -f docker-compose.dev.yml up -d
```
This spins up PostgreSQL only. Backend and frontend run locally.

### Production (Docker)
```bash
cp .env.example .env      # điền giá trị thật trước khi chạy
docker compose up -d      # khởi động 4 services: postgres, backend, frontend, nginx
docker compose logs -f    # theo dõi logs realtime
docker compose ps         # kiểm tra trạng thái
docker compose pull && docker compose up -d --remove-orphans  # redeploy với images mới
docker compose down       # dừng stack
```
Requires `.env` file (copy từ `.env.example`). Backend và frontend dùng pre-built GHCR images. Xem [DEPLOYMENT.md](DEPLOYMENT.md) để hướng dẫn EC2 đầy đủ.

### Backend
```bash
cd backend
mvn spring-boot:run                  # run with dev profile (default)
mvn compile                          # compile only
mvn test                             # run all tests
mvn test -Dtest=ClassName#methodName # run a single test
mvn package -DskipTests              # build jar
```
No env vars needed for local dev — `application-dev.yml` has hardcoded defaults (DB: `localhost:5432`, user: `postgres`, pass: `123456789`).

### Frontend
```bash
cd frontend
npm run dev    # starts Vite dev server at http://localhost:5173
npx tsc --noEmit  # type-check without building (use before committing)
npm run lint   # ESLint
npm run build  # production build (runs tsc first)
```
Vite proxies `/api/*` → `http://localhost:8080`, so the frontend hits the local Spring Boot instance.

---

## Architecture

### Request lifecycle
```
Dev:        Browser → Vite (:5173) → proxy /api → Spring Boot (:8080) → PostgreSQL (:5432)
Production: Browser → Nginx (:80)  → [/api/* → Spring Boot (:8080) | / → React nginx (:80)] → PostgreSQL (:5432)
```
Production chạy trong Docker Compose với 4 services trên `task-manager-network` bridge. Chỉ nginx expose port 80 ra ngoài; backend, frontend, postgres là internal only. Nginx config: `nginx/nginx.conf` (mount vào `/etc/nginx/conf.d/default.conf`). Frontend là static `dist/` được serve bởi nginx:alpine bên trong container.

### Backend package structure (`com.taskmanager`)
```
config/       Spring beans, security config, CORS, Cloudinary
common/       BaseEntity, ApiResponse<T>, PageResponse<T>, enums, CloudinaryService
exception/    GlobalExceptionHandler, ErrorCode enum, BusinessException hierarchy
security/     JwtService, UserPrincipal, SecurityUtil, JWT filter
domain/
  auth/       Login, register, refresh token, logout
  user/       Profile CRUD, avatar upload
  workspace/  Workspace + member management (RBAC: OWNER > ADMIN > MEMBER)
  project/    Project + member management (RBAC: MANAGER > DEVELOPER > VIEWER)
  sprint/     (Phase 4)
  task/       (Phase 3)
  comment/    (Phase 3)
```
Each domain has `entity/`, `repository/`, `service/`, `controller/`, `dto/` sub-packages. Domains with non-trivial entity→DTO mapping also have a `mapper/` sub-package (MapStruct interfaces): currently `auth/`, `user/`, `workspace/`, `project/`.

### Frontend feature structure (`src/`)
```
api/
  axios.ts          Axios instance + JWT interceptors + auto-refresh on 401
  queryKeys.ts      Centralized TanStack Query key factory
  endpoints/        One file per domain: auth.api.ts, user.api.ts, workspace.api.ts, project.api.ts
features/
  auth/             Login, Register, hooks (useLogin, useLogout, useRegister, useAuthInitializer)
  user/             Profile/avatar hooks (useCurrentUser, useUpdateProfile, useUpdateAvatar, useChangePassword)
  workspace/        WorkspacesPage, WorkspaceDetailPage, hooks (useWorkspaceQueries, useWorkspaceMutations)
  project/          ProjectDetailPage, hooks (useProjectQueries, useProjectMutations)
  dashboard/        DashboardPage
  profile/          ProfilePage, EditProfilePage
  settings/         SettingsPage (change password)
  landing/          LandingPage (public)
layouts/            AppLayout (sidebar + user dropdown)
router/             index.tsx, ProtectedRoute, NotFoundPage
stores/             authStore (Zustand) — holds user + accessToken in memory
types/              auth.types.ts, common.types.ts, workspace.types.ts, project.types.ts
components/ui/      Avatar, Spinner
```

---

## Key Patterns and Conventions

### Backend

**Soft delete** — all main entities use:
```java
@SQLRestriction("deleted_at IS NULL")
@SQLDelete(sql = "UPDATE table SET deleted_at = NOW() WHERE id = ?")
```
`WorkspaceMember` and `ProjectMember` do NOT extend `BaseEntity` because their tables have no `deleted_at`, `created_by`, or `updated_by` columns. They get `@EntityListeners(AuditingEntityListener.class)` + `@CreatedDate`/`@LastModifiedDate` directly.

**Current user** — always use `SecurityUtil.getCurrentUserId()` (reads from JWT principal, no DB call). Never inject `HttpServletRequest` or call the DB for the current user's ID.

**API response wrapper** — three overloads, pick the right one:
```java
ApiResponse.success(data)                  // data only, message = "OK"
ApiResponse.success(data, "Custom msg")    // data + message
ApiResponse.success("Message only")        // void responses (no data field)
```

**RBAC helpers** — each service has its own `private` helpers (`findWorkspaceOrThrow`, `requireWorkspaceMembership`, etc.) that inject repositories directly. `ProjectService` injects `WorkspaceRepository` + `WorkspaceMemberRepository` directly — it does NOT call `WorkspaceService`. This keeps service-layer coupling zero and keeps `WorkspaceService`'s helpers private.

**Database migrations** — Flyway owns the schema; `ddl-auto: validate` means Hibernate never alters tables. Add new migrations as `V{n}__description.sql` in `backend/src/main/resources/db/migration/`. Never edit existing migration files.

**MapStruct + Lombok ordering** — `pom.xml` annotation processor order is Lombok → `lombok-mapstruct-binding` → MapStruct. This order is required and must not change.

**ErrorCode** — all business error codes live in `exception/ErrorCode.java`. Always use an existing code or add a new one there rather than throwing generic exceptions.

**ApiPaths** — all controllers use constants from `common/constants/ApiPaths.java` (`ApiPaths.AUTH`, `ApiPaths.USERS`, `ApiPaths.WORKSPACES`, `ApiPaths.PROJECTS`, `ApiPaths.TASKS`, `ApiPaths.COMMENTS`) in their class-level `@RequestMapping`. Never hardcode `/api/v1` strings.

**MapStruct multi-source mapping** — when a DTO needs computed/context-dependent data (e.g. `currentUserRole`, `memberCount`, `workspaceName`), use multi-source mapper methods:
```java
WorkspaceResponse toResponse(Workspace workspace, WorkspaceRole currentUserRole, long memberCount);
ProjectResponse toResponse(Project project, Workspace workspace, ProjectRole currentUserRole, long memberCount);
```
Annotate ambiguous fields explicitly: `@Mapping(target = "id", source = "project.id")`. All mappers use `unmappedTargetPolicy = ReportingPolicy.ERROR` to catch missing fields at compile time.

**Pagination pattern** — list endpoints return `PageResponse<T>` (not `List<T>`). Controllers accept `@ModelAttribute @Valid FilterParams` with `page`, `size` (default 10, min 5, max 20), `sortBy`, `sortDir`. Allowed sort fields are validated via a `ALLOWED_SORT_FIELDS` whitelist in the service's `buildPageable()` helper. Repositories extend `JpaSpecificationExecutor<T>` for filter support.

**Specification pattern** — filter logic lives in `domain/{name}/specification/{Name}Specification.java` as static factory methods returning `Specification<T>`. Use subquery pattern to filter by membership without mapping `@OneToMany` on entity classes:
```java
public static Specification<Workspace> memberOfUser(UUID userId) {
    return (root, query, cb) -> {
        var sub = query.subquery(UUID.class);
        var wm = sub.from(WorkspaceMember.class);
        sub.select(wm.get("workspace").get("id"))
           .where(cb.equal(wm.get("user").get("id"), userId));
        return root.get("id").in(sub);
    };
}
```

**N+1 prevention rules**:
- `@ManyToOne` JOIN FETCH is safe even with pagination (no row multiplication).
- `@OneToMany` JOIN FETCH with pagination triggers Hibernate HHH90003004 (in-memory pagination) — **never use this**.
- Use batch queries (2 flat queries) instead of per-entity queries: `findByUserIdAndWorkspaceIdIn()` + `countMembersByWorkspaceIds()` return all roles and counts in one round-trip per list page.
- Use interface projections (`MemberCountView` with `getWorkspaceId()`/`getMemberCount()`) instead of `Object[]` for type-safe batch count queries.

**User search endpoint** — `GET /api/v1/users/search?email=xxx` returns `UserResponse` for exact email match. Used by "add member" modals in the frontend. Required because `AddMemberRequest` takes `userId`, not email.

**ProjectStatus enum** — `Project.status` is `ProjectStatus` (`ACTIVE | ARCHIVED`), stored as string via `@Enumerated(EnumType.STRING)`. Follow this same pattern for any status/state field in future entities (e.g., `TaskStatus`, `SprintStatus` — enums, not strings).

### Frontend

**`verbatimModuleSyntax: true`** — all type-only imports MUST use `import type`. The compiler rejects `import { SomeType }` when the value is only used as a type.

**Axios and FormData** — `axios.create()` has NO default `Content-Type`. Axios auto-sets `application/json` for plain objects and lets the browser set `multipart/form-data; boundary=...` for `FormData`. Never set `Content-Type: application/json` as an Axios instance default — it causes FormData to be JSON-serialized.

**Access token** — stored in-memory in `axios.ts` as a module-level variable (`let accessToken`). Never in `localStorage`. The 401 interceptor auto-refreshes using the HttpOnly refresh token cookie and retries the original request.

**Query keys** — always use `queryKeys.*` from `src/api/queryKeys.ts` for consistency across queries and cache invalidation.

**Auth store** — `authStore` (Zustand) exposes `updateUser(user)` to update the in-memory user object after profile edits without re-fetching.

**Pagination in queries** — hooks that fetch paginated lists accept a `FilterParams` object and pass it directly as query params. Use `placeholderData: (prev) => prev` (TanStack Query v5 pattern, replaces deprecated `keepPreviousData`) so the previous page remains visible while the next page loads.

**Filter state in URL** — all filter/search/sort/page params live in URL search params via `useSearchParams()`, not in component state. This makes pages shareable and supports back-button navigation. Update params with `setSearchParams((prev) => { ... })` to preserve unrelated params. Reset `page` to 0 whenever a non-page param changes.

**Pagination UI pattern** — shared component at `src/components/ui/Pagination.tsx`. Always render when `totalElements > 0`; hidden only when `totalElements === 0`. Layout: left side = icon navigation (first ⏮ / prev ◀ / Page X of Y / next ▶ / last ⏭), right side = rows-per-page selector (5 / 10 / 20) + "X–Y of Z" count. The `size` URL param controls page size; reset `page` to 0 on size change. `safeTotalPages` is computed as `Math.max(totalPages, Math.ceil(totalElements / pageSize), 1)` to prevent stale `totalPages` from placeholder data incorrectly disabling Next when page size just changed.

**Add member flow** — two-phase: (1) search user by email via `GET /users/search?email=xxx`, (2) confirm user identity + select role, (3) POST with userId + role. The search and add are separate API calls. Search errors (404) display inline; mutation errors display below the form.

**Debounced search** — search inputs are controlled (`value` + `onChange`). Local `searchInput` state feeds `useDebounce(searchInput, 300)` from `src/hooks/useDebounce.ts`. A `useEffect` syncs the debounced value to URL search params with `{ replace: true }` to avoid polluting browser history. Removing the value deletes the param and resets page to 0. **Critical**: the `useEffect` deps must be `[debouncedSearch]` only — do NOT include `setSearchParams`. React Router creates a new `setSearchParams` identity on every URL change (its `useCallback` depends on `searchParams`). Including it in deps causes the effect to fire on every navigation, deleting `page` and resetting back to page 0.

**Permission sync — Phase 2 TEMPORARY** — critical queries override the global 5-minute staleTime with `staleTime: 0` + `refetchInterval` so role/membership changes by other users are visible within 10–15 seconds without a reload. This is a Phase 2 stopgap; Phase 3+ will replace with WebSocket/SSE events.

| Hook | `staleTime` | `refetchInterval` |
|------|------------|------------------|
| `useWorkspace(id)` | 0 | 15 000 ms |
| `useWorkspaceMembers(id)` | 0 | 10 000 ms |
| `useWorkspaceProjects(id, params)` | 0 | 15 000 ms |
| `useProject(id)` | 0 | 15 000 ms |
| `useProjectMembers(id)` | 0 | 10 000 ms |
| `useMyWorkspaces(params)` | 0 | — (window focus only) |
| `useProjectTasks(id, params)` | 0 | 15 000 ms |
| `useTask(id)` | 0 | 15 000 ms |
| `useTaskComments(taskId)` | 0 | 15 000 ms |
| `useProjectSprints(id, params)` | 0 | 15 000 ms |
| `useSprint(id)` | 0 | 15 000 ms |
| `useMyTasks(params)` | 0 | 15 000 ms |
| `useNotifications(params)` | 0 | 30 000 ms |
| `useUnreadNotificationCount()` | 0 | 30 000 ms |
| `useDashboardStats()` | 0 | 60 000 ms |

**403 handling — component level only** — When a workspace or project data fetch returns 403, the component renders an "access revoked" message and calls `navigate('/workspaces')` after 2 seconds via `useEffect`. The Axios interceptor does NOT handle 403 globally because mutation 403s (e.g. "insufficient role" on a form submit) must show inline errors instead of redirecting. All 403s share `code: "CMN_001"` — use HTTP status 403 alone to detect access-revoked in `WorkspaceDetailPage` and `ProjectDetailPage`.

**Mutation cache invalidation** — every mutation must invalidate all queries whose data it changes. Full matrix:

| Mutation | Invalidations |
|---|---|
| `createWorkspace` | `workspace.lists()` |
| `updateWorkspace` | `setQueryData workspace.detail(id)` + `workspace.lists()` |
| `deleteWorkspace` | `workspace.lists()` |
| `addWorkspaceMember` | `workspace.members(id)` + `workspace.detail(id)` |
| `updateMemberRole` | `workspace.members(id)` + `workspace.detail(id)` |
| `removeWorkspaceMember` | `workspace.members(id)` + `workspace.detail(id)` + **`task.all`** + **`task.mine()`** |
| `createProject` | `project.byWorkspace(workspaceId)` |
| `updateProject` | `setQueryData project.detail(id)` + `project.byWorkspace(workspaceId)` |
| `archiveProject` | `setQueryData project.detail(id)` + `project.byWorkspace(workspaceId)` |
| `addProjectMember` | `project.members(id)` + `project.detail(id)` |
| `removeProjectMember` | `project.members(id)` + `project.detail(id)` + **`task.byProject(projectId)`** + **`task.mine()`** |
| `createTask` | `task.byProject(projectId)` + `task.mine()` |
| `updateTask` | `setQueryData task.detail(id)` + `task.byProject(projectId)` + `task.mine()` |
| `deleteTask` | `task.byProject(projectId)` + `task.mine()` |
| `changeTaskStatus` | `setQueryData task.detail(id)` + `task.byProject(projectId)` + `task.mine()` |
| `changeAnyTaskStatus` (Kanban DnD) | `setQueryData task.detail(id)` + `task.byProject(projectId)` + `task.mine()` |
| `assignTask` | `setQueryData task.detail(id)` + `task.byProject(projectId)` + `task.mine()` |
| `addComment` | `task.comments(taskId)` |
| `updateComment` | `task.comments(taskId)` |
| `deleteComment` | `task.comments(taskId)` |
| `createSprint` | `sprint.byProject(projectId)` |
| `updateSprint` | `setQueryData sprint.detail(id)` + `sprint.byProject(projectId)` |
| `deleteSprint` | `sprint.byProject(projectId)` |
| `startSprint` | `setQueryData sprint.detail(id)` + `sprint.byProject(projectId)` |
| `completeSprint` | `setQueryData sprint.detail(id)` + `sprint.byProject(projectId)` + **`task.all`** |
| `addTaskToSprint` | `task.detail(taskId)` + `task.byProject(projectId)` + `task.mine()` |
| `removeTaskFromSprint` | `task.detail(taskId)` + `task.byProject(projectId)` + `task.mine()` |
| `markNotificationRead` | `notification.all` |
| `markAllNotificationsRead` | `notification.all` |

---

## Security Model

Three-level RBAC:
- **System**: `ROLE_USER` / `ROLE_ADMIN` (on `users.system_role`)
- **Workspace**: `OWNER > ADMIN > MEMBER` (`WorkspaceRole` enum — `isAtLeast()` uses ordinal order)
- **Project**: `MANAGER > DEVELOPER > VIEWER` (`ProjectRole` enum — same pattern)

Permission rules enforced in service layer:
- Workspace creation/deletion: `OWNER` only for delete, `ADMIN+` for most mutations
- Project creation: workspace `ADMIN+`
- Project mutations (update, archive, member management): project `MANAGER` OR workspace `ADMIN+`
- Viewing workspace/project: any member
- **Project visibility in list**: workspace `MEMBER` sees only projects they are explicitly a member of; workspace `ADMIN`/`OWNER` sees all. Enforced in `ProjectService.getWorkspaceProjects()` via `ProjectSpecification.memberOfUser(UUID)` — only applied when requester is not workspace ADMIN+.

**Task RBAC matrix** (enforced in `TaskService` + `CommentService`; mirrored in frontend via `getTaskPermissions()`):

| Action | VIEWER | DEVELOPER (non-assignee) | DEVELOPER (assignee) | MANAGER | wsADMIN/OWNER |
|---|---|---|---|---|---|
| View tasks/comments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create task | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit title | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit description | ❌ | ❌ | ✅ | ✅ | ✅ |
| Change status | ❌ | ❌ | ✅ | ✅ | ✅ |
| Assign/Unassign | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete task | ❌ | ❌ | ❌ | ✅ | ✅ |
| Add/Reply comment | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit own comment | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete own comment | ❌ | ✅ | ✅ | ✅ | ✅ |

Frontend utility: `src/features/task/utils/taskPermissions.ts` — `getTaskPermissions(role, assigneeId?, currentUserId?)` returns `TaskPerms` with one boolean per action/field. `role === null` = workspace admin with implicit full access.

**`ProjectResponse` includes both `currentUserRole` (project role) and `currentWorkspaceRole` (workspace role).** Use `currentWorkspaceRole` to compute `isWorkspaceAdmin` on the frontend (`OWNER` or `ADMIN`). `canManage` in `ProjectDetailPage` = `currentUserRole === 'MANAGER' || isWorkspaceAdmin`. This is required because a wsADMIN who is also a project DEVELOPER has `currentUserRole = 'DEVELOPER'` — checking only project role would incorrectly hide manager UI for them.

---

## Database

Primary keys are UUID v4 (`@GeneratedValue(strategy = GenerationType.UUID)`). All entity tables have `created_at`, `updated_at`, `created_by`, `updated_by` from `BaseEntity` (Spring Data Auditing). Member join tables (`workspace_members`, `project_members`) only have `created_at` and `updated_at`.

The `key` column on `projects` (e.g. `"PROJ"`) is UNIQUE per workspace and used to generate task IDs (`PROJ-1`, `PROJ-2`, …). It must match `^[A-Z0-9]{1,10}$`.

---

## Documentation

Architecture decisions, ERD, API conventions, and the development roadmap are in `docs/`. These are the source of truth for anything not yet implemented:
- `docs/DATABASE_DESIGN.md` — full table definitions, indexes
- `docs/SYSTEM_ARCHITECTURE.md` — request flows, auth flow diagrams, route table
- `docs/PROJECT_GUIDELINE.md` — coding/API/git conventions
- `docs/PROJECT_ROADMAP.md` — phase breakdown and implementation order
