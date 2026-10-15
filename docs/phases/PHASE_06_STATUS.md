# Phase 6 Execution Status: Timetable + Calendar + Realtime

> **Phase**: Phase 6 — Timetable + Calendar + Realtime
> **Status**: IN PROGRESS (Tasks 6.1, 6.2, 6.4, and 6.5 COMPLETE — Tasks 6.3, 6.6–6.8 NOT STARTED)
> **Prerequisites**: Phase 1 (COMPLETE), Phase 2 (COMPLETE), Phase 3 (COMPLETE), Phase 4 (COMPLETE & SIGNED OFF), MOD_001 (COMPLETED), Phase 5 (COMPLETE — Release Gate: PASS)
> **Authorization**: Roadmap explicitly authorized by project owner — 2026-10-13
> **Last Updated**: 2026-10-15

---

## 1. Phase Status Notice

**Phase 6 is actively in progress. Tasks 6.1, 6.2, 6.4, and 6.5 are COMPLETE. Tasks 6.3 and 6.6 through 6.8 have not started.**

This document is the authoritative execution ledger for Phase 6.

Per authoritative project governance:
- All preceding phases are complete and signed off.
  - **Phase 1**: COMPLETE (Foundation & Governance)
  - **Phase 2**: COMPLETE (Frontend Scaffolding & Deep Role Experiences)
  - **Phase 3**: COMPLETE (Backend Architecture, PostgreSQL Schema & Domain Models)
  - **Phase 4**: COMPLETE & SIGNED OFF (Backend API Foundation, Authentication & Complete RBAC)
  - **MOD_001**: COMPLETED (Approved Project Modification: Faculty/Class Teacher Assignment + Homework Management)
  - **Phase 5**: COMPLETE — Release Gate: PASS (520 backend tests, 283 frontend tests, clean build 6.43s, 0 migration drift, live dual-role PostgreSQL security verified)
- **Phase 6**:
  - **Task 6.1**: COMPLETE (Timetable Domain Models, Migrations, Option B DB Security, and REST APIs; 28/28 tests passing).
  - **Task 6.2**: COMPLETE (Academic Calendar Models, Option B Migration, Role Scoping, and REST APIs; 36/36 tests passing).
  - **Task 6.4**: COMPLETE (Student and Parent Timetable/Calendar Integration; 20/20 new frontend tests passing; 303 total frontend tests passing; clean build).
  - **Task 6.5**: COMPLETE (Faculty Timetable and Attendance Scheduling Integration; 15/15 new frontend tests passing; 318 total frontend tests passing; clean build).
  - **Tasks 6.3, 6.6–6.8**: NOT STARTED.

**Pending decisions required before Task 6.3 may begin**:

| Proposal | Description | Status |
| :--- | :--- | :--- |
| **PROP_006_A** | WebSocket authentication handshake (recommended: short-lived single-use ticket) | **PENDING OWNER APPROVAL** |
| **PROP_006_B** | WebSocket test strategy (recommended: in-memory + real Redis split) | **PENDING OWNER APPROVAL** |

---

## 2. Phase 6 Task Breakdown & Progress Ledger

| Task | Title | Status | Dependencies |
| :--- | :--- | :--- | :--- |
| **Task 6.1** | Timetable Domain Models, Migrations and REST APIs | **COMPLETE** | Phase 5 complete |
| **Task 6.2** | Academic Calendar Models and REST APIs | **COMPLETE** | Phase 5 complete; Task 6.1 Option B pattern |
| **Task 6.3** | Django Channels and WebSocket Authentication | **NOT STARTED** | Tasks 6.1, 6.2; PROP_006_A & PROP_006_B owner approval |
| **Task 6.4** | Student and Parent Timetable/Calendar Integration | **COMPLETE** | Tasks 6.1, 6.2 |
| **Task 6.5** | Faculty Timetable and Attendance Scheduling Integration | **COMPLETE** | Tasks 6.1, 6.2 |
| **Task 6.6** | Admin Timetable Builder and Calendar Management | **NOT STARTED** | Tasks 6.1, 6.2, 6.4, 6.5 |
| **Task 6.7** | Realtime Client Integration | **NOT STARTED** | Tasks 6.3, 6.4, 6.5, 6.6; PROP_006_A owner approval |
| **Task 6.8** | Full System Verification and Release Gate | **NOT STARTED** | Tasks 6.1 through 6.7 |

---

## 3. Task 6.1 — Timetable Domain Models, Migrations and REST APIs

**Status**: COMPLETE

**Objective**: Define the timetable domain in the backend and expose it as a fully tested REST API.

### 3.1 Acceptance Checklist

- [x] Timetable model exists in `apps/timetable/models.py` consistent with `docs/DATABASE_SCHEMA.md`.
- [x] Migration is Option B-compatible (`erp_migrator` ownership, `erp_app` CRUD grants).
- [x] Conflict detection rejects section double-booking (same section + day + period).
- [x] Conflict detection rejects faculty double-booking (same faculty + day + period).
- [x] Admin: Full CRUD on `/api/v1/timetable/` (create, retrieve, update, delete).
- [x] Principal: Read + oversight (retrieve, list).
- [x] Faculty: Read scoped to authorized teaching assignments and sections.
- [x] Student: Read scoped to enrolled section.
- [x] Parent: Read scoped to linked children's sections.
- [x] `409 Conflict` response on double-booking with structured error message.
- [x] Filter parameters `?section_id=`, `?day_of_week=`, `?faculty_id=` functional.
- [x] Pytest suite for Task 6.1: min. 15 new tests in `tests/test_phase6_timetable_task61.py` (28 tests implemented, 100% passing).
- [x] Zero migration drift (`manage.py makemigrations --check`).
- [x] `manage.py check` produces 0 issues.
- [x] No `PeriodDefinition` model introduced without explicit schema amendment approval.

### 3.2 Dependency Information

- **Prerequisite**: Phase 5 COMPLETE; `apps/academics` `Section`, `Subject`, and `Faculty` models available.
- **Enables**: Tasks 6.4, 6.5, 6.6 (frontend integration tasks).

### 3.3 Evidence

- **Implementation date**: 2026-10-13
- **Backend tests added**: 28 passing tests (100% pass rate in `backend/tests/test_phase6_timetable_task61.py`)
- **Test file**: `backend/tests/test_phase6_timetable_task61.py`
- **Migration file(s)**: `backend/apps/timetable/migrations/0001_initial.py` (applied under `erp_migrator`; table owned by `erp_migrator`; CRUD granted to `erp_app`)
- **Option B Security Verification**:
  - Runtime user: `erp_app`
  - Table owner: `erp_migrator`
  - `erp_app` table privileges: `['INSERT', 'SELECT', 'UPDATE', 'DELETE']` (DML only, no DDL)
- **Django check result**: `System check identified no issues (0 silenced).`
- **Migration drift check**: `No changes detected` (`manage.py makemigrations --check` passed)
- **Regression test result**: 549/549 backend tests passing (100% pass rate in 1468.18s, exit code 0) across entire backend test suite executing against `test_student_erp` under least-privileged runtime role `erp_app`
- **Completion report**: Task 6.1 Timetable Domain Models, Migrations and REST APIs is complete. Implemented `TimetableSlot(BaseModel)` mapped to `timetables` table in PostgreSQL with composite unique constraints on `(section, day_of_week, period_number)` and `(faculty, day_of_week, period_number)`, positive period check constraint, and `start_time < end_time` constraint. Option B dual-role database security verified. Implemented `TimetableService` with double-booking conflict detection raising `TimetableConflictError` (HTTP 409 Conflict). Implemented `TimetableListView` and `TimetableDetailView` under `/api/v1/timetable/` with RBAC scoping for all 5 roles (Admin full CRUD, Principal read-only school-wide oversight, Faculty scoped to assigned teaching slots, Student scoped to enrolled section, Parent scoped to linked children sections). Fully verified with 28 automated tests executing under least-privileged runtime role `erp_app`. Full backend regression suite (549/549 tests) passing with zero regressions.

---

## 4. Task 6.2 — Academic Calendar Models and REST APIs

**Status**: COMPLETE

**Objective**: Implement the academic calendar event domain and expose it as a fully tested REST API.

### 4.1 Acceptance Checklist

- [x] `calendar_events` model exists in `apps/calendar/models.py` consistent with `docs/DATABASE_SCHEMA.md` Section 3.5.
- [x] Migration is Option B-compatible (`erp_migrator` table ownership, `erp_app` least-privilege CRUD grants).
- [x] `target_roles` (JSONB) visibility correctly scopes which roles can see each event.
- [x] Admin: Full CRUD on `/api/v1/calendar/events/`.
- [x] Principal: Full CRUD on `/api/v1/calendar/events/` (deletion restricted to Admin).
- [x] Faculty: Read events where `target_roles` includes `Faculty` or public, plus own drafts; draft creation supported.
- [x] Student: Read published events where `target_roles` includes `Student` or public (`is_published=True`).
- [x] Parent: Read published events where `target_roles` includes `Parent` or public (`is_published=True`).
- [x] Date-range filtering (`?start_date=`, `?end_date=`) functional with multi-day interval overlap matching.
- [x] Category filtering (`?category=`) functional with alias normalization and canonical validation.
- [x] Holiday filtering (`?is_holiday=`) functional.
- [x] Holiday events (`is_holiday=True`) and school-sanctioned events (`is_school_sanctioned=True`) do not conflict with or alter `ON_DUTY` attendance semantics.
- [x] Pytest suite for Task 6.2: 36 new tests in `tests/test_phase6_calendar_task62.py` (100% pass rate).
- [x] Zero migration drift (`manage.py makemigrations --check` passed).
- [x] `manage.py check` produces 0 issues.

### 4.2 Dependency Information

- **Prerequisite**: Phase 5 COMPLETE; Task 6.1 Option B migration pattern established.
- **Enables**: Tasks 6.4, 6.5, 6.6 (frontend integration tasks).

### 4.3 Evidence

- **Implementation date**: 2026-10-14
- **Backend tests added**: 36 passing tests (100% pass rate in `backend/tests/test_phase6_calendar_task62.py`)
- **Test file**: `backend/tests/test_phase6_calendar_task62.py`
- **Migration file(s)**: `backend/apps/calendar/migrations/0001_initial.py` (applied under `erp_migrator`; table owned by `erp_migrator`; CRUD granted to `erp_app`)
- **Option B Security Verification**:
  - Target table: `calendar_events`
  - Table owner: `erp_migrator`
  - Runtime user: `erp_app`
  - `erp_app` table privileges: `['INSERT', 'SELECT', 'UPDATE', 'DELETE']` (DML only, zero DDL privileges)
  - Runtime DDL denial: Verified `ALTER TABLE calendar_events` blocked for `erp_app` with `InsufficientPrivilege`
  - Live test identity: Verified `('erp_app', 'erp_app', 'test_student_erp')`
- **Django check result**: `System check identified no issues (0 silenced).`
- **Migration drift check**: `No changes detected` (`manage.py makemigrations --check` passed)
- **Regression test result**: 105 regression tests passing (`test_phase6_timetable_task61.py`, `test_models_scaffolding.py`, `test_models_task33.py`, `test_task35_hardening_and_seed.py`, `test_services_scaffolding.py`) and 33 RBAC tests passing (`test_endpoint_rbac_task44.py`) with zero regressions
- **Completion report**: Task 6.2 Academic Calendar Models, Role Scoping, Migrations and REST APIs is complete. Implemented `CalendarEvent(BaseModel)` mapped to `calendar_events` in PostgreSQL adhering strictly to Section 3.5 of `docs/DATABASE_SCHEMA.md` with check constraint `start_date <= end_date` and indexes on `(start_date, end_date)`, `(category)`, `(is_holiday)`, and `(is_published)`. Option B dual-role database security verified on live PostgreSQL and isolated test database. Implemented `CalendarService` with multi-day interval overlap date filtering, category normalization, role-targeted scoping, publishing controls, and transactional mutations. Built DRF serializers and views (`CalendarEventListView`, `CalendarEventDetailView`) under `/api/v1/calendar/events/` supporting 5-role scoping and structured error responses. Verified attendance isolation (school-sanctioned events do not alter attendance records or auto-grant ON_DUTY). Fully verified with 36 automated pytest tests executing under runtime role `erp_app`. Zero schema drift.

---

## 5. Task 6.3 — Django Channels and WebSocket Authentication

**Status**: NOT STARTED

> **BLOCKER**: PROP_006_A (WebSocket authentication handshake) and PROP_006_B (test strategy) require explicit owner approval before implementation may begin.

**Objective**: Establish the approved ASGI/WebSocket infrastructure, authenticated consumer routing, and automated test infrastructure.

### 5.1 Acceptance Checklist

- [ ] Owner has explicitly approved PROP_006_A (WebSocket authentication handshake).
- [ ] Owner has explicitly approved PROP_006_B (WebSocket test strategy).
- [ ] `backend/config/asgi.py` routes WebSocket connections (`/ws/`) to `channels.routing.URLRouter`.
- [ ] `CHANNEL_LAYERS` production configuration uses `channels_redis.core.RedisChannelLayer`.
- [ ] In-memory test Channel Layer configuration documented separately from production config.
- [ ] Unauthenticated WebSocket connections are refused (closed with code 4001).
- [ ] Authenticated consumers resolve the user's role and join appropriate channel groups.
- [ ] WebSocket consumers implemented for timetable and calendar update channels.
- [ ] Connection lifecycle handlers implemented: `connect()`, `disconnect()`, `receive()`.
- [ ] Consumer routing implemented in `config/routing.py`.
- [ ] In-memory automated tests: min. 8 new tests in `tests/test_phase6_websocket_task63.py`.
- [ ] Real Redis integration tests documented with `pytest -m redis_integration` marker.
- [ ] In-memory vs. Redis configurations are documented and separated.

### 5.2 Dependency Information

- **Prerequisite**: Tasks 6.1 and 6.2 complete (domain apps exist). Owner approval of PROP_006_A and PROP_006_B.
- **Enables**: Task 6.7 (realtime client integration).

### 5.3 Pending Proposals

| Proposal | Decision Required | Status |
| :--- | :--- | :--- |
| **PROP_006_A** | Confirm ticket handshake approach or select alternative before Task 6.3 implementation | **PENDING OWNER APPROVAL** |
| **PROP_006_B** | Approve in-memory + real Redis split test strategy or specify alternative | **PENDING OWNER APPROVAL** |

### 5.4 Evidence (Empty — Awaiting Implementation)

- **PROP_006_A approval date**: —
- **PROP_006_B approval date**: —
- **Implementation date**: —
- **Backend tests added**: —
- **Test file**: `backend/tests/test_phase6_websocket_task63.py`
- **ASGI configuration file**: `backend/config/asgi.py`
- **Consumer routing file**: `backend/config/routing.py`
- **Completion report**: —

---

## 6. Task 6.4 — Student and Parent Timetable/Calendar Integration

**Status**: COMPLETE

**Objective**: Replace mock timetable and calendar data in the Student and Parent frontend modules with typed API-service integration.

### 6.1 Acceptance Checklist

- [x] `frontend/src/services/timetableApiService.ts` implemented using shared `ApiClient`.
- [x] `frontend/src/services/calendarApiService.ts` implemented using shared `ApiClient`.
- [x] `StudentService.getTimetable()` connected to live `/api/v1/timetable/` (enrolled section scoped).
- [x] `StudentService.getCalendarEvents()` connected to live `/api/v1/calendar/events/` (`Student` target_roles).
- [x] `ParentService.getChildTimetable()` connected to live `/api/v1/timetable/` (linked children's sections).
- [x] `ParentService.getCalendarEvents()` connected to live `/api/v1/calendar/events/` (`Parent` target_roles).
- [x] Student timetable page displays live data from DRF (enrolled section only).
- [x] Parent timetable page displays live data for linked children's sections.
- [x] Student calendar page displays live events scoped to `Student` target_roles.
- [x] Parent calendar page displays live events scoped to `Parent` target_roles.
- [x] Zero raw JSON imports or mock data inline in Student/Parent UI pages after migration.
- [x] Graceful offline/test fallback preserved in `StudentService` and `ParentService`.
- [x] Vitest tests added: min. 8 new frontend tests in `tests/timetable_calendar_student_parent.test.ts` (20 new tests implemented, 100% passing).
- [x] No regression in existing Student suite (`student.test.ts`, `student_api_integration.test.ts`).
- [x] No regression in existing Parent suite (`parent.test.ts`, `parent_api_integration.test.ts`).

### 6.2 Dependency Information

- **Prerequisite**: Tasks 6.1 and 6.2 complete (REST APIs available).
- **Enables**: Task 6.7 (frontend pages exist for realtime integration).

### 6.3 Evidence

- **Implementation date**: 2026-10-15
- **Frontend tests added**: 20 passing tests (100% pass rate in `frontend/tests/timetable_calendar_student_parent.test.ts`)
- **Test file**: `frontend/tests/timetable_calendar_student_parent.test.ts`
- **Services created / updated**:
  - `frontend/src/services/timetableApiService.ts` (TimetableApiService with formatters and weekly grid/parent day transformers)
  - `frontend/src/services/calendarApiService.ts` (CalendarApiService with date/time interval formatters and role presentation mappers)
  - `frontend/src/features/students/services/studentApiService.ts` (DRF `/api/v1/timetable/` and `/api/v1/calendar/events/` bindings)
  - `frontend/src/features/students/services/studentService.ts` (Live DRF query integration with fallback)
  - `frontend/src/features/parents/services/parentApiService.ts` (DRF child timetable and calendar bindings)
  - `frontend/src/features/parents/services/parentService.ts` (Live DRF query integration with fallback)
  - `frontend/src/services/index.ts` (Barrel re-exports)
- **Frontend test suite**: 303 passing tests (283 baseline + 20 new tests), 0 failures.
- **Frontend build**: Clean build with `tsc -b && vite build` in 7.35s (and `tsc && vite build` in 17.49s).
- **Completion report**: Task 6.4 Student and Parent Timetable/Calendar Integration is complete. Connected `StudentService` and `ParentService` to Django REST Framework `/api/v1/timetable/` and `/api/v1/calendar/events/` endpoints via dedicated, typed API services (`TimetableApiService`, `CalendarApiService`). Implemented period formatting, laboratory/activity classification, multi-day interval formatting, and category detection (PTM, Exam, Holiday). Maintained graceful fallback for resilience. Verified with 20 new Vitest tests and confirmed zero regressions across the entire 303-test frontend suite and clean production build.

---

## 7. Task 6.5 — Faculty Timetable and Attendance Scheduling Integration

**Status**: COMPLETE

**Objective**: Integrate live faculty timetables and calendar information, validate teaching-period conflicts, and connect scheduled periods to existing attendance workflows without breaking Phase 5 attendance semantics.

### 7.1 Acceptance Checklist

- [x] `FacultyService.getTimetable()` connected to live `/api/v1/timetable/` (scoped to authorized teaching assignments).
- [x] `FacultyService.getCalendarEvents()` connected to live `/api/v1/calendar/events/` (`Faculty` target_roles).
- [x] Timetable displayed to Faculty is consistent with active `TeachingAssignment` records.
- [x] Faculty timetable does NOT display periods for sections/subjects not in their `TeachingAssignment`.
- [x] Timetable periods connect to the existing `POST /api/v1/attendance/bulk/` roll-call workflow.
- [x] Phase 5 attendance semantics preserved (4-status model, canonical formula unchanged).
- [x] Mock timetable and calendar data removed from Faculty pages/components.
- [x] No regression in Faculty module tests from Phase 5 (`faculty.test.ts`, `faculty_api_integration.test.ts`).
- [x] Vitest tests added: min. 6 new frontend tests (15 new tests implemented in `tests/timetable_calendar_faculty.test.ts`, 100% passing).

### 7.2 Dependency Information

- **Prerequisite**: Tasks 6.1 and 6.2 complete (REST APIs available). Phase 5 Faculty attendance integration preserved.
- **Enables**: Task 6.7 (frontend pages exist for realtime integration).

### 7.3 Evidence

- **Implementation date**: 2026-10-15
- **Frontend tests added**: 15 passing tests (100% pass rate in `frontend/tests/timetable_calendar_faculty.test.ts`)
- **Test file**: `frontend/tests/timetable_calendar_faculty.test.ts`
- **Attendance semantics regression check**: VERIFIED. Canonical formula `(PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100` and 4-status model preserved with 100% test pass rate across `attendance.test.ts`, `attendance_api_integration.test.ts`, and `faculty_api_integration.test.ts`.
- **Services created / updated**:
  - `frontend/src/services/timetableApiService.ts` (added `transformSlotsToFacultyTimetable` and `transformSlotsToFacultyTodaySchedule`)
  - `frontend/src/services/calendarApiService.ts` (added `FacultyCalendarEventItem` interface and `transformEventToFacultyItem`)
  - `frontend/src/features/faculty/services/facultyApiService.ts` (added `getTimetable` and `getCalendarEvents`)
  - `frontend/src/features/faculty/services/facultyService.ts` (live `getFacultyTimetable()`, `getTimetable()`, `getTodaySchedule()`, `getCalendarEvents()`, `validateTimetableConsistency()`, `filterTimetableByAssignments()`)
  - `frontend/src/features/faculty/hooks/useFacultyCalendar.ts` (created dedicated faculty calendar hook)
  - `frontend/src/features/faculty/hooks/index.ts` (exported `useFacultyCalendar`)
  - `frontend/src/pages/faculty/FacultyAttendancePage.tsx` (connected timetable period navigation state pre-selection)
  - `frontend/src/pages/faculty/FacultyDashboardPage.tsx` (wired timetable period CTA to attendance roll call)
- **Frontend test suite**: 318 passing tests (283 baseline + 35 new Phase 6 tests), 0 failures.
- **Frontend build**: Clean build with `tsc -b && vite build` in 7.04s (and `tsc && vite build` in 17.30s).
- **Completion report**: Task 6.5 Faculty Timetable and Attendance Scheduling Integration is complete. Connected faculty weekly timetable and daily schedule routines to live Django REST Framework `/api/v1/timetable/` with robust offline/test fallback. Connected institutional academic calendar events to `/api/v1/calendar/events/` scoped to `Faculty` `target_roles`. Implemented `TeachingAssignment` consistency verification and filtering. Connected today's schedule period directly to `FacultyAttendancePage` session roll call pre-selection while strictly preserving Phase 5 canonical 4-status attendance semantics. Fully verified with 15 new automated Vitest tests, 0 regressions across the entire 318-test frontend suite, and clean production build.

---

## 8. Task 6.6 — Admin Timetable Builder and Calendar Management

**Status**: NOT STARTED

**Objective**: Implement the Admin master timetable builder and calendar event-management experience, with appropriate Principal oversight.

### 8.1 Acceptance Checklist

**Timetable Builder**:
- [ ] Admin can create, assign, edit, validate, and publish timetables for every class and section.
- [ ] Assignment workflow captures: academic year, class, section, day of week, period number, subject, faculty, start time, end time, and optional room number.
- [ ] Faculty and section conflict detection: validate against double-booking (faculty conflict: faculty assigned to multiple sections at same day/period; section conflict: section assigned to multiple subjects/periods simultaneously); backend `409 Conflict` responses are surfaced to Admin in the UI.
- [ ] Backend persistence and authorization: timetable changes persist through the real Django/PostgreSQL backend (no client-side-only state) and enforce backend RBAC (`403 Forbidden` for unauthorized mutation calls; frontend control hiding is strictly insufficient).
- [ ] Correct Student, Parent and Faculty timetable visibility: published timetables are correctly scoped and visible across Student, Parent, and Faculty views.
- [ ] Principal timetable overview is read-only (no create, edit, or delete controls visible or accessible).

**Calendar Management**:
- [ ] Admin calendar management UI allows creating academic events and holidays.
- [ ] Admin can edit and delete calendar events through the UI.
- [ ] Event creation captures: title, category, description, start date, end date, target roles, location, is_holiday flag.
- [ ] Published events are visible to roles in `target_roles`.
- [ ] Holiday events remain compatible with the existing `ON_DUTY` attendance policy.
- [ ] Principal calendar overview allows read-only inspection and is able to publish/update events per RBAC.
- [ ] Backend RBAC enforced for all mutation endpoints (`403 Forbidden` for unauthorized roles).

**Testing**:
- [ ] Vitest tests added: min. 12 new frontend tests in `tests/admin_timetable_calendar.test.ts`.
- [ ] No regression in Admin module tests from Phase 5 (`admin.test.ts`, `admin_allocation_api_integration.test.ts`).

### 8.2 Dependency Information

- **Prerequisite**: Tasks 6.1, 6.2, 6.4, and 6.5 complete.
- **Enables**: Task 6.8 (admin timetable builder acceptance verified at system gate).

### 8.3 Evidence (Empty — Awaiting Implementation)

- **Implementation date**: —
- **Frontend tests added**: —
- **Test file**: `frontend/tests/admin_timetable_calendar.test.ts`
- **Conflict detection browser QA evidence**: —
- **Completion report**: —

---

## 9. Task 6.7 — Realtime Client Integration

**Status**: NOT STARTED

> **BLOCKER**: Owner approval of PROP_006_A (WebSocket authentication handshake) required before implementation.

**Objective**: Implement the typed frontend WebSocket integration, connection lifecycle, reconnection behaviour, authorization handling, and live timetable/calendar updates.

### 9.1 Acceptance Checklist

- [ ] Owner has explicitly approved PROP_006_A (WebSocket authentication handshake).
- [ ] `useWebSocket` custom hook or equivalent service implemented.
- [ ] WebSocket URL construction from `VITE_WS_BASE_URL`.
- [ ] Connection lifecycle (`open`, `close`, `error`) handled.
- [ ] Reconnection with exponential back-off (max 5 retries) implemented.
- [ ] Authorization handshake using approved mechanism from Task 6.3.
- [ ] Typed TypeScript event schema defined for all WebSocket message payloads.
- [ ] Hook integrated into timetable pages for all 5 roles.
- [ ] Hook integrated into calendar pages for all 5 roles.
- [ ] Realtime timetable updates (room changes, period swaps) received and reflected in UI without page refresh.
- [ ] Realtime calendar event announcements received and reflected in UI without page refresh.
- [ ] Connection state indicators displayed (connecting / connected / disconnected) without blocking UI render.
- [ ] Unauthenticated connections refused; UI handles rejection gracefully.
- [ ] WebSocket connection does NOT block initial page render (progressive enhancement).
- [ ] Generic notifications NOT implemented in this task.
- [ ] Vitest tests added: min. 6 new tests in `tests/websocket_integration.test.ts` (mock WebSocket).
- [ ] No regression in existing test suites.

### 9.2 Dependency Information

- **Prerequisite**: Task 6.3 complete (server-side consumer infrastructure). Tasks 6.4, 6.5, 6.6 complete (frontend pages exist). Owner approval of PROP_006_A.
- **Enables**: Task 6.8 (realtime integration verified at system gate).

### 9.3 Evidence (Empty — Awaiting Implementation)

- **PROP_006_A approval date**: —
- **Implementation date**: —
- **Frontend tests added**: —
- **Test file**: `frontend/tests/websocket_integration.test.ts`
- **Completion report**: —

---

## 10. Task 6.8 — Full System Verification and Release Gate

**Status**: NOT STARTED

**Objective**: Verify the entire Phase 6 implementation through comprehensive testing and issue a release verdict supported by recorded evidence.

### 10.1 Acceptance Checklist

**Automated Suites**:
- [ ] Backend pytest regression suite: all tests pass (>= 520 + Phase 6 additions).
- [ ] Frontend Vitest regression suite: all tests pass (>= 283 + Phase 6 additions).
- [ ] Frontend production build: clean (`tsc && vite build`, 0 TypeScript errors).
- [ ] `manage.py check`: 0 issues.
- [ ] `manage.py makemigrations --check`: 0 migration drift.
- [ ] `manage.py showmigrations`: 100% applied.

**Database Security**:
- [ ] Option B dual-role PostgreSQL security verified for Phase 6 tables.
- [ ] Phase 6 tables owned by `erp_migrator`.
- [ ] `erp_app` has CRUD grants; no DDL rights.
- [ ] Existing audit trail immutability (`trg_audit_logs_immutable`) preserved.

**Functional Verification**:
- [ ] Timetable conflict detection verified end-to-end (section double-booking rejected; faculty double-booking rejected).
- [ ] 5-role browser QA completed (Student, Parent, Faculty, Admin, Principal) with recorded evidence.
- [ ] Realtime WebSocket integration verified end-to-end (connect → authenticate → receive update → disconnect).
- [ ] Admin timetable builder CRUD verified against live API.
- [ ] Admin calendar event management CRUD verified against live API.
- [ ] All mock timetable and calendar data replaced with live API responses (zero mock/live mixing).

**Documentation**:
- [ ] `docs/phases/PHASE_06_STATUS.md` updated with all task completion evidence.
- [ ] `docs/PROJECT_STATUS.md` updated.
- [ ] `docs/CHANGELOG.md` updated.
- [ ] `docs/API_CONTRACT.md` updated with Phase 6 implemented endpoints.
- [ ] `docs/DECISIONS.md` updated with approved ADRs for Phase 6.

**Release Gate Decision**: — (PASS / FAIL — to be determined after verification)

### 10.2 Dependency Information

- **Prerequisite**: Tasks 6.1 through 6.7 all complete.
- **Outcome**: Phase 6 officially released; Phase 7 may begin upon explicit authorization.

### 10.3 Quality Gate Summary (Empty — Awaiting Implementation)

| Quality Gate | Requirement | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| Backend Test Suite | Full pytest regression pass | — | — |
| Frontend Test Suite | Full Vitest regression pass | — | — |
| Frontend Production Build | TypeScript compilation & Vite bundle | — | — |
| Django System Check | `manage.py check` | — | — |
| Migration Consistency | `manage.py makemigrations --check` | — | — |
| Applied Migrations | `manage.py showmigrations` | — | — |
| Option B DB Security | Phase 6 tables under erp_migrator | — | — |
| Audit Trail Immutability | Trigger active, erp_app restrictions preserved | — | — |
| Timetable Conflict Detection | Section & faculty double-booking rejected | — | — |
| RBAC Route & API Enforcement | 5-role isolation & anonymous rejection | — | — |
| 5-Role Browser Verification | Live interactive browser QA | — | — |
| Realtime Integration | WebSocket end-to-end verified | — | — |
| Mock Data Elimination | Zero mock/live mixing in timetable/calendar | — | — |
| Documentation Update | All docs updated | — | — |

### 10.4 Browser QA Evidence (Empty — Awaiting Implementation)

| Role | Credentials | Verified Behaviour | Evidence |
| :--- | :--- | :--- | :--- |
| **Student** | — | Live timetable (enrolled section), live calendar events | — |
| **Parent** | — | Live child timetable, live calendar events | — |
| **Faculty** | — | Scoped timetable, attendance roll-call linkage, live calendar | — |
| **Admin** | — | Master timetable builder CRUD, conflict detection UI, calendar event management | — |
| **Principal** | — | Read-only timetable and calendar overview | — |
| **Realtime** | — | Live push update received by connected client | — |

### 10.5 Release Gate Decision (Empty — Awaiting Implementation)

**VERDICT**: — (Pending implementation and verification)

---

## 11. Outstanding Decisions

| Decision | Description | Required Before | Status |
| :--- | :--- | :--- | :--- |
| **PROP_006_A** | WebSocket authentication handshake approach (recommended: short-lived single-use ticket via `POST /api/v1/ws/ticket/`; alternative: JWT-in-query-parameter) | Task 6.3 begins | **PENDING OWNER APPROVAL** |
| **PROP_006_B** | WebSocket test strategy (recommended: in-memory `WebsocketCommunicator` for standard CI + real Redis integration tests under `pytest -m redis_integration` marker) | Task 6.3 begins | **PENDING OWNER APPROVAL** |
