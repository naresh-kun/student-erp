# Phase 4 Execution Status: Authentication + RBAC

> **Phase**: Phase 4 (Authentication + Role-Based Access Control)  
> **Current Task**: **Task 4.6 Completed (Faculty / Admin / Principal Access + Real Frontend Authentication Integration)**  
> **Next Task**: **Task 4.7 (Final Phase 4 Verification & Sign-Off)**  
> **Status**: **IN PROGRESS (Tasks 4.1 through 4.6 DONE; 319/319 backend pytest tests passing; 181/181 frontend tests passing; clean production build)**  
> **Date**: 2026-10-06  

---

## 1. Phase Objective

Establish the authoritative backend authentication and authorization engine for Student ERP using Django, Django REST Framework, and `djangorestframework-simplejwt`. Implement secure credential verification, JWT token lifecycle management, object-level RBAC permission matrices across all 5 system roles (Admin, Principal, Faculty, Student, Parent), and student/parent authentication boundaries, followed by real frontend authentication integration.

---

## 2. Phase 4 Task Breakdown

| Task | Title | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Task 4.1** | **Authentication Foundation** | SimpleJWT configuration, environment variables, AuthService boundary, auth serializers, `/api/v1/auth/` URL namespace, password security, test suite | **COMPLETED** |
| **Task 4.2** | **Custom User & Login** | Custom login endpoint, token claims, safe profile payload, envelope normalization, live smoke tests | **COMPLETED** |
| **Task 4.3** | **RBAC Architecture & Permission Model** | Canonical permission identifiers, 5-role explicit matrix, scope model, AuthorizationService, DRF permission classes, queryset scoping | **COMPLETED** |
| **Task 4.4** | **RBAC Broad Endpoint Enforcement** | Application of permission classes and queryset scoping across all ERP endpoints, views, and services | **COMPLETED** |
| **Task 4.5** | **Student & Parent Authentication** | Alphanumeric Student ID login, parent authentication via linked child's Student ID | **COMPLETED** |
| **Task 4.6** | **Faculty / Admin / Principal Real Frontend Auth** | Real Django login integration in AuthContext, JWT persistence, session restoration, homework service token attachment | **COMPLETED** |
| **Task 4.7** | **Final Phase 4 Verification & Sign-Off** | Comprehensive auth/RBAC verification, security audit, regression check, Phase 4 sign-off | **PENDING** |

---

## 3. Completed Work (Task 4.1: Authentication Foundation)

- [x] **Phase 3 Prerequisite Verification**:
  - Validated PostgreSQL connection, zero pending migrations, and green baseline test suite (154/154 passing).
- [x] **SimpleJWT & Token Configuration**:
  - Configured `SIMPLE_JWT` dictionary in `backend/config/settings.py`:
    - Access token lifetime: 15 minutes (`JWT_ACCESS_TOKEN_LIFETIME_MINUTES`).
    - Refresh token lifetime: 7 days (`JWT_REFRESH_TOKEN_LIFETIME_DAYS`).
    - Token rotation: `ROTATE_REFRESH_TOKENS = True`.
    - Algorithm: `HS256` with environment-based signing key fallback (`JWT_SIGNING_KEY or SECRET_KEY`).
    - Header scheme: `Bearer` (`AUTH_HEADER_TYPES = ('Bearer',)`).
    - User ID mapping: `USER_ID_FIELD = 'id'`, `USER_ID_CLAIM = 'user_id'`.
- [x] **Environment Configuration**:
  - Updated `backend/.env.example` and `backend/.env` with JWT configuration placeholders (`JWT_ACCESS_TOKEN_LIFETIME_MINUTES`, `JWT_REFRESH_TOKEN_LIFETIME_DAYS`, `JWT_ROTATE_REFRESH_TOKENS`, `JWT_SIGNING_KEY`, `JWT_ISSUER`).
- [x] **Password Security Configuration**:
  - Verified Django's standard password hashing (`pbkdf2_sha256$`) across all user operations.
  - Confirmed all 4 standard password validators are active in `AUTH_PASSWORD_VALIDATORS`.
  - Zero plaintext passwords or password hashes exposed in responses, string representations, or logs.
- [x] **AuthService Domain Boundary (`apps/accounts/services.py`)**:
  - Implemented `AuthService(BaseService)` with:
    - `authenticate_user(username, password)`: Rejects empty credentials and disabled/inactive accounts.
    - `generate_tokens_for_user(user)`: Issues JWT token pair with standard safe claims (`user_id`, `role`, `username`).
    - `validate_password_strength(password, user)`: Validates against Django password validators.
    - `get_user_by_id(user_id)`: Safely loads user by UUID.
- [x] **Authentication Serializers (`apps/accounts/serializers.py`)**:
  - `AuthTokenResponseSerializer`: Declares standard token output schema (`access`, `refresh`, `token_type`).
  - `LoginCredentialsSerializer`: Declares `username` and `password` with `password` marked `write_only=True`.
  - `CurrentUserProfileSerializer`: Safe profile representation for `/api/v1/auth/me/` strictly excluding password, password hash, and security secrets.
- [x] **API URL Routing Under `/api/v1/auth/`**:
  - `POST /api/v1/auth/login/`: TokenObtainPairView route scaffolded.
  - `POST /api/v1/auth/refresh/`: TokenRefreshView route scaffolded.
  - `GET /api/v1/auth/me/`: CurrentUserProfileView protected by `IsAuthenticated` returning user context in standard envelope.
- [x] **Automated Testing Suite (`backend/tests/test_auth_foundation_task41.py`)**:
  - 27 new automated tests covering:
    - Settings and JWT configuration.
    - Password hashing and usability.
    - Inactive user rejection.
    - Password validator enforcement.
    - AuthService methods.
    - Serializer field safety.
    - URL resolution and endpoint behavior (authenticated, unauthenticated, invalid token).
    - Exactly 5 approved roles integrity.
  - **181/181 backend tests passing (100%)**.
- [x] **Frontend Regression Verification**:
  - **158/158 frontend tests passing (`npm test -- --run`)**.
  - **Clean production build (`npm run build` in 13.26s)**.
  - Frontend remains purely mock-driven (`VITE_USE_MOCK_DATA=true`); zero token integration or auth coupling.

---

## 4. Completed Work (Task 4.2: Custom User & Login)

- [x] **Login Pipeline Implementation (`POST /api/v1/auth/login/`)**:
  - Implemented `ERPTokenObtainPairSerializer` subclassing `TokenObtainPairSerializer`:
    - Enforces credential validation via Django authentication (`authenticate(username, password)`).
    - Rejects inactive or disabled accounts (`is_active=False`) with HTTP 401.
    - Rejects non-existent usernames and incorrect passwords with safe generic 401 response (zero account enumeration).
    - Injects standard safe claims (`user_id`, `role`, `username`) into JWT payload.
    - Assembles safe user identity payload: `id`, `username`, `email`, `first_name`, `last_name`, `role`.
    - Returns standardized dual-compatibility envelope (`access`, `refresh`, `token_type`, `user`, `success`, `data`).
  - Implemented `TokenObtainPairView` in `apps/accounts/views.py` backed by `ERPTokenObtainPairSerializer`.
- [x] **Token Refresh Implementation (`POST /api/v1/auth/refresh/`)**:
  - Implemented `TokenRefreshView` in `apps/accounts/views.py`:
    - Validates refresh token and issues new access token.
    - Rotates refresh tokens when configured.
    - Rejects expired, tampered, or invalid refresh tokens with HTTP 401.
    - Delivers standardized dual-compatibility envelope (`access`, `refresh`, `token_type`, `success`, `data`).
- [x] **Current User Endpoint (`GET /api/v1/auth/me/`)**:
  - Requires `IsAuthenticated`.
  - Resolves authenticated User from validated JWT Bearer token.
  - Returns safe user context via `AccountService.get_user_profile_context(request.user)`.
  - Strictly excludes password, password hash, and security secrets.
  - Rejects unauthenticated or tampered requests with HTTP 401.
- [x] **AuthService Extension (`apps/accounts/services.py`)**:
  - Added `login_with_credentials(username, password)` executing the complete credential check, inactive user validation, token issuance, and safe user payload assembly.
- [x] **Automated Testing Suite (`backend/tests/test_login_task42.py`)**:
  - 20 comprehensive automated tests covering:
    - Login with valid credentials, invalid password, unknown username, empty inputs, inactive user.
    - Login across all 5 canonical roles (`Admin`, `Principal`, `Faculty`, `Student`, `Parent`).
    - JWT access & refresh token claims, lifetimes (15m / 7d), and signature validation.
    - Refresh token issuance, rotation, and rejection of malformed tokens.
    - Current user profile retrieval with token, unauthenticated 401, token tampering, and post-issuance account deactivation.
    - Direct `AuthService` login workflow execution.
  - **Total backend test suite expanded from 181 to 201 tests passing (100%)**.
- [x] **Live API Smoke Testing**:
  - Executed real HTTP queries against live PostgreSQL database with seeded credentials (`admin_demo` / `demo123`):
    - `POST /api/v1/auth/login/` -> 200 OK (access, refresh, user: Admin).
    - `POST /api/v1/auth/refresh/` -> 200 OK (access renewed).
    - `GET /api/v1/auth/me/` -> 200 OK (user context verified).
    - `POST /api/v1/auth/login/` (wrong password) -> 401 Unauthorized.
    - `GET /api/v1/auth/me/` (unauthenticated) -> 401 Unauthorized.
- [x] **Frontend Regression**:
  - **158/158 Vitest tests passing (`npm test -- --run` in 5.79s)**.
  - **Clean production build (`npm run build` in 7.79s, 0 errors)**.

---

## 5. Completed Work (Task 4.3: RBAC Architecture & Permission Model)

- [x] **Authoritative 5-Role RBAC Model (`backend/common/authorization.py`)**:
  - Exactly 5 system roles (`Admin`, `Principal`, `Faculty`, `Student`, `Parent`).
  - Explicit role assignments in `ROLE_PERMISSIONS_MATRIX` with zero automatic role inheritance.
  - Standardized permission identifiers (`<domain>.<action>`).
- [x] **Reusable Scope Engine (`backend/common/constants.py` & `authorization.py`)**:
  - Declared `SCOPE_GLOBAL`, `SCOPE_FACULTY_ASSIGNED`, `SCOPE_SELF`, `SCOPE_LINKED_CHILD`, `SCOPE_NONE`.
  - Implemented `AuthorizationService.resolve_scope(user, domain)`.
  - Assignment-aware Faculty scoping (Class Teacher assignments and recorded/evaluated items).
  - Student identity self-ownership and Parent verified child relationships.
- [x] **Task 2.7 Allocation Governance**:
  - Student section allocation and Class Teacher allocation `Update` and `Delete` assigned strictly to `Admin` and `Principal`.
  - `Faculty` restricted to view-only allocation access.
  - Principal access works without Django `is_superuser = True` shortcut.
- [x] **Authorization Domain Service (`AuthorizationService`)**:
  - `get_user_role(user)`: Evaluates live DB user role state, ignoring client payloads and stale token claims.
  - `has_permission(user, permission)`: Evaluates permissions against matrix.
  - `can_access_object(user, obj, action)`: Verifies object-level ownership and faculty assignments.
  - `filter_queryset_for_user(queryset, user, domain)`: Scopes querysets across `Student`, `Attendance`, `LeaveApplication`, `Mark`, `Section`, `Enrollment`, `Parent`, and `Faculty`.
- [x] **DRF Permission Architecture (`backend/common/permissions.py`)**:
  - `HasRequiredPermission(perm)`: Base evaluator.
  - `require_permission(perm)`: Class factory.
  - Role-specific classes: `IsAdminRole`, `IsPrincipalRole`, `IsFacultyRole`, `IsStudentRole`, `IsParentRole`.
  - Composite classes: `IsAdminOrPrincipal`, `IsStaffOrExecutive`.
  - Scoped object access: `IsOwnerOrScopedAccess`.
- [x] **Security Hardening & Tampering Mitigation**:
  - Payload overrides (`{"role": "Admin"}`) strictly ignored.
  - Immediate role revocation upon database role changes or account deactivation (`is_active = False`).
  - Clear denial semantics: 401 unauthenticated vs 403 forbidden.
- [x] **Automated Testing Suite (`backend/tests/test_rbac_task43.py`)**:
  - 27 comprehensive automated tests covering all 5 roles, scope resolution, queryset scoping, object ownership, denial semantics, and security hardening.
  - **Backend test suite expanded from 201 to 228 tests passing (100%)**.
- [x] **Full Regression Verification**:
  - `python manage.py check`: 0 issues.
  - `python manage.py makemigrations --check`: 0 changes (zero migrations needed).
  - `pytest -q`: 228/228 passing in 94.24s.
  - `npm test -- --run`: 158/158 passing in 5.06s.
  - `npm run build`: Clean production build in 6.59s.

---

## 6. Completed Work (Task 4.4: RBAC Broad Endpoint Enforcement)

- [x] **Comprehensive API Surface Audit**:
  - Identified and inventoried all 33 endpoints across 15 router namespaces (`/api/health/`, `/api/v1/auth/`, `/api/v1/students/`, `/api/v1/parents/`, `/api/v1/faculty/`, `/api/v1/classes/`, `/api/v1/subjects/`, `/api/v1/academics/`, `/api/v1/attendance/`, `/api/v1/marks/`, `/api/v1/timetable/`, `/api/v1/calendar/`, `/api/v1/allocation/`, `/api/v1/reports/`, `/api/v1/notifications/`, `/api/v1/audit/`).
  - Zero invented or phantom endpoints created.
- [x] **Public vs. Protected Boundaries**:
  - Explicitly documented and maintained intentional public endpoints:
    - `/api/health/`: Unauthenticated health check.
    - `POST /api/v1/auth/login/`: Unauthenticated credential verification.
    - `POST /api/v1/auth/refresh/`: Unauthenticated refresh token rotation.
  - All other 30 endpoints strictly require active authenticated users.
- [x] **DRF Permission Architecture & Method Mapping**:
  - Applied `HasRequiredPermission` with `permission_map` (HTTP method dispatch) or `require_permission(...)` across all views:
    - `StudentListView`: GET (`students.view`), POST (`students.create`).
    - `StudentDetailView`: GET (`students.view`), PATCH (`students.update`), backed by `IsOwnerOrScopedAccess`.
    - `ParentListView`: GET (`students.view`) with scoped querysets.
    - `ParentDetailView`, `ParentChildrenView`: GET (`students.view`) backed by `IsOwnerOrScopedAccess`.
    - `FacultyListView`: GET (`users.view`), POST (`users.create`).
    - `FacultyDetailView`: GET (`users.view`), PATCH (`users.update`), backed by `IsOwnerOrScopedAccess`. Self-edit restricted from modifying administrative fields (`employee_code`, `is_active`, `department`, `designation`, `joining_date`, `user_id`).
    - `ClassListView`, `SubjectListView`: GET (`academics.view`), POST (`academics.manage`).
    - `ClassDetailView`, `ClassSectionsView`, `SubjectDetailView`, `AcademicYearListView`: GET (`academics.view`).
    - `AttendanceOverviewView`: GET (`attendance.view`).
    - `BulkAttendanceCreateView`: POST (`attendance.mark`). Faculty limited strictly to assigned sections; Student/Parent denied.
    - `StudentAbsenteesView`: GET (`attendance.view_absentees`). Admin, Principal, Faculty (scoped). Student/Parent denied.
    - `LeaveApplicationListView`: GET (`attendance.view`). POST: Students permitted for self-only; Faculty/Admin permitted. Role tampering blocked.
    - `AttendanceDetailView`: GET (`attendance.view`), PATCH (`attendance.mark`), backed by `IsOwnerOrScopedAccess`.
    - `MarkListView`: GET (`marks.view`).
    - `BulkMarkCreateView`: POST (`marks.enter`). Faculty limited to assigned section; Student/Parent denied.
    - `ExamTypeListView`: GET (`marks.view`), POST (`marks.override`).
    - `ReportCardView`: GET (`reports.view`). Object-level access verification via `AuthorizationService.can_access_object`.
    - `MarkDetailView`: GET (`marks.view`), PATCH (`marks.enter`), backed by `IsOwnerOrScopedAccess`.
    - `AllocationListView`: GET (`allocation.view`). Admin, Principal, Faculty. Student/Parent denied.
    - `AuditLogListView`: GET (`audit.view`). Admin, Principal. Faculty, Student, Parent denied.
    - `CalendarEventListView`, `TimetableListView`, `NotificationListView`, `ReportListView`: Protected by domain view permissions.
- [x] **Queryset-Level Scoping Integration**:
  - Connected `AuthorizationService.filter_queryset_for_user(qs, request.user, domain)` prior to pagination/serialization across:
    - `StudentListView` (`domain='students'`)
    - `ParentListView` & `ParentChildrenView` (`domain='students'`)
    - `FacultyListView` (`domain='users'`)
    - `AttendanceOverviewView`, `StudentAbsenteesView`, `LeaveApplicationListView` (`domain='attendance'`)
    - `MarkListView` (`domain='marks'`)
- [x] **Object-Level Authorization & Direct ID Manipulation Prevention**:
  - Implemented object-level security hooks (`check_object_permissions`) and `can_access_object` verification.
  - Verified prevention of cross-student profile inspection, cross-parent detail access, cross-parent children access, cross-faculty bio editing, cross-student report card inspection, and cross-section attendance/marks mutation.
- [x] **Mutation & Role Tampering Protection**:
  - POST, PATCH, PUT mutations enforce strict domain permissions and payload validation.
  - Client request payloads containing elevated roles (e.g. `{"role": "Admin"}`) or mismatched IDs are rejected without modifying database roles or elevating privileges.
- [x] **Deterministic Pagination & Clean Database Hygiene**:
  - Added deterministic `.order_by('created_at', 'id')` to `Parent` and `Faculty` querysets in `apps/accounts/services.py` eliminating DRF `UnorderedObjectListWarning`.
  - Used timezone-aware datetimes in seed data eliminating `RuntimeWarning`.
- [x] **Automated Testing Suite (`backend/tests/test_endpoint_rbac_task44.py`)**:
  - 33 comprehensive automated tests covering:
    - Public vs authenticated endpoints (health check, `/auth/me/`).
    - All 5 canonical roles: Admin, Principal, Faculty, Student, Parent.
    - List queryset scoping across students, parents, faculty, attendance, absentees, marks.
    - Object-level direct ID manipulation prevention (UUID and Student ID lookups).
    - Faculty assignment boundaries (assigned class attendance/marks allowed; unassigned denied).
    - Administrative field protection during faculty self-edit.
    - Student leave application identity enforcement.
    - Scaffolding endpoint RBAC (allocation, audit, calendar, notifications, reports, timetable).
    - Role tampering via payload denial and inactive user rejection.
  - **Backend test suite expanded from 228 to 261 passing tests (100%, 0 warnings, 0 failures)**.
- [x] **Full Regression Verification**:
  - `python manage.py check`: 0 issues.
  - `python manage.py makemigrations --check`: 0 changes (zero pending migrations).
  - `pytest`: 261/261 passing in 222.64s.
  - `npm test -- --run`: 158/158 Vitest tests passing in 25.55s.
  - `npm run build`: Clean production build in 15.92s.

---

## 7. Completed Work (Task 4.5: Student & Parent Authentication)

- [x] **Unified Login Endpoint Preserved (`POST /api/v1/auth/login/`)**:
  - Maintained single unified endpoint accepting standard payload `{ "username": "<identifier>", "password": "<password>" }`.
  - Seamlessly handles Student ID, Parent authenticating via linked child's Student ID, and standard administrative usernames.
- [x] **Student Authentication Workflow**:
  - Identifier matching regex `^STU\d{4}\d{5}$` (case-insensitive, whitespace trimmed) resolves Student record.
  - Linked `student.user` credential verified with standard Django PBKDF2 hasher.
  - Strict account activity enforced: `student.user.is_active == True` and `student.status != Student.Status.WITHDRAWN`.
  - On success, issues standard JWT with `role = "Student"` derived strictly from the database.
- [x] **Parent Authentication via Linked Child Workflow**:
  - Deterministic evaluation order: If Student password verification does not match, checks `student.parent.user`.
  - Verifies parent password and `parent.user.is_active == True`.
  - Enables parents with multiple children to authenticate using any linked child's Student ID.
  - Rejects cross-parent attempts: A parent cannot log in with an unrelated child's Student ID.
  - Rejects orphan students (no parent relationship).
  - On success, issues standard JWT with `role = "Parent"` derived strictly from the database.
- [x] **Administrative & Standard Username Fallback**:
  - Identifiers that do not match the Student ID regex or fail Student/Parent resolution fall back directly to standard `authenticate(username=identifier, password=password)`.
  - Fully preserves login for Admin, Principal, Faculty, and any legacy direct usernames.
- [x] **Security & Anti-Enumeration Hardening**:
  - Timing attack mitigation: Executes in-memory PBKDF2 dummy password hash calculation (`User().set_password(password)`) when Student ID is not found or when child has no linked parent.
  - Generic HTTP 401 response (`NO_ACTIVE_ACCOUNT`) on all authentication failures with zero distinction between nonexistent IDs, bad passwords, or inactive status.
  - Server-side identity derivation: Client-supplied payload fields (`role`, `user_id`, `student_id`) are completely ignored.
- [x] **Architectural Layering**:
  - Implemented `AuthService.authenticate_by_identifier(identifier, password)` in `backend/apps/accounts/services.py`.
  - Kept `ERPTokenObtainPairSerializer.validate()` thin by delegating credential resolution to `AuthService`.
- [x] **Automated Testing Suite (`backend/tests/test_student_parent_auth_task45.py`)**:
  - 26 comprehensive automated tests covering:
    - Student login (valid, lowercase, whitespace, wrong password, nonexistent ID, malformed ID, withdrawn student, inactive user).
    - Parent login (valid child ID, multiple linked children, wrong parent password, another parent's child ID, orphan child, inactive parent).
    - Security controls (role tampering, user_id tampering, cross-student auth, cross-parent auth, generic 401 envelope, zero existence leakage).
    - Regressions (Admin, Principal, Faculty, direct username, token refresh, `/api/v1/auth/me/`).
  - **Backend test suite expanded from 261 to 287 passing tests (100%, 0 warnings, 0 failures)**.
- [x] **Full Regression & Quality Gate**:
  - `python manage.py check`: 0 issues.
  - `python manage.py makemigrations --check`: 0 changes (zero pending migrations).
  - `pytest`: 287/287 passing.
  - `npm test -- --run`: 158/158 Vitest tests passing.
  - `npm run build`: Clean production build.

---

## 8. Completed Work (Task 4.6: Faculty / Admin / Principal Real Frontend Auth Integration)

- [x] **Audit-Only Investigation & Root Cause Identification**:
  - Confirmed backend health: Django `POST /api/v1/auth/login/` and `GET /api/v1/homework/` functional with real JWT tokens.
  - Identified client-side root cause: `AuthContext.tsx` was dispatching `loginWithCredentials()` to `MockAuthService.loginWithCredentials()`, storing a mock user in `localStorage` without acquiring or storing real JWT tokens (`access_token`, `refresh_token`).
  - Identified cascading issue: `HomeworkService` expected `localStorage['access_token']`, and when absent attempted an auto-login workaround with mock username `Faculty01`, which failed with 401 against PostgreSQL because the database contains real username `faculty_suresh`.
- [x] **Real Authentication Integration in `AuthContext.tsx`**:
  - Replaced mock login dispatch with direct `POST /api/v1/auth/login/` sending `{ "username": identifier.trim(), "password": password.trim() }`.
  - Persisted server-issued `access_token` and `refresh_token` in `localStorage`.
  - Derived user identity and role strictly from server response (`rawUser.role as UserRole`), eliminating client-side role overrides.
  - Implemented session restoration on app startup via `GET /api/v1/auth/me/` with `Authorization: Bearer <access_token>`.
  - Implemented automatic token refresh recovery via `POST /api/v1/auth/refresh/` on access token expiration (401).
  - Implemented clean logout clearing `access_token`, `refresh_token`, and active user state from `localStorage`.
- [x] **HomeworkService Cleanup (`frontend/src/services/homeworkService.ts`)**:
  - Removed embedded auto-login workaround from `getAuthHeaders()`.
  - Service strictly reads `localStorage['access_token']` and attaches `Authorization: Bearer <token>`.
  - Cleaned up imports, removing `MockAuthService` dependency.
- [x] **LoginPage & Demo Accounts Alignment (`LoginPage.tsx`, `authService.ts`)**:
  - Removed Phase 2 demonstration notices ("Simulated credential authentication").
  - Updated helper placeholders and descriptions with real seeded accounts (`admin_demo`, `principal_demo`, `faculty_suresh`, `faculty_priya`, `STU202600001`).
  - Updated `SYNTHETIC_DEMO_ACCOUNTS` in `authService.ts` to reference authoritative seeded accounts and passwords (`demo123`).
- [x] **Automated Testing Suite (`frontend/tests/auth_integration.test.ts`)**:
  - 14 comprehensive Vitest tests covering:
    - Real Admin login request to `/api/v1/auth/login/`.
    - Real Principal login request.
    - Real Faculty login request.
    - JWT token persistence in `localStorage`.
    - Authenticated user hydration.
    - Logout token and session cleanup.
    - Session restoration via `GET /api/v1/auth/me/`.
    - Token refresh recovery on 401.
    - Generic error handling on invalid credentials.
    - Client-side role tampering rejection.
    - Bearer token attachment on protected requests.
    - `HomeworkService` non-embedded login verification.
    - `HomeworkService` stored access token usage.
    - Student and Parent login regression at frontend auth boundary.
  - **Frontend test suite expanded from 167 to 181 passing tests (100%, 0 failures)**.
- [x] **Live Browser Verification via Subagent**:
  - Admin login (`admin_demo` / `demo123`): Redirected to `/admin/dashboard`, rendered `System Administrator ADMIN SA`.
  - Principal login (`principal_demo` / `demo123`): Redirected to `/principal/dashboard`, rendered `Dr. K. Radhakrishnan PRINCIPAL DR`.
  - Faculty login (`faculty_suresh` / `demo123`): Redirected to `/faculty/dashboard`, rendered `R. Suresh FACULTY RS`.
  - Faculty Homework navigation (`/faculty/homework`): Loaded all 3 seeded PostgreSQL homework items with zero 401 errors.
  - Django terminal confirmed HTTP 200 on all login and homework requests.
- [x] **Full Regression & Quality Gate**:
  - `python manage.py check`: 0 issues.
  - `python manage.py makemigrations --check`: 0 changes (zero pending migrations).
  - `pytest`: 319/319 passing (including 30 MOD_001 tests).
  - `npm test -- --run`: 181/181 Vitest tests passing.
  - `npm run build`: Clean production build (zero TypeScript errors).

---

## 9. Phase 4 Invariants & Architectural Boundaries

1. **Django + DRF + SimpleJWT Sole Authority**: No competing authentication framework (Firebase, Supabase, Auth0, FastAPI) is permitted.
2. **Stateless JWT Architecture**: Access tokens are stateless, short-lived (15 minutes), signed with HMAC-SHA256.
3. **Endpoint Enforcement Complete in Task 4.4**: All API endpoints enforce authentication, RBAC permissions, queryset scoping, and object-level checks.
4. **Student/Parent Special Auth Complete in Task 4.5**: Alphanumeric Student ID login and Parent linked-student auth are authoritative.
5. **Real Frontend Authentication in Task 4.6**: Frontend session layer uses real Django authentication and JWT tokens; Phase 5 remains NOT STARTED.



