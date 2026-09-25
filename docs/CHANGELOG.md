# Project Changelog

All notable changes to the Student ERP project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Phase 2: Task 2.5 — Deep Admin & Principal Role Experiences] - 2026-09-25

### Added
- **Admin Domain Feature Module (`frontend/src/features/admin/`)**:
  - Structured domain architecture: `types/`, `schemas/`, `services/`, `hooks/`, `components/`, and barrel export `frontend/src/features/admin/index.ts`.
  - Decomposed all 11 Admin routes (`/admin/dashboard`, `/admin/students`, `/admin/parents`, `/admin/faculty`, `/admin/classes`, `/admin/subjects`, `/admin/attendance`, `/admin/marks`, `/admin/timetable`, `/admin/calendar`, `/admin/allocation`) into thin page views consuming domain components and hooks.
  - **Student Master Directory**: Real-time search, grade and stream filtering, immutable permanent Student ID (`STU202600001`), student profile inspection modal, and direct CSV register export.
  - **Parent Master Directory**: Guardian directory with phone, occupation, and verified linked children Student IDs.
  - **Faculty Master Directory**: Descriptive staff roster with employee codes, departments, designations, qualifications, assigned classes, and weekly period counts (e.g. 24 Periods / wk); strictly non-evaluative (zero ratings, reviews, rankings, or scores).
  - **Classes & Sections Capacity**: Grade 10 (no stream) and Grades 11–12 stream designations (`Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`) with room numbers and enrollment capacity bars.
  - **Subjects Catalog**: Course catalog with weekly period counts (university credits permanently purged).
  - **Attendance Oversight**: School-wide 4-status audit registers (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`) adhering to $(P + OD) / Total \times 100$.
  - **Marks Register & Grade Audit**: Exam-wise marks registers scored out of 100 with CBSE 8-tier letter grades (`A1`–`E`) and pass percentages.
  - **Master Timetable Grid**: 8-period weekly schedule across Monday–Friday mapping classes, subjects, faculty, and room locations.
  - **Calendar Event Publisher**: Institutional event manager with Zod schema validation (`eventSchema.ts`) and On Duty credit eligibility flags.
  - **Class & Section Allocation Engine**: Dual allocation methods (Merit-based descending rank and Seeded Random) with stream boundary enforcement, interactive preview modal (`AllocationPreviewModal.tsx`), and historical allocation logs.
  - **Automated Vitest Test Suite**: 18 automated unit tests in `frontend/tests/admin.test.ts`.

- **Principal Domain Feature Module (`frontend/src/features/principal/`)**:
  - Structured domain architecture: `types/`, `schemas/`, `services/`, `hooks/`, `components/`, and barrel export `frontend/src/features/principal/index.ts`.
  - Decomposed all 5 Principal routes (`/principal/dashboard`, `/principal/academics`, `/principal/attendance`, `/principal/faculty`, `/principal/reports`) into modular page views consuming domain components and hooks.
  - **Head of Institution Executive Console**: Executive institutional branding, high-level KPIs (Enrollment 1,248, Faculty 86, Student-Teacher Ratio 15:1, Attendance Rate, Academic Quality Avg), Recharts CBSE 8-tier grade distribution, and longitudinal attendance curves.
  - **Academic & Cohort Analytics**: Grade-level comparisons, senior secondary stream comparisons (Grades 11 & 12), subject performance quality assurance, and CBSE 8-tier distribution.
  - **Attendance Telemetry & Longitudinal Cohort Trends**: 4-status institutional presence telemetry and longitudinal cohort progression curves (Grades 9–12).
  - **Departmental Faculty Roster & Workload Oversight**: Descriptive staff roster with qualifications and weekly workloads (strictly non-evaluative).
  - **Statutory Report Endorsement Workflow**: Institutional reports registry across Academic, Attendance, Faculty, and Governance categories. Report review modal (`ReportReviewModal.tsx`) supporting status transitions (`Draft` / `Review` -> `Approved`) with principal signature (`Dr. K. Radhakrishnan (Principal)`), timestamp, and official review remarks, plus downloadable official dossier text file generation.
  - **Automated Vitest Test Suite**: 10 automated unit tests in `frontend/tests/principal.test.ts`.

- **Authoritative Phase 2 Task 2.5 Specification**:
  - Authored `docs/phase_prompts/Phase_2_Task_2.5.md` covering all domain rules, constraints, architectural patterns, and acceptance checklists.

- **Test Suite & Build Metrics**:
  - 128/128 automated Vitest unit tests passing across all 7 test suites (`attendance.test.ts`, `grading.test.ts`, `student.test.ts`, `parent.test.ts`, `faculty.test.ts`, `admin.test.ts`, `principal.test.ts`).
  - Production build verified with zero TypeScript errors or warnings (`npm run build` exit code 0).

---

## [Phase 2: Demo Credential Update] - 2026-09-25

### Changed — TEMPORARY PHASE 2 DEMO CREDENTIALS

> ⚠️ These are **temporary Phase 2 demonstration credentials only**. Real authentication (JWT/OAuth) is PLANNED for Phase 4. Do NOT hash or migrate passwords.

| Role      | User ID     | Password  |
| :-------- | :---------- | :-------- |
| Student   | `Student01` | `demo123` |
| Parent    | `Parent01`  | `demo123` |
| Faculty   | `Faculty01` | `demo123` |
| Admin     | `Admin`     | `demo123` |
| Principal | `Principal` | `demo123` |

- **`mock-data/users.json`**: Updated `username` fields for `usr_001` (Admin), `usr_002` (Principal), `usr_003` (Faculty), `usr_005` (Student), `usr_007` (Parent) to match the required presentation identifiers.
- **`frontend/src/services/authService.ts`**: Rewrote `loginWithCredentials` to resolve the five new demo aliases (`Student01`, `Parent01`, `Faculty01`, `Admin`, `Principal`) with explicit user-ID binding. Removed old `parent123`/`demo123-parent` password-sniffing heuristic. Added inline credential table in JSDoc comment. Updated `SYNTHETIC_DEMO_ACCOUNTS` array to publish the new identifiers to the dev panel.
- **`frontend/src/pages/LoginPage.tsx`**: Updated form placeholder text, label hint, and dev panel header to reflect new credential format.
- **`frontend/tests/parent.test.ts`**: Updated two Parent login tests to use `Parent01`/`demo123` and `selvam.m`/`demo123` instead of legacy `STU202600001`/`parent123` flow; Student-Parent domain relationship assertions preserved via `ParentService.isChildLinkedToParent`.
- **Test suite**: 100/100 tests passing post-update. Production build: ✓ (`npm run build` exit code 0).

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

### Changed (Master Plan Amendment 2 — Attendance LEAVE Status)
- **Attendance Status Architecture**:
  - Adopted canonical 4-status model across domain types, mock data, services, utilities, and UI views: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`.
  - Strictly maintained removal of `LATE` and `EXCUSED` across the entire codebase and synthetic datasets.
  - Defined `approved_by_faculty_id` on attendance records reflecting faculty authority for approving `LEAVE`.
- **Pure Attendance Calculation Utilities (`src/utils/attendance.ts`)**:
  - Implemented `calculateAttendancePercentage((PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100)` ensuring consistent calculation across all roles.
  - Added helpers `isAttending`, `isAbsence`, `getAttendanceStatusLabel`, and style constants `ATTENDANCE_BADGE_CLASSES` and `ATTENDANCE_CHART_COLORS`.
- **Mock Data & Service Layer (`mock-data/attendance.json` & `src/services/mockService.ts`)**:
  - Converted all mock attendance records to canonical 4 statuses with verified arithmetic.
  - Enriched `MockDataService` with `getPrincipalAttendanceDistribution()`, updated `getStudentAttendanceHistory()`, `getStudentAbsenceLogs()`, and `getAttendanceAuditLogs()` with `onDuty` and `leave` counts.
- **Role Portal Enhancements**:
  - **Faculty Portal** (`src/pages/faculty/index.tsx`): Attendance sheet supports 4 status buttons (`PRESENT`, `ON_DUTY`, `LEAVE`, `ABSENT`) with live recalculation and 5-card KPI summary.
  - **Student Portal** (`src/pages/student/index.tsx`): Attendance & Dashboard views feature 4 KPI cards (Overall %, Attended, Approved Leave, Absent) and violet badges for `LEAVE`.
  - **Parent Portal** (`src/pages/parent/index.tsx`): Clean distinction between approved `LEAVE` vs unexcused `ABSENT` with faculty approval requirements clearly stated in absence submission forms.
  - **Admin Portal** (`src/pages/admin/index.tsx`): 5-column institutional KPI bar and audit table with discrete columns for Enrolled, Present, On Duty, Leave, Absent, Attendance %, and Verified Faculty.
  - **Principal Portal** (`src/pages/principal/index.tsx`): 5 KPI cards, Recharts 4-status distribution chart (`#8b5cf6` for `LEAVE`, `#f43f5e` for `ABSENT`, `#3b82f6` for `ON_DUTY`, `#10b981` for `PRESENT`), and Master Plan Amendment 2 business rules legend.
- **Automated Unit Testing**:
  - Added 15 Vitest unit tests in `frontend/tests/attendance.test.ts` verifying calculation accuracy, edge cases, predicate classifications, and visual color assignments. All tests pass with zero regressions.

### Changed (Indian School ERP Frontend-Wide Reconciliation — CBSE/ICSE Model)
- **Purge of University / College Concepts**:
  - Completely purged all traces of GPA, CGPA, Credits, Credit Hours, Semester GPA, college-style transcripts, degree/major/minor, and faculty appraisal ratings/leaderboards across all active types, interfaces, mock data, services, utilities, components, pages, tables, forms, filters, and reports.
- **Canonical Indian School Academic Evaluation Model**:
  - Replaced GPA/credits with Marks out of 100 (numeric 0–100, or `'AB'` for absent assessments), Cumulative Marks (e.g. 435 / 500), Overall Percentage (87.00%), and standard 8-tier letter grades:
    - `A1` (91–100), `A2` (81–<91), `B1` (71–<81), `B2` (61–<71), `C1` (51–<61), `C2` (41–<51), `D` (33–<41), `E` (<33).
  - Implemented shared utility `frontend/src/utils/grading.ts` as the single source of truth for grading. Percentage and letter grades are guaranteed to agree across all 5 roles.
  - Implemented pure date and currency utilities `frontend/src/utils/dateFormat.ts` for Indian format `DD/MM/YYYY`, Academic Year `2026–27`, and marks formatting.
  - Created 19 comprehensive Vitest unit tests in `frontend/tests/grading.test.ts` verifying all 8 tiers, mandatory boundary conditions (`32.99`, `33`, `40.99`, `41`, `90.99`, `91`, `100`), absent assessments (`'AB'`), and formatting helpers (34/34 total suite tests passing).
- **Synthetic Indian School Identity & Personnel**:
  - Configurable school identity centralized in `frontend/src/config/schoolConfig.ts`: "School ERP", Academic Year 2026–27, affiliated to CBSE / ICSE Senior Secondary pattern.
  - Realistic synthetic Indian personas in `mock-data/users.json`, `students.json`, `faculty.json`, `parents.json`:
    - Student: Arun Kumar (`STU202600001`, Adm No: `ADM20240091`, Roll: `11-A2-04`, Grade 11, Computer Science A, DOB: 14/05/2009).
    - Faculty: R. Suresh (Senior PGT Mathematics & Department Head, Class Teacher XI-A2), Priya Krishnan (PGT Computer Science), Karthik Raman (PGT Physics), Meena Devi (PGT English), Anitha Joseph (PGT Chemistry).
    - Principal: Dr. K. Radhakrishnan.
    - Parents: S. Ramanathan (linked to Arun Kumar via Student ID `STU202600001`), M. Selvam.
- **Indian Senior Secondary Class & Stream Architecture**:
  - Structure: Academic Year → Grade/Class → Stream (Grades 11–12) → Section → Students.
  - Grade 10: General Secondary Core, Sections A and B.
  - Grades 11–12: Exactly 4 approved streams with stream-specific sections:
    - Computer Science A (Sections A1, A2, A3)
    - Bio-Maths B (Sections B1, B2, B3)
    - Commerce C (Sections C1, C2, C3)
    - Pure Science D (Sections D1, D2, D3)
- **School Assessment Terminology**:
  - Terminology aligned with Indian school examinations: Cycle Test, Unit Test, Quarterly Examination, Half-Yearly Examination, Annual Examination.
  - Timetable organized around Periods (Period 1 to Period 5, 08:30 AM to 02:45 PM), Subjects, Classrooms (`Room XI-A2`, `Comp Lab 2`, `Physics Lab`), and Faculty.
  - Subjects defined by weekly instructional periods (e.g. 6 Periods / wk) rather than university credit hours.
- **Faculty Non-Evaluative Architecture**:
  - Removed all faculty appraisal ratings, review scores, performance leaderboards, and teacher scoring columns from Admin and Principal portals.
  - Faculty directory displays descriptive data only: Name, Designation, Department, Assigned Classes, Weekly Period Workload, and Status.
- **Enterprise School Design System**:
  - Replaced glowing gradients, neon accents, and dark tech styling with enterprise Indian school design: Deep Navy primary (`bg-blue-900`), clean white/slate surfaces, flat bordered cards, minimal shadows, clear data tables, and WCAG AA contrast.
  - Global Header displays School Name, Academic Year (2026–27), User Name, and Role.
- **Role Portals Reconciled**:
  - Student Portal: Prominent Student ID, Class & Section, Stream, 4-status attendance (94.30%), Cumulative Marks (435/500), Percentage (87.00%), Grade A2, official report card.
  - Parent Portal: Authenticates with child's Student ID (`STU202600001`), synchronized child performance, absence leave submissions, teacher contact.
  - Faculty Portal: Class Teacher XI-A2 workflow, 4-status attendance roll call with "Mark All Present", marks entry (0–100 or 'AB'), 8-tier grade distribution chart snapshot.
  - Admin Portal: Enrolled students registry with Student IDs, 4 streams, class sections, subjects catalog with weekly periods, attendance audit, and stream allocation preview.
  - Principal Portal: Institutional overview (Overall Academic Average 81.7%, Attendance 94.2%, 1,248 students, 86 faculty), grade-by-grade academic average %, and school report dossiers.

### Changed (Corrective Task — Canonical "School ERP" Branding Reconciliation)
- **Elimination of "Vidya Mandir" Branding**:
  - Removed all occurrences of "Vidya Mandir", "Vidya Mandir Senior Secondary School", and "Vidya Mandir School Administration" across the entire repository.
  - Set canonical application branding in `frontend/src/config/schoolConfig.ts`:
    - `name: 'School ERP'`
    - `shortName: 'School ERP'`
    - `campusLocation: 'K.K. Nagar'`
    - `city: 'Madurai'`
    - `state: 'Tamil Nadu'`
    - `pinCode: '625001'`
    - `contactEmail: 'office@schoolerp.edu.in'`
    - `contactPhone: '+91-452-2618-4001'`
  - Updated Admin Hero header in `frontend/src/pages/admin/index.tsx` to dynamically bind to `{SCHOOL_CONFIG.name} Administration`.
  - Updated Principal Hero header in `frontend/src/pages/principal/index.tsx` to dynamically bind to `{SCHOOL_CONFIG.name} Institutional Oversight`.
  - Updated all mock user and faculty emails from `@vidyamandir.edu.in` to `@schoolerp.edu.in` across `mock-data/users.json`, `mockService.ts`, and `authService.ts`.
  - Updated HTML page title in `frontend/index.html` to `School ERP — Enterprise Educational Management`.

---

## [Phase 2: Task 2.2 — Deep Student Role Experience] - 2026-09-24

### Added
- **Student Domain Feature Module (`frontend/src/features/students/`)**:
  - Organized modular domain architecture with dedicated subdirectories: `types/`, `schemas/`, `services/`, `hooks/`, and `components/`.
  - Exported unified API from `frontend/src/features/students/index.ts`.
  - Decomposed student pages (`/student/*`) to consume reusable domain components rather than growing monolithic page code.
- **Authoritative Student Profile Component & Immutability Protection**:
  - Implemented `StudentProfileCard` and `StudentProfileEditModal` rendering permanent, unique, and immutable Student ID (`STU202600001`), Admission Number (`ADM20240091`), Roll Number (`11-A2-04`), Full Name (`Arun Kumar`), Indian-formatted Date of Birth (`14/05/2009`), Class 11, Section A2, Stream (`Computer Science A`), Academic Year (`2026–27`), Guardian (`S. Ramanathan`), and Emergency Contact.
  - Implemented strict immutability: Student ID is explicitly locked and identified as the Parent Portal username; academic attributes cannot be edited.
  - Contact information updates (phone, emergency contact, residential address) are governed by Zod validation schema (`studentProfileSchema.ts`).
- **Canonical Four-Status Student Attendance Experience**:
  - Enhanced `StudentAttendanceSummary` with 5 dedicated metric cards: Overall Attendance (94.25%), Present (78 sessions), On Duty (4 sessions), Approved Leave (3 sessions), and Absent (2 sessions).
  - Adhered strictly to Master Plan Amendment 2 calculation: $(P + OD) / Total \times 100$.
  - Visually differentiated `LEAVE` (purple tokens) from `ABSENT` (rose tokens).
  - Rendered subject-wise attendance clearance bars against the 85% board exam hall ticket eligibility requirement.
- **Institutional Student Leave Request Workflow**:
  - Implemented `StudentLeaveApplicationModal` and `StudentLeaveHistoryCard`.
  - Enforced business policy: Submissions are created strictly in `PENDING` state; students cannot self-approve. Faculty/Class Teacher (`R. Suresh`) is the sole sanctioning authority.
  - Added Zod validation schema (`leaveRequestSchema.ts`) validating leave categories, ISO dates (conclusion $\ge$ commencement), and reason justification length (10–300 characters).
- **Indian School Marks & Academic Score Register**:
  - Maintained Marks out of 100, Cumulative Marks (`435 / 500`), Overall Percentage (`87.00%`), and 8-tier letter grade (`A2`) using shared `src/utils/grading.ts`. Zero GPA, CGPA, or credits.
  - Rendered official CBSE/ICSE-oriented Score Register table with downloadable PDF action and standard 8-tier letter grade reference scale.
- **Refined Student Dashboard**:
  - Displays Student Identity & ID, Class / Section / Stream, KPI cards with attendance integration, Today's Class Schedule (5 periods), Attendance Progression Trend, Half-Yearly marks comparison, and new `StudentUpcomingEventsCard` for upcoming examinations and academic events.
- **Automated Vitest Test Suite**:
  - Created 25 automated unit tests in `frontend/tests/student.test.ts` covering profile immutability, Zod schemas, leave request workflow, canonical attendance calculations, grading presentations, and visual QA contracts.
  - Total test suite now stands at **59/59 passing unit tests** across the project with zero regressions.

---

## [Phase 2: Task 2.3 — Deep Parent Role Experience] - 2026-09-25

### Added
- **Parent Domain Feature Module (`frontend/src/features/parents/`)**:
  - Organized modular domain architecture with dedicated subdirectories: `types/`, `schemas/`, `services/`, `hooks/`, and `components/`.
  - Re-exported domain module via barrel export `frontend/src/features/parents/index.ts`.
  - Refactored all 6 Parent routes (`/parent/*`) into thin page views consuming domain hooks and components.
- **Student ID Parent Login Rule Implementation**:
  - Enforced permanent Student ID (`STU202600001` or `STU202600002`) as the Parent login username, consistently presented across login interfaces and portal banners with copy utility.
  - Enhanced `MockAuthService.loginWithCredentials` to map child Student IDs to authenticated Parent records (`usr_007`, `usr_008`).
  - Updated synthetic demo accounts in `authService.ts` to showcase `STU202600001` with `parent123`.
- **Multi-Child Scoped Access & Security Boundaries**:
  - Scoped parent visibility strictly to children listed in the authenticated record's `children_student_ids` (`S. Ramanathan` -> `Arun Kumar STU202600001`).
  - Added security helper `isChildLinkedToParent` preventing inspection of unrelated students (`STU202600002`, `STU202600004`).
  - Created `useActiveChild` hook providing clean multi-child switching across all parent pages when multiple children are linked.
- **Canonical Four-Status Parent Attendance Experience**:
  - Implemented `ParentAttendanceCards` displaying 5 dedicated cards: Overall Attendance (94.3% / 94.25%), Present (78), On Duty (4), Approved Leave (3), and Absent (2).
  - Adhered strictly to Master Plan Amendment 2 formula: $(P + OD) / (P + A + OD + L) \times 100$.
  - Visually distinguished `LEAVE` (purple/violet tokens) from `ABSENT` (rose tokens) and correctly counted `LEAVE` as absence in the denominator.
  - Implemented `ParentSubjectAttendanceTable` with individual subject percentages, progress bars, and board clearance threshold tags (85% benchmark).
  - Implemented `ParentAttendanceTrendChart` with Recharts AreaChart visualizing monthly verified attendance progression.
  - Implemented `ParentAbsenceLogTable` showing official session logs with faculty sanctioning details.
- **Parent Absence Notification Workflow**:
  - Implemented `ParentAbsenceNoticeCard` utilizing `react-hook-form` and Zod validation (`parentAbsenceNoticeSchema`).
  - Submissions are created strictly in `PENDING_FACULTY_REVIEW` state; parents cannot self-approve. Class Teacher (`R. Suresh`) is the sole sanctioning authority for converting absences to `LEAVE`.
- **Indian School Academic Model & Report Cards**:
  - Displayed Marks out of 100, Cumulative Marks (`435 / 500`), Overall Percentage (`87.00%`), and 8-tier letter grade (`A2`) using shared `src/utils/grading.ts`.
  - Zero university concepts: GPA, CGPA, credits, credit hours completely purged.
  - Implemented `ParentReportCardTable` with official Score Register, teacher remarks, downloadable PDF action, and standard 8-tier letter grade reference scale.
  - Implemented `ParentMarksComparisonChart` comparing child's marks out of 100 against section averages across all subjects.
- **Timetable, Calendar & Deterministic Advisories**:
  - Implemented `ParentTimetableSchedule` with 5 scheduled daily periods (08:30 AM – 01:15 PM / 02:45 PM), room assignments, and Monday–Friday navigation.
  - Implemented `ParentCalendarEventsList` rendering school events (PTM on Nov 14, 2026, Half-Yearly Exams, Diwali break, Science Exhibition).
  - Implemented `ParentAdvisoryCard` generating deterministic observations based on actual mock data (94%+ standing, Chemistry focus recommendation, PTM consultation notice).
  - Implemented `ParentTeacherContactCard` with Class Teacher `R. Suresh` contact details.
- **Automated Vitest Test Suite**:
  - Created 19 automated unit tests in `frontend/tests/parent.test.ts` validating parent profile handling, child linking, Student ID login, unrelated student access protection, 4-status attendance calculations, report cards, absence workflow, Zod schema, and deterministic advisories.
  - Total test suite now stands at **78/78 passing unit tests** across 4 test suites with zero regressions.

---

## [Phase 2: Task 2.4 — Deep Faculty Role Experience] - 2026-09-25

### Added
- **Faculty Domain Feature Module (`frontend/src/features/faculty/`)**:
  - Structured domain architecture: `types/`, `schemas/`, `services/`, `hooks/`, `components/`, and barrel export `frontend/src/features/faculty/index.ts`.
  - Refactored all 5 Faculty routes (`/faculty/dashboard`, `/faculty/classes`, `/faculty/attendance`, `/faculty/marks`, `/faculty/timetable`) into modular page views consuming domain hooks and components.
- **Authoritative Faculty Profile & Non-Evaluative Governance**:
  - Modeled senior PGT profile for `R. Suresh` (`usr_003` / `fac_001`), Senior PGT Mathematics & Department Head, Class Teacher of `Grade 11 — Section A2`.
  - Displayed qualifications, specialization (Algebra, Calculus, 3D Geometry), office room (`Staff Room B, Ramanujan Block`), and employee code (`FAC-MATH-012`).
  - Strictly enforced non-evaluative governance: zero faculty ratings, reviews, rankings, appraisal scores, or teacher comparison metrics.
- **Assigned Class & Student Scoping**:
  - Scoped faculty access strictly to authorized assigned classes: `Grade 11 — Computer Science A (Sec A2)`, `Grade 12 — Computer Science A (Sec A1)`, `Grade 10 — Section A`. Unrelated school classes are inaccessible.
  - Enrolled students roster with permanent, immutable Student ID (`STU202600001`, `STU202600002`), roll numbers, admission numbers, attendance rates, academic %, derived 8-tier letter grades, and CSV export.
- **Session Attendance Roll Call & Canonical 4-Status Model**:
  - Implemented `FacultyAttendanceRollCallSheet` with 4 canonical statuses: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`.
  - Implemented canonical "Mark All Present" action with immediate live count and percentage updates.
  - Adhered strictly to Master Plan Amendment 2 calculation via shared utility `src/utils/attendance.ts`: $(P + OD) / (P + A + OD + L) \times 100$.
  - `LEAVE` strictly counted as absence in the denominator.
  - Session state tracking (`Not Marked`, `In Progress`, `Marked`).
- **Class Teacher LEAVE Approval Workflow**:
  - Empowered Class Teacher `R. Suresh` as the sole sanctioning authority for reviewing pending absence notices from students (`STORAGE_STUDENT_LEAVE_KEY`) and parents (`STORAGE_PARENT_ABSENCE_KEY`).
  - Actions: `Approve Leave` converts notice status to sanctioned `LEAVE` and records audit data (`approved_by_faculty_id`, `approved_by_name`, `approved_at`); `Reject` converts notice status to `REJECTED`.
  - Approved leaves automatically populate in the session attendance roll call sheet for that date.
- **Examination Marks Entry & CBSE 8-Tier Grading**:
  - Implemented `FacultyMarksEntrySheet` supporting marks out of 100 (0–100) or 'AB' (Absent).
  - Implemented Zod validation and input parser rejecting negative marks, >100, and malformed text.
  - Derived standard CBSE 8-tier letter grades (`A1` to `E`) via shared `src/utils/grading.ts`.
  - Implemented `FacultyGradeDistributionChart` (Recharts BarChart) visualizing class grade distribution.
  - Zero university concepts: GPA, CGPA, credits, or grade points.
- **Instructional Timetable Routine**:
  - Implemented `FacultyTimetableSchedule` with Monday–Friday tabs, period cards (Period 1 to Period 8), room assignments, and 24 periods/week workload.
- **Automated Vitest Test Suite**:
  - Created 22 automated unit tests in `frontend/tests/faculty.test.ts` covering faculty profile, class/student scoping, timetable, 4-status roll call, "Mark All Present", leave approval/rejection, marks validation, and 8-tier grade derivation.
  - Total test suite now stands at **100/100 passing unit tests** across 5 test suites with zero regressions.



