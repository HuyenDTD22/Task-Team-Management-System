# Task & Team Management System

> A Jira-inspired task and team management system — enterprise-grade fullstack project.
>
> **Stack**: Java 21 · Spring Boot 3 · React 18 + TypeScript · PostgreSQL 16 · Docker · AWS EC2

---

## Development Status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 — Foundation | Spring Boot skeleton, DB, Flyway, base classes | ✅ Done |
| 1 — Auth & User | JWT auth, refresh token rotation, user profile, avatar (Cloudinary) | ✅ Done |
| 2 — Workspace & Project | Workspace/project CRUD, member RBAC, full frontend UI | ✅ Done |
| 3 — Task Management | Task CRUD, filtering, comments | 🔜 Next |
| 4 — Sprint Management | Sprint lifecycle (PLANNED → ACTIVE → COMPLETED) | Pending |
| 5 — Frontend (advanced) | Kanban board, drag-and-drop, sprint UI | Pending |
| 6 — Docker & Deploy | Dockerize, AWS EC2 | Pending |

---

## Tech Stack

### Backend
- Java 21 · Spring Boot 3 · Spring Security 6
- JWT Authentication (access + refresh token rotation)
- Spring Data JPA · Flyway Migrations · MapStruct · PostgreSQL 16
- Cloudinary (avatar upload) · Swagger/OpenAPI

### Frontend
- React 18 + TypeScript · Vite · TailwindCSS
- TanStack Query v5 · React Router v6 · Axios
- Zustand (auth store)

### Infrastructure
- Docker + Docker Compose · Nginx reverse proxy
- AWS EC2 (Ubuntu 22.04)

---

## Architecture

```
Browser → Nginx (:80/:443) → Spring Boot (:8080) → PostgreSQL (:5432)
                           ↘ React Static Files
```

In local dev:
```
Browser → Vite (:5173) → proxy /api → Spring Boot (:8080) → PostgreSQL (:5432)
```

---

## Getting Started (Local Development)

### Prerequisites
- Java 21 · Node.js 20+ · Docker + Docker Compose · Maven 3.9+

### 1. Start the database

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Configure backend

Create `backend/src/main/resources/application-dev.yml` (gitignored) with your local credentials:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/taskmanager
    username: postgres
    password: <your-db-password>
cloudinary:
  cloud-name: <your-cloud-name>
  api-key: <your-api-key>
  api-secret: <your-api-secret>
```

### 3. Run

```bash
# Backend
cd backend && mvn spring-boot:run
# http://localhost:8080 · Swagger: http://localhost:8080/swagger-ui.html

# Frontend
cd frontend && npm install && npm run dev
# http://localhost:5173
```

---

## Project Structure

```
task-team-management-system/
├── backend/
│   ├── src/main/java/com/taskmanager/
│   │   ├── config/         # Spring beans, security, Cloudinary
│   │   ├── common/         # BaseEntity, ApiResponse, PageResponse, enums
│   │   ├── exception/      # GlobalExceptionHandler, ErrorCode
│   │   ├── security/       # JwtService, UserPrincipal, SecurityUtil
│   │   └── domain/
│   │       ├── auth/       # Login, register, refresh token
│   │       ├── user/       # Profile, avatar upload
│   │       ├── workspace/  # Workspace + member RBAC
│   │       ├── project/    # Project + member RBAC
│   │       ├── task/       # (Phase 3)
│   │       └── comment/    # (Phase 3)
│   └── src/main/resources/
│       ├── application.yml             # Base config
│       ├── application-prod.yml        # Prod profile (${ENV_VAR} only)
│       └── db/migration/               # Flyway SQL migrations
├── frontend/
│   └── src/
│       ├── api/            # Axios, query keys, endpoints
│       ├── components/ui/  # Avatar, Spinner, Pagination
│       ├── features/       # auth, user, workspace, project, dashboard
│       ├── layouts/        # AppLayout
│       ├── router/         # Routes, ProtectedRoute
│       ├── stores/         # Zustand auth store
│       └── types/          # TypeScript definitions
├── docs/                   # Architecture, DB design, API guidelines
├── docker-compose.dev.yml  # Local dev PostgreSQL
└── README.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Architecture diagrams, auth flow, route table |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | ERD, table definitions, indexes, migration strategy |
| [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) | Phase breakdown, implementation order |
| [PROJECT_GUIDELINE.md](docs/PROJECT_GUIDELINE.md) | Coding conventions, API standards, git workflow |
| [FEATURE_ANALYSIS.md](docs/FEATURE_ANALYSIS.md) | Business analysis, user roles, permission matrix |
| [DEVOPS_DEPLOYMENT_GUIDE.md](docs/DEVOPS_DEPLOYMENT_GUIDE.md) | EC2 setup, Docker deployment, Nginx config |
