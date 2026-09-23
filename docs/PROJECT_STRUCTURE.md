# Project Structure & Directory Governance

> **Status**: Authoritative Master Specification  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. Overview & Architectural Boundaries

The **Student ERP** system is organized as a unified monorepo with strict architectural boundaries separating concerns between the presentation layer (frontend), business and API services (backend), relational persistence (database), deployment infrastructure (infra), synthetic datasets (mock-data), and governing documentation (docs).

Structural drift is strictly prohibited. No alternative directories (such as `frontend2/`, `erp/`, or `new-backend/`) may be introduced.

---

## 2. Complete Directory Hierarchy

```text
student-erp/
├── frontend/                     # React + TypeScript + Vite Single-Page Application
│   ├── src/
│   │   ├── app/                  # Application initialization, root router, providers
│   │   ├── components/           # Reusable atomic & UI primitives (shadcn-compatible)
│   │   ├── features/             # Domain modules (auth, students, attendance, etc.)
│   │   ├── layouts/              # Structural shells (DashboardLayout, AuthLayout, etc.)
│   │   ├── pages/                # Route entry points mapping layouts and features
│   │   ├── hooks/                # Custom React hooks (useAuth, useTheme, etc.)
│   │   ├── services/             # Service adapters (mock services and future API clients)
│   │   ├── lib/                  # Library wrappers and configuration (tailwind merge, etc.)
│   │   ├── types/                # Domain models, DTOs, and TypeScript interfaces
│   │   └── utils/                # Pure formatting, date manipulation, and calculation helpers
│   ├── public/                   # Static assets, icons, manifest
│   ├── tests/                    # Vitest and React Testing Library suites
│   ├── index.html                # HTML entry point
│   ├── package.json              # NPM dependencies and scripts
│   ├── postcss.config.js         # PostCSS pipeline configuration
│   ├── tailwind.config.js        # Design tokens and theme configuration
│   ├── tsconfig.json             # TypeScript root compiler configuration
│   ├── tsconfig.node.json        # TypeScript Node environment configuration
│   └── vite.config.ts            # Vite bundler configuration and path aliases
│
├── backend/                      # Django + Django REST Framework + Channels Monolith
│   ├── config/                   # Project root configuration
│   │   ├── __init__.py           # Package marker and ASGI/Celery bindings
│   │   ├── asgi.py               # ASGI entry point for Channels and WebSockets
│   │   ├── settings.py           # Base, environment-aware Django configuration
│   │   ├── urls.py               # Central URL dispatching under /api/v1/
│   │   └── wsgi.py               # WSGI entry point for standard synchronous HTTP
│   ├── apps/                     # Modular Django domain apps
│   │   ├── accounts/             # Identity, authentication, custom user, and RBAC
│   │   ├── students/             # Student records, profiles, and enrollments
│   │   ├── academics/            # Programs, classes, sections, courses, and terms
│   │   ├── attendance/           # Daily & lecture session attendance logs
│   │   ├── marks/                # Exams, grading schemes, scores, and transcripts
│   │   ├── timetable/            # Schedules, room allocations, time slots
│   │   ├── calendar/             # Institutional calendar, academic events, holidays
│   │   ├── allocation/           # Automated section and resource allocation logic
│   │   ├── reports/              # Aggregated analytics, performance cards, exports
│   │   ├── notifications/        # In-app alerts, email/SMS dispatching, realtime events
│   │   └── audit/                # Immutable change logs, access telemetry, audit trail
│   ├── common/                   # Shared backend utilities, base models, custom exceptions
│   │   ├── models.py             # TimeStampedModel, UUIDModel base classes
│   │   ├── permissions.py        # Generic DRF role-based permission classes
│   │   ├── pagination.py         # Standardized pagination handlers
│   │   └── exceptions.py         # Custom DRF API exception formatters
│   ├── requirements/             # Pinned pip dependency manifests
│   │   ├── base.txt              # Core requirements (Django, DRF, Channels, psycopg)
│   │   ├── development.txt       # Tooling (pytest, flake8, black)
│   │   └── production.txt        # Production server dependencies (gunicorn, uvicorn)
│   └── manage.py                 # Django management CLI wrapper
│
├── database/                     # PostgreSQL Relational Persistence Architecture
│   ├── README.md                 # Schema governance, migration policy, connection rules
│   └── schema/                   # Reference DDL, ER diagrams, initialization scripts
│
├── infra/                        # Containerization & Edge Routing Infrastructure
│   ├── README.md                 # Infrastructure architecture, topology, deployment guidelines
│   ├── docker/                   # Dockerfile configurations for frontend and backend
│   ├── caddy/                    # Reverse proxy Caddyfile with automated TLS
│   └── docker-compose.yml        # Development and staging multi-container orchestration
│
├── mock-data/                    # Synthetic JSON Datasets for Frontend Phase 2
│   ├── users.json                # User accounts spanning all 5 system roles
│   ├── students.json             # Student identity, enrollment, and parent links
│   ├── parents.json              # Guardian details and children associations
│   ├── faculty.json              # Teachers, designations, departments, subject links
│   ├── classes.json              # Grades, sections, and room assignments
│   ├── subjects.json             # Courses, department codes, credit mappings
│   ├── attendance.json           # Daily and course session attendance logs
│   ├── marks.json                # Exam evaluations, grades, percentages, marks
│   ├── timetable.json            # Weekly schedules, rooms, period allocations
│   └── events.json               # Academic calendar events, holidays, schedules
│
├── docs/                         # Authoritative Project Documentation & Governance
│   ├── PROJECT_STRUCTURE.md      # This document: folder governance and ownership
│   ├── ARCHITECTURE.md           # System architecture, topology, data flow
│   ├── DATABASE_SCHEMA.md        # Relational schema specification and constraints
│   ├── API_CONTRACT.md           # REST API endpoint contracts under /api/v1/
│   ├── RBAC_PERMISSIONS.md       # Role-Based Access Control matrix (5 roles)
│   ├── FRONTEND_ARCHITECTURE.md  # React, UI components, state, service layer
│   ├── BACKEND_ARCHITECTURE.md   # Django apps, service layer, channels, audit
│   ├── DEVELOPMENT_WORKFLOW.md   # Step-by-step developer and AI agent protocol
│   ├── GIT_WORKFLOW.md           # Branching strategy, PR guidelines, commit conventions
│   ├── TESTING_STRATEGY.md       # Pytest, Vitest, Playwright progressive testing
│   ├── DEPLOYMENT.md             # Docker Compose, Caddy TLS, VPS deployment
│   ├── PROJECT_STATUS.md         # Authoritative status (Implemented vs Planned)
│   ├── CHANGELOG.md              # Historical record of phase milestones
│   ├── DECISIONS.md              # Architecture Decision Records (ADRs)
│   ├── phase_prompts/            # Detailed phase prompt specifications
│   │   └── PHASE_01.md           # Phase 1 kickoff specification
│   └── phases/                   # Phase execution status records
│       └── PHASE_01_STATUS.md    # Phase 1 completion and sign-off status
│
├── .gitignore                    # Git hygiene rules for build and cache artifacts
└── README.md                     # Root project overview and onboarding guide
```

---

## 3. Folder Responsibilities & Boundaries

### 3.1 `frontend/`
- **Responsibility**: Contains the user interface and client-side logic.
- **Constraints**: 
  - Code must be organized by domain (`features/`), shared UI primitives (`components/`), layouts (`layouts/`), and route views (`pages/`).
  - The UI must NOT talk directly to the backend database or circumvent the service layer.
  - In Phase 2, the UI will consume data through `services/mockService.ts` reading from `mock-data/`.
  - When backend APIs are deployed in future phases, the service layer will switch from mock adapters to Axios/Fetch API clients pointing to `/api/v1/` with zero UI component rewrites.

### 3.2 `backend/`
- **Responsibility**: Contains the core business logic, Django REST APIs, WebSocket consumers, authentication, authorization, and background tasks.
- **Constraints**:
  - The backend is a modular monolith. Each domain entity is isolated inside `apps/<domain>/`.
  - No cross-app circular imports. Shared functionality resides in `common/`.
  - Backend authorization (RBAC) is the authoritative security boundary.

### 3.3 `database/`
- **Responsibility**: Houses documentation and scripts related to PostgreSQL.
- **Constraints**:
  - PostgreSQL is the sole relational database.
  - Django migrations will serve as the source of truth for schema changes once backend modeling starts.

### 3.4 `infra/`
- **Responsibility**: Docker orchestration, Caddy reverse-proxy configuration, and environment manifests.
- **Constraints**:
  - Encapsulates network topology: Internet -> Caddy (port 80/443) -> Frontend (static/Vite) & Backend (Gunicorn/Uvicorn on port 8000) -> PostgreSQL (5432) & Redis (6379).

### 3.5 `mock-data/`
- **Responsibility**: Houses static JSON files for prototyping, frontend testing, and rapid validation.
- **Constraints**:
  - Data must remain synthetic and valid JSON.
  - No frontend code or logic may reside here.

### 3.6 `docs/`
- **Responsibility**: The single source of truth for architectural contracts, operational workflows, and status tracking.
- **Constraints**:
  - Must be kept continuously synchronized with code changes.
  - Every AI agent and developer must read docs before executing changes.

---

## 4. Anti-Drift Governance

1. **No Competing Trees**: Never create directories such as `backend2/`, `frontend_new/`, or `api/`.
2. **Technology Preservation**: Technology replacements (e.g. attempting to switch to FastAPI, Next.js, Mongo, or Supabase) are strictly prohibited.
3. **Module Integrity**: Do not merge apps into a single generic app. Respect domain boundaries.
