# Project Changelog

All notable changes to the Student ERP project will be documented in this file.

## [Phase 5: Task 5.1 — Core ERP API Integration: Student Module] - 2026-10-07

### Summary
Officially opened Phase 5. Migrated the Student module from mock-backed data to the live Django REST Framework backend APIs while strictly preserving the established frontend service abstraction (`React component -> StudentService -> StudentApiService -> ApiClient -> DRF`), enterprise light theme UI, and security boundaries. Created the core production `ApiClient` with automatic JWT Bearer token injection, 401 interception, automatic token refresh via `/api/v1/auth/refresh/`, and normalized `ApiError` handling. Enhanced backend `StudentDetailSerializer` and `StudentDetailView` (`/api/v1/students/me/`) with dynamic class/section/stream/teacher hydration from active enrollments. Created 13 backend integration tests and 9 frontend unit/integration tests with 100% pass rate (390/390 backend pytest tests, 190/190 frontend Vitest tests, clean build, zero schema drift). Performed end-to-end browser verification of the complete student workflow.

### Added / Modified
- **Backend (`backend/apps/students/`)**:
  - `serializers.py`: Enhanced `StudentDetailSerializer` with dynamic enrollment resolution fields (`current_class`, `current_section`, `stream`, `academic_year`, `class_teacher_name`, `class_teacher_email`, `class_teacher_dept`, `class_teacher_room`).
  - `views.py`: Extended `StudentDetailView.get` to support `pk == 'me'` shortcut mapping to `request.user.student_profile` with object-level permission enforcement.
  - `tests/test_phase5_student_integration_task51.py`: Authored 13 dedicated integration tests verifying authenticated student profile (`/me`), cross-student access blocking (403/404), immutable identity protections, attendance retrieval, leave submission (strictly PENDING), and marks/report card retrieval.
- **Frontend (`frontend/src/`)**:
  - `services/api.ts`: Established core production `ApiClient` featuring automated auth header injection, 401 interception with automated token refreshing, concurrent request queuing during refresh, and typed `ApiError` extraction.
  - `features/students/services/studentApiService.ts`: Created dedicated API client bridging DRF endpoints (`/api/v1/students/me/`, `/api/v1/attendance/`, `/api/v1/leaves/`, `/api/v1/marks/`, `/api/v1/report-cards/`) and adapting backend schemas to frontend domain models.
  - `features/students/services/studentService.ts`: Connected domain service methods (`getProfile`, `getAttendance`, `submitLeaveApplication`, `getMarks`, `getReportCard`) to `studentApiService` with graceful offline/test fallback.
  - `tests/student_api_integration.test.ts`: Authored 9 Vitest integration tests validating API mapping, token header injection, error normalization, 401 refresh flows, and fallback logic.
- **Verification & Governance**:
  - Local browser verification executed for `STU202600001` navigating Dashboard, Profile, Attendance, Marks, Homework, and Logout (`task51_student_flow_1791321497316.webp`).
  - Created `docs/phase_prompts/Phase_5_Task_5.1.md` and `docs/phase_prompts/Phase_5_Task_5.1_Completion_Report.md`.
  - Updated `docs/phases/PHASE_05_STATUS.md` and `docs/PROJECT_STATUS.md`.

---

## [Phase 4: Documentation Cleanup — Terminology Correction] - 2026-10-07

### Summary
Documentation-only cleanup correcting unsupported "statutory report endorsement" terminology across project documentation to accurately reflect the actual RBAC implementation. Principal role authority is limited to school-wide oversight, institutional report review, and marks/report approval where explicitly permitted by RBAC — not statutory endorsement powers.

### Changed
- **`PROJECT_STATUS.md`**: Principal module description corrected from "statutory report endorsement workflow" to "institutional report review workflow".
- **`Phase_4_Task_4.8_Completion_Report.md`**: Principal RBAC summary corrected from "statutory report endorsement" to "institutional report oversight".
- **`PHASE_02_STATUS.md`**: Section heading corrected from "Statutory Report Endorsement Workflow" to "Institutional Report Review Workflow"; sub-bullet "Endorsement workflow" corrected to "Review workflow".
- **`CHANGELOG.md`**: Phase 2 Task 2.5 entry corrected from "Statutory Report Endorsement Workflow" to "Institutional Report Review Workflow".

### Not Changed (Correct Historical References)
- `Phase_2_Task_2.6.md`: Task spec instructing audit/removal of "statutory" claims — preserved as authoritative specification.
- `PHASE_03_STATUS.md`: Past-tense record of purging "statutory" references — preserved as historical record.
- `CHANGELOG.md` Task 2.6/3.2 entries: Audit confirmations that statutory claims were removed — preserved as remediation evidence.

### Governance
- Phase 4: COMPLETE & SIGNED OFF (unchanged)
- Phase 5: NOT STARTED (unchanged)
- No code, migrations, tests, or configuration modified.

---

## [Phase 4: Task 4.8 — Final Sign-off, Governance Closure & Phase 5 Gate] - 2026-10-06

### Summary
Conducted final Phase 4 release-gate verification, governance audit, and Phase 5 transition checks. Successfully executed local browser UI verification across all 5 canonical roles (**Admin**, **Principal**, **Faculty**, **Student**, **Parent**), validating authentication, role-based dashboard redirects, UI hydration, and clean logout. Verified MOD_001 active enrollment scoping on Homework and strict separation from Phase 5. Executed full regression testing with 100% pass rate: 377/377 backend pytest tests (1217.81s), 181/181 frontend Vitest tests (5.30s), 0 Django system issues, 0 migration drift, and clean production build. Formally signed off Phase 4. Phase 5 remains explicitly NOT STARTED.

### Added / Modified
- **Local Browser UI Verification**:
  - Executed automated browser verification against `http://localhost:5173` with backend on `http://127.0.0.1:8000`.
  - Verified login, role redirect, dashboard render, and session cleanup for:
    - Admin (`admin_demo` -> `/admin/dashboard`)
    - Principal (`principal_demo` -> `/principal/dashboard`)
    - Faculty (`faculty_suresh` -> `/faculty/dashboard`)
    - Student (`STU202600001` -> `/student/dashboard`)
    - Parent (`parent_ramanathan` -> `/parent/dashboard`)
  - Artifact recording saved: `task48_ui_verification_1791316080446.webp`.
- **MOD_001 Active Enrollment Audit**:
  - Verified `AuthorizationService._scope_homework_queryset` actively filters by `status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled']` for Student and Parent. Confirmed PASS.
- **Documentation & Governance**:
  - Authored `docs/phase_prompts/Phase_4_Task_4.8.md` and `docs/phase_prompts/Phase_4_Task_4.8_Completion_Report.md`.
  - Updated `docs/phases/PHASE_04_STATUS.md` and `docs/PROJECT_STATUS.md` to reflect Phase 4 COMPLETE & SIGNED OFF and Phase 5 NOT STARTED.

---

## [Phase 4: Task 4.7 — Phase-Wide Testing, Security Verification & Regression Hardening] - 2026-10-06

### Summary
Executed Phase 4 Task 4.7 comprehensive security hardening, multi-role verification, and regression testing across the complete authentication and RBAC architecture. Created an authoritative 58-test security test suite (`backend/tests/test_phase4_security_hardening_task47.py`) verifying all 5 canonical roles (Admin, Principal, Faculty, Student, Parent), JWT claims and lifecycle, HTTP 401 vs 403 semantics, object-level authorization, server-side queryset scoping, privilege escalation defense, and cross-role denial. Executed automated live server smoke testing against running Django (`127.0.0.1:8000`) and Vite (`localhost:5173`) dev servers. Achieved 100% green regression results across both backend (377/377 passed) and frontend (181/181 passed) suites with clean production build and zero migration drift.

### Added / Modified
- **Security Hardening & Verification Suite (`backend/tests/test_phase4_security_hardening_task47.py`)**:
  - 58 automated tests across 11 verification classes:
    1. `TestFiveRoleAuthentication`: Complete login lifecycle for all 5 roles, invalid password rejection, non-existent user handling, and inactive account denial.
    2. `TestStudentIDAuthentication`: Case-insensitive resolution, whitespace trimming, inactive user denial, and withdrawn student lifecycle rejection.
    3. `TestParentAuthentication`: Single and multi-child resolution via child's Student ID, unrelated child rejection, and inactive parent denial.
    4. `TestJWTLifecycle`: Access/refresh token issuance, claim verification (`role`, `username`, `user_id`), refresh rotation, signature tampering rejection, and `/me/` safe serialization without secret leakage.
    5. `TestHTTPSemantics`: Strict 401 Unauthorized (unauthenticated/malformed) vs 403 Forbidden (authenticated but unauthorized) semantics; generic 401 timing parity without account enumeration.
    6. `TestRBACMatrix`: Positive and negative CRUD entitlement boundaries across all 5 roles (Admin full access, Principal oversight with mutation denial, Faculty assigned-section scope, Student/Parent staff boundary denial).
    7. `TestObjectLevelAuthorization`: Rejection of cross-student, cross-parent, and cross-faculty detail access and mutation.
    8. `TestQuerysetLevelScoping`: Server-side filtering ensuring students see only self, parents see linked children, and draft homework is hidden from students.
    9. `TestPrivilegeEscalation`: Rejection of client-supplied `role` injection on login and updates; forged HMAC signature rejection.
    10. `TestCrossRoleAccessDenial`: Denial of attendance marking and marks entry for Student, Parent, and unassigned Faculty.
    11. `TestSecurityRegression`: Zero password or PBKDF2 hash leakage in `/auth/me/` or `/auth/login/`, public accessibility of `/api/health/`, and deactivated user token invalidation.
- **Backend Test Expansion**:
  - Test suite grew from 319 to 377 passing tests (377/377, 100% pass rate in 18m 40s).
- **Live Smoke Testing (`scratch/live_auth_verification.py`)**:
  - Verified live Django backend on `127.0.0.1:8000` and Vite dev server on `localhost:5173`.
  - Confirmed live login, role derivation, and `/api/v1/auth/me/` for `admin_demo`, `principal_demo`, `faculty_suresh`, `STU202600001` (Student), and `parent_ramanathan` (Parent).
- **Regression & Build Verification**:
  - Django system check: 0 issues.
  - Migration check: 0 pending migrations.
  - Frontend Vitest: 181/181 passed.
  - Production build: Clean compilation in 10.19s.
- **Architectural Decisions (`docs/DECISIONS.md`)**:
  - Recorded ADR 017: Authentication Rate Limiting & Brute Force Defense Strategy (deferring Redis infrastructure to Phase 6 while enforcing current generic 401 timing parity).
- **Documentation**:
  - Updated `PHASE_04_STATUS.md`, `PROJECT_STATUS.md`, and authored `Phase_4_Task_4.7_Completion_Report.md`.

---

## [Phase 4: Task 4.6 — Faculty / Admin / Principal Access + Real Frontend Authentication Integration] - 2026-10-06

### Summary
Implemented real frontend authentication and session management in the React application connecting to the Django REST Framework + SimpleJWT backend (`POST /api/v1/auth/login/`, `GET /api/v1/auth/me/`, `POST /api/v1/auth/refresh/`). Resolved the observed 401 Unauthorized errors on `/api/v1/homework/` caused by the frontend relying on `MockAuthService` and missing real JWT access tokens. Updated `HomeworkService` to consume canonical `localStorage['access_token']` without embedded login workarounds. Updated `LoginPage` and developer credential helpers to use real seeded PostgreSQL accounts (`admin_demo`, `principal_demo`, `faculty_suresh`, `faculty_priya`, `STU202600001`). Created 14 automated integration tests in Vitest. Verified end-to-end flow with browser subagent across Admin, Principal, and Faculty dashboards and the Homework management view with real PostgreSQL data.

### Added / Modified
- **Frontend Authentication Context (`frontend/src/features/auth/AuthContext.tsx`)**:
  - Replaced mock login dispatch with direct HTTP call to `/api/v1/auth/login/`.
  - Persisted server-issued `access_token` and `refresh_token` in `localStorage`.
  - Derived user profile and role strictly from server response (`rawUser.role`).
  - Added session restoration on startup via `GET /api/v1/auth/me/` with `Authorization: Bearer <access_token>`.
  - Added token refresh recovery on 401 via `POST /api/v1/auth/refresh/`.
  - Added clean logout clearing tokens and active user session.
- **Homework API Service (`frontend/src/services/homeworkService.ts`)**:
  - Removed embedded auto-login fallback from `getAuthHeaders()`.
  - Reads stored access token directly and attaches `Authorization: Bearer <token>`.
  - Removed `MockAuthService` dependency.
- **Login Experience & Demo Credentials (`LoginPage.tsx`, `authService.ts`)**:
  - Removed outdated Phase 2 mock demonstration messaging.
  - Updated input placeholders and descriptions with real seeded database usernames (`admin_demo`, `faculty_suresh`, `STU202600001`).
  - Updated `SYNTHETIC_DEMO_ACCOUNTS` in `authService.ts` to reference authoritative seeded accounts and passwords (`demo123`).
- **Automated Vitest Test Suite (`frontend/tests/auth_integration.test.ts`)**:
  - 14 comprehensive automated tests covering Admin/Principal/Faculty login, JWT persistence, user hydration, logout cleanup, session restoration, token refresh, invalid credential rejection, role tampering resistance, Bearer token attachment, and Student/Parent auth regression.
  - Frontend test suite expanded to 181 passing tests (181/181, 100%).
- **Documentation**: Updated `Phase_4_Task_4.6.md`, `PHASE_04_STATUS.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`, and added ADR 016 in `DECISIONS.md`.

---

## [Approved Project Modification: MOD_001 — Faculty/Class-Teacher Assignment Architecture & Homework Management] - 2026-10-06

### Summary
Implemented school-wide faculty assignment invariants and the complete Homework domain per MOD_001 specification:
1. **Faculty vs. Class Teacher Invariants**: Formalized domain rule that a Faculty member is not automatically a Class Teacher. Enforced database-level cardinality invariant: one Faculty member may be assigned as Class Teacher for at most one class/section per Academic Year via `Section.academic_year` and PostgreSQL `UniqueConstraint` (`unique_faculty_class_teacher_per_academic_year`).
2. **Authoritative Subject Faculty Model (`TeachingAssignment`)**: Introduced `TeachingAssignment` model in `apps.academics.models.py` linking faculty, section, subject, and academic year with unique constraint `unique_faculty_section_subject_per_year`. Formalized rule that Class Teacher assignment alone does NOT grant all-subject authority.
3. **Academic Domain Reconciliation**: Reconciled marks entry (`BulkMarkCreateView`) and attendance recording (`BulkAttendanceCreateView`) with `AuthorizationService.can_faculty_teach_subject()` and `can_faculty_manage_section_attendance()`. Class Teacher alone without a teaching assignment cannot enter marks for unassigned subjects (403 Forbidden).
4. **Homework Domain (`backend/apps/homework`)**: Implemented complete Homework domain module: concrete model `Homework` (title, description, faculty, academic_year, school_class, section, subject, assigned_date, due_date, status: DRAFT/PUBLISHED/CLOSED), dedicated domain service `HomeworkService`, serializers (`HomeworkListSerializer`, `HomeworkDetailSerializer`, `HomeworkWriteSerializer`), and REST API views (`HomeworkListView`, `HomeworkDetailView` supporting GET, POST, GET/:id, PATCH, DELETE 204).
5. **Authorization & RBAC Scoping**: Extended RBAC matrix with `homework.view`, `homework.create`, `homework.update`, `homework.delete`, `teaching_assignment.view`. List endpoints scoped server-side (drafts strictly hidden from Students and Parents). Object-level permission checks reject cross-faculty and cross-section access attempts.
6. **Automated Testing**: Created comprehensive pytest suite in `backend/tests/test_homework_and_assignment_mod001.py` with 30 tests (30/30 passing, 100% pass rate). Verified non-regression across all existing backend and frontend suites.

### Added / Modified
- **Academics Domain (`backend/apps/academics/models.py`)**:
  - Added `Section.academic_year` foreign key and `unique_faculty_class_teacher_per_academic_year` constraint.
  - Added `TeachingAssignment` model with uniqueness constraints and foreign key relationships.
- **Authorization Engine (`backend/common/authorization.py` & `backend/common/constants.py`)**:
  - Added homework permissions (`PERM_HOMEWORK_VIEW`, `PERM_HOMEWORK_CREATE`, `PERM_HOMEWORK_UPDATE`, `PERM_HOMEWORK_DELETE`, `PERM_TEACHING_ASSIGNMENT_VIEW`).
  - Added `can_faculty_teach_subject()` and `can_faculty_manage_section_attendance()`.
  - Added homework scoping logic for Faculty, Student, and Parent in `filter_queryset_for_user()`.
  - Added object-level checks for Homework across all roles in `can_access_object()`.
- **Homework App (`backend/apps/homework/`)**:
  - `models.py`: Concrete `Homework` entity with status choices and lifecycle dates.
  - `serializers.py`: List, Detail, and Write serializers with flexible payload mapping and faculty object representation.
  - `services.py`: `HomeworkService` with teaching scope verification, lifecycle transitions, and query filtering.
  - `views.py`: `HomeworkListView` and `HomeworkDetailView` with DRF permission dispatch.
  - `urls.py`: Routing for `/api/v1/homework/`.
- **Marks & Attendance Reconciliation (`backend/apps/marks/` & `backend/apps/attendance/`)**:
  - `BulkMarkCreateView`: Validates authoritative teaching assignment for evaluated subject.
  - `BulkMarkCreateSerializer`: Supported `marks` payload alias.
  - `BulkAttendanceCreateSerializer`: Extracted date from records if omitted from root payload.
- **Documentation**: Updated `API_CONTRACT.md`, `DATABASE_SCHEMA.md`, `RBAC_PERMISSIONS.md`, `ARCHITECTURE.md`, `BACKEND_ARCHITECTURE.md`, `PROJECT_STATUS.md`, and `DECISIONS.md` (ADR 015).
- **Automated Tests (`backend/tests/test_homework_and_assignment_mod001.py`)**: 30 dedicated tests covering cardinality, domain rules, reconciliation, homework CRUD, student/parent scoping, and tampering prevention.

---

## [Phase 4: Task 4.5 — Student & Parent Special Authentication] - 2026-10-06

### Summary
Implemented special authentication for Students and Parents via permanent Student ID business identifiers (`^STU\d{4}\d{5}$`) on top of the established Django/DRF/SimpleJWT backend architecture. Preserved the unified `POST /api/v1/auth/login/` endpoint accepting `{ "username": "<identifier>", "password": "<password>" }` with complete backward compatibility. Encapsulated credential resolution in `AuthService.authenticate_by_identifier()` in `backend/apps/accounts/services.py`, keeping `ERPTokenObtainPairSerializer.validate()` thin. Implemented deterministic resolution order: (1) Student Authentication via case-insensitive Student ID lookup, requiring `student.user.is_active == True` and `student.status != 'Withdrawn'`, issuing JWT with `role = 'Student'`; (2) Parent Authentication via linked child (`student.parent -> parent.user`), supporting multi-child parents with any linked child's Student ID, requiring `parent.user.is_active == True`, issuing JWT with `role = 'Parent'`; (3) Standard Login Fallback for Admin, Principal, Faculty, and legacy direct usernames. Implemented security controls: role and identity claims derived strictly server-side from `user.role.name` and `user.id` (client payload tampering ignored), uniform generic HTTP 401 response envelope (`NO_ACTIVE_ACCOUNT`) on all failures, and dummy password hashing computation on non-existent identifiers to prevent timing-based user enumeration. Created comprehensive test suite in `backend/tests/test_student_parent_auth_task45.py` with 26 automated tests. Zero database migrations, zero frontend modifications.

### Added / Modified
- **Authentication Service (`backend/apps/accounts/services.py`)**:
  - Implemented `AuthService.authenticate_by_identifier(identifier, password)` with normalization (whitespace stripping, case-insensitive regex check), multi-tier credential resolution (Student -> Parent -> Standard Fallback), and timing-safe dummy password hashing.
  - Updated `AuthService.login_with_credentials()` to delegate to `authenticate_by_identifier()`.
- **Login Serializer (`backend/apps/accounts/serializers.py`)**:
  - Refactored `ERPTokenObtainPairSerializer.validate()` to delegate credential resolution cleanly to `AuthService.authenticate_by_identifier()`.
  - Maintained server-derived JWT claims (`role`, `username`) and standardized dual-compatibility response envelope.
- **API Contract Documentation (`docs/API_CONTRACT.md`)**:
  - Documented Student ID and Parent linked child authentication behavior, normalization rules, and security controls under `POST /api/v1/auth/login/`.
- **Architectural Decision Record (`docs/DECISIONS.md`)**:
  - Added ADR 014: Student and Parent Special Authentication via Unified Login Endpoint.
- **Task 4.5 Automated Pytest Suite (`backend/tests/test_student_parent_auth_task45.py`)**:
  - 26 comprehensive automated tests covering:
    - Student login: valid Student ID, lowercase normalization, whitespace normalization, wrong password, nonexistent ID, malformed ID, withdrawn student, inactive user.
    - Parent login: valid child Student ID, multiple linked children, wrong parent password, another parent's child ID, orphan student, inactive parent.
    - Security: role tampering rejection, user_id tampering rejection, cross-student authentication denial, cross-parent authentication denial, generic 401 envelope uniformity, zero existence leakage.
    - Regression: Admin login, Principal login, Faculty login, direct username login, token refresh endpoint, current user profile (`/api/v1/auth/me/`).

---

## [Phase 4: Task 4.4 — Endpoint-Level RBAC Enforcement] - 2026-10-06

### Summary
Connected the authoritative RBAC architecture from Task 4.3 to all REST API endpoints and views across the Student ERP backend tier. Enforced complete defense-in-depth: authentication verification, inactive user denial, permission checking via `HasRequiredPermission` and `permission_map`, database-level queryset scoping via `AuthorizationService.filter_queryset_for_user()`, and object-level authorization via `IsOwnerOrScopedAccess` and `check_object_permissions()`. Maintained intentional public endpoint access (`/api/health/`, `POST /api/v1/auth/login/`, `POST /api/v1/auth/refresh/`) while strictly guarding all remaining 30 endpoints with 401 unauthenticated and 403 forbidden semantics. Implemented strict mutation boundaries: Faculty bulk attendance and bulk marks entry are locked strictly to their assigned sections (rejecting cross-section attempts with 403), Faculty self-profile editing is barred from modifying administrative fields (`employee_code`, `is_active`, `department`, `designation`, `joining_date`, `user_id`), and student leave applications are validated against the authenticated student identity. Mitigated role tampering via request payload overrides and eliminated pagination warnings with deterministic ordering. Expanded automated backend test suite by 33 tests in `test_endpoint_rbac_task44.py`, achieving 261/261 tests passing (100% pass rate, 0 warnings, 0 failures), and verified frontend non-regression with 158/158 Vitest tests passing and a clean production build in 15.92s.

### Added / Modified
- **Broad View RBAC Wiring (`backend/apps/*/views.py`)**:
  - `accounts`: `ParentListView` (scoped queryset), `ParentDetailView` & `ParentChildrenView` (`IsOwnerOrScopedAccess`), `FacultyListView` (active directory scoping), `FacultyDetailView` (self-profile update with administrative field guards).
  - `students`: `StudentListView` (GET `students.view` with queryset scoping, POST `students.create` Admin-only), `StudentDetailView` (GET `students.view`, PATCH `students.update`, `IsOwnerOrScopedAccess`).
  - `academics`: `ClassListView` & `SubjectListView` (GET `academics.view`, POST `academics.manage`), `ClassDetailView`, `ClassSectionsView`, `SubjectDetailView`, `AcademicYearListView` (GET `academics.view`).
  - `attendance`: `AttendanceOverviewView` (GET `attendance.view` with queryset scoping), `BulkAttendanceCreateView` (POST `attendance.mark` with Faculty class teacher assignment validation), `StudentAbsenteesView` (GET `attendance.view_absentees` scoped), `LeaveApplicationListView` (GET `attendance.view`, POST with student self-identity validation), `AttendanceDetailView` (GET/PATCH with `IsOwnerOrScopedAccess`).
  - `marks`: `MarkListView` (GET `marks.view` with queryset scoping), `BulkMarkCreateView` (POST `marks.enter` with Faculty assignment validation), `ExamTypeListView` (GET `marks.view`, POST `marks.override`), `ReportCardView` (GET `reports.view` with `can_access_object` verification), `MarkDetailView` (GET/PATCH with `IsOwnerOrScopedAccess`).
  - `allocation`, `audit`, `calendar`, `timetable`, `reports`, `notifications`: Scaffolding endpoints protected by canonical domain permissions (`allocation.view`, `audit.view`, `calendar.view`, `timetable.view`, `reports.view`, `users.view`).
- **DRF Permission Enhancements (`backend/common/permissions.py`)**:
  - Extended `HasRequiredPermission` and `IsOwnerOrScopedAccess` to inspect `view.permission_map` (HTTP method dispatch) when present, falling back to standard DRF actions and request methods.
- **Service & Queryset Scoping Hardening (`backend/common/authorization.py` & `backend/apps/accounts/services.py`)**:
  - Added deterministic `.order_by('created_at', 'id')` on Parent and Faculty querysets, eliminating `UnorderedObjectListWarning`.
  - Refined object access verification for `Faculty` and `Parent` entities across all 5 roles.
- **Development Seed Data Hygiene (`backend/common/management/commands/seed_dev_data.py`)**:
  - Replaced naive datetime on `LeaveApplication.reviewed_at` with timezone-aware `timezone.now()`, eliminating `RuntimeWarning`.
- **ADR 013 (`docs/DECISIONS.md`)**:
  - Documented endpoint-level RBAC enforcement, queryset scoping before serialization, object authorization, and mutation protection.
- **Task 4.4 Automated Pytest Suite (`backend/tests/test_endpoint_rbac_task44.py`)**:
  - 33 comprehensive integration tests covering:
    - Public vs authenticated endpoints.
    - All 5 canonical roles: Admin, Principal, Faculty, Student, Parent.
    - List queryset scoping across students, parents, faculty, attendance, absentees, marks.
    - Detail endpoint object ownership and URL/ID manipulation prevention.
    - Faculty assignment boundaries and administrative field protection.
    - Student leave application identity enforcement.
    - Scaffolding endpoint RBAC.
    - Role tampering mitigation via request payloads and inactive user denial.
  - Backend test suite expanded from 228 to **261 passing tests (100%)**.

### Verified (Non-Regression)
- **Django System Check**: `python manage.py check` passes with 0 issues.
- **Database Migrations**: `makemigrations --check` reports 0 unmigrated changes; schema unchanged.
- **Backend Test Suite**: 261 passed out of 261 tests across 16 test modules in 222.64s.
- **Frontend Test Suite**: 158 passed out of 158 Vitest tests in 25.55s (`npm test -- --run`).
- **Frontend Build**: Production bundle compiles cleanly in 15.92s (`npm run build`).
- **Architectural Invariants**: Frontend remains mock-driven; Student/Parent special authentication (Task 4.5) untouched.

---

## [Phase 4: Task 4.3 — RBAC Architecture & Permission Model] - 2026-10-05

### Summary
Established the authoritative Role-Based Access Control (RBAC) architecture, explicit permission model, and queryset scoping engine for Student ERP across all 5 system roles (`Admin`, `Principal`, `Faculty`, `Student`, `Parent`). Standardized canonical permission identifiers (`<domain>.<action>`) in `common.constants` and declared explicit role-permission sets in `ROLE_PERMISSIONS_MATRIX` with zero automatic role inheritance. Defined formal operational scopes (`SCOPE_GLOBAL`, `SCOPE_FACULTY_ASSIGNED`, `SCOPE_SELF`, `SCOPE_LINKED_CHILD`). Implemented `AuthorizationService` (`common.authorization`) providing live database role inspection, permission checking, scope resolution, object-level ownership checks, and database-level queryset scoping for list and search endpoints. Authored reusable DRF permission classes (`HasRequiredPermission`, `require_permission`, `Is*Role`, `IsOwnerOrScopedAccess`) in `common.permissions`. Enforced Task 2.7 allocation governance reserving section and Class Teacher allocation mutations strictly for `Admin` and `Principal`, while restricting `Faculty` to view-only access. Implemented security hardening against client payload tampering, stale-token privilege escalation, and account deactivation. Authored 27 automated tests in `test_rbac_task43.py`, expanding the backend test suite to 228/228 passing tests (100%). Confirmed frontend non-regression with 158/158 Vitest tests passing and a clean production build in 6.59s.

### Added
- **Canonical Permission Identifiers & Scopes (`backend/common/constants.py`)**:
  - Defined 28 canonical permission constants formatted as `<domain>.<action>` across 10 functional modules (`users`, `students`, `academics`, `attendance`, `marks`, `timetable`, `calendar`, `allocation`, `reports`, `audit`).
  - Defined 5 scope constants: `SCOPE_GLOBAL`, `SCOPE_FACULTY_ASSIGNED`, `SCOPE_SELF`, `SCOPE_LINKED_CHILD`, `SCOPE_NONE`.
- **RBAC Matrix & Scope Engine (`backend/common/authorization.py`)**:
  - `ROLE_PERMISSIONS_MATRIX`: Explicit permission mappings for all 5 roles with zero automatic inheritance.
  - `ROLE_DOMAIN_SCOPES`: Mapping of role-domain combinations to operational scopes.
  - `AuthorizationService(BaseService)`:
    - `get_user_role(user)`: Evaluates live DB user role state, ignoring client payloads and stale claims.
    - `has_permission(user, permission)`: Evaluates permissions against matrix.
    - `get_user_permissions(user)`: Returns full permission set.
    - `resolve_scope(user, domain)`: Returns operational scope.
    - `can_access_object(user, obj, action)`: Verifies object-level ownership and faculty assignments.
    - `filter_queryset_for_user(queryset, user, domain)`: Scopes querysets across `Student`, `Attendance`, `LeaveApplication`, `Mark`, `Section`, `Enrollment`, `Parent`, and `Faculty`.
- **DRF Permission Classes (`backend/common/permissions.py`)**:
  - `HasRequiredPermission`: Dynamic view and object-level permission evaluator.
  - `require_permission(perm)`: Class factory helper.
  - Role-specific classes: `IsAdminRole`, `IsPrincipalRole`, `IsFacultyRole`, `IsStudentRole`, `IsParentRole`.
  - Composite classes: `IsAdminOrPrincipal`, `IsStaffOrExecutive`.
  - Scoped object access: `IsOwnerOrScopedAccess`.
  - Backward-compatible aliases: `IsAdminUser`, `IsPrincipalUser`, `IsFacultyUser`, `IsStudentUser`, `IsParentUser`.
- **Re-export in Accounts Domain (`backend/apps/accounts/services.py`)**:
  - Exposed `AuthorizationService` alongside `AuthService` and `AccountService`.
- **ADR 012 (`docs/DECISIONS.md`)**:
  - Documented explicit 5-role RBAC architecture, scope resolution, live database role checking, and queryset scoping engine.
- **Task 4.3 Automated Pytest Suite (`backend/tests/test_rbac_task43.py`)**:
  - 27 comprehensive automated tests covering:
    - 5-role explicit permission assignment and non-inheritance.
    - Scope resolution across all roles and domains.
    - Faculty assignment-aware scoping (Class Teacher access vs unrelated class denial).
    - Student self-ownership verification and cross-student denial.
    - Parent linked-child verification and unrelated student denial.
    - Admin/Principal global access and Task 2.7 allocation permissions.
    - Queryset scoping for list endpoints and search filters.
    - DRF permission classes with simulated HTTP requests and 401/403 denial semantics.
    - Security hardening: role tampering resistance, live DB role change reflection, account deactivation handling, zero superuser shortcut.
  - Backend test suite expanded from 201 to **228 passing tests (100%)**.

### Verified (Non-Regression)
- **Django System Check**: `python manage.py check` passes with 0 issues.
- **Database Migrations**: `makemigrations --check` reports 0 unmigrated changes; schema unchanged (zero migrations).
- **Backend Test Suite**: 228 passed out of 228 tests across 15 test modules in 94.24s.
- **Frontend Test Suite**: 158 passed out of 158 Vitest tests in 5.06s (`npm test -- --run`).
- **Frontend Build**: Production bundle compiles cleanly in 6.59s (`npm run build`).
- **Architectural Invariants**: Broad endpoint enforcement reserved for Task 4.4; Student/Parent special authentication reserved for Task 4.5; frontend remains mock-driven.

---

## [Phase 4: Task 4.2 — Custom User & Login] - 2026-10-05

### Summary
Implemented the authoritative login and authentication workflow under `/api/v1/auth/` using the custom User model (`accounts.User`), Django password verification, and SimpleJWT. Authored `ERPTokenObtainPairSerializer` to authenticate credentials, reject disabled/inactive accounts (`is_active=False`), inject standard safe claims (`user_id`, `role`, `username`), assemble a safe authenticated user identity payload, and return a standardized dual-compatibility envelope (`access`, `refresh`, `token_type`, `user`, `success`, `data`). Wired custom `TokenObtainPairView` and `TokenRefreshView` under `apps/accounts/views.py`. Extended `AuthService` with `login_with_credentials`. Validated password security with PBKDF2 hashing, verified all 5 canonical roles, verified `/api/v1/auth/me/` current-user identity resolution, and authored 20 automated tests expanding the backend test suite to 201/201 passing tests (100%). Executed real live API smoke tests against PostgreSQL seeded credentials, and confirmed frontend non-regression with 158/158 Vitest tests passing and a clean production build in 7.79s.

### Added
- **Login Serializer & View (`backend/apps/accounts/serializers.py` & `views.py`)**:
  - `ERPTokenObtainPairSerializer`: Subclasses SimpleJWT `TokenObtainPairSerializer`, validates credentials, checks active account status, injects claims, returns user info and tokens in dual envelope format.
  - `TokenObtainPairView`: Exposes `POST /api/v1/auth/login/` backed by `ERPTokenObtainPairSerializer`.
  - `TokenRefreshView`: Exposes `POST /api/v1/auth/refresh/` with dual envelope wrapping (`access`, `refresh`, `token_type`, `success`, `data`).
- **AuthService Extension (`backend/apps/accounts/services.py`)**:
  - `login_with_credentials(username, password)`: Complete authentication workflow returning safe user payload and JWT token pair.
- **Task 4.2 Pytest Suite (`backend/tests/test_login_task42.py`)**:
  - 20 comprehensive unit and integration tests covering login success, role identity (all 5 roles), invalid passwords, unknown users, empty inputs, inactive accounts, token lifetimes, claim inspection, refresh workflow, `/auth/me/` profile retrieval, and post-issuance account deactivation.
  - Backend test suite expanded from 181 to **201 passing tests (100%)**.
- **Live API Smoke Testing**:
  - Validated live HTTP requests for login, token refresh, and `/auth/me/` against PostgreSQL seeded data (`admin_demo` / `demo123`).

### Verified (Non-Regression)
- **Django System Check**: `python manage.py check` passes with 0 issues.
- **Database Migrations**: `makemigrations --check` reports 0 unmigrated changes; schema unchanged.
- **Backend Test Suite**: 201 passed out of 201 tests across all 14 test modules.
- **Frontend Test Suite**: 158 passed out of 158 Vitest tests (`npm test -- --run`).
- **Frontend Build**: Production bundle compiles cleanly in 7.79s (`npm run build`).
- **Architectural Invariants**: Frontend remains mock-driven; zero RBAC enforcement or Student/Parent special auth implemented in Task 4.2.

---

## [Phase 4: Task 4.1 — Authentication Foundation] - 2026-10-05

### Summary
Established the secure authentication foundation for the Student ERP backend tier using Django 5, Django REST Framework, and `djangorestframework-simplejwt`. Configured stateless JWT token settings with 15-minute access and 7-day refresh lifetimes, HMAC-SHA256 signing with environment variable fallback, token rotation, and standard claims (`user_id`, `role`, `username`). Verified Django password hashing using PBKDF2 with SHA-256 and confirmed all 4 standard password validators are active. Implemented dedicated `AuthService` domain boundary encapsulating credential verification, inactive account protection, token issuance, and password strength validation. Authored secure authentication serializers (`AuthTokenResponseSerializer`, `LoginCredentialsSerializer`, `CurrentUserProfileSerializer`) strictly excluding passwords and hashes. Scaffolded `/api/v1/auth/` URL namespace (`login/`, `refresh/`, `me/`). Added 27 automated tests in `test_auth_foundation_task41.py`, bringing total backend test suite to 181/181 passing tests (100%). Verified frontend non-regression with 158/158 Vitest tests passing and a clean production build.

### Added
- **SimpleJWT Token Configuration (`backend/config/settings.py`)**:
  - `SIMPLE_JWT` configuration with `ACCESS_TOKEN_LIFETIME = 15m`, `REFRESH_TOKEN_LIFETIME = 7d`, `ROTATE_REFRESH_TOKENS = True`, `ALGORITHM = HS256`.
  - Signing key configured with fallback: `JWT_SIGNING_KEY or SECRET_KEY`.
  - Header scheme: `Bearer` (`AUTH_HEADER_TYPES = ('Bearer',)`).
  - User ID mapping: `USER_ID_FIELD = 'id'`, `USER_ID_CLAIM = 'user_id'`.
- **Environment Configuration (`backend/.env` & `backend/.env.example`)**:
  - Added placeholders for `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`, `JWT_REFRESH_TOKEN_LIFETIME_DAYS`, `JWT_ROTATE_REFRESH_TOKENS`, `JWT_SIGNING_KEY`, `JWT_ISSUER`.
- **AuthService Domain Boundary (`backend/apps/accounts/services.py`)**:
  - `AuthService` inheriting from `BaseService`:
    - `authenticate_user(username, password)`: Verifies credentials, strictly rejecting inactive accounts and empty inputs.
    - `generate_tokens_for_user(user)`: Issues JWT token pair with standard safe claims (`user_id`, `role`, `username`).
    - `validate_password_strength(password, user)`: Validates passwords against Django's 4 configured validators.
    - `get_user_by_id(user_id)`: Safely loads user by UUID.
- **Authentication Serializers (`backend/apps/accounts/serializers.py`)**:
  - `AuthTokenResponseSerializer`: Declares standard token output schema (`access`, `refresh`, `token_type`).
  - `LoginCredentialsSerializer`: Declares `username` and `password` with `password` marked `write_only=True`.
  - `CurrentUserProfileSerializer`: Safe profile representation for `/api/v1/auth/me/` strictly excluding password, password hash, and security secrets.
- **Task 4.1 Pytest Suite (`backend/tests/test_auth_foundation_task41.py`)**:
  - 27 comprehensive tests verifying settings, token configuration, password hashing, password validation, inactive user rejection, AuthService, serializer security, URL resolution, and endpoints under `/api/v1/auth/`.
  - Total backend tests expanded from 154 to **181 passing tests (100%)**.

### Verified (Non-Regression)
- **Django System Check**: `python manage.py check` passes with 0 issues.
- **Database Migrations**: `makemigrations --check` reports 0 unmigrated changes; all migrations applied.
- **Backend Test Suite**: 181 passed out of 181 tests across all 13 test modules.
- **Frontend Test Suite**: 158 passed out of 158 Vitest tests (`npm test -- --run`).
- **Frontend Build**: Production bundle compiles cleanly in 13.26s (`npm run build`).
- **Architectural Invariants**: Frontend remains purely mock-driven (`VITE_USE_MOCK_DATA=true`); zero token integration or auth coupling; full RBAC and student/parent auth reserved for later Phase 4 tasks.

---

## [Phase 3: Task 3.7 — Final Verification, Hardening & Phase 3 Sign-Off] - 2026-10-05

### Summary
Concluded Phase 3 with comprehensive system verification, environment alignment, database seeding and idempotency testing, edge-case hardening, documentation gap repair, and formal Phase 3 sign-off. Aligned backend `.venv` with `requirements/development.txt` (`pytest`, `pytest-django`, `pytest-mock`, `faker`), resolved model parameter mismatches in `seed_dev_data`, hardened student ID resolution in `AttendanceService` and `MarksService` to safely parse UUID vs. alphanumeric business IDs against PostgreSQL, and corrected cumulative marks dictionary key mappings. Executed full backend pytest test suite achieving 154/154 passing tests (100%), verified 0 unmigrated changes, executed live PostgreSQL database seeding and proved 100% idempotency, verified REST API foundation endpoints against live data, confirmed frontend non-regression (158/158 Vitest tests passing, clean production build in 6.67s), and closed documentation gaps (`PHASE_03.md`, `Phase_3_Task_3.3.md`, `Phase_3_Task_3.7.md`). Formally signed off Phase 3.

### Fixed & Hardened
- **Test Suite**: Fixed `ProtectedError` import in `backend/tests/test_models_task33.py` (`from django.db.models import ProtectedError`).
- **Seed Command**: Fixed `Parent`, `Student`, `SchoolClass`, and `Enrollment` model instantiation parameters in `backend/common/management/commands/seed_dev_data.py`. Attached `phone` to `User`, removed invalid `alternate_phone` from `Parent`, removed invalid `is_active` from `Student`, removed unmodeled `stream` from `SchoolClass`, and removed `roll_number` from `Enrollment`.
- **Query Hardening**: Hardened `get_attendance_queryset`, `record_bulk_attendance`, `get_marks_queryset`, `record_bulk_marks`, and `generate_report_card` in `AttendanceService` and `MarksService` to safely handle UUID vs. alphanumeric business identifier (`STUYYYYNNNNN`) without triggering PostgreSQL UUID parse errors.
- **Report Card Cumulative Totals**: Corrected report card generation dictionary key extraction in `MarksService.generate_report_card` to read `cumulative_eval['total_obtained']` and `cumulative_eval['total_max']`.

### Verified
- **Environment**: `pytest` (9.1.1), `pytest-django` (4.14.0), `pytest-mock` (3.16.0), and `faker` (40.40.0) runtime verified.
- **PostgreSQL Database**: All initial migrations verified applied `[X]`. Idempotency proven across consecutive runs of `python manage.py seed_dev_data` (`Role: 5, User: 5, Faculty: 1, Parent: 1, Student: 1, AcademicYear: 1, SchoolClass: 1, Section: 1, Subject: 4, Enrollment: 1, Attendance: 5, LeaveApplication: 1, ExamType: 1, Mark: 4`).
- **Backend Tests**: 154 passed out of 154 tests across all 12 test modules.
- **API Endpoints**: `/api/health/`, `/api/v1/students/`, `/api/v1/attendance/`, `/api/v1/attendance/absentees/`, `/api/v1/marks/`, and `/api/v1/marks/report-card/{student_id}/` verified against live seeded PostgreSQL instance.
- **Frontend Tests**: 158 passed out of 158 Vitest tests.
- **Frontend Build**: Production bundle compiles cleanly in 6.67s with 0 errors.
- **Documentation**: Repaired `PHASE_03.md`, `Phase_3_Task_3.3.md`, authored `Phase_3_Task_3.7.md`, and updated `PHASE_03_STATUS.md` and `PROJECT_STATUS.md`.

---

## [Phase 3: Task 3.6 — Initial REST API Foundation] - 2026-09-30

### Summary
Designed and implemented the first REST API foundation for the Student ERP backend under versioned namespace `/api/v1/` matching `docs/API_CONTRACT.md`. Authored DRF ModelSerializers and Serializers across 5 active domains (`accounts`, `students`, `academics`, `attendance`, `marks`), wired thin DRF views with dedicated domain services, enforced standardized response and error envelopes, standard pagination (`StandardResultsSetPagination`), and query optimization (`select_related`, `prefetch_related`) to prevent N+1 queries. Implemented Master Plan Amendment 2 canonical 4-status attendance percentage calculation (`(PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100`), strict legacy status rejection (`LATE`, `EXCUSED`), CBSE 8-tier letter grading derivation, Student ID format validation and immutability protection, and cumulative report card computation. Expanded test suite to 132 passing backend unit/model/API tests (22 DB tests marked), verified 0 unmigrated model changes, 158/158 passing frontend tests, and a clean production build.

### Added
- **API Routing & Versioning (`backend/config/urls.py`)**:
  - Maintained unauthenticated `/api/health/` liveness endpoint.
  - Wired domain-specific routers: `/api/v1/auth/`, `/api/v1/students/`, `/api/v1/parents/`, `/api/v1/faculty/`, `/api/v1/classes/`, `/api/v1/subjects/`, `/api/v1/academics/`, `/api/v1/attendance/`, `/api/v1/marks/`, and deferred domain endpoints (`timetable`, `calendar`, `allocation`, `reports`, `notifications`, `audit`).
- **DRF Serializers**:
  - `accounts`: `RoleSerializer`, `UserSummarySerializer`, `ParentSerializer`, `ParentSummarySerializer`, `FacultySerializer`, `FacultySummarySerializer` (strictly descriptive).
  - `students`: `StudentListSerializer`, `StudentDetailSerializer`, `StudentWriteSerializer` (with `STUYYYYNNNNN` format validation & immutability protection).
  - `academics`: `AcademicYearSerializer`, `SchoolClassSerializer`, `SectionSerializer`, `SubjectSerializer` (`weekly_periods` replaces `credits`), `EnrollmentSerializer`.
  - `attendance`: `AttendanceRecordSerializer`, `AttendanceBulkItemSerializer`, `BulkAttendanceCreateSerializer`, `LeaveApplicationSerializer` (4 canonical statuses: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`; rejects `LATE`/`EXCUSED`).
  - `marks`: `ExamTypeSerializer`, `MarkSerializer`, `MarkBulkItemSerializer`, `BulkMarkCreateSerializer` (0–100 range validation, automatic CBSE 8-tier grading).
- **Views & Domain Services**:
  - `apps/accounts`: `CurrentUserProfileView` (`/auth/me/`), `ParentListView`, `ParentDetailView`, `ParentChildrenView`, `FacultyListView`, `FacultyDetailView`.
  - `apps/students`: `StudentListView`, `StudentDetailView` (supports lookup by UUID PK or `student_id`).
  - `apps/academics`: `ClassListView`, `ClassDetailView`, `ClassSectionsView`, `SubjectListView`, `SubjectDetailView`, `AcademicYearListView`.
  - `apps/attendance`: `AttendanceOverviewView` (returns summary metrics & attendance % in metadata), `BulkAttendanceCreateView`, `AttendanceDetailView`, `StudentAbsenteesView` (dedicated surface for status `ABSENT`), `LeaveApplicationListView`.
  - `apps/marks`: `MarkListView`, `BulkMarkCreateView`, `MarkDetailView`, `ReportCardView` (cumulative total, max marks, overall percentage, letter grade, subject breakdown), `ExamTypeListView`.
- **Response & Error Handling**:
  - Standard success envelope (`success`, `data`, `meta`).
  - Standard error envelope (`success`, `error: {code, message, status_code, details}`).
  - `custom_exception_handler` normalized for Django `ValidationError`, `Http404`, and custom domain exceptions.
  - Standard pagination with `page`, `page_size`, `total_records`, `total_pages`, `has_next`, `has_previous`.
- **Task 3.6 Pytest Suite (`backend/tests/test_api_task36.py`)**:
  - Comprehensive suite verifying route resolution, serializer validation, response envelopes, error normalization, attendance formulas, grading boundaries, and PostgreSQL DB integration.
  - Total backend tests: **132 passing**, 22 skipped (live DB).

### Verified (Non-Regression)
- **Django System Check**: `python manage.py check` passes with 0 issues.
- **Migration Graph**: `makemigrations --check` reports 0 unmigrated changes.
- **Frontend Test Suite**: 158/158 Vitest tests passing across all 8 test suites.
- **Frontend Build**: Production bundle compiles cleanly with 0 TypeScript errors in 14.18s.

---

## [Phase 3: Task 3.5 — Migrations, Constraints & Seed Data] - 2026-09-29

### Summary
Hardened all 13 concrete 3NF relational database models across `accounts`, `students`, `academics`, `attendance`, and `marks`. Audited foreign key deletion semantics (`PROTECT`, `RESTRICT`, `SET_NULL`, `CASCADE`), uniqueness constraints, database indexes, and migration graph consistency. Created a deterministic, transaction-safe, idempotent development seed management command (`python manage.py seed_dev_data`) populating synthetic test data across all 5 system roles and 13 concrete entities. Expanded pytest suite to 105 passing backend unit/model tests (19 DB tests marked), verified 0 unmigrated changes, 158/158 passing frontend Vitest tests, and a clean production build.

### Added
- **Seed Data Management Command (`backend/common/management/commands/seed_dev_data.py`)**:
  - Implemented `@transaction.atomic` idempotent `seed_dev_data` management command.
  - Seeds synthetic roles (`Admin`, `Principal`, `Faculty`, `Student`, `Parent`), demo users with hashed credentials (`demo123`), faculty profile (`R. Suresh`), parent profile (`S. Ramanathan`), student profile (`Arun Kumar`, `STU202600001`), academic year (`2026-2027`), class (`Grade 11 - Computer Science`), section (`Section A2`), 4 subjects (`Computer Science`, `Mathematics`, `Physics`, `English Core`), enrollment, 4-status attendance logs, leave application, exam type (`Half-Yearly Examination 2026`), and raw marks records.
- **Task 3.5 Hardening Test Suite (`backend/tests/test_task35_hardening_and_seed.py`)**:
  - 8 test cases auditing migration dependency ordering, deferred app isolation, 13 concrete model registration, Student ID regex and immutability logic, attendance status constraints, marks range checks, and `seed_dev_data` command registration & idempotency.
  - Backend test suite expanded to **105 passing backend tests** (19 live DB tests marked/skipped).

### Verified (Non-Regression)
- **Django Core**: `python manage.py check` passes with 0 issues identified.
- **Migration Consistency**: `makemigrations --check` verifies 0 unmigrated model changes.
- **Frontend Test Suite**: 158/158 Vitest tests passing across all 8 test suites.
- **Frontend Build**: Production bundle compiles cleanly with 0 TypeScript errors in 4.02s.

---

## [Phase 3: Task 3.4 — Attendance & Marks Database Layer] - 2026-09-29

### Summary
Designed, implemented, and migrated concrete 3NF relational database models for `Attendance` & `LeaveApplication` (`apps/attendance`) and `ExamType` & `Mark` (`apps/marks`). Enforced Master Plan Amendment 2 canonical 4-status attendance model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`) with strict rejection of legacy statuses (`LATE`, `EXCUSED`), attendance formula calculation support, CBSE 8-tier letter grading scale (`A1`–`E`), raw marks range validation (0–100), and database uniqueness constraints. Authored comprehensive pytest test suite (97 backend unit/model tests passing, 18 DB tests marked), verified 0 unmigrated model changes, 158/158 passing frontend tests, and clean production build.

### Added
- **Attendance Domain Models (`backend/apps/attendance/models.py`)**:
  - `Attendance`: UUID PK, `enrollment` FK (`CASCADE`), `date`, `session_period`, canonical `status` (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`), `recorded_by` FK (`PROTECT`), `approved_by_faculty` FK (`SET_NULL`), unique constraint on `(enrollment, date, session_period)`, status check constraint.
  - `LeaveApplication`: UUID PK, `student` FK (`CASCADE`), `leave_type`, `start_date`, `end_date`, `reason`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `reviewed_by` FK (`SET_NULL`), date validation check (`end_date >= start_date`).
- **Marks Domain Models (`backend/apps/marks/models.py`)**:
  - `ExamType`: UUID PK, unique `name` (e.g., `Midterm Examination 2026`), `weightage`, `is_active`.
  - `Mark`: UUID PK, `enrollment` FK (`CASCADE`), `subject` FK (`PROTECT`), `exam_type` FK (`PROTECT`), `marks_obtained` (0–100 range checked), `max_marks` (default 100.00), `grade` (derived via CBSE 8-tier grading utility `calculate_grade`), unique constraint on `(enrollment, subject, exam_type)`, range check constraint.
- **Initial Migrations**:
  - `apps/attendance/migrations/0001_initial.py` (Creates `Attendance`, `LeaveApplication`, depends on `academics`, `accounts`, `students`).
  - `apps/marks/migrations/0001_initial.py` (Creates `ExamType`, `Mark`, depends on `academics`, `accounts`).
- **Task 3.4 Pytest Suite (`backend/tests/test_models_task34.py`)**:
  - 22 new test cases covering migration graph dependencies, field structure, status validation, legacy status rejection, canonical attendance percentage formula, leave date validation, marks 0–100 range, CBSE 8-tier grading scale boundary cases, and PostgreSQL integration tests.
  - Backend test suite expanded to **97 passing backend tests** (18 live DB tests marked/skipped).

### Verified (Non-Regression)
- **Django Core**: `python manage.py check` passes with 0 issues identified.
- **Migration Graph**: `makemigrations --check` verifies 0 unmigrated model changes.
- **Frontend Test Suite**: 158/158 Vitest tests passing across all 8 test suites.
- **Frontend Build**: Production bundle compiles cleanly with 0 TypeScript errors in 17.5s.

---

## [Phase 3: Task 3.3 — Core Database Models & PostgreSQL Schema] - 2026-09-28

### Summary
Designed, implemented, and migrated 3NF relational database models across `accounts`, `students`, and `academics` domain applications with UUID primary keys, strict relationship integrity (`RESTRICT`, `PROTECT`, `SET_NULL`, `CASCADE`), CBSE/Indian school business constraints, permanent immutable Student IDs (`ImmutableFieldMutationError`), non-evaluative faculty profiles, and migration dependency sequencing. Verified 0 pending migration changes, 76 passing backend unit/model tests, 158/158 passing frontend tests, and a clean production build.

### Added
- **Core 3NF Models (`backend/apps/`)**:
  - `accounts`: `Role` (UUID PK, 5 canonical roles), `User` (`AbstractUser`, UUID PK, `AUTH_USER_MODEL = 'accounts.User'`, `role` FK `RESTRICT`), `Faculty` (UUID PK, descriptive non-evaluative staff profile, unique `employee_code`), `Parent` (UUID PK, guardian details).
  - `students`: `Student` (UUID PK, permanent `student_id` formatted `STUYYYYNNNNN` with regex validation & immutability check on `save()`, `parent` FK `PROTECT`, unique `admission_number`, `is_active`).
  - `academics`: `AcademicYear` (UUID PK, `name`, `is_current`), `SchoolClass` (UUID PK, `academic_year` FK `PROTECT`, approved streams, unique together `(academic_year, code)`), `Section` (UUID PK, `class_teacher` FK `SET_NULL`, unique together `(school_class, name)`), `Subject` (UUID PK, unique `code`, `weekly_periods` [periods, not credits]), `Enrollment` (UUID PK, student FK `CASCADE`, unique together `(student, academic_year)`).
- **PostgreSQL Initial Migrations**:
  - `apps/accounts/migrations/0001_initial.py`
  - `apps/students/migrations/0001_initial.py`
  - `apps/academics/migrations/0001_initial.py`
  - `apps/academics/migrations/0002_initial.py` (cross-app FKs to accounts and students)
- **Comprehensive Task 3.3 Test Suite (`backend/tests/test_models_task33.py`)**:
  - 31 test cases covering migration graph dependencies, model structure, UUID PKs, relationship deletion rules, CBSE rules (periods vs credits), Student ID validation & immutability, and live-DB integration tests.
  - Test suite grew to 76 passing backend tests (with 17 live PostgreSQL tests marked and skipped when DB host is offline).

### Verified (Non-Regression)
- **Django Core**: `python manage.py check` passes with 0 issues identified.
- **Migration Graph**: In-memory migration autodetector verifies 0 unmigrated changes.
- **Scope Discipline**: Enforced 0 concrete models and 0 migrations for deferred apps (`attendance`, `marks`, `timetable`, `calendar`, `allocation`, `reports`, `notifications`, `audit`).
- **Frontend Test Suite**: 158/158 Vitest tests passing across all 8 test suites.
- **Frontend Build**: Production bundle compiles cleanly with 0 TypeScript errors.

---

## [Phase 3: Task 3.2 — Django App Architecture & Base Domain Scaffolding] - 2026-09-28

### Summary
Established the modular monolith Django domain application architecture, dedicated service layer structures (`BaseService`), DRF serializers scaffolding, thin view dispatchers, URL routes, and shared domain utilities across all 11 domain apps. Reconciled boundaries by removing premature concrete database models (which are scheduled for Task 3.3). Verified zero premature concrete models exist in Django's app registry, zero migrations created, 45 passing backend unit tests, zero frontend regressions (158/158 Vitest tests passing), and a clean frontend production build.

### Added
- **Shared Domain Utilities & Constants (`backend/common/`)**:
  - `common/constants.py`: Canonical 5 system roles (`Admin`, `Principal`, `Faculty`, `Student`, `Parent`), Master Plan Amendment 2 attendance 4-status model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`), prohibited legacy statuses (`LATE`, `EXCUSED`), CBSE / ICSE 8-tier grading scale (`A1`–`E`), approved streams, and workflow states.
  - `common/utils.py`: Pure mathematical utilities for CBSE 8-tier grading (`calculate_grade`, `calculate_percentage`, `calculate_cumulative_evaluation`), attendance formula adherence, canonical status validation, permanent Student ID validation (`validate_student_id`), and canonical ID generator (`format_student_id`).
  - `common/exceptions.py`: Custom domain exceptions (`DomainValidationError`, `BusinessLogicError`, `ResourceNotFoundError`, `PermissionDeniedError`, `InvalidAttendanceStatusError`, `ImmutableFieldMutationError`) integrated with standardized error envelope.
  - `common/responses.py`: Envelope response builders (`success_response`, `error_response`).
  - `common/services.py`: `BaseService` base class providing transactional boundaries (`self.atomic()`) and structured error logging.
  - `common/models.py`: Shared abstract base models (`TimeStampedModel`, `UUIDModel`, `BaseModel`).
- **Domain App Scaffolding Across All 11 Domain Apps**:
  - Structured all 11 domain apps (`accounts`, `students`, `academics`, `attendance`, `marks`, `timetable`, `calendar`, `allocation`, `reports`, `notifications`, `audit`) with standard module files: `models.py`, `services.py`, `serializers.py`, `views.py`, `urls.py`.
  - Defined dedicated service class scaffolding: `AccountService`, `StudentService`, `AcademicService`, `AttendanceService`, `MarksService`, `TimetableService`, `CalendarService`, `AllocationService`, `ReportService`, `NotificationService`, `AuditService`.
  - Defined serializer-layer scaffolding using standard DRF serializers.
  - Wired thin DRF view dispatchers and URL routes under `/api/v1/`.
  - Terminology neutralized: Removed unsupported "statutory" references across all backend files in favor of neutral academic/administrative reporting.
- **Backend Test Suite Expansion**:
  - `tests/test_common_utils.py`: 14 unit tests covering grading, percentage, attendance formula, forbidden statuses, Student ID.
  - `tests/test_services_scaffolding.py`: 12 unit tests verifying all 11 domain service classes and BaseService helpers.
  - `tests/test_common_responses.py`: 4 unit tests covering response envelopes and exception handlers.
  - `tests/test_models_scaffolding.py`: 3 unit tests verifying abstract base models, 11-app file structure, and boundary assertion of 0 premature concrete models.
  - Test suite grew from 12 to 45 unit tests (100% passing).
- **Task Specification**:
  - Created `docs/phase_prompts/Phase_3_Task_3.2.md`.
  - Updated `docs/phases/PHASE_03_STATUS.md`.

### Verified (Non-Regression)
- **Task 3.2 Boundary**: Confirmed 0 concrete models and 0 database migrations in Task 3.2.
- **Django Core**: `python manage.py check` passes with 0 issues identified.
- **Frontend Protection**: Phase 2 frontend source code left completely untouched.
- **Frontend Test Suite**: 158/158 Vitest tests passing across all 8 test suites.
- **Frontend Build**: Production bundle compiles cleanly with 0 TypeScript errors.

---

## [Phase 3: Task 3.1 — Backend Foundation & Environment] - 2026-09-28

### Summary
Established the core Python/Django application tier foundation, environment configuration, database resolution, unauthenticated health check endpoint, test infrastructure, and container blueprint. Django 5.1.15 and Django REST Framework 3.15.2 are verified and operational with 12/12 passing backend unit tests, zero regressions on the frontend (158/158 passing Vitest tests), and a clean frontend build.

### Added
- **Python Virtual Environment (`backend/.venv`)**:
  - Isolated Python 3.11 virtual environment initialized and excluded in root `.gitignore`.
  - Installed dependencies from `backend/requirements/development.txt` (Django 5.1.15, DRF 3.15.2, psycopg 3.3.6, pytest 9.1.1, pytest-django 4.14.0, python-dotenv 1.2.3, channels 4.3.2, etc.).
- **Environment Configuration**:
  - Created `backend/.env.example` documenting standardized database variables (`DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`) and compatibility aliases.
  - Wired `python-dotenv` into `backend/manage.py` and `backend/config/settings.py` for seamless environment loading.
- **Django Application Foundation**:
  - Created `backend/common/apps.py` with `CommonConfig(AppConfig)` for clean app registry integration.
  - Created placeholder `backend/templates/.gitkeep` for `TEMPLATES['DIRS']`.
  - Added development-friendly `LOGGING` dictionary in `backend/config/settings.py`.
  - Unified database settings supporting `DATABASE_URL` or individual `DATABASE_*` / `DB_*` variables with fast connect timeout (`connect_timeout=2`) for offline environments.
  - `python manage.py check` passes with 0 issues.
- **Unauthenticated Health Check Endpoint (`GET /api/health/`)**:
  - Implemented `HealthCheckView` in `backend/common/views.py` (`AllowAny`, no auth required).
  - Registered route in `backend/config/urls.py`.
  - Performs an honest database probe via `connection.ensure_connection()`, reporting `status: "ok"` and `database: "disconnected"` when PostgreSQL is not running locally without crashing the process.
- **Backend Test Foundation**:
  - Configured `backend/pytest.ini` pointing to `config.settings`.
  - Implemented `backend/tests/test_settings.py` (settings, middleware, DRF, database, logging).
  - Implemented `backend/tests/test_apps.py` (app registry, all 11 domain apps + common).
  - Implemented `backend/tests/test_health.py` (200 status, JSON schema, database probe, unauthenticated access).
  - 12/12 backend tests passing.
- **Container Blueprint**:
  - Created multi-stage Python 3.11 `backend/Dockerfile` aligning with `infra/docker-compose.yml`.
- **Phase 3 Governance**:
  - Created `docs/phase_prompts/Phase_3_Task_3.1.md`.
  - Created `docs/phases/PHASE_03_STATUS.md`.

### Verified (Non-Regression)
- **Frontend Protection**: Phase 2 frontend source code left completely untouched.
- **Test Suite**: 158/158 Vitest tests passing across 8 suites.
- **Build**: Frontend production bundle compiles cleanly with 0 TypeScript errors.

---

## [Phase 2: Task 2.7 — Operational Allocation, Search & Attendance Visibility Revision] - 2026-09-27

### Summary
Approved post-Phase-2 functional and UI amendment implementing operational student section allocation, Class Teacher allocation governance, dedicated student absentees visibility (ONLY status ABSENT), attendance-not-entered visibility (unentered timetable sessions), multi-role directory search (Admin, Principal, Faculty), and prominent faculty subject visibility. Update and Delete actions are strictly restricted to Admin and Principal roles, while Faculty access is strictly view-only.

### Added
- **Domain Allocation Service (`frontend/src/services/allocationService.ts`)**:
  - In-memory mock service providing typed async methods for operational student allocations, Class Teacher assignments, absentee records, unentered sessions, and global search.
  - Zero raw JSON imports; adheres strictly to the existing Service Abstraction Layer.
- **Student Section Allocation Components (`frontend/src/components/allocation/`)**:
  - `StudentAllocationTable`: Enterprise table with search, grade filter, stream filter, status badges, and role-based action controls (`canManage` prop).
  - `StudentAllocationModal`: Real enterprise form for reassigning grade, stream, section, and roll number while strictly locking the immutable Student ID (`STU202600001`).
  - Confirmation modal for deletion ("Remove [Student Name] ([Student ID]) from [Grade] — [Section]? The student will be marked as Unassigned.") and non-blocking success notices.
- **Class Teacher Allocation Components (`frontend/src/components/allocation/`)**:
  - `ClassTeacherAllocationTable`: Displays Faculty ID, Name, Designation, and Assigned Subject(s) with Update and Delete action buttons for Admin & Principal.
  - `ClassTeacherAllocationModal`: Enterprise dialog to assign designated Class Teachers across academic sections.
  - Confirmation modal for Class Teacher removal ("Remove [Faculty Name] as Class Teacher for [Grade] — [Section]?").
- **Strict Student Absentees Visibility (`frontend/src/components/attendance/StudentAbsenteesTable.tsx`)**:
  - Dedicated table containing strictly students with status `ABSENT`. Excludes `PRESENT`, `ON_DUTY`, and `LEAVE`.
  - Filterable by grade, date, and text query.
  - Scoped school-wide for Admin and Principal; scoped strictly to assigned classes for Faculty.
- **Attendance-Not-Entered Visibility (`frontend/src/components/attendance/AttendanceNotEnteredTable.tsx`)**:
  - Dedicated table identifying scheduled timetable sessions where roll-call submission remains pending.
  - Displays session date, grade, section, subject, period, and assigned faculty with status `NOT ENTERED`.
  - Scoped school-wide for Admin and Principal; scoped strictly to assigned responsibilities for Faculty.
- **Multi-Role Global Directory Search (`frontend/src/components/search/GlobalSearchModal.tsx`)**:
  - Header search trigger (`Search Directory...` or `Ctrl+K`) for Admin, Principal, and Faculty.
  - Real-time search across Students (ID, name, section, roll number) and Faculty (name, employee code, department, designation, subjects).
  - Direct `Update` and `Delete` action triggers in search results for Admin and Principal.
  - Search results for Faculty are strictly view-only with all mutation buttons suppressed.
  - Clean empty state on no results.
- **Principal Allocation Workspace (`frontend/src/pages/principal/PrincipalAllocationPage.tsx`)**:
  - Added new route `/principal/allocation` in `frontend/src/app/router.tsx` and sidebar navigation item in `frontend/src/app/navigation.ts`.
  - Provides executive operational governance over Student Section Allocation and Class Teacher Allocation with full Update/Delete capabilities.
- **Automated Vitest Test Suite (`frontend/tests/task2_7.test.ts`)**:
  - 28 automated tests covering student section allocation, Class Teacher allocation, faculty subject visibility, student absentees scoping, attendance not entered scoping, role-tailored search, attendance formula invariants, and CBSE 8-tier grades.

### Security & Governance
- **Role Invariant**: Update and Delete controls are strictly reserved for Admin and Principal. Faculty UI is guaranteed view-only across all allocation views, search results, and rosters.
- **Immutable Student ID**: Student ID cannot be modified during section updates.
- **Faculty Non-Evaluative Architecture**: Staff directories and search results display subject assignments descriptively without ratings, rankings, or performance scores.
- **Attendance Model**: Preserved canonical 4-status model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`) and calculation formula.
- **Mock State**: All modifications are maintained in client-side mock memory; real backend persistence remains scheduled for Phase 3.

### Testing & Verification
- Vitest: 158/158 tests passing across 8 suites.
- Build: Zero TypeScript errors; clean bundle output.
- Browser QA: Verified Admin, Principal, and Faculty workflows, modal forms, delete confirmations, non-blocking toasts, search modal, and 404 recovery with zero console errors.

---

## [Phase 2: Task 2.6 — Hardening, Cross-Module Reconciliation, QA & Phase 2 Closure] - 2026-09-26

### Summary
Final Phase 2 hardening and quality assurance pass across all modules (Tasks 2.1–2.5). Comprehensive audit spanning academic model correctness, attendance status consistency, grading model, Student ID, parent scoping, stream model, faculty scope, Admin/Principal boundaries, branding, route guards, accessibility, and responsive behavior.

### Fixed
- **Dark mode toggle removed from `DashboardLayout.tsx`**: The `isDarkMode` state, `toggleTheme` function, and Sun/Moon theme toggle button were removed. Dark mode is explicitly out of scope for Phase 2 (spec §12). The button was actively applying `document.documentElement.classList.add('dark')`, which would activate the `dark:` variants present throughout the codebase; removing it keeps the app strictly in its intended light-mode enterprise design.

### Verified (No Changes Required)
- **Academic Model**: Zero active GPA, CGPA, credit, or semester-credit usage in all active UI files. All marks are out of 100 with CBSE 8-tier letter grades (A1–E) via `src/utils/grading.ts`. Verified edge cases (32.99/33/40.99/41/90.99/91/100) pass in 19 automated grading tests.
- **Attendance Model**: Confirmed exactly 4 canonical statuses (PRESENT, ABSENT, ON_DUTY, LEAVE) across all role portals. No LATE or EXCUSED status found anywhere in active code or data. Formula `(P + OD) / (P + A + OD + L) × 100` consistently applied via shared `src/utils/attendance.ts`. Verified by 15 automated tests.
- **Student ID**: Format `STU202600001` (STU + 4-digit year + 5-digit sequence) used consistently. Displayed in student profile, parent portal, admin directory. Student ID is immutable and non-editable in UI. Parent login uses Student ID as username (`STU202600001` / `demo123`).
- **Parent Child Scoping**: Parent access strictly scoped to linked `children_student_ids`. `isChildLinkedToParent` guard prevents cross-ward access. No administrative or other-user data accessible from parent portal.
- **Grade 11–12 Streams**: Four streams verified (Computer Science A, Bio-Maths B, Commerce C, Pure Science D) with sections A1–A3, B1–B3, C1–C3, D1–D3. Grade 10 has no stream. Admin allocation respects stream boundaries.
- **Faculty Scope**: Zero faculty performance ratings, rankings, appraisals, or evaluative reviews found in any active code. Staff directory shows only designations, departments, qualifications, and workload counts.
- **OD-Eligible Terminology**: `od_eligible` field in calendar events is correctly described as "On-Duty (OD) attendance sanction; strictly NOT academic credit." Label in UI is "On-Duty (OD) Sanction Eligible" — neutral, accurate, and not an unsupported statutory claim.
- **Report Endorsement Workflow**: Principal reports workflow uses neutral institutional terms (Draft → Review → Approved). No unsupported statutory/board/government certification claims found.
- **Branding**: "School ERP" consistently applied in browser header, login portal, sidebar, footer, and auth notice. No competing school names, placeholder branding, or university terminology found.
- **Routes**: All 34 routes + 404 verified. Role guards redirect correctly: Student attempting `/admin/dashboard` is redirected to `/student/dashboard`. Unauthenticated users redirected to `/login`. 404 catch-all route renders correct page.
- **Authentication**: Login page shows demo credential notice. Dev mode panel hidden behind `?dev=true` or `Alt+Shift+D`. Role is derived strictly from matched synthetic user record.
- **Mock/Service Abstraction**: All pages consume hooks/services, not raw JSON imports. Mock data flows: `JSON → MockDataService → typed data → React page/component`.
- **Console**: Zero `console.log` statements in production source code. Two `console.warn` statements preserved for legitimate security/session-parse audit purposes.

### Testing
- **Test suite**: 130/130 Vitest unit tests passing across 7 suites (2 new parent tests were added in Task 2.5 that were not reflected in the prior count of 128).
- **Build**: Zero TypeScript errors, zero build errors. `npm run build` exits with code 0. Bundle: 2530 modules, 484 KB main chunk.

### Browser QA
- Full walkthrough across all 5 role portals (Student, Parent, Faculty, Admin, Principal).
- All routes verified, logout/login cycle verified, 404 page verified.
- Zero unhandled JavaScript exceptions or React rendering errors across all tested pages.

---

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
  - **Institutional Report Review Workflow**: Institutional reports registry across Academic, Attendance, Faculty, and Governance categories. Report review modal (`ReportReviewModal.tsx`) supporting status transitions (`Draft` / `Review` -> `Approved`) with principal signature (`Dr. K. Radhakrishnan (Principal)`), timestamp, and official review remarks, plus downloadable official dossier text file generation.
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



