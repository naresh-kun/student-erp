# Architecture Decision Records (ADRs)

> **Status**: Authoritative Architectural Decisions  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## ADR 001: React + Vite Single Page Application Instead of Next.js

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: The Student ERP is an authenticated internal enterprise portal with complex client-side workflows (timetabling, grade sheets, interactive scheduling, dashboard widgets) where SEO and Server-Side Rendering (SSR) provide negligible benefits compared to the added architectural complexity of Node.js servers, hydration mismatches, and vendor coupling.
- **Decision**: Use React 18+ with TypeScript bundled via Vite as a pure Single-Page Application (SPA).
- **Consequences**:
  - Extremely fast local developer feedback loop with instant Hot Module Replacement (HMR).
  - Clear, unambiguous boundary between static client bundles and the Python backend.
  - Zero requirement for Node.js runtime servers in production; assets can be served directly from Caddy or Nginx with low resource overhead.

---

## ADR 002: Django & Django REST Framework (DRF) as the Primary Backend

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: An enterprise educational ERP requires robust ORM capabilities, rock-solid transactional integrity, mature authentication/session handling, built-in migration tooling, and rich admin capabilities.
- **Decision**: Standardize on Python with Django and Django REST Framework for all core API services. Alternative frameworks (such as FastAPI, Express, or Spring Boot) are strictly rejected.
- **Consequences**:
  - Battle-tested security against SQL injection, CSRF, and clickjacking.
  - Standardized serializer validation, exception formatting, and pagination.
  - Strong ecosystem integration with Django Channels and Celery.

---

## ADR 003: PostgreSQL as the Sole Authoritative Relational Database

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: Educational ERP data is deeply relational: students belong to classes, take multiple subjects, receive marks categorized by exam types, and log daily attendance against scheduled timetable periods. Document stores (such as MongoDB) lack foreign key referential integrity and transactional multi-table consistency, risking data anomalies.
- **Decision**: Use PostgreSQL 16+ exclusively as the persistent database engine. MongoDB, Firebase, and Supabase are strictly prohibited.
- **Consequences**:
  - Full ACID compliance across multi-table academic workflows.
  - Native JSONB support provides document flexibility where needed (e.g. audit logs, report filters) without sacrificing relational guarantees.
  - Rock-solid foreign key constraints enforce cascading deletions and protect orphan rows.

---

## ADR 004: Redis & Django Channels for Realtime Event Broadcasting

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: Real-time communication (e.g. instantaneous attendance notifications to parents, campus emergency alerts, live timetable room swaps) requires a persistent full-duplex socket architecture without polling overhead.
- **Decision**: Adopt Django Channels with ASGI backing, using Redis as the in-memory Channel Layer broker and cache store.
- **Consequences**:
  - Seamless coexistence of standard synchronous HTTP views and asynchronous WebSocket consumers in the same application codebase.
  - Redis provides sub-millisecond pub/sub message fanout across multiple worker processes.
  - Redis doubles as an API rate limiter and short-term cache.

---

## ADR 005: Mock Service Abstraction During Frontend Development

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: To allow rapid frontend development in Phase 2 without waiting for complete backend database schema implementation and API deployments, the frontend requires realistic datasets.
- **Decision**: Implement a clean Service Abstraction Layer between React components/hooks and data sources (`VITE_USE_MOCK_DATA=true`). Components consume service interfaces (e.g. `StudentService`, `AttendanceService`) that load from `mock-data/*.json`. When backend APIs are deployed, swapping the service adapter to `/api/v1/` REST endpoints requires zero UI component rewrites.
- **Consequences**:
  - Frontend engineering proceeds at maximum velocity with rich, deterministic data.
  - Components are completely decoupled from backend network details.
  - Zero technical debt during the transition to live APIs.

---

## ADR 006: Modular Monolith Over Distributed Microservices

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: For educational institutions, microservice architectures introduce severe operational complexity: distributed transactions (two-phase commits), network latency, service discovery overhead, and Kubernetes deployment costs.
- **Decision**: Adopt a Modular Monolith architecture within Django. Domain logic is compartmentalized into discrete Django apps under `backend/apps/`, sharing a common relational database while maintaining clean domain boundaries.
- **Consequences**:
  - Single deployment artifact drastically reduces operational overhead.
  - Relational joins and ACID transactions remain native and performant.
  - Future extraction of a specific domain into an independent microservice remains feasible if extreme scale requires it.

---

## ADR 007: Master Plan Amendment 2 — Attendance Four-Status Model (PRESENT, ABSENT, ON_DUTY, LEAVE)

- **Status**: ACCEPTED / AUTHORITATIVE (Approved Master Plan Amendment 2)
- **Context**: 
  - Educational institutions require distinguishing unexcused absences from sanctioned, faculty-approved leaves.
  - Prior specifications only supported `PRESENT`, `ABSENT`, and `ON_DUTY`. Legacy statuses (`LATE`, `EXCUSED`) were previously deprecated due to subjective scoring ambiguities.
- **Decision**:
  - Adopt a canonical 4-status model across all layers: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`.
  - `LATE` and `EXCUSED` remain strictly deprecated and forbidden from reintroduction.
  - **Business Rules**:
    1. `LEAVE` represents a student absence sanctioned with faculty/school permission. Faculty are responsible for approving and marking `LEAVE`.
    2. `LEAVE` counts as an absence in attendance percentage calculations (it is included in the denominator only).
    3. `ON_DUTY` continues to count as present (included in both numerator and denominator).
    4. `LEAVE` must remain visually and semantically distinct from ordinary `ABSENT` across all UI dashboards (using Violet/Purple tokens).
    5. Mathematical calculation rule:
       $$\text{Attendance \%} = \frac{\text{PRESENT} + \text{ON\_DUTY}}{\text{PRESENT} + \text{ABSENT} + \text{ON\_DUTY} + \text{LEAVE}} \times 100$$
- **Consequences**:
  - Faculty portal includes a dedicated `LEAVE` toggle action with `approved_by_faculty_id` auditing.
  - Student and Parent portals display approved leave breakdowns without distorting the canonical absence calculation.
  - Admin and Principal oversight metrics aggregate 4 statuses with complete mathematical consistency.

---

## ADR 008: Indian School ERP Reconciliation & CBSE/ICSE Academic Model

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: 
  - The Student ERP is specifically designed for Indian schools (CBSE / ICSE Senior Secondary model, canonical application identity "School ERP").
  - Previous scaffolds inherited university/college concepts (GPA, CGPA, Credits, Credit Hours, Semester GPA, college-style transcripts, degree/major/minor, faculty appraisal ratings/leaderboards), which conflict with Indian school administration practices and user workflows.
- **Decision**:
  1. **Complete Removal of University Concepts**: Purge all GPA, CGPA, credits, credit hours, degree/major/minor, and faculty performance ratings/rankings from active types, services, mock data, components, dashboards, tables, filters, and reports.
  2. **Canonical Indian School Academic Model**:
     - Marks out of 100 (0–100 numeric, or `'AB'` for absent assessments).
     - Cumulative marks out of Total Maximum Marks (e.g. 435 / 500).
     - Overall percentage (rounded to 2 decimal places, e.g. 87.00%).
     - Standard 8-tier letter grade scale:
       - `A1` = 91–100
       - `A2` = 81–<91
       - `B1` = 71–<81
       - `B2` = 61–<71
       - `C1` = 51–<61
       - `C2` = 41–<51
       - `D`  = 33–<41
       - `E`  = <33
     - Shared single source of truth for grade evaluation: `frontend/src/utils/grading.ts`.
  3. **Student Information Model**:
     - Permanent, unique, system-generated Student ID (e.g. `STU202600001`), Admission Number (`ADM20240091`), Roll Number (`11-A2-04`), Date of Birth (`14/05/2009`), Class & Section, Stream, Academic Year (`2026–27`).
     - Parent Portal authentication uses child's Student ID as the username with parent credentials.
  4. **Indian School Class & Stream Structure**:
     - Grades below 11: General Secondary curriculum (no stream).
     - Grades 11–12: Exactly one stream (`Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`) and stream-specific sections (`A1..A3`, `B1..B3`, `C1..C3`, `D1..D3`).
  5. **Faculty Non-Evaluative Principle**:
     - Faculty information is strictly descriptive (Name, Designation, Assigned Classes, Workload in periods/week, Timetable).
     - Prohibited: Faculty ratings, performance rankings, leaderboards, teacher scorecards, or attributing class marks to teacher appraisals.
  6. **UI & Design Language**:
     - Enterprise school visual design: Light theme default, white/slate surfaces, deep navy blue primary (`bg-blue-900`), flat bordered panels, minimal shadows, WCAG AA compliance.
     - Prohibited: Glowing gradients, neon accents, glassmorphism, floating cards, 3D blobs, AI sparkle icons.
- **Consequences**:
  - Authentic, natural workflow for Indian school administrators, principals, teachers, parents, and students.
  - Complete mathematical consistency across marks, percentage, and 8-tier letter grades in all 5 user roles.
  - Full adherence to Master Plan Amendment 2 four-status attendance model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`).

---

## ADR 009: Operational Allocation, Search & Attendance Visibility Revision (Task 2.7 Approved Functional Amendment)

- **Status**: ACCEPTED / AUTHORITATIVE (Approved Post-Phase-2 Functional Amendment)
- **Context**: 
  - Following completion of Phase 2 core dashboards, operational amendments were approved under Task 2.7 to support real-world school administrative workflows:
    1. Operational student section allocation when joining or transferring.
    2. Class Teacher allocation governance.
    3. Dedicated visibility for unexcused student absentees (distinct from leave).
    4. Dedicated visibility for unentered attendance sessions (unmarked timetable slots).
    5. Multi-role global search for students and faculty across Admin, Principal, and Faculty.
    6. Prominent faculty subject assignment visibility.
    7. Delegation of update/delete capabilities on allocation records exclusively to Admin and Principal, strictly excluding Faculty.
- **Decision**:
  1. **Operational Student Section Allocation**:
     - Preserves hierarchy: Academic Year → Grade → Stream (Grades 11–12) → Section → Student.
     - Student ID is permanent, unique, and immutable. Update forms permit modifying Grade, Stream, Section, and Roll Number, but lock Student ID.
     - Admin and Principal hold Update/Delete permissions. Faculty access is strictly view-only (no modification controls).
     - Deletion requires clear confirmation ("Remove [Student Name] ([Student ID]) from [Grade] — [Section]? The student will be marked as Unassigned.") and non-blocking success feedback.
  2. **Class Teacher Allocation Governance**:
     - Admin and Principal can assign, update, and remove designated Class Teachers across all grades, streams, and sections.
     - Faculty records require Faculty ID, Name, Designation, and Assigned Subject(s).
     - Deletion requires explicit confirmation ("Remove [Faculty Name] as Class Teacher for [Grade] — [Section]?").
  3. **Faculty Subject Visibility**:
     - Whenever faculty members appear in directories, allocations, search results, or class rosters, their assigned subject(s) are clearly displayed via compact badges.
     - Faculty data remains strictly descriptive and non-evaluative (zero ratings, rankings, or performance scores).
  4. **Strict Student Absentees Visibility**:
     - Dedicated visibility surfaces display ONLY students whose attendance status is `ABSENT`.
     - Excludes `PRESENT`, `ON_DUTY`, and `LEAVE` (LEAVE and ABSENT remain strictly distinct).
     - Admin and Principal view school-wide absentees; Faculty views absentees scoped strictly to assigned classes/subjects.
  5. **Attendance-Not-Entered Visibility**:
     - Dedicated visibility surfaces identify scheduled timetable periods where roll call has NOT yet been marked/submitted.
     - Represents unentered sessions (status `NOT ENTERED`), distinct from student absence.
     - Admin and Principal view school-wide unentered sessions; Faculty views sessions scoped to assigned responsibilities.
  6. **Role-Tailored Directory Search**:
     - Admin and Principal can search students and faculty with allocation management actions directly in results.
     - Faculty can search students and faculty for reference/lookup; Update/Delete actions are suppressed.
  7. **Mock State Limitation**:
     - All mutations operate on client-side in-memory mock state via the domain Service Abstraction Layer (`AllocationService`). Backend REST persistence is strictly deferred to Phase 3.
- **Consequences**:
  - Full operational capability for Admin and Principal workflows.
  - Clean role separation preventing unauthorized faculty mutations.
  - Zero violation of Phase 2 architectural boundaries or attendance 4-status invariants.

---

## ADR 010: Backend Authentication Foundation with Stateless SimpleJWT

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: 
  - Educational ERP security demands robust credential verification, safe session/token lifecycles, and protection against credential stuffing and privilege escalation.
  - Need a unified, battle-tested token architecture for REST API consumers under `/api/v1/` without introducing complex third-party identity dependencies (Auth0, Firebase, Supabase).
- **Decision**:
  1. **Framework Standardization**: Adopt `djangorestframework-simplejwt` as the sole JWT provider for DRF endpoints. Custom cryptography or parallel auth databases are strictly rejected.
  2. **Token Lifespans & Algorithms**:
     - Access Token: 15-minute lifespan, stateless HMAC-SHA256 signed JWT.
     - Refresh Token: 7-day lifespan with rotation enabled (`ROTATE_REFRESH_TOKENS = True`).
     - Standard Claims: `user_id` (UUID), `role` (canonical system role), `username`.
  3. **Credential & Password Security**:
     - Standardize on Django's PBKDF2 password hasher (`pbkdf2_sha256$`). Plaintext passwords must never be stored, logged, or returned in serialized outputs.
     - Enforce all 4 standard Django password validators in settings.
     - Disabled/inactive accounts (`is_active=False`) are strictly rejected during authentication and token issuance.
  4. **Domain Service Encapsulation**:
     - Implement `AuthService` inside `apps/accounts/services.py` to handle credential verification, token generation, and password validation cleanly separated from DRF views and serializers.
  5. **Decoupled Frontend**:
     - The React frontend remains in mock mode (`VITE_USE_MOCK_DATA=true`) during Phase 4. Live frontend authentication wiring is strictly deferred to Phase 5.
- **Consequences**:
  - Fully standardized and reproducible JWT authentication conforming to `docs/API_CONTRACT.md`.
  - Zero database bloat or unneeded migrations for token management in Task 4.1.
  - High developer velocity and strict preservation of Phase 3 invariants.

---

## ADR 011: Standardized Login Workflow and Dual Envelope Token Delivery

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: 
  - `docs/API_CONTRACT.md` establishes two conventions:
    1. Section 2 global standard envelopes: `{ "success": true, "data": { ... } }`.
    2. Section 3.1 auth endpoint specifics: `POST /api/v1/auth/login/` returning `{ "access": "...", "refresh": "...", "user": { ... } }`.
  - Standard OAuth/JWT client SDKs (and direct DRF tests) look for `access` and `refresh` directly on the root JSON object, whereas Student ERP frontend adapters expect enveloped responses with `success: true`.
- **Decision**:
  1. **Dual Envelope Structure**: The login response emits a hybrid response payload containing both the root token keys and the standardized envelope:
     ```json
     {
       "access": "<jwt>",
       "refresh": "<jwt>",
       "token_type": "Bearer",
       "user": { "id": "...", "username": "...", "role": "..." },
       "success": true,
       "data": {
         "access": "<jwt>",
         "refresh": "<jwt>",
         "token_type": "Bearer",
         "user": { ... }
       }
     }
     ```
  2. **Serializer Layer Integration**: Implement `ERPTokenObtainPairSerializer` subclassing SimpleJWT's `TokenObtainPairSerializer` to generate safe claims (`user_id`, `role`, `username`), query the custom User model, and package this dual-envelope payload.
  3. **Credential & Inactivity Enforcement**: Authentication strictly uses Django's password verification (`authenticate`). Non-existent usernames and incorrect passwords return identical generic error messages (HTTP 401) to prevent account enumeration. Disabled accounts (`is_active=False`) are unconditionally rejected.
  4. **Preserved Endpoint Identity**: Keep view class names `TokenObtainPairView` and `TokenRefreshView` so route resolution contracts and earlier tests remain 100% stable.
- **Consequences**:
  - Zero ambiguity: both SimpleJWT client libraries and ERP envelope-aware clients operate seamlessly without custom adapters.
  - Full adherence to security requirements: no passwords or hashes serialized, zero enumeration risk.
  - 100% backward compatibility with Task 4.1 foundation tests.

---

## ADR 012: Explicit 5-Role RBAC Architecture, Scope Resolution, and Queryset Scoping

- **Status**: ACCEPTED / AUTHORITATIVE
- **Phase**: Phase 4 (Authentication + RBAC) — Task 4.3
- **Context**: 
  - Educational ERP security demands strict operational segregation across exactly 5 roles: `Admin`, `Principal`, `Faculty`, `Student`, `Parent`.
  - Implicit role hierarchies (e.g. `Admin > Principal > Faculty > Student > Parent`) risk accidental privilege leakage (such as granting Faculty student-deletion rights or allowing Principal to overwrite raw attendance).
  - Object-level authorization alone cannot secure list endpoints or search queries, leading to data leakage across classes or unrelated students if querysets are unconstrained.
  - Stale JWT token claims could lead to privilege escalation if authorization decisions relied on claims rather than live database role state.
- **Decision**:
  1. **Canonical Identifiers & Explicit Matrix**: Standardize all permissions on `<domain>.<action>` format (e.g. `students.view`, `attendance.mark`, `allocation.update_student_section`). Declare explicit permission sets per role in `ROLE_PERMISSIONS_MATRIX` with zero automatic role inheritance.
  2. **Reusable Scope Model**: Define formal scopes:
     - `SCOPE_GLOBAL`: Full institutional scope (`Admin`, `Principal`).
     - `SCOPE_FACULTY_ASSIGNED`: Scoped strictly to academic assignments (sections where faculty is designated Class Teacher, or subjects evaluated/recorded).
     - `SCOPE_SELF`: Scoped to authenticated user's own profile (`Student`).
     - `SCOPE_LINKED_CHILD`: Scoped strictly to verified linked children (`Parent`).
  3. **Task 2.7 Allocation Governance**:
     - Student section and Class Teacher allocation `Update` and `Delete` belong strictly to `Admin` and `Principal`.
     - `Faculty` holds view-only access to assigned allocations and is strictly denied modification controls.
  4. **Queryset Scoping Engine**: Implement `AuthorizationService.filter_queryset_for_user(queryset, user, domain)` ensuring list endpoints and search filters are constrained at the database layer before serialization.
  5. **Live Database Freshness & Zero Stale-Token Escalation**:
     - `AuthorizationService.get_user_role(user)` always evaluates `user.role.name` from the authenticated database user model.
     - Stale JWT token claims and client payload overrides (e.g. `{"role": "Admin"}`) are completely ignored for authorization decisions.
     - User deactivation (`is_active = False`) immediately denies all permissions.
     - Zero Django `is_superuser` shortcut: `Admin` and `Principal` authorities operate purely via ERP roles.
  6. **DRF Permission Classes**: Implement reusable classes in `backend/common/permissions.py`:
     - `HasRequiredPermission(perm)` and `require_permission(perm)`
     - `IsAdminRole`, `IsPrincipalRole`, `IsFacultyRole`, `IsStudentRole`, `IsParentRole`
     - `IsAdminOrPrincipal`, `IsStaffOrExecutive`, `IsOwnerOrScopedAccess`
- **Consequences**:
  - Authoritative, non-bypassable security boundary adhering strictly to `docs/RBAC_PERMISSIONS.md`.
  - Zero schema migrations needed (relies on existing `Role` and `User` foreign keys).
  - Foundation ready for broad endpoint enforcement in Task 4.4 without structural rework.

---

## ADR 013: Endpoint-Level RBAC Enforcement, Queryset Scoping, and Mutation Security

- **Status**: ACCEPTED / AUTHORITATIVE
- **Phase**: Phase 4 (Authentication + RBAC) — Task 4.4
- **Context**:
  - Task 4.3 established the foundational authorization service, permission matrix, and DRF permission classes. However, REST API endpoints were previously guarded only by basic `IsAuthenticated` or open access.
  - Endpoint security requires full enforcement across all 33 endpoints and methods:
    1. Public endpoints (`/api/health/`, `/api/v1/auth/login/`, `/api/v1/auth/refresh/`) must remain accessible without tokens.
    2. All other endpoints must strictly return 401 for unauthenticated/inactive requests and 403 for authenticated requests lacking permission or object ownership.
    3. Querysets must be filtered via `AuthorizationService.filter_queryset_for_user()` before DRF pagination and serialization to prevent horizontal data leakage.
    4. Object detail endpoints must verify object ownership via `IsOwnerOrScopedAccess` preventing URL/ID manipulation.
    5. Mutation endpoints (POST, PATCH) must require domain mutation permissions and reject payload role tampering.
- **Decision**:
  1. **Uniform Permission Mapping**: Standardize views using `permission_classes = [HasRequiredPermission, IsOwnerOrScopedAccess]` with `permission_map = {'GET': ..., 'POST': ..., 'PATCH': ...}` or `require_permission(...)`.
  2. **Queryset Scoping Before Serialization**: Integrate `filter_queryset_for_user()` across all list and directory endpoints (`StudentListView`, `ParentListView`, `FacultyListView`, `AttendanceOverviewView`, `StudentAbsenteesView`, `LeaveApplicationListView`, `MarkListView`).
  3. **Object Ownership Enforcement**: Call `self.check_object_permissions(request, obj)` on all detail retrieve and update actions (`StudentDetailView`, `ParentDetailView`, `ParentChildrenView`, `FacultyDetailView`, `AttendanceDetailView`, `MarkDetailView`, `ReportCardView`).
  4. **Field-Level Mutation Guardrails**: Disallow `Faculty` from mutating administrative fields (`employee_code`, `is_active`, `department`, `designation`, `joining_date`, `user_id`) during self-profile PATCH. Disallow students from applying for leave under other student IDs.
  5. **Academic Assignment Mutation Boundaries**: Bulk attendance (`BulkAttendanceCreateView`) and bulk marks entry (`BulkMarkCreateView`) restrict Faculty strictly to sections where they are assigned Class Teacher or evaluator, raising `PermissionDenied` (403) on cross-section attempts.
  6. **Deterministic Pagination**: Guarantee deterministic sorting with `.order_by('created_at', 'id')` on model querysets before DRF pagination.
- **Consequences**:
  - Consistent and robust defense-in-depth across the entire backend REST API surface.
  - Zero data leakage across students, parents, faculty sections, or administrative domains.
  - All 261 backend tests passing (100% pass rate) with 0 warnings.
  - Full backward compatibility with existing services, serializers, and frontend mock architecture.





