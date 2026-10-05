# Phase 3 Specification: Backend Foundation + Database

> **Phase**: Phase 3 of Multi-Phase ERP Roadmap  
> **Objective**: **BACKEND FOUNDATION + POSTGRESQL SCHEMA + SERVICE LAYER + INITIAL REST API**  
> **Authoritative Mandate**: Strict adherence to the modular monolith architecture. Establish relational persistence, core domain models, deterministic services, and the versioned REST API foundation under `/api/v1/`. Frontend remains mock-driven until Phase 5.

---

## 1. Phase Objective & Mission

The goal of Phase 3 is to establish the production-grade Python Django 5+ backend application tier, relational database persistence (PostgreSQL 16+), domain models in Third Normal Form (3NF), database migrations, domain service layer logic, and initial RESTful API endpoints under `/api/v1/`.

Phase 3 transitions the Student ERP from static mock datasets toward fully modeled relational persistence while strictly preserving architectural boundaries:
- **Phase 1**: Project Foundation + Documentation + Governance (COMPLETED)
- **Phase 2**: Frontend Core + Role Dashboards + Mock Data Integration (COMPLETED)
- **Phase 3**: Backend Foundation + Database + Service Layer + REST API Foundation (ACTIVE / COMPLETED)
- **Phase 4**: Authentication & Role-Based Access Control (RBAC) (UPCOMING)
- **Phase 5**: Full REST API Integration (Frontend-to-Backend Wiring) (PLANNED)

---

## 2. Master Technology Stack

- **Backend Framework**: Python 3.11+, Django 5+, Django REST Framework (DRF)
- **Database Engine**: PostgreSQL 16+ (PostGIS/JSONB ready)
- **Database Driver**: `psycopg` (v3)
- **Service Layer**: Dedicated domain services subclassing `BaseService` with atomic transaction boundaries
- **Testing**: `pytest`, `pytest-django`, `pytest-mock`, `faker`
- **Asynchronous & Realtime Scaffolding**: Django Channels 4+ with `channels_redis` (Active implementation scheduled for Phase 6)

*Prohibited Practices in Phase 3*:
- No replacement of PostgreSQL with NoSQL / MongoDB / Firebase / Supabase.
- No premature frontend REST API client integration (Phase 2 frontend remains strictly on mock services until Phase 5).
- No premature Phase 4 authentication implementation (JWT issuance, refresh, password verification belongs to Phase 4).

---

## 3. Phase 3 Task Roadmap

| Task | Title | Scope Summary |
| :--- | :--- | :--- |
| **Task 3.1** | **Backend Foundation & Environment** | Virtual environment (`.venv`), Twelve-Factor configuration (`.env`), health check (`/api/health/`), WSGI/ASGI entry points, logging, Docker blueprint. |
| **Task 3.2** | **Django App Architecture & Scaffolding** | Modular domain layout (11 apps), `BaseService`, domain service classes, shared utilities (grading, attendance formula, Student ID validation), zero premature concrete models. |
| **Task 3.3** | **PostgreSQL Schema Models & Migrations (Core)** | 3NF models in `accounts` (`Role`, `User`, `Faculty`, `Parent`), `students` (`Student` with immutable ID), and `academics` (`AcademicYear`, `SchoolClass`, `Section`, `Subject`, `Enrollment`). Migrations generated and applied. |
| **Task 3.4** | **Attendance & Marks Database Layer** | 3NF models for `Attendance`, `LeaveApplication`, `ExamType`, `Mark`. Master Plan Amendment 2 canonical 4-status model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`), CBSE 8-tier letter grading, raw mark 0–100 validation. |
| **Task 3.5** | **Migrations, Constraints & Seed Data** | Relational constraint hardening, foreign key audit, deterministic and idempotent `seed_dev_data` management command. |
| **Task 3.6** | **Initial REST API Foundation** | DRF serializers, versioned `/api/v1/` routes, thin views, standardized envelopes, pagination, query optimization (`select_related`, `prefetch_related`). |
| **Task 3.7** | **Final Verification, Hardening & Sign-Off** | Environment alignment, full backend pytest execution (154/154 passing), live database seed verification, API verification, frontend regression, documentation gap closure, and formal Phase 3 sign-off. |

---

## 4. Key Architectural Boundaries & Domain Invariants

1. **Modular Monolith**: All domain entities reside within `backend/apps/<domain>/`. Cross-cutting utilities, abstract base models, and shared math reside in `backend/common/`.
2. **Fat Models / Thin Views / Dedicated Services**: Views remain thin dispatchers delegating complex business calculations to domain services (`apps/*/services.py`).
3. **Four-Status Attendance Model (Master Plan Amendment 2)**:
   - Canonical statuses: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`.
   - Prohibited legacy statuses: `LATE` and `EXCUSED` are permanently forbidden.
   - Formula:
     $$\text{Attendance \%} = \frac{\text{PRESENT} + \text{ON\_DUTY}}{\text{PRESENT} + \text{ABSENT} + \text{ON\_DUTY} + \text{LEAVE}} \times 100$$
4. **Indian School Academic & Evaluation Model**:
   - Assessments evaluate raw numeric marks out of 100 (0.00–100.00).
   - CBSE/ICSE standard 8-tier letter grade scale: `A1` (91–100), `A2` (81–<91), `B1` (71–<81), `B2` (61–<71), `C1` (51–<61), `C2` (41–<51), `D` (33–<41), `E` (<33).
   - All university terminology (GPA, CGPA, credits, credit hours, degree) is strictly purged.
5. **Student ID Immutability**:
   - Permanent business identifier formatted as `STU<4-digit-year><5-digit-sequence>` (e.g. `STU202600001`).
   - Protected against modification after initial insertion; any update raises `ImmutableFieldMutationError`.
6. **Descriptive Non-Evaluative Faculty Architecture**:
   - Staff profiles contain biographical and departmental assignment details only.
   - Zero performance ratings, review scores, or teacher leaderboards.

---

## 5. Acceptance Criteria for Phase 3 Completion

1. Django core check `python manage.py check` passes with 0 issues.
2. In-memory migration autodetector `python manage.py makemigrations --check` detects 0 unmigrated changes.
3. Live PostgreSQL database applies all migrations cleanly with `[X]` status across all initial migrations.
4. `seed_dev_data` runs idempotently without uncontrolled duplicates or constraint violations.
5. Full backend pytest test suite executes cleanly with 100% passing rate.
6. Initial REST API foundation under `/api/v1/` adheres to standardized JSON envelope and error formats.
7. Frontend Vitest test suite (158/158 tests) and production build (`npm run build`) pass with 0 regressions.
8. Comprehensive documentation and phase ledger (`PHASE_03_STATUS.md`) synchronized and signed off.
