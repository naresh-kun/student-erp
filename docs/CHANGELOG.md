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

### Fixed & Maintained
- **Repository Git Hygiene**:
  - Created root `.gitignore` to prevent Python bytecode (`__pycache__/`, `*.pyc`), Node build directories (`node_modules/`, `dist/`), environment secrets (`.env*`), and IDE artifacts from being tracked.
  - Purged all compiled `.pyc` and `__pycache__/` files from Git tracking and working tree.
- **Frontend Runtime & Module Resolution**:
  - Renamed `postcss.config.js` and `tailwind.config.js` to `.cjs` (`postcss.config.cjs`, `tailwind.config.cjs`) to resolve CommonJS/ESM scope mismatch when `"type": "module"` is defined in `package.json`.
  - Removed unused `Database` icon import from `src/App.tsx` satisfying strict TypeScript `noUnusedLocals` checks.
  - Verified local dev server (`npm run dev`) and production bundle build (`npm run build`).

---

## [Phase 2: Frontend Core + Role Dashboards + Mock Data Integration] - 2026-09-23

### Added (Task 2.1: Frontend Application Foundation)
- **Phase 2 Governance & Specification**:
  - `docs/phase_prompts/PHASE_02.md`: Authoritative Phase 2 specification covering objectives, constraints, 34 application routes + catch-all 404 route contract, and acceptance criteria.
  - `docs/phases/PHASE_02_STATUS.md`: Phase 2 tracking ledger initiated (IN PROGRESS).
- **Frontend Application Shell & Routing**:
  - `src/app/router.tsx`: Fixed contract of 34 application routes + catch-all 404 route fully wired with React Router across Shared (1), Student (6), Parent (6), Faculty (5), Admin (11), and Principal (5) domains.
  - `src/app/navigation.ts`: Comprehensive role-specific navigation definitions with Lucide React icons.
  - `src/layouts/DashboardLayout.tsx`: Responsive shell featuring collapsible sidebar, top navigation, user profile summary, dark/light theme toggle, and quick role switcher.
  - `src/layouts/AuthLayout.tsx`: Centered focus layout for authentication with institutional branding.
  - `src/layouts/RoleRoute.tsx`: Client-side route guard enforcing authentication and role clearance.
- **Mock Authentication System**:
  - `src/services/authService.ts`: Client-side session management with `localStorage` persistence and simulated credentials.
  - `src/features/auth/AuthContext.tsx` & `src/hooks/useAuth.ts`: Reactive auth context and hook supporting 1-click role simulation.
  - `src/pages/LoginPage.tsx`: Interactive login portal with 1-click role selectors for all 5 roles.
- **Shared UI Component Primitives**:
  - `src/components/ui/Card.tsx`, `Button.tsx`, `Badge.tsx`, `PageContainer.tsx`, `SectionHeader.tsx`, `States.tsx` (Loading, Empty, Error), and `RoutePlaceholder.tsx`.
- **Route Shell Pages**:
  - Scaffolding of all 34 application routes in `src/pages/` (Student, Parent, Faculty, Admin, Principal, and 404 handler) ensuring zero broken links or 404 errors during navigation.

### Changed (Task 2.1 Demo Surface Upgrade)
- **Elimination of Developer Scaffold Views**:
  - Replaced technical placeholder panels with role-tailored, believable ERP presentation surfaces across all 34 routes.
  - Student: Interactive dashboard with attendance AreaChart and midterm scores BarChart, 2-column profile record, attendance log, score register, weekly timetable tabs, and categorized calendar.
  - Parent: Family academic overview with child switcher, attendance logs with excuse submission form, term report card with teacher remarks, and school calendar.
  - Faculty: Teaching workspace with today's lecture schedule, class roster tables, live interactive attendance recording sheet, marks grade book with Recharts distribution chart, and faculty timetable.
  - Admin: Institutional operations center with 6-month trends, master student/parent/faculty directories with live search, classes & capacity bars, subjects catalog, attendance/marks audits, master timetable, and section allocation engine preview.
  - Principal: Executive leadership console with school-wide KPIs, departmental pass rate bar chart, cohort attendance line chart, faculty appraisal roster, and downloadable executive dossiers.
- **Service Layer Enrichment**:
  - Extended `src/services/mockService.ts` with typed methods for student directories, faculty directories, parent directories, weekly timetable grids, section allocation previews, and institutional KPIs.
- **Component Hygiene**:
  - Removed obsolete `src/components/ui/RoutePlaceholder.tsx` and added `info` variant to `src/components/ui/Badge.tsx`.

### Changed (Task 2.1 Demo Surface — Service Data Cleanup)
- **Extracted Inline Contextual Prototype Data Behind Service Abstraction Layer**:
  - Migrated hardcoded contextual prototype arrays out of React page components and placed them behind typed async methods on `MockDataService`:
    - `/student/attendance`: `getStudentAttendanceHistory()` for attendance session log records.
    - `/student/marks`: `getStudentExamRecords()` for detailed examination score rows.
    - `/student/calendar`: `getAcademicCalendarEvents()` for categorized campus events.
    - `/parent/children`: `getParentChildrenCards()` for linked children cards.
    - `/parent/attendance`: `getStudentAbsenceLogs()` for student absence advisory records.
    - `/parent/marks`: `getParentStudentEvaluations()` for term subject evaluations.
    - `/parent/calendar`: `getParentCalendarEvents()` for family calendar events.
    - `/faculty/dashboard`: `getFacultyTodayLectures()` and `getFacultyAssignedClassesSummary()`.
    - `/faculty/marks`: `getFacultyGradeDistribution()` and `getFacultyClassGrades()`.
    - `/faculty/timetable`: `getFacultyTimetableSlots()`.
    - `/admin/classes`: `getClassSections()` for class section capacities and coordinators.
    - `/admin/subjects`: `getSubjectsCatalog()`.
    - `/admin/attendance`: `getAttendanceAuditLogs()`.
    - `/admin/marks`: `getExamSummaries()`.
    - `/admin/timetable`: `getMasterTimetableEntries()`.
    - `/admin/calendar`: `getCalendarNotices()`.
    - `/principal/academics`: `getClassGpaComparisons()`.
    - `/principal/attendance`: `getGradeAttendanceTrends()`.
    - `/principal/reports`: `getReportMetadata()` for formal institutional dossiers.
  - Zero raw JSON imports in any page or presentation component; zero duplicate dataset copies.
  - Strict data flow maintained: `Mock JSON / Service Data -> Mock Service -> Typed Data -> React Page / Component`.

### Changed (Phase 2 Authentication Demo Correction)
- **Institutional Mock Credential-Based Authentication**:
  - Replaced visible 1-click role simulation buttons on `src/pages/LoginPage.tsx` with a realistic institutional ERP login portal requesting User ID / Institutional Email and Password.
  - Implemented `MockAuthService.loginWithCredentials(identifier, password)` matching against synthetic records in `mock-data/users.json` with institutional aliases.
  - Role is strictly derived from the matched synthetic mock user record; users do NOT select their role during normal login.
  - Authenticated synthetic user session persisted in client `localStorage` (`student_erp_active_user`).
  - Enriched `mock-data/users.json` with synthetic demonstration password (`"password": "demo123"`).
- **Elimination of Role Switchers from Normal UI**:
  - Completely removed the interactive quick role-switcher dropdown from `src/layouts/DashboardLayout.tsx`, replacing it with a read-only role indicator pill.
  - A logged-in student has zero UI mechanisms to switch to Parent, Faculty, Admin, or Principal.
  - Client-side `<RoleRoute>` guard enforcement verified: direct unauthorized URL navigations (e.g. Student entering `/admin/dashboard`) are blocked and redirected to `/student/dashboard`.
- **Development-Only Testing Accessibility**:
  - Preserved developer testing velocity through a hidden helper panel activated solely via `?dev=true` URL query parameter or `Alt+Shift+D` keyboard shortcut, and console helpers (`window.__erpRoleLogin`, `window.__erpFillCredentials`). Completely omitted from normal demonstration presentation.
- **Security & Architectural Status**:
  - Authentication remains strictly **MOCKED** on synthetic datasets without live Django/PostgreSQL/Redis connectivity. Real cryptographic authentication remains **PLANNED** for Phase 4.
