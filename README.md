# Task & Team Management System

> A Jira-inspired task and team management system built as an enterprise-grade fullstack project.
> **Stack**: Java 21 + Spring Boot 3 · React + TypeScript · PostgreSQL · Docker · AWS EC2

---

## Project Status

> **Current Phase**: Planning & Architecture (Pre-implementation)
> **Stage**: Documentation complete — ready to begin Phase 0 (Foundation Setup)

---

## Tech Stack

### Backend
- Java 21 · Spring Boot 3 · Spring Security 6
- JWT Authentication · Spring Data JPA · PostgreSQL 16
- Flyway Migrations · Maven

### Frontend
- React 18 + TypeScript · Vite · TailwindCSS
- TanStack Query · React Router v6 · Axios

### Infrastructure
- Docker + Docker Compose
- Nginx Reverse Proxy
- AWS EC2 (Ubuntu 22.04)

---

## Architecture Overview

```
Internet
   ↓ HTTPS
Nginx (EC2)
   ├── / → Frontend React (:3000)
   └── /api → Spring Boot Backend (:8080)
                    ↓
               PostgreSQL (:5432)
```

All services run in Docker containers on a single EC2 instance,
communicating via an isolated Docker bridge network.

---

## Documentation

| Document | Description |
|----------|-------------|
| [FEATURE_ANALYSIS.md](docs/FEATURE_ANALYSIS.md) | Business analysis, user roles, modules, workflows, permission matrix |
| [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Architecture diagrams, backend/frontend structure, auth flow, Docker setup |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | ERD, table definitions, indexes, migration strategy |
| [PROJECT_GUIDELINE.md](docs/PROJECT_GUIDELINE.md) | Coding conventions, API standards, security, git workflow |
| [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) | Development phases, MVP scope, timeline, difficulty ratings |
| [DEVOPS_DEPLOYMENT_GUIDE.md](docs/DEVOPS_DEPLOYMENT_GUIDE.md) | EC2 setup, Docker deployment, Nginx config, CI/CD |

---

## MVP Features

- JWT Authentication with refresh token rotation
- Multi-workspace management with role-based access control
- Project management (OWNER > ADMIN > MEMBER hierarchy)
- Task CRUD with status, priority, assignee, due date
- Sprint management (PLANNED → ACTIVE → COMPLETED lifecycle)
- Kanban board view
- Task comments

---

## Project Structure (Planned)

```
task-team-management-system/
├── backend/                # Spring Boot application
│   ├── src/main/java/com/taskmanager/
│   │   ├── config/
│   │   ├── common/
│   │   ├── exception/
│   │   ├── security/
│   │   └── domain/
│   │       ├── auth/
│   │       ├── user/
│   │       ├── workspace/
│   │       ├── project/
│   │       ├── sprint/
│   │       ├── task/
│   │       └── comment/
│   └── src/main/resources/
│       └── db/migration/   # Flyway SQL migrations
├── frontend/               # React application
│   └── src/
│       ├── api/
│       ├── components/
│       ├── features/
│       └── hooks/
├── nginx/                  # Reverse proxy config
├── docs/                   # Architecture documentation
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Getting Started

> Implementation has not started yet. See [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) for the development plan.

### Prerequisites
- Java 21
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 16 (or use Docker)

### Environment Setup (when ready)
```bash
cp .env.example .env
# Edit .env with your values
```

### Run with Docker Compose (when ready)
```bash
docker compose up -d
# Frontend: http://localhost
# Backend:  http://localhost/api/v1
```

---

## License

MIT
