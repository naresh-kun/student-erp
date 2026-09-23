# Phase 1 Specification: Project Foundation + Documentation + Governance

> **Phase**: 1 of Multi-Phase ERP Roadmap  
> **Objective**: **STRUCTURE + DOCUMENTATION + GOVERNANCE**  
> **Authoritative Mandate**: Strict adherence to the master architecture. Do NOT implement actual ERP functionality in this phase.

---

## 1. Phase Objective & Mission

The goal of Phase 1 is to establish the authoritative structural foundation, comprehensive technical documentation, synthetic mock datasets, and engineering governance policies for the **Student ERP** system. 

Phase 1 provides the bedrock upon which subsequent phases will build:
- **Phase 2**: Frontend Core + Role Dashboards + Mock Data Integration
- **Future Phases**: Django REST Backend + PostgreSQL Relational Persistence + Realtime Channels

---

## 2. Master Technology Stack (Non-Negotiable)

- **Frontend**: React 18+, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui primitives, TanStack Query, React Hook Form, Zod, Recharts, Lucide React
- **Backend**: Python 3.11+, Django 5+, Django REST Framework, Django Channels
- **Database**: PostgreSQL 16+
- **Realtime / Cache**: Redis 7+
- **Infrastructure**: Docker, Docker Compose, Caddy Reverse Proxy, Cloud VPS
- **Testing**: Pytest, Vitest, React Testing Library, Playwright

*Prohibited Technologies*: Next.js, FastAPI, MongoDB, Firebase, Supabase, Microservices, Kubernetes.

---

## 3. Scope of Deliverables

### 3.1 Monorepo Structure
Create and preserve the exact directory layout:
```text
student-erp/
├── frontend/
├── backend/
├── database/
├── infra/
├── docs/
├── mock-data/
└── README.md
```

### 3.2 Authoritative Documentation Suite (`docs/`)
Create rich, complete, non-placeholder markdown specifications:
1. `PROJECT_STRUCTURE.md`: Exact directory hierarchy, folder responsibilities, and anti-drift rules.
2. `ARCHITECTURE.md`: High-level system architecture, component topology, data flows, and sequence diagrams.
3. `DATABASE_SCHEMA.md`: 3NF relational schema specification covering 19 major entities and constraints.
4. `API_CONTRACT.md`: Comprehensive REST API endpoint contract under `/api/v1/` distinguishing planned vs. implemented APIs.
5. `RBAC_PERMISSIONS.md`: Access control matrix for the 5 system roles (Student, Parent, Faculty, Admin, Principal) and boundary rules.
6. `FRONTEND_ARCHITECTURE.md`: Frontend design system, service abstraction pattern, and state management rules.
7. `BACKEND_ARCHITECTURE.md`: Django modular monolith boundaries, ORM rules, Channels/Redis topology, and audit logging.
8. `DEVELOPMENT_WORKFLOW.md`: Mandatory 13-step development sequence for developers and AI agents.
9. `GIT_WORKFLOW.md`: Branching model and conventional commit standards.
10. `TESTING_STRATEGY.md`: Progressive testing tiers (Pytest, Vitest + RTL, Playwright).
11. `DEPLOYMENT.md`: Infrastructure topology, Docker Compose, Caddy TLS reverse proxy, and backup procedures.
12. `PROJECT_STATUS.md`: Authoritative status matrix classifying items into IMPLEMENTED, MOCKED, PLANNED, NOT IMPLEMENTED, BLOCKED.
13. `CHANGELOG.md`: Historical record of changes by phase.
14. `DECISIONS.md`: Formal Architecture Decision Records (ADRs).
15. `phase_prompts/PHASE_01.md`: This specification file.
16. `phases/PHASE_01_STATUS.md`: Tracking ledger for Phase 1 execution and sign-off.

### 3.3 Synthetic Mock Datasets (`mock-data/`)
Create 10 valid, relational JSON datasets:
- `users.json`, `students.json`, `parents.json`, `faculty.json`, `classes.json`, `subjects.json`, `attendance.json`, `marks.json`, `timetable.json`, `events.json`.

### 3.4 Skeletons
- **Frontend Skeleton**: `frontend/src/` with `app/`, `components/`, `features/`, `layouts/`, `pages/`, `hooks/`, `services/`, `lib/`, `types/`, `utils/`, plus Vite, TypeScript, and Tailwind configurations.
- **Backend Skeleton**: `backend/` with `config/` (settings, urls, asgi, wsgi), `apps/` (11 domain apps), `common/`, and `requirements/`.
- **Database & Infra**: `database/README.md`, `infra/README.md`, `infra/docker-compose.yml`, `infra/caddy/Caddyfile`.
- **Root README**: Comprehensive project introduction.

---

## 4. Phase 1 Boundaries & Strict Restrictions

**DO NOT**:
- Implement actual ERP dashboard pages or business logic.
- Implement production authentication or live JWT issuance.
- Connect PostgreSQL as an active live database.
- Build live REST API endpoints or Django Channels consumers.
- Build class allocation algorithms.
- Change the agreed technology stack or create duplicate directory trees.

---

## 5. Acceptance Criteria

1. Exact directory structure matches the authoritative tree with zero competing folders.
2. All 16 markdown documentation files exist in `docs/` and are populated with comprehensive, useful content.
3. All 10 synthetic datasets in `mock-data/` contain valid, properly formatted JSON.
4. Frontend and backend boundaries are cleanly established with corresponding configuration files.
5. All validation checks (JSON validation, syntax inspection, file existence) pass without errors.
6. `PROJECT_STATUS.md` and `docs/phases/PHASE_01_STATUS.md` accurately record the state of deliverables.
