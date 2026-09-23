# Project Changelog

All notable changes to the Student ERP project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Phase 1: Foundation + Documentation + Governance] - 2026-09-23

### Added
- **Governance & Documentation**:
  - `docs/PROJECT_STRUCTURE.md`: Authoritative repository hierarchy and anti-drift rules.
  - `docs/ARCHITECTURE.md`: High-level system architecture, component topology, data flows, and sequence diagrams.
  - `docs/DATABASE_SCHEMA.md`: 3NF relational schema specification covering 19 major entities and constraints.
  - `docs/API_CONTRACT.md`: Comprehensive REST API endpoint contract under `/api/v1/` distinguishing planned vs. implemented APIs.
  - `docs/RBAC_PERMISSIONS.md`: Access control matrix for the 5 system roles (Student, Parent, Faculty, Admin, Principal) and boundary rules.
  - `docs/FRONTEND_ARCHITECTURE.md`: Frontend design system, service abstraction pattern, and state management rules.
  - `docs/BACKEND_ARCHITECTURE.md`: Django modular monolith boundaries, ORM rules, Channels/Redis topology, and audit logging.
  - `docs/DEVELOPMENT_WORKFLOW.md`: Mandatory 13-step development sequence for developers and AI agents.
  - `docs/GIT_WORKFLOW.md`: Branching model and conventional commit standards.
  - `docs/TESTING_STRATEGY.md`: Progressive testing tiers (Pytest, Vitest + RTL, Playwright).
  - `docs/DEPLOYMENT.md`: Infrastructure topology, Docker Compose, Caddy TLS reverse proxy, and backup procedures.
  - `docs/PROJECT_STATUS.md`: Authoritative status matrix classifying items into IMPLEMENTED, MOCKED, PLANNED, NOT IMPLEMENTED, BLOCKED.
  - `docs/DECISIONS.md`: Formal Architecture Decision Records (ADRs) capturing core technical selections.
  - `docs/phase_prompts/PHASE_01.md`: Self-contained Phase 1 kickoff specification.
  - `docs/phases/PHASE_01_STATUS.md`: Tracking ledger for Phase 1 objectives, achievements, and sign-off.
  - `README.md`: High-level project overview, quick-start guide, and architectural manifesto.

- **Synthetic Mock Datasets (`mock-data/`)**:
  - `users.json`: 8 user accounts spanning all 5 system roles.
  - `students.json`: Student profiles with admission numbers, roll numbers, and parent links.
  - `parents.json`: Guardian records linked to students.
  - `faculty.json`: Academic staff records with employee codes, departments, and qualifications.
  - `classes.json`: Grade 11 and 12 definitions with sections, capacities, and rooms.
  - `subjects.json`: Academic courses with department codes and credit values.
  - `attendance.json`: Multi-period attendance logs with status indicators (Present, Absent, Late, Excused).
  - `marks.json`: Exam evaluations with marks obtained, max marks, grades, and evaluator links.
  - `timetable.json`: Scheduled weekly periods mapping classes, subjects, rooms, and faculty.
  - `events.json`: Academic calendar events covering exams, fairs, meetings, and holidays.

- **Frontend Foundation (`frontend/`)**:
  - Modular source tree: `app/`, `components/`, `features/`, `layouts/`, `pages/`, `hooks/`, `services/`, `lib/`, `types/`, `utils/`.
  - Tooling configuration: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`.
  - Core domain TypeScript interfaces (`src/types/index.ts`).
  - Dual-mode mock service abstraction interface (`src/services/mockService.ts`).
  - Welcome / Architecture verification screen (`src/App.tsx`, `src/main.tsx`, `src/index.css`).

- **Backend Foundation (`backend/`)**:
  - Project configuration: `config/settings.py`, `config/urls.py`, `config/asgi.py`, `config/wsgi.py`.
  - Modular app skeletons for 11 domain apps: `accounts`, `students`, `academics`, `attendance`, `marks`, `timetable`, `calendar`, `allocation`, `reports`, `notifications`, `audit`.
  - Common base utilities: `common/models.py`, `common/permissions.py`, `common/pagination.py`, `common/exceptions.py`.
  - Pinned requirements manifests: `base.txt`, `development.txt`, `production.txt`.
  - Django CLI wrapper: `manage.py`.

- **Database & Infrastructure Foundation**:
  - `database/README.md`: Schema governance, connection pooling, and migration policy.
  - `infra/README.md`: Infrastructure topology and deployment guidelines.
  - `infra/docker-compose.yml`: Baseline multi-service Docker configuration.
  - `infra/caddy/Caddyfile`: Reverse proxy and automated TLS routing specification.
