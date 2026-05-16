# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 — Foundation | Spring Boot skeleton, DB, Flyway, base classes | ✅ Done |
| 1 — Auth & User | JWT auth, refresh token rotation, user profile, avatar (Cloudinary) | ✅ Done |
| 2 — Workspace & Project | Workspace/project CRUD + member RBAC, full frontend | ✅ Done |
| 3 — Task Management | Task CRUD, filtering, comments | 🔜 **Next** |
| 4 — Sprint Management | Sprint lifecycle (PLANNED → ACTIVE → COMPLETED) | Pending |
| 5 — Frontend (advanced) | Kanban board, drag-and-drop, sprint UI | Pending |
| 6 — Docker & Deploy | Dockerize, AWS EC2 | Pending |

**DB migrations applied**: V1 (users) → V2 (refresh_tokens) → V3 (avatar_public_id) → V4 (workspaces + workspace_members) → V5 (projects + project_members). **Next**: V6 (tasks), V7 (comments).

**Current focus**: Implement Phase 3. Start with the `task/` domain: entity, repository, service, controller, DTOs. See `docs/PROJECT_ROADMAP.md` for endpoint list and `docs/DATABASE_DESIGN.md` for table schema.

**Phase 2 refactoring completed**: Mapper bug fixed (role + joinedAt now returned in member responses), MapStruct multi-source methods replace manual builders, N+1 queries eliminated via JOIN FETCH + batch projections, pagination/filter/search added to workspace and project list endpoints, full frontend UI for edit/member management, URL-based filter state.

**Phase 2 polish completed**: Project visibility bug fixed (MEMBER sees only their own projects), mutation cache invalidation gaps closed, polling-based permission sync added (staleTime:0 + refetchInterval 10–15s), 403 component-level handling in workspace/project detail pages, debounced controlled search inputs, UI typography/truncation fixes, pagination always-visible with page-size selector.

---

## Development Commands

### Start the database (dev)
```bash
docker compose -f docker-compose.dev.yml up -d
```
This spins up PostgreSQL only. Backend and frontend run locally.

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
Browser → Vite (:5173) → proxy /api → Spring Boot (:8080) → PostgreSQL (:5432)
```
In production everything runs in Docker behind Nginx; Nginx routes `/api` to the backend container and `/` to the frontend container.

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

**403 handling — component level only** — When a workspace or project data fetch returns 403, the component renders an "access revoked" message and calls `navigate('/workspaces')` after 2 seconds via `useEffect`. The Axios interceptor does NOT handle 403 globally because mutation 403s (e.g. "insufficient role" on a form submit) must show inline errors instead of redirecting. All 403s share `code: "CMN_001"` — use HTTP status 403 alone to detect access-revoked in `WorkspaceDetailPage` and `ProjectDetailPage`.

**Mutation cache invalidation** — every mutation must invalidate all queries whose data it changes. Full matrix:

| Mutation | Invalidations |
|---|---|
| `createWorkspace` | `workspace.lists()` |
| `updateWorkspace` | `setQueryData workspace.detail(id)` + `workspace.lists()` |
| `deleteWorkspace` | `workspace.lists()` |
| `addWorkspaceMember` | `workspace.members(id)` + `workspace.detail(id)` |
| `updateMemberRole` | `workspace.members(id)` + `workspace.detail(id)` |
| `removeWorkspaceMember` | `workspace.members(id)` + `workspace.detail(id)` |
| `createProject` | `project.byWorkspace(workspaceId)` |
| `updateProject` | `setQueryData project.detail(id)` + `project.byWorkspace(workspaceId)` |
| `archiveProject` | `setQueryData project.detail(id)` + `project.byWorkspace(workspaceId)` |
| `addProjectMember` | `project.members(id)` + `project.detail(id)` |
| `removeProjectMember` | `project.members(id)` + `project.detail(id)` |

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
