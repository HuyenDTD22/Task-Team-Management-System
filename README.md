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
- Java 21
- Node.js 20+
- Docker + Docker Compose
- Maven 3.9+

### 1. Start the database

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL only. Backend and frontend run locally.

### 2. Configure backend credentials

```bash
cd backend/src/main/resources
cp application-dev.yml.example application-dev.yml
# Edit application-dev.yml — fill in your DB password and Cloudinary credentials
```

`application-dev.yml` is gitignored — never commit it.

### 3. Run the backend

```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

Flyway runs migrations automatically on startup.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# Vite proxies /api/* → http://localhost:8080
```

---

## Environment Configuration

### File responsibilities

| File | Committed | Purpose |
|------|-----------|---------|
| `backend/src/main/resources/application.yml` | ✅ Yes | Base config, non-sensitive defaults |
| `backend/src/main/resources/application-prod.yml` | ✅ Yes | Prod profile — reads from `${ENV_VAR}` only |
| `backend/src/main/resources/application-dev.yml.example` | ✅ Yes | Template for local dev setup |
| `backend/src/main/resources/application-dev.yml` | ❌ No | Your local credentials (gitignored) |
| `.env.example` | ✅ Yes | Template for Docker production deployment |
| `.env` | ❌ No | Real secrets for Docker deployment (gitignored) |
| `docker-compose.dev.yml` | ✅ Yes | Local dev PostgreSQL (generic dev password) |

### Production deployment

```bash
cp .env.example .env
# Edit .env with real production values
docker compose up -d
```

---

## Project Structure

```
task-team-management-system/
├── backend/                        # Spring Boot application
│   ├── src/main/java/com/taskmanager/
│   │   ├── config/                 # Spring beans, security, Cloudinary
│   │   ├── common/                 # BaseEntity, ApiResponse, PageResponse, enums
│   │   ├── exception/              # GlobalExceptionHandler, ErrorCode, BusinessException
│   │   ├── security/               # JwtService, UserPrincipal, SecurityUtil
│   │   └── domain/
│   │       ├── auth/               # Login, register, refresh token
│   │       ├── user/               # Profile, avatar upload
│   │       ├── workspace/          # Workspace + member RBAC
│   │       ├── project/            # Project + member RBAC
│   │       ├── task/               # (Phase 3)
│   │       └── comment/            # (Phase 3)
│   └── src/main/resources/
│       ├── application.yml
│       ├── application-prod.yml
│       ├── application-dev.yml.example
│       └── db/migration/           # Flyway SQL migrations V1–V5
├── frontend/                       # React application
│   └── src/
│       ├── api/                    # Axios instance, query keys, endpoints
│       ├── components/ui/          # Avatar, Spinner, Pagination
│       ├── features/               # auth, user, workspace, project, dashboard
│       ├── layouts/                # AppLayout (sidebar)
│       ├── router/                 # Routes, ProtectedRoute
│       ├── stores/                 # Zustand auth store
│       └── types/                  # TypeScript type definitions
├── docs/                           # Architecture, DB design, API guidelines
├── docker-compose.dev.yml          # Local dev: PostgreSQL only
├── .env.example                    # Template for production Docker deployment
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

---

## License

MIT
