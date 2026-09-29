# Phase 3 Task 3.2: Django App Architecture & Base Domain Scaffolding Specification

> **Phase**: Phase 3 (Backend Foundation + Database)  
> **Task**: Task 3.2 (Django App Architecture & Base Domain Scaffolding — Reconciled)  
> **Status**: COMPLETED (Scope Corrected & Boundary Reconciled)  
> **Authoritative Scope**: Modular domain architecture scaffolding, service layers, serializer-layer scaffolding, thin view dispatchers, and shared utilities across all 11 domain apps. Concrete ERP database models belong strictly to Task 3.3.

---

## 1. Task Objective

Establish the modular monolith application architecture, dedicated service layers, serializer-layer scaffolding, thin view dispatchers, and shared domain utilities across all 11 domain apps without circular dependencies, cleanly preparing the backend for relational schema models & migrations in Task 3.3.

### In Scope
1. **Shared Foundation & Utilities (`backend/common/`)**:
   - `common/constants.py`: Canonical system roles (5 roles), Master Plan Amendment 2 attendance 4-status model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`), prohibited legacy statuses (`LATE`, `EXCUSED`), CBSE / ICSE 8-tier grading scale (`A1`–`E`), senior secondary streams (`Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`), leave statuses, and allocation workflow statuses.
   - `common/utils.py`:
     - CBSE / ICSE 8-tier grade determination (`calculate_grade`).
     - Percentage calculation with 'AB' absent handling (`calculate_percentage`).
     - Master Plan Amendment 2 attendance percentage formula:
       $$\text{Attendance \%} = \frac{\text{PRESENT} + \text{ON\_DUTY}}{\text{PRESENT} + \text{ABSENT} + \text{ON\_DUTY} + \text{LEAVE}} \times 100$$
     - Canonical attendance status validator rejecting legacy statuses.
     - Permanent Student ID validator (`validate_student_id`) and canonical generator (`format_student_id`).
   - `common/exceptions.py`: Custom domain exceptions (`DomainValidationError`, `BusinessLogicError`, `ResourceNotFoundError`, `PermissionDeniedError`, `InvalidAttendanceStatusError`, `ImmutableFieldMutationError`) integrated with the standardized JSON error envelope.
   - `common/responses.py`: REST envelope builders (`success_response`, `error_response`).
   - `common/services.py`: `BaseService` providing atomic transactional wrappers and structured error logging.
   - `common/models.py`: Abstract base classes (`TimeStampedModel`, `UUIDModel`, `BaseModel`).

2. **Domain App Architecture Scaffolding (All 11 Domain Apps)**:
   Every domain app under `backend/apps/` exposes the required architectural module structure (`models.py`, `services.py`, `serializers.py`, `views.py`, `urls.py`) without concrete ERP business tables:
   - `apps/accounts`: `AccountService(BaseService)`, DRF serializers, thin views, `/api/v1/auth/` routes.
   - `apps/students`: `StudentService(BaseService)`, DRF serializers, thin views, `/api/v1/students/` routes.
   - `apps/academics`: `AcademicService(BaseService)`, DRF serializers, thin views, `/api/v1/academics/` routes.
   - `apps/attendance`: `AttendanceService(BaseService)`, DRF serializers, thin views, `/api/v1/attendance/` routes.
   - `apps/marks`: `MarksService(BaseService)`, DRF serializers, thin views, `/api/v1/marks/` routes.
   - `apps/timetable`: `TimetableService(BaseService)`, DRF serializers, thin views, `/api/v1/timetable/` routes.
   - `apps/calendar`: `CalendarService(BaseService)`, DRF serializers, thin views, `/api/v1/calendar/` routes.
   - `apps/allocation`: `AllocationService(BaseService)`, DRF serializers, thin views, `/api/v1/allocation/` routes.
   - `apps/reports`: `ReportService(BaseService)`, DRF serializers, thin views, `/api/v1/reports/` routes.
   - `apps/notifications`: `NotificationService(BaseService)`, DRF serializers, thin views, `/api/v1/notifications/` routes.
   - `apps/audit`: `AuditService(BaseService)`, DRF serializers, thin views, `/api/v1/audit/` routes.

3. **Backend Test Suite Alignment**:
   - `tests/test_common_utils.py`: 14 tests for grading boundaries, percentage, attendance formula, forbidden statuses, Student ID.
   - `tests/test_services_scaffolding.py`: 12 tests verifying all 11 domain service classes and BaseService helpers.
   - `tests/test_common_responses.py`: 4 tests for response envelopes and exception handlers.
   - `tests/test_models_scaffolding.py`: 3 tests for shared abstract base models, 11-app file structure, and boundary assertion verifying 0 premature concrete models.
   - Total backend tests: **45/45 passing** in ~1.0s.

4. **Non-Regression Verification**:
   - `python manage.py check`: Passes with 0 issues.
   - Frontend Vitest suite: **158/158 tests passing**.
   - Frontend production build: **Clean compile** in 10.3s with 0 errors.

### Strictly Out of Scope (Deferred to Task 3.3+)
- Concrete ERP database models (`Student`, `Parent`, `Faculty`, `AcademicYear`, `Class`, `Section`, `Subject`, `Enrollment`, `Attendance`, `Mark`, `ExamType`, `Timetable`, `CalendarEvent`, `Allocation`, `Report`, `Notification`, `AuditLog`).
- PostgreSQL database migrations (`makemigrations`/`migrate` scheduled for Task 3.3).
- Real JWT credential verification / login authentication flow (scheduled for Phase 4).
- Frontend REST API wiring (Phase 2 frontend remains strictly on mock services; live wiring in Phase 5).
- Django Channels WebSocket consumers and Redis realtime layers (Phase 6).
