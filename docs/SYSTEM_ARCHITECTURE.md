# System Architecture — Task & Team Management System

> Version: 1.1 | Last updated: 2026-05-16

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET / CLIENT                        │
│              (Browser, Mobile App, Postman, etc.)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (443) / HTTP (80)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS EC2 Ubuntu 22.04                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Nginx Reverse Proxy                     │  │
│  │                  (Port 80 / 443)                          │  │
│  │                                                           │  │
│  │  /          → Frontend React (port 3000)                  │  │
│  │  /api/v1/*  → Backend Spring Boot (port 8080)             │  │
│  └───────────────────────────────────────────────────────────┘  │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌─────────────────┐         ┌────────────────────┐             │
│  │ Frontend React  │         │  Backend Spring    │             │
│  │   (port 3000)   │         │  Boot (port 8080)  │             │
│  │   Vite Build    │         │  Java 21 + Maven   │             │
│  └─────────────────┘         └─────────┬──────────┘             │
│                                        │                        │
│                              ┌─────────▼──────────┐             │
│                              │   PostgreSQL 16     │             │
│                              │   (port 5432)       │             │
│                              └────────────────────┘             │
│                                                                  │
│  All containers communicate via: task-manager-network (bridge)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Java | 21 (LTS) |
| Framework | Spring Boot | 3.x |
| Security | Spring Security 6 + OAuth2 Resource Server (Nimbus JWT) | 6.x |
| Mapping | MapStruct | 1.6.x |
| File Storage | Cloudinary (image upload/delete) | SDK 1.39.x |
| Persistence | Spring Data JPA + Hibernate | - |
| Database | PostgreSQL | 16 |
| Migrations | Flyway | - |
| Build | Maven | 3.9+ |
| Containerization | Docker | - |

### 2.2 Package Structure (Domain-Driven Design Lite)

```
src/main/java/com/taskmanager/
│
├── TaskManagerApplication.java          # Entry point
│
├── config/                              # Spring configurations
│   ├── SecurityConfig.java              # Spring Security chain
│   ├── JwtConfig.java                   # JWT properties
│   ├── CorsConfig.java                  # CORS settings
│   ├── JacksonConfig.java               # JSON serialization
│   └── OpenApiConfig.java               # Swagger/OpenAPI
│
├── common/                              # Shared components
│   ├── response/
│   │   ├── ApiResponse.java             # Standard response wrapper
│   │   └── PageResponse.java            # Paginated response
│   ├── upload/
│   │   ├── CloudinaryService.java       # Upload/delete images (validates MIME, size)
│   │   └── CloudinaryUploadResult.java  # Record: url + publicId
│   ├── entity/
│   │   └── BaseEntity.java              # Audit fields (createdAt, updatedAt...)
│   ├── enums/
│   │   ├── TaskStatus.java
│   │   ├── TaskPriority.java
│   │   ├── SprintStatus.java
│   │   ├── WorkspaceRole.java
│   │   └── ProjectRole.java
│   └── util/
│       └── PageUtil.java
│
├── exception/                           # Global exception handling
│   ├── GlobalExceptionHandler.java      # @ControllerAdvice
│   ├── ErrorCode.java                   # Enum of business error codes
│   ├── ErrorResponse.java
│   ├── BusinessException.java           # Base checked exception
│   ├── ResourceNotFoundException.java
│   ├── AccessDeniedException.java
│   └── ConflictException.java
│
├── security/                            # Security infrastructure
│   ├── JwtService.java                  # JWT token generation (encode only)
│   ├── JwtToPrincipalConverter.java     # Jwt claims → UserPrincipal (no DB)
│   ├── UserDetailsServiceImpl.java      # Load user from DB (login flow only)
│   ├── SecurityUtil.java                # Get current user from context
│   ├── CustomAuthenticationEntryPoint.java
│   └── CustomAccessDeniedHandler.java
│
└── domain/                              # Business domains
    │
    ├── auth/                            # Authentication
    │   ├── controller/
    │   │   └── AuthController.java
    │   ├── service/
    │   │   └── AuthService.java
    │   ├── mapper/
    │   │   └── AuthMapper.java          # RegisterRequest → User (no password)
    │   ├── dto/
    │   │   ├── LoginRequest.java
    │   │   ├── RegisterRequest.java
    │   │   └── AuthResponse.java
    │   ├── repository/
    │   │   └── RefreshTokenRepository.java
    │   └── entity/
    │       └── RefreshToken.java
    │
    ├── user/
    │   ├── controller/UserController.java
    │   ├── service/UserService.java
    │   ├── mapper/
    │   │   └── UserMapper.java          # User → UserResponse (MapStruct)
    │   ├── repository/UserRepository.java
    │   ├── dto/
    │   │   ├── UserResponse.java
    │   │   ├── UpdateProfileRequest.java
    │   │   └── ChangePasswordRequest.java
    │   └── entity/User.java
    │
    ├── workspace/
    │   ├── controller/WorkspaceController.java
    │   ├── service/WorkspaceService.java
    │   ├── repository/
    │   │   ├── WorkspaceRepository.java
    │   │   └── WorkspaceMemberRepository.java
    │   ├── dto/...
    │   └── entity/
    │       ├── Workspace.java
    │       └── WorkspaceMember.java
    │
    ├── project/
    │   ├── controller/ProjectController.java
    │   ├── service/ProjectService.java
    │   ├── repository/
    │   │   ├── ProjectRepository.java
    │   │   └── ProjectMemberRepository.java
    │   ├── dto/...
    │   └── entity/
    │       ├── Project.java
    │       └── ProjectMember.java
    │
    ├── sprint/
    │   ├── controller/SprintController.java
    │   ├── service/SprintService.java
    │   ├── repository/SprintRepository.java
    │   ├── dto/...
    │   └── entity/Sprint.java
    │
    ├── task/
    │   ├── controller/TaskController.java
    │   ├── service/TaskService.java
    │   ├── repository/TaskRepository.java
    │   ├── dto/...
    │   └── entity/
    │       ├── Task.java
    │       └── TaskLabel.java
    │
    └── comment/
        ├── controller/CommentController.java
        ├── service/CommentService.java
        ├── repository/CommentRepository.java
        ├── dto/...
        └── entity/Comment.java
```

### 2.3 Layer Responsibilities

```
Controller  → Nhận HTTP request, validate input, gọi Service, trả response
   │             KHÔNG chứa business logic
   │
Service     → Business logic, orchestrate repositories, throw business exceptions
   │             KHÔNG query DB trực tiếp (dùng Repository)
   │
Repository  → JPA queries, JPQL, Specifications
   │             KHÔNG chứa business logic
   │
Entity      → JPA mapping, audit fields
                KHÔNG chứa business logic (chỉ getter/setter, simple helpers)
```

### 2.4 Request/Response Flow

```
HTTP Request
    │
    ▼
BearerTokenAuthenticationFilter  (Spring OAuth2 Resource Server built-in)
    │ Extract Bearer token from Authorization header
    │ Decode & validate JWT via NimbusJwtDecoder
    │ JwtToPrincipalConverter: Jwt claims → UserPrincipal (no DB lookup)
    │ Set SecurityContext
    ▼
SecurityConfig (check permissions via authorizeHttpRequests)
    │
    ▼
Controller (@RestController)
    │ @Valid — trigger Bean Validation
    │ Delegate to Service (no business logic here)
    ▼
Service (@Service, @Transactional)
    │ Business logic
    │ Authorization check (SecurityUtil.getCurrentUserId())
    │ Call Repository for data access
    ▼
Repository (@Repository)
    │ Spring Data JPA / JPQL queries
    ▼
Database (PostgreSQL)
    │
    ▼
MapStruct Mapper (Entity → Response DTO)
    │ UserMapper.toResponse(user)
    ▼
ApiResponse.success(data)
    │
    ▼
HTTP Response (200/201/204)

--- Error Path ---

Service throws BusinessException / ConflictException
    │
GlobalExceptionHandler (@RestControllerAdvice)
    │
ErrorResponse (JSON)
    │
HTTP Response (4xx/5xx)
```

---

## 3. Authentication & Authorization Architecture

### 3.1 Auth Flow

#### Register → Login (two-step, no auto-login)

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Client  │         │  Auth API    │         │  DB      │
└────┬─────┘         └──────┬───────┘         └────┬─────┘
     │                      │                      │
     │  POST /auth/register  │                      │
     │─────────────────────►│                      │
     │                      │  Check email unique  │
     │                      │─────────────────────►│
     │                      │◄─────────────────────│
     │                      │  BCrypt(password)    │
     │                      │  Save User to DB     │
     │                      │─────────────────────►│
     │  201 { id, email }   │                      │
     │◄─────────────────────│                      │
     │  (no token issued)   │                      │
     │  redirect → /login   │                      │
     │                      │                      │
     │  POST /auth/login     │                      │
     │─────────────────────►│                      │
     │                      │  Query user by email │
     │                      │─────────────────────►│
     │                      │◄─────────────────────│
     │                      │  Verify BCrypt hash  │
     │                      │  Generate JWT (30m)  │
     │                      │  Generate RT (7d)    │
     │                      │  Save RT to DB       │
     │                      │─────────────────────►│
     │  accessToken (body)  │                      │
     │  refreshToken (HttpOnly Cookie)              │
     │◄─────────────────────│                      │
```

#### Protected API call

```
     │  API call + Bearer token                    │
     │─────────────────────►│                      │
     │                      │  BearerTokenFilter   │
     │                      │  NimbusJwtDecoder    │
     │                      │  JwtToPrincipal      │
     │                      │  → UserPrincipal     │
     │                      │    (no DB lookup)    │
     │  Response data        │                      │
     │◄─────────────────────│                      │
```

### 3.2 Refresh Token Strategy

```
[Access Token expires]
        │
Client → POST /auth/refresh (refresh token in Cookie)
        │
Backend:
  1. Extract refresh token from HttpOnly Cookie
  2. Find token in DB
  3. Check: not expired, not revoked
  4. Revoke old refresh token (rotation)
  5. Generate new access token
  6. Generate new refresh token
  7. Save new refresh token to DB
  8. Return new access token + Set-Cookie new refresh token
        │
Client nhận access token mới → tiếp tục
```

**Tại sao dùng HttpOnly Cookie cho refresh token?**
- JavaScript không thể đọc được → bảo vệ khỏi XSS
- Tự động gửi cùng request → không cần manually attach
- Kết hợp `Secure` flag → chỉ gửi qua HTTPS

**Tại sao lưu refresh token trong DB thay vì Redis?**
- Đơn giản hơn cho solo dev — không cần thêm infrastructure
- Vẫn có thể revoke token bất kỳ lúc nào
- Đủ cho quy mô MVP
- Có thể migrate sang Redis sau khi cần performance

### 3.3 Authorization Strategy

Authorization check diễn ra tại **Service layer**:

```java
// Example: User chỉ có thể update task nếu là MANAGER hoặc assignee
public TaskResponse updateTask(UUID taskId, UpdateTaskRequest request) {
    Task task = findTaskOrThrow(taskId);
    User currentUser = SecurityUtil.getCurrentUser();

    // Check project membership và role
    ProjectMember member = findProjectMember(task.getProject().getId(), currentUser.getId());

    boolean isManager = member.getRole() == ProjectRole.MANAGER;
    boolean isAssignee = task.getAssignee() != null
                         && task.getAssignee().getId().equals(currentUser.getId());

    if (!isManager && !isAssignee) {
        throw new AccessDeniedException("Bạn không có quyền sửa task này");
    }

    // ... proceed
}
```

**Tại sao không dùng @PreAuthorize hoàn toàn?**
- Authorization của hệ thống này phụ thuộc vào **context** (task thuộc project nào, user có role gì trong project đó)
- `@PreAuthorize` chỉ xử lý được static role checks tốt
- Business-level authorization (MANAGER của PROJECT CỤ THỂ) cần xử lý trong service

### 3.4 Project Visibility Rule

A workspace membership check alone is not sufficient to grant access to all projects inside that workspace.

| Workspace Role | Projects visible in list |
|---|---|
| `OWNER` / `ADMIN` | All projects in the workspace |
| `MEMBER` | Only projects the user is explicitly a member of |

**Implementation:** `ProjectService.getWorkspaceProjects()` calls `requireWorkspaceMembership()` to get the caller's workspace role. If the role is below `ADMIN`, `ProjectSpecification.memberOfUser(userId)` is AND-ed onto the query — this is a JPA subquery on `project_members`. Workspace ADMINs skip this filter and see all projects.

This rule applies to the **list endpoint only**. The single-project GET endpoint (`getProjectById`) has its own access check: user must be either a project member OR a workspace ADMIN+.

---

## 4. Frontend Architecture

### 4.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | TailwindCSS 3 |
| HTTP | Axios 1.x (với interceptors) |
| Server State | TanStack Query v5 |
| Client State | Zustand 5 |
| Routing | React Router v7 |
| Form | React Hook Form 7 + Zod 4 |

### 4.2 Directory Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                         # Entry point
│   ├── App.tsx                          # QueryClientProvider + useAuthInitializer
│   │
│   ├── api/                             # Axios instance & API modules
│   │   ├── axios.ts                     # apiClient, setAccessToken, auto-refresh interceptor
│   │   └── endpoints/
│   │       ├── auth.api.ts              # register, login, refresh, logout
│   │       └── user.api.ts              # getMe, updateProfile, changePassword, updateAvatar
│   │
│   ├── components/ui/                   # Generic reusable primitives
│   │   ├── Spinner.tsx                  # Loading spinner (sm/md/lg)
│   │   └── Avatar.tsx                   # Initials/image avatar (sm/md/lg/xl)
│   │
│   ├── layouts/
│   │   └── AppLayout.tsx                # Dark sidebar + user dropdown + Outlet
│   │
│   ├── features/                        # Feature modules (co-located by domain)
│   │   ├── auth/
│   │   │   ├── components/              # LoginForm, RegisterForm
│   │   │   ├── hooks/                   # useLogin, useRegister, useLogout, useAuthInitializer
│   │   │   └── pages/                   # LoginPage (dark gradient), RegisterPage (dark gradient)
│   │   ├── landing/
│   │   │   └── pages/
│   │   │       └── LandingPage.tsx      # Public SaaS landing page (hero, features, CTA, footer)
│   │   ├── user/
│   │   │   └── hooks/
│   │   │       ├── useCurrentUser.ts    # GET /users/me via React Query
│   │   │       ├── useUpdateProfile.ts  # PATCH /users/me — updates store + query cache
│   │   │       ├── useChangePassword.ts # PATCH /users/me/password
│   │   │       └── useUpdateAvatar.ts   # PATCH /users/me/avatar — updates store + query cache
│   │   ├── dashboard/
│   │   │   └── pages/
│   │   │       └── DashboardPage.tsx    # Stats row + quick actions + activity empty state
│   │   ├── profile/
│   │   │   └── pages/
│   │   │       ├── ProfilePage.tsx      # View profile (avatar, name, email, role, dates)
│   │   │       └── EditProfilePage.tsx  # Edit name + avatar upload (calls updateProfile/updateAvatar)
│   │   ├── settings/
│   │   │   └── pages/
│   │   │       └── SettingsPage.tsx     # Change password form + danger zone placeholder
│   │   ├── workspace/                   # Phase 2 — WorkspacesPage, WorkspaceDetailPage (RBAC, members, projects, pagination)
│   │   ├── project/                     # Phase 2 — ProjectDetailPage (members, tasks placeholder, pagination)
│   │   ├── task/                        # Phase 3 — not yet implemented
│   │   └── sprint/                      # Phase 4 — not yet implemented
│   │
│   ├── stores/
│   │   └── authStore.ts                 # Zustand: user, isAuthenticated, isInitializing, updateUser
│   │
│   ├── types/
│   │   ├── auth.types.ts                # UserResponse, AuthResponse, LoginRequest, RegisterRequest
│   │   └── common.types.ts              # ApiResponse<T>, PageResponse<T>, ApiError, enums
│   │
│   └── router/
│       ├── index.tsx                    # Route tree: / landing, /login, /register, protected, 404
│       ├── ProtectedRoute.tsx           # Auth guard — spinner during init, redirect if unauth
│       └── NotFoundPage.tsx             # Custom 404
│
├── .env.development
├── .env.production
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.3 Route Structure

| Path | Component | Access |
|------|-----------|--------|
| `/` | `LandingPage` | Public |
| `/login` | `LoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/dashboard` | `DashboardPage` | Protected |
| `/workspaces` | `WorkspacesPage` | Protected |
| `/workspaces/:id` | `WorkspaceDetailPage` | Protected |
| `/projects/:id` | `ProjectDetailPage` | Protected |
| `/profile` | `ProfilePage` | Protected |
| `/profile/edit` | `EditProfilePage` | Protected |
| `/settings` | `SettingsPage` | Protected |
| `*` | `NotFoundPage` | Public |

Protected routes are wrapped in `ProtectedRoute → AppLayout`. `ProtectedRoute` checks Zustand auth state, shows a spinner during JWT initialization, then redirects to `/login` if unauthenticated.

### 4.4 Backend API Endpoints (Phase 1 & 2)

| Method | Path | Response | Notes |
|--------|------|----------|-------|
| POST | `/api/v1/auth/register` | `UserResponse` | |
| POST | `/api/v1/auth/login` | `AuthResponse` | Sets HttpOnly refresh cookie |
| POST | `/api/v1/auth/refresh` | `AuthResponse` | |
| POST | `/api/v1/auth/logout` | void | |
| GET | `/api/v1/users/me` | `UserResponse` | |
| PATCH | `/api/v1/users/me` | `UserResponse` | |
| PATCH | `/api/v1/users/me/avatar` | `UserResponse` | multipart/form-data |
| PATCH | `/api/v1/users/me/password` | void | |
| GET | `/api/v1/users/search?email=` | `UserResponse` | Exact email lookup |
| GET | `/api/v1/workspaces` | `PageResponse<WorkspaceSummaryResponse>` | `?search&sortBy&sortDir&page&size` |
| POST | `/api/v1/workspaces` | `WorkspaceResponse` | |
| GET | `/api/v1/workspaces/:id` | `WorkspaceResponse` | |
| PUT | `/api/v1/workspaces/:id` | `WorkspaceResponse` | ADMIN+ |
| DELETE | `/api/v1/workspaces/:id` | void | OWNER only |
| GET | `/api/v1/workspaces/:id/members` | `List<WorkspaceMemberResponse>` | |
| POST | `/api/v1/workspaces/:id/members` | `WorkspaceMemberResponse` | ADMIN+ |
| PATCH | `/api/v1/workspaces/:id/members/:userId` | `WorkspaceMemberResponse` | ADMIN+ |
| DELETE | `/api/v1/workspaces/:id/members/:userId` | void | ADMIN+ |
| GET | `/api/v1/workspaces/:id/projects` | `PageResponse<ProjectSummaryResponse>` | `?search&status&sortBy&sortDir&page&size` |
| POST | `/api/v1/workspaces/:id/projects` | `ProjectResponse` | ADMIN+ |
| GET | `/api/v1/projects/:id` | `ProjectResponse` | |
| PUT | `/api/v1/projects/:id` | `ProjectResponse` | MANAGER or workspace ADMIN+ |
| POST | `/api/v1/projects/:id/archive` | `ProjectResponse` | MANAGER or workspace ADMIN+ |
| GET | `/api/v1/projects/:id/members` | `List<ProjectMemberResponse>` | |
| POST | `/api/v1/projects/:id/members` | `ProjectMemberResponse` | MANAGER or workspace ADMIN+ |
| DELETE | `/api/v1/projects/:id/members/:userId` | void | MANAGER or workspace ADMIN+ |

### 4.5 API Call Pattern

```typescript
// 1. Axios instance với interceptors (src/api/axios.ts)
const axiosInstance = axios.create({ baseURL: '/api/v1' });

// Request interceptor: attach access token
axiosInstance.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto refresh on 401
axiosInstance.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    const newToken = await refreshAccessToken();
    authStore.getState().setAccessToken(newToken);
    return axiosInstance(error.config);
  }
  return Promise.reject(error);
});

// 2. React Query hook (src/features/task/hooks/useTasks.ts)
export const useTasks = (projectId: string) =>
  useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskApi.getByProject(projectId),
  });
```

### 4.6 Permission Synchronization

When user A changes user B's role — or removes B from a workspace/project — B's browser must reflect the change without requiring a manual reload.

#### Phase 2 — Polling (TEMPORARY stopgap)

The global `QueryClient` in `App.tsx` has `staleTime: 5 minutes`. This is overridden per-hook for permission-sensitive queries:

| Hook | `staleTime` | `refetchInterval` | Rationale |
|------|------------|------------------|-----------|
| `useWorkspace(id)` | 0 | 15 s | Contains `currentUserRole` |
| `useWorkspaceMembers(id)` | 0 | 10 s | Role changes + removals |
| `useWorkspaceProjects(id, params)` | 0 | 15 s | Visibility depends on membership |
| `useProject(id)` | 0 | 15 s | Contains `currentUserRole` |
| `useProjectMembers(id)` | 0 | 10 s | Role changes + removals |
| `useMyWorkspaces(params)` | 0 | — | Window-focus only |

`staleTime: 0` also re-enables TanStack Query's default `refetchOnWindowFocus`, so switching back to a browser tab immediately re-fetches stale data without waiting for the next polling tick. Max observed lag: ~15 seconds.

**403 handling** — when a poll or focus-refetch returns 403, the workspace or project detail page renders "You no longer have access" and auto-redirects to `/workspaces` after 2 seconds. The Axios interceptor does NOT globally redirect on 403 — doing so would break mutation-level 403s (e.g. "insufficient role" on a form submit). All permission 403s share `code: "CMN_001"`, so HTTP status 403 alone is used to detect access-revoked scenarios at the component level.

#### Phase 3+ — WebSocket / SSE (planned)

Replace polling with a real-time push channel. Planned events and their query invalidation actions:

| Event | Frontend action |
|-------|----------------|
| `workspace.member.role.updated` | `invalidateQueries(workspace.detail, workspace.members)` |
| `workspace.member.removed` | `invalidateQueries(workspace.*)` + redirect to `/workspaces` if current user |
| `project.member.role.updated` | `invalidateQueries(project.detail, project.members)` |
| `project.member.removed` | `invalidateQueries(project.*)` + redirect if current user |

**Implementation options:** Spring WebSocket (STOMP) for bidirectional (needed for Phase 3 real-time task updates); Server-Sent Events (SSE) for one-way permission push only (simpler, sufficient for Phase 2+ permission sync alone).

---

## 5. Docker Architecture

### 5.1 Container Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Docker Compose Network                         │
│                  (task-manager-network)                           │
│                                                                  │
│  ┌─────────────────┐   ┌────────────────┐   ┌───────────────┐   │
│  │     nginx       │   │    backend     │   │   frontend    │   │
│  │  80:80, 443:443 │   │    8080:8080   │   │   3000:3000   │   │
│  │  nginx:alpine   │   │  openjdk:21    │   │  node:20-alp  │   │
│  └────────┬────────┘   └────────┬───────┘   └───────────────┘   │
│           │                     │                                 │
│           └────────────────┬────┘                                 │
│                            ▼                                      │
│                  ┌─────────────────┐                              │
│                  │    postgres     │                              │
│                  │  5432 (internal)│                              │
│                  │  postgres:16    │                              │
│                  └─────────────────┘                              │
│                                                                  │
│  Volumes: postgres_data, nginx_certs                              │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Docker Compose Structure

```yaml
# docker-compose.yml (dev)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: taskmanager
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - task-manager-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/taskmanager
      SPRING_DATASOURCE_USERNAME: ${DB_USERNAME}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    networks:
      - task-manager-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    networks:
      - task-manager-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - nginx_certs:/etc/nginx/certs
    depends_on:
      - frontend
      - backend
    networks:
      - task-manager-network

volumes:
  postgres_data:
  nginx_certs:

networks:
  task-manager-network:
    driver: bridge
```

### 5.3 Nginx Reverse Proxy Config

```nginx
# nginx/nginx.conf
upstream frontend {
    server frontend:3000;
}

upstream backend {
    server backend:8080;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS (production)
    # return 301 https://$host$request_uri;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 6. AWS EC2 Deployment Architecture

```
                    ┌─────────────────────────────┐
                    │         Route 53 (DNS)       │
                    │  yourdomain.com → EC2 IP     │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │     Internet Gateway         │
                    └─────────────┬───────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────────┐
│                      AWS EC2 Instance                           │
│                   Ubuntu 22.04 LTS                              │
│                   t3.small (2vCPU, 2GB RAM)                     │
│                                                                 │
│  Security Group:                                                 │
│    Inbound: 22 (SSH), 80 (HTTP), 443 (HTTPS)                    │
│    Outbound: All                                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                Docker Engine                             │   │
│  │                                                          │   │
│  │  nginx → frontend → backend → postgres                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Environment Variable Strategy

### Dev vs Production separation:

```
backend/
├── src/main/resources/
│   ├── application.yml          # Base config (không chứa secrets)
│   ├── application-dev.yml      # Dev-specific (local postgres)
│   └── application-prod.yml     # Prod-specific (từ env vars)
```

```yaml
# application.yml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
  access-token-expiry: ${JWT_ACCESS_EXPIRY:1800000}    # 30 min
  refresh-token-expiry: ${JWT_REFRESH_EXPIRY:604800000} # 7 days
```

**Secrets không bao giờ commit lên Git:**
- `JWT_SECRET` — tối thiểu 256-bit random string
- `DB_PASSWORD` — strong password
- `.env` file phải trong `.gitignore`
- Dùng `.env.example` để document các variables cần có

---

## 8. Scalability Considerations

### Hệ thống hiện tại (Monolith — phù hợp với solo dev)
- Một codebase duy nhất
- Đơn giản để develop, test, deploy
- Đủ cho hàng nghìn users với vertical scaling

### Nếu cần scale sau này:
- **Horizontal scaling**: Thêm instances, cần sticky sessions hoặc stateless JWT (đã stateless)
- **Database**: Read replicas, connection pooling (HikariCP — Spring Boot default)
- **Caching**: Thêm Redis cho frequently-accessed data
- **Tách microservices**: Auth service, Notification service có thể tách ra đầu tiên

### Performance tips cho production:
- Enable database connection pooling (HikariCP)
- Dùng `@Transactional(readOnly = true)` cho read operations
- Lazy loading JPA (default) — chú ý N+1 problem
- Index đúng chỗ trong database (xem DATABASE_DESIGN.md)
- Gzip response từ Nginx
