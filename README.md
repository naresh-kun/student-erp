# Student ERP — Enterprise Educational Management System

> **Current Phase**: **Phase 1: Foundation + Documentation + Governance**  
> **Status**: Completed Phase 1 Foundation  
> **Target Production Architecture**: React (Vite + TypeScript) + Django REST Framework + PostgreSQL + Redis + Caddy

---

## 1. Project Overview

The **Student ERP** system is a modern, modular educational enterprise management platform designed to streamline academic operations, communication, and performance tracking across institutions.

The platform provides dedicated, role-tailored experiences for five distinct stakeholder groups:
1. **Students**: Course enrollment, personal timetable view, real-time attendance logs, exam mark sheets, and academic announcements.
2. **Parents / Guardians**: Real-time tracking of children's academic progress, attendance alerts, timetable view, and direct institution communications.
3. **Faculty**: Daily/session attendance recording, assignment and exam grading, timetable management, and class rosters.
4. **Administrators**: System-wide configuration, user provisioning, role assignments, academic calendars, master timetabling, and audit telemetry.
5. **Principals / Institutional Leadership**: School-wide analytics, department oversight, grade and report card approvals, policy sign-offs, and compliance inspection.

---

## 2. Master Technology Stack

The project adheres strictly to an agreed-upon, non-negotiable technology stack:

- **Presentation Layer (Frontend)**:
  - React 18+ & TypeScript
  - Vite build tool & development server
  - Tailwind CSS & shadcn/ui accessible component primitives
  - React Router (v6/v7) for client-side navigation
  - TanStack Query (React Query) for server-state caching
  - React Hook Form & Zod for schema-validated forms
  - Recharts for responsive analytics and data visualization
  - Lucide React for consistent iconography
- **Application & API Layer (Backend)**:
  - Python 3.11+ & Django 5+
  - Django REST Framework (DRF) for RESTful endpoints under `/api/v1/`
  - Django Channels (ASGI) for bidirectional WebSockets (`/ws/`)
- **Persistence & Caching**:
  - PostgreSQL 16+ (ACID relational transactional store)
  - Redis 7+ (ASGI Channels layer broker, query caching, rate limiting)
- **Infrastructure & Edge**:
  - Docker & Docker Compose
  - Caddy (Reverse proxy with automatic Let's Encrypt TLS)
  - Cloud VPS Deployment
- **Testing Pyramid**:
  - Pytest & Pytest-Django (Backend unit and integration)
  - Vitest & React Testing Library (Frontend component and unit)
  - Playwright (End-to-End browser test automation)

---

## 3. Authoritative Directory Structure

```text
student-erp/
├── frontend/                     # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── app/                  # Application root & providers
│   │   ├── components/           # Reusable UI primitives
│   │   ├── features/             # Modular domain features (auth, attendance, marks...)
│   │   ├── layouts/              # Shell layouts (Dashboard, Auth)
│   │   ├── pages/                # Route endpoints
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # Service abstraction (mock vs. API)
│   │   ├── lib/                  # Utilities (shadcn cn helper)
│   │   ├── types/                # Domain TypeScript types
│   │   └── utils/                # Pure formatting helpers
│   ├── public/                   # Static assets
│   └── tests/                    # Vitest suites
│
├── backend/                      # Django + DRF Modular Monolith
│   ├── config/                   # Root Django configuration (settings, urls, asgi, wsgi)
│   ├── apps/                     # Modular domain apps (11 isolated apps)
│   ├── common/                   # Base models, custom permissions, exceptions
│   └── requirements/             # Pinned pip requirements
│
├── database/                     # PostgreSQL schema architecture & migration policies
├── infra/                        # Docker Compose, Caddyfile, and edge configs
├── mock-data/                    # Synthetic JSON datasets (10 files covering all roles)
├── docs/                         # Comprehensive engineering documentation (16 files)
└── README.md                     # This documentation file
```

---

## 4. Current Phase & Evolutionary Roadmap

> [!IMPORTANT]
> **Phase 1 is strictly foundational**. In this phase, the exact directory structure, governance, architecture documents, synthetic datasets, and skeleton tooling were created. No live ERP business logic, active dashboards, or database migrations are implemented in Phase 1.

### Roadmap Phases:
1. **Phase 1: Foundation + Documentation + Governance** `[COMPLETED]`
   - Monorepo directory structure, 16 authoritative docs, 10 mock datasets, skeleton configs.
2. **Phase 2: Frontend Core + Role Dashboards + Mock Data Integration** `[UPCOMING]`
   - Implementation of responsive, role-based dashboards (Student, Parent, Faculty, Admin, Principal) powered by `mock-data/` via `src/services/mockService.ts`.
3. **Phase 3: Backend API Core + Django REST Framework** `[PLANNED]`
   - PostgreSQL schema models, DRF API views under `/api/v1/`, JWT authentication, and RBAC permission enforcement.
4. **Phase 4: Realtime Infrastructure + Channels + WebSockets** `[PLANNED]`
   - Redis channel layers, instant notifications, live attendance alerts.
5. **Phase 5: Production Hardening, Testing & Deployment** `[PLANNED]`
   - End-to-end Playwright tests, Caddy reverse-proxy SSL automation, automated backups, staging launch.

---

## 5. Development Workflow & Protocol

All contributors and AI agents must follow the mandatory workflow documented in [`docs/DEVELOPMENT_WORKFLOW.md`](docs/DEVELOPMENT_WORKFLOW.md):
1. Read the required documentation in `docs/`.
2. Inspect the current phase prompt (`docs/phase_prompts/PHASE_XX.md`) and status (`docs/phases/PHASE_XX_STATUS.md`).
3. Implement focused changes without violating architectural boundaries or introducing competing directories.
4. Validate changes through tests and syntax checks.
5. Update affected documentation, changelog, and phase status files prior to declaring completion.

---

## 6. Documentation Quick Links

- [Project Structure & Governance](docs/PROJECT_STRUCTURE.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema (PostgreSQL 3NF)](docs/DATABASE_SCHEMA.md)
- [REST API Contract (`/api/v1/`)](docs/API_CONTRACT.md)
- [RBAC Permissions Matrix (5 Roles)](docs/RBAC_PERMISSIONS.md)
- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md)
- [Development Workflow Protocol](docs/DEVELOPMENT_WORKFLOW.md)
- [Git Workflow & Conventions](docs/GIT_WORKFLOW.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Deployment & Operations](docs/DEPLOYMENT.md)
- [Project Status Ledger](docs/PROJECT_STATUS.md)
- [Architecture Decisions (ADRs)](docs/DECISIONS.md)
- [Phase 1 Status Sign-off](docs/phases/PHASE_01_STATUS.md)
