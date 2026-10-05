# Project Status & Milestone Ledger

> **Current Phase**: **Phase 4 IN PROGRESS (Authentication + RBAC)**  
> **Authoritative State**: Phase 3 COMPLETE & SIGNED OFF; Phase 4 Tasks 4.1, 4.2 & 4.3 COMPLETE (Authentication Foundation, Custom User & Login Workflow, SimpleJWT Configuration, AuthService Domain Boundary, Token Refresh, Safe Profile Context, 5-Role RBAC Architecture, Canonical Permissions & Scopes, AuthorizationService, DRF Permission Classes, Queryset Scoping; 228/228 backend tests passing; 158/158 frontend tests passing; clean build)  
> **Last Updated**: 2026-10-05

---

## 1. Status Category Definitions

To ensure strict engineering honesty, features and modules are classified into exactly five states:
- **`IMPLEMENTED`**: Code is written, configured, functional, and structurally validated.
- **`MOCKED`**: Datasets or simulated responses exist for decoupled frontend work.
- **`PLANNED`**: Fully specified in architectural documentation and scheduled for future phases.
- **`NOT IMPLEMENTED`**: Out of scope for current phases; deliberately untouched.
- **`BLOCKED`**: Progress halted due to external dependency or missing architectural clarification.

---

## 2. Comprehensive Status Matrix

### 2.1 Governance & Architecture
| Component / Area | Status | Notes |
| :--- | :--- | :--- |
| **Top-Level Monorepo Structure** | `IMPLEMENTED` | Strict folder boundaries (`frontend/`, `backend/`, `database/`, `infra/`, `mock-data/`, `docs/`) |
| **Authoritative Documentation Suite** | `IMPLEMENTED` | 16 comprehensive `.md` specifications covering all architecture, schema, RBAC, workflows |
| **Phase 1 Kickoff Specification & Status** | `IMPLEMENTED` | Preserved under `docs/phase_prompts/PHASE_01.md` & `docs/phases/PHASE_01_STATUS.md` |
| **Phase 2 Kickoff Specification** | `IMPLEMENTED` | Preserved under `docs/phase_prompts/PHASE_02.md` |
| **Phase 2 Status Ledger** | `IMPLEMENTED` | Tracked under `docs/phases/PHASE_02_STATUS.md` (Active, IN PROGRESS) |
| **Architecture Decision Records (ADR)** | `IMPLEMENTED` | Documented in `docs/DECISIONS.md` |
| **Root README** | `IMPLEMENTED` | High-level onboarding guide and project roadmap |
| **Repository Git Hygiene** | `IMPLEMENTED` | Root `.gitignore` and clean tracking (no bytecode or cache artifacts) |

### 2.2 Datasets & Prototyping
| Component / Area | Status | Notes |
| :--- | :--- | :--- |
| **Users Mock Data** | `MOCKED` | Synthetic Indian personnel & students across all 5 roles (`mock-data/users.json`) |
| **Students Mock Data** | `MOCKED` | Indian student records with permanent Student ID (`STU202600001`), admission no, roll no, class, section, stream |
| **Parents Mock Data** | `MOCKED` | Indian guardian records linked to student IDs for parent authentication |
| **Faculty Mock Data** | `MOCKED` | Indian academic staff records (e.g. R. Suresh) with departments, subjects, weekly period workloads (no appraisal ratings) |
| **Classes & Sections Mock Data** | `MOCKED` | Grade 10 (no stream) and Grades 11–12 with 4 approved streams (`Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`) |
| **Subjects Mock Data** | `MOCKED` | Indian school subjects with weekly period allocations (credits purged) |
| **Attendance Mock Data** | `MOCKED` | Multi-period attendance logs with canonical 4-status model (PRESENT, ABSENT, ON_DUTY, LEAVE per Master Plan Amendment 2) |
| **Marks Mock Data** | `MOCKED` | Examination evaluations with marks out of 100, cumulative totals, percentages, and 8-tier letter grades (A1 to E) |
| **Timetable Mock Data** | `MOCKED` | 5 scheduled daily school periods mapping classes, subjects, classrooms, and faculty |
| **Calendar Events Mock Data** | `MOCKED` | Indian school events (Half-Yearly Exams, PTM, Science Exhibition, Diwali Holidays) |

### 2.3 Presentation Layer (Frontend)
| Component / Area | Status | Notes |
| :--- | :--- | :--- |
| **Frontend Directory Skeleton** | `IMPLEMENTED` | Modular layout (`app`, `components`, `features`, `layouts`, `pages`, `hooks`, `services`, `types`, `utils`) |
| **Build & Tooling Configuration** | `IMPLEMENTED` | Vite, TypeScript (`tsconfig.json`), Tailwind CSS, PostCSS configured & runtime verified (`npm run build` passes 100%) |
| **Service Layer Abstraction Setup** | `IMPLEMENTED` | Dual-mode static/async mock service interfaces defined in `services/mockService.ts`; all contextual prototype data is service-backed with zero raw JSON imports in UI pages |
| **TypeScript Domain Interfaces** | `IMPLEMENTED` | Core domain types defined in `src/types/index.ts`; university concepts purged; Indian school models implemented |
| **Indian School Academic Model & Grading** | `IMPLEMENTED` | Marks out of 100, cumulative marks, percentage, and 8-tier letter grades (`A1`–`E`) via pure utility `src/utils/grading.ts`; verified by 19 Vitest unit tests |
| **Attendance Calculation & 4-Status UI** | `IMPLEMENTED` | Canonical 4-status model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`), pure calculation utility (`src/utils/attendance.ts`), formula adherence, distinct visual styling across all 5 roles, verified by 15 Vitest tests (Master Plan Amendment 2) |
| **Application Router & 34 Routes (+ 404)** | `IMPLEMENTED` | Fixed contract of 34 application routes + catch-all 404 route fully wired with React Router in `src/app/router.tsx` |
| **Role-Aware Layouts & Navigation** | `IMPLEMENTED` | `DashboardLayout`, `AuthLayout`, `<RoleRoute>`, dynamic sidebar with enterprise navy school design (`bg-blue-900`) and header showing school identity & academic year |
| **Institutional Mock Authentication** | `MOCKED` | **TEMPORARY PHASE 2 DEMO CREDENTIALS** deployed: `Student01` / `Parent01` / `Faculty01` / `Admin` / `Principal` — all `demo123`. Credential-based login (User ID + Password), role derived from matched record, client `localStorage` session. Real JWT/OAuth authentication `PLANNED` for Phase 4. Student-Parent domain relationship preserved independently via `ParentService`. |
| **Shared UI Component Primitives** | `IMPLEMENTED` | `Card`, `Button`, `Badge`, `PageContainer`, `SectionHeader`, `States` |
| **Student Domain Feature Module (`features/students`)** | `IMPLEMENTED` | Complete student domain module: permanent/immutable Student ID profile, 4-status attendance summary, Zod validation schemas, PENDING leave application workflow (no self-approval), marks/percentage/8-tier grade register, timetable schedule, upcoming events, 25 Vitest tests |
| **Parent Domain Feature Module (`features/parents`)** | `IMPLEMENTED` | Complete parent domain module: Student ID authentication login, linked child scoped access, multi-child support, 4-status attendance cards & formula adherence, subject attendance with 85% clearance benchmark, absence audit log, absence notice workflow (PENDING status), report cards with marks / 100, 8-tier grades, Recharts visualizations, 19 Vitest tests |
| **Faculty Domain Feature Module (`features/faculty`)** | `IMPLEMENTED` | Complete faculty domain module: R. Suresh profile, Class Teacher assignment (XI-A2), assigned class & student scoping, 4-status attendance roll call with "Mark All Present", Class Teacher LEAVE approval workflow, examination marks entry out of 100 or 'AB', CBSE 8-tier grade distribution chart, 24 periods/wk timetable, 22 Vitest tests |
| **Admin Domain Feature Module (`features/admin`)** | `IMPLEMENTED` | Complete admin domain module: Student & Parent master directories with permanent Student ID, non-evaluative faculty staff directory, class capacity & course catalog, 4-status attendance oversight, CBSE 8-tier marks audit register, timetable overview, calendar event publisher, Merit & Random section allocation engine, 18 Vitest tests |
| **Principal Domain Feature Module (`features/principal`)** | `IMPLEMENTED` | Complete principal domain module: Head of Institution executive console, academic & stream performance analytics, school presence telemetry & cohort curves, non-evaluative faculty roster, statutory report endorsement workflow with approval audit trail, 10 Vitest tests |
| **Hardening & Quality Assurance (Task 2.6)** | `IMPLEMENTED` | Full audit pass: academic model, attendance model, Student ID, streams, faculty scope, branding, route guards, auth honesty, mock/service abstraction, responsive, a11y. Fixed: dark mode toggle removed (out-of-scope). Tests: 130/130. Build: clean. Browser QA: all 5 roles verified. |
| **Operational Allocation, Search & Attendance Visibility (Task 2.7)** | `IMPLEMENTED` | Approved functional amendment: student section allocation (Admin/Principal update+delete, Faculty view-only, immutable Student ID), Class Teacher allocation (Admin/Principal update+delete), faculty subject badges, dedicated student absentees list (ONLY status ABSENT), attendance not entered list (unmarked sessions), multi-role global directory search (Ctrl+K), non-blocking feedback, 28 Vitest tests (158/158 total suite passing). |

### 2.4 Application Layer (Backend)
| Component / Area | Status | Notes |
| :--- | :--- | :--- |
| **Django Virtual Environment & Dependencies** | `IMPLEMENTED` | Python 3.11 virtualenv (`backend/.venv`), Django 5.1.15, DRF 3.15.2, psycopg 3.3.6, pytest 9.1.1 installed |
| **Django Project Foundation & Settings** | `IMPLEMENTED` | Settings unified for Twelve-Factor/PostgreSQL, logging configured, `manage.py check` passes with 0 issues |
| **Modular App Domain Boundaries** | `IMPLEMENTED` | 11 app modules under `backend/apps/` configured with `models.py`, `services.py`, `serializers.py`, `views.py`, `urls.py` |
| **Domain Services & Base Architecture** | `IMPLEMENTED` | `BaseService` foundation, 11 dedicated service classes, CBSE 8-tier grading, 4-status attendance formula, Student ID format helpers |
| **Health Check Endpoint (`/api/health/`)** | `IMPLEMENTED` | Unauthenticated liveness probe with honest, non-crashing database connectivity status (`status: ok`) |
| **Backend Test Infrastructure** | `IMPLEMENTED` | `backend/pytest.ini` and 201 unit/model/API tests passing (201/201 passing, 100% test pass rate across all 14 modules) |
| **Backend Container Blueprint** | `IMPLEMENTED` | `backend/Dockerfile` created conforming to `infra/docker-compose.yml` |
| **REST API Endpoints (`/api/v1/`)** | `IMPLEMENTED` | Initial REST API foundation implemented across `auth`, `students`, `parents`, `faculty`, `classes`, `subjects`, `attendance`, and `marks` with standard envelopes, pagination, and error formatting |
| **Authentication Foundation (Task 4.1)** | `IMPLEMENTED` | Stateless SimpleJWT setup (15m access / 7d refresh), AuthService boundary, password validators & PBKDF2 hashing, safe profile serializers, 27 dedicated tests |
| **Custom User & Login Workflow (Task 4.2)** | `IMPLEMENTED` | Authoritative login workflow (`POST /api/v1/auth/login/`), `ERPTokenObtainPairSerializer`, dual-envelope responses, token refresh (`/api/v1/auth/refresh/`), current-user identity (`/api/v1/auth/me/`), 20 dedicated tests (201/201 passing) |
| **Realtime WebSockets (Channels)** | `PLANNED` | Documented in `docs/BACKEND_ARCHITECTURE.md`; scheduled for Phase 6 |
| **Database Migrations & Models** | `IMPLEMENTED` | 13 concrete 3NF PostgreSQL models (`Role`, `User`, `Faculty`, `Parent`, `Student`, `AcademicYear`, `SchoolClass`, `Section`, `Subject`, `Enrollment`, `Attendance`, `LeaveApplication`, `ExamType`, `Mark`), hardened migrations, and live PostgreSQL seeded dataset |


### 2.5 Infrastructure & Database
| Component / Area | Status | Notes |
| :--- | :--- | :--- |
| **Database Architecture Specification** | `IMPLEMENTED` | Comprehensive 3NF relational schema in `docs/DATABASE_SCHEMA.md` |
| **Database Directory & Migration Guidelines** | `IMPLEMENTED` | Preserved in `database/README.md` |
| **Infrastructure Architecture & Topology** | `IMPLEMENTED` | Documented in `docs/DEPLOYMENT.md` and `infra/README.md` |
| **Docker Compose Orchestration Blueprint** | `IMPLEMENTED` | Baseline multi-service configuration in `infra/docker-compose.yml` |
| **Live VPS / Production Cluster** | `NOT IMPLEMENTED` | Production deployment not active in Phase 1 |
