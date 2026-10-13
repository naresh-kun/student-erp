# Phase 6 Kickoff Specification: Timetable + Calendar + Realtime

> **Phase**: Phase 6 — Timetable + Calendar + Realtime
> **Status**: ROADMAP ESTABLISHED — AWAITING IMPLEMENTATION AUTHORIZATION PER TASK
> **Prerequisites**: Phase 1 (COMPLETE), Phase 2 (COMPLETE), Phase 3 (COMPLETE), Phase 4 (COMPLETE & SIGNED OFF), MOD_001 (COMPLETED), Phase 5 (COMPLETE — Release Gate: PASS)
> **Authorization**: Roadmap explicitly authorized by project owner — 2026-10-13
> **Last Updated**: 2026-10-13

---

## 1. Phase Objective

Phase 6 replaces mock timetable and calendar data throughout the Student ERP with a fully operational, database-backed implementation and delivers authenticated realtime push updates over WebSockets.

Upon completion, all five institutional roles — **Student**, **Parent**, **Faculty**, **Admin**, and **Principal** — will interact with live timetable schedules and academic calendar events persisted in PostgreSQL, mutated only through the authoritative Django REST API, and delivered in realtime via Django Channels over Redis.

Phase 6 does **not** include generic notification infrastructure, Phase 7 allocation analytics, AI features, or any component outside the explicitly scoped eight tasks below.

---

## 2. Scope Boundaries

### 2.1 In Scope

- Timetable domain models, migrations, REST APIs, and conflict validation (Task 6.1)
- Academic calendar event models, REST APIs, publishing, and role-visibility (Task 6.2)
- Django Channels / ASGI WebSocket infrastructure and authenticated consumers (Task 6.3)
- Student and Parent timetable/calendar frontend integration (Task 6.4)
- Faculty timetable and attendance scheduling integration (Task 6.5)
- Admin master timetable builder and calendar management (Task 6.6)
- Realtime frontend WebSocket client integration for timetable/calendar updates (Task 6.7)
- Full Phase 6 system verification and release gate (Task 6.8)

### 2.2 Explicitly Out of Scope for Phase 6

- Generic in-app notification system (Phase 7)
- Phase 7 allocation analytics, AI, or advanced reporting features
- Production VPS deployment or CI/CD pipeline (separate operational concern)
- Any changes to Phase 5 attendance semantics, CBSE grading, or audit immutability

---

## 3. Architectural Invariants (Non-Negotiable)

All Phase 6 implementation must strictly preserve:

1. **Technology Stack**: React + TypeScript + Vite (frontend); Django + DRF (backend); PostgreSQL (persistence); Django Channels + Redis (realtime).
2. **Five Roles**: `Student`, `Parent`, `Faculty`, `Admin`, `Principal` — no additions, no merges.
3. **Phase 5 Behavior Preservation**: Attendance 4-status model, CBSE 8-tier grading, existing audit immutability, and PostgreSQL Option B dual-role ownership/security are preserved without modification.
4. **No Mock/Live Mixing**: Do not mix mock data with production API services or claim mocked functionality is live.
5. **Baseline Schema**: Use `docs/DATABASE_SCHEMA.md` as the authoritative baseline. Do not add a separate `PeriodDefinition` model or silently change schema design. Reconcile any naming differences between implementation proposals and the schema in documentation before coding.
6. **Student Section Separation**: Maintain the separation between student section allocation (handled in Phase 5 / `apps/allocation`) and timetable scheduling (handled in `apps/timetable`).
7. **Non-Evaluative Faculty Policy**: Faculty data remains strictly descriptive. Zero performance ratings, rankings, or appraisals.
8. **Backend Authorization is the Security Boundary**: Frontend hiding of controls is NOT sufficient. Every mutation endpoint must enforce backend RBAC.

---

## 4. Pending Proposals (Require Explicit Owner Approval Before Implementation)

The following design proposals are documented as **PENDING APPROVAL** and must NOT be implemented until the project owner explicitly approves them:

### PROP_006_A — WebSocket Authentication Handshake (Status: PENDING APPROVAL)

**Proposed approach**: Short-lived, single-use WebSocket ticket handshake.

- The frontend requests a short-lived opaque ticket (`POST /api/v1/ws/ticket/`) using its existing JWT Bearer token.
- The ticket (e.g. a UUID stored in Redis with a 30-second TTL) is passed as a query parameter when opening the WebSocket (`/ws/timetable/?ticket=<uuid>`).
- The Django Channels consumer validates the ticket, resolves the user identity, and immediately invalidates the ticket.
- This avoids sending JWT tokens over WebSocket query parameters in plaintext logs.

**Alternative**: Direct JWT-in-query-parameter approach (simpler, less secure).

**Decision required from owner**: Confirm the recommended ticket handshake approach or select an alternative before Task 6.3 begins.

### PROP_006_B — WebSocket Test Strategy (Status: PENDING APPROVAL)

**Proposed split test strategy**:

1. **In-memory automated tests** (fast, no infrastructure): Use Django Channels `WebsocketCommunicator` with `InMemoryChannelLayer` in pytest. Cover consumer authentication, message routing, and connection lifecycle without Redis.
2. **Real Redis integration tests** (slower, requires running Redis): A separate pytest marker (`pytest -m redis_integration`) targeting a local Redis instance, validating actual pub/sub fanout and channel group behaviour.

**Redis configuration note**: In-memory Channel Layer configuration for automated tests must be documented separately from Docker/production Redis configuration. They must not share a single settings block.

**Decision required from owner**: Approve the split test approach or specify an alternative before Task 6.3 begins.

---

## 5. Task Specifications

### Task 6.1 — Timetable Domain Models, Migrations and REST APIs

**Objective**: Define the timetable domain in the backend and expose it as a fully tested REST API.

**Scope**:

- Implement/reconcile concrete Django models in `apps/timetable/` using the authoritative schema in `docs/DATABASE_SCHEMA.md` (section 3.4 `timetables` table). The existing `timetables` schema columns are: `id`, `section_id`, `subject_id`, `faculty_id`, `day_of_week`, `period_number`, `start_time`, `end_time`, `room_number`, with unique constraints on `(section_id, day_of_week, period_number)` and `(faculty_id, day_of_week, period_number)`.
- Implement Option B-compatible Django migration(s): tables owned by `erp_migrator`, runtime CRUD granted to `erp_app`, with `ALTER DEFAULT PRIVILEGES` applied consistently.
- Implement `TimetableService` in `apps/timetable/services.py` with conflict detection (section double-booking and faculty double-booking).
- Implement serializers: `TimetableListSerializer`, `TimetableDetailSerializer`, `TimetableWriteSerializer`.
- Implement REST endpoints under `/api/v1/timetable/`:
  - `GET /api/v1/timetable/` — list (role-scoped)
  - `POST /api/v1/timetable/` — create (Admin/Principal)
  - `GET /api/v1/timetable/{id}/` — retrieve
  - `PATCH /api/v1/timetable/{id}/` — update (Admin/Principal)
  - `DELETE /api/v1/timetable/{id}/` — delete (Admin only)
  - Filter parameters: `?section_id=`, `?day_of_week=`, `?faculty_id=`
- Conflict validation: Reject assignments that create a double-booking for a section or faculty on the same day/period with a structured `409 Conflict` response.
- RBAC enforcement per `docs/RBAC_PERMISSIONS.md`: Admin (Full CRUD), Principal (Read + oversight), Faculty (Read — assigned section/subject scope), Student (Read — enrolled section), Parent (Read — linked children's sections).
- Replace the existing scaffolding `TimetableListView` with a fully functional implementation.

**Schema note**: The `timetables` table does **not** include a separate `PeriodDefinition` model. `period_number`, `start_time`, and `end_time` are columns on the timetable entry itself. Do not introduce a `PeriodDefinition` model without explicit schema amendment approval.

**Acceptance criteria**:

- [ ] Timetable model exists in `apps/timetable/models.py` consistent with `docs/DATABASE_SCHEMA.md`.
- [ ] Migration is Option B-compatible (`erp_migrator` ownership, `erp_app` CRUD grants).
- [ ] Conflict detection rejects section double-booking and faculty double-booking.
- [ ] All 5 roles can read their scoped timetable via REST.
- [ ] Admin and Principal can create, update, and delete timetable entries via REST.
- [ ] Pytest suite for Task 6.1 passes (min. 15 new tests covering models, conflict detection, RBAC, and serializers).
- [ ] Zero migration drift (`makemigrations --check`).
- [ ] `manage.py check` produces 0 issues.

**Dependencies**: Phase 5 complete, `apps/academics` Section and Subject models available.

---

### Task 6.2 — Academic Calendar Models and REST APIs

**Objective**: Implement the academic calendar event domain and expose it as a fully tested REST API.

**Scope**:

- Implement/reconcile concrete Django models in `apps/calendar/` using the authoritative schema in `docs/DATABASE_SCHEMA.md` (section 3.5 `calendar_events` table). The existing columns are: `id`, `title`, `category`, `description`, `start_date`, `end_date`, `target_roles` (JSONB), `location`, `is_holiday`.
- Implement Option B-compatible Django migration(s).
- Implement `CalendarService` in `apps/calendar/services.py` with date-range filtering, holiday flagging, category filtering, and target-role visibility logic.
- Implement REST endpoints under `/api/v1/calendar/events/`:
  - `GET /api/v1/calendar/events/` — list (role-scoped by `target_roles`)
  - `POST /api/v1/calendar/events/` — create (Admin/Principal)
  - `GET /api/v1/calendar/events/{id}/` — retrieve
  - `PATCH /api/v1/calendar/events/{id}/` — update (Admin/Principal)
  - `DELETE /api/v1/calendar/events/{id}/` — delete (Admin only)
  - Query parameters: `start_date`, `end_date`, `category`, `is_holiday`, `target_role`
- Publishing workflow: Events are visible only to roles listed in `target_roles`. An event targeting `['Student', 'Parent']` is invisible to `Faculty`.
- Holiday events (`is_holiday=True`) must remain compatible with the existing `ON_DUTY` attendance policy.
- Replace the existing scaffolding `CalendarEventListView` with a fully functional implementation.

**Acceptance criteria**:

- [ ] `calendar_events` model exists consistent with `docs/DATABASE_SCHEMA.md`.
- [ ] Migration is Option B-compatible.
- [ ] `target_roles` visibility correctly scopes which roles can see each event.
- [ ] Date-range and category filtering work correctly.
- [ ] Admin and Principal can create, update, and delete events via REST.
- [ ] Holiday events do not conflict with `ON_DUTY` attendance semantics.
- [ ] Pytest suite for Task 6.2 passes (min. 12 new tests).
- [ ] Zero migration drift; `manage.py check` produces 0 issues.

**Dependencies**: Task 6.1 (Option B migration pattern established).

---

### Task 6.3 — Django Channels and WebSocket Authentication

**Objective**: Establish the approved ASGI/WebSocket infrastructure, authenticated consumer routing, and automated test infrastructure.

> **BLOCKER**: The WebSocket authentication handshake (PROP_006_A) and test strategy (PROP_006_B) are **pending explicit owner approval**. Finalize the authentication contract with the owner before writing any consumer code.

**Scope (after approval of proposals)**:

- Configure `backend/config/asgi.py` to route WebSocket connections (`/ws/`) through `channels.routing.URLRouter` alongside standard HTTP.
- Configure `CHANNEL_LAYERS` in `backend/config/settings.py`:
  - Production/Docker: `channels_redis.core.RedisChannelLayer` using `REDIS_URL`.
  - Automated test environment: `channels.layers.InMemoryChannelLayer` (must be documented separately from production config).
- Implement WebSocket consumers in `apps/timetable/consumers.py` and/or `apps/calendar/consumers.py` for timetable and calendar update channels.
- Implement the approved authentication handshake (PROP_006_A pending approval). If ticket approach approved: `POST /api/v1/ws/ticket/` endpoint; Redis-backed ticket validation in consumer `connect()`. Consumer resolves user identity, enforces role-based channel group membership, and closes unauthenticated connections.
- Implement connection lifecycle: `connect()`, `disconnect()`, and `receive()` handlers.
- Implement consumer routing (`ProtocolTypeRouter`, `URLRouter`) in `config/routing.py`.
- Test infrastructure: in-memory pytest tests using `WebsocketCommunicator` with `InMemoryChannelLayer`; real Redis integration tests with pytest marker `redis_integration`.

**Redis configuration note**: Document in-memory test Channel Layer configuration separately from Docker/production `CHANNEL_LAYERS`. Never let test configuration silently override production configuration.

**Acceptance criteria**:

- [ ] ASGI entry point routes WebSockets to Channels consumers.
- [ ] Unauthenticated WebSocket connections are refused (closed with code 4001).
- [ ] Authenticated consumers resolve the user's role and join appropriate channel groups.
- [ ] In-memory automated tests cover authentication, connection lifecycle, and message routing (min. 8 new tests).
- [ ] Real Redis integration tests documented with `redis_integration` marker.
- [ ] In-memory vs. Redis configurations are documented and separated.
- [ ] WebSocket authentication contract is approved before implementation begins.

**Dependencies**: Tasks 6.1 and 6.2 (domain apps exist for consumer routing). Owner approval of PROP_006_A and PROP_006_B.

---

### Task 6.4 — Student and Parent Timetable/Calendar Integration

**Objective**: Replace mock timetable and calendar data in the Student and Parent frontend modules with typed API-service integration.

**Scope**:

- Implement `TimetableApiService` in `frontend/src/services/timetableApiService.ts` using the shared `ApiClient`.
- Implement `CalendarApiService` in `frontend/src/services/calendarApiService.ts` using the shared `ApiClient`.
- Connect `StudentService.getTimetable()` and `StudentService.getCalendarEvents()` to live DRF endpoints.
- Connect `ParentService.getChildTimetable()` and `ParentService.getCalendarEvents()` to live DRF endpoints.
- Enforce section-based visibility: Student sees their enrolled section's timetable; Parent sees their linked children's section timetables.
- Replace all mock timetable and calendar data in Student and Parent pages/components with live API calls.
- Maintain graceful offline/test fallback in `StudentService` and `ParentService`.

**Acceptance criteria**:

- [ ] Student timetable and calendar pages display live data from live DRF endpoints.
- [ ] Parent timetable and calendar pages display live data for linked children's sections.
- [ ] Section-based scoping is correct (Student sees own section only; Parent sees children's sections).
- [ ] Zero raw JSON imports or mock data inline in UI pages after migration.
- [ ] Vitest tests added for new API services (min. 8 new frontend tests).
- [ ] No regression in existing Student and Parent test suites.

**Dependencies**: Tasks 6.1 and 6.2 (REST APIs available).

---

### Task 6.5 — Faculty Timetable and Attendance Scheduling Integration

**Objective**: Integrate live faculty timetables and calendar information, validate teaching-period conflicts, and connect scheduled periods to existing attendance workflows without breaking Phase 5 attendance semantics.

**Scope**:

- Connect `FacultyService.getTimetable()` to live DRF `/api/v1/timetable/` scoped to the authenticated faculty member's assigned sections and subjects.
- Connect `FacultyService.getCalendarEvents()` to live DRF `/api/v1/calendar/events/` scoped to `Faculty` `target_roles`.
- Validate that the timetable displayed to Faculty is consistent with their active `TeachingAssignment` records.
- Connect timetable periods to the existing attendance roll-call workflow (existing `POST /api/v1/attendance/bulk/` is the backend; no new attendance mechanism required).
- Do not modify Phase 5 attendance semantics (4-status model: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`; canonical formula unchanged).
- Replace mock timetable and calendar data in Faculty pages/components.

**Acceptance criteria**:

- [ ] Faculty timetable displays live section/subject/period data scoped to authorized teaching assignments.
- [ ] Faculty calendar displays events with `target_roles` including `Faculty`.
- [ ] Timetable-to-attendance workflow connection does not break Phase 5 attendance RBAC or formula.
- [ ] No regression in Faculty module tests from Phase 5.
- [ ] Vitest tests added (min. 6 new frontend tests).
- [ ] Existing `faculty_api_integration.test.ts` suite continues to pass.

**Dependencies**: Tasks 6.1 and 6.2 (REST APIs available). Phase 5 Faculty attendance integration preserved.

---

### Task 6.6 — Admin Timetable Builder and Calendar Management

**Objective**: Implement the Admin master timetable builder and calendar event-management experience, with appropriate Principal oversight.

**Scope**:

- Implement Admin timetable builder UI allowing Admin to create, assign, edit, validate, and publish timetables for every class and section.
- The assignment workflow must capture: academic year, class, section, day of week, period number, subject, faculty, start time, end time, and (optionally) room number.
- Implement faculty and section conflict detection: validate against double-booking (faculty conflict: faculty assigned to multiple sections at the same day/period; section conflict: section assigned to multiple subjects/periods simultaneously) and surface backend `409 Conflict` responses in the UI.
- Implement Admin calendar management UI for creating, editing, publishing, and deleting academic events and holidays.
- Implement Principal oversight view of the master timetable (read-only; no mutation controls for Principal).
- All mutations persist through the real Django/PostgreSQL backend (no client-side-only state).
- All mutation endpoints enforce backend authorization (RBAC).
- Verify correct Student, Parent, and Faculty timetable visibility: published timetables must be accurately reflected across Student, Parent, and Faculty scoped views.

**Mandatory acceptance criteria**:

- [ ] Admin can create, assign, edit, validate, and publish timetables for every class and section.
- [ ] The timetable assignment workflow captures: academic year, class, section, day of week, period number, subject, faculty, and time (start and end time).
- [ ] Faculty and section conflict detection: conflicting faculty assignments (double-booked teacher) and section assignments (double-booked period) are detected, validated, and rejected before publication; backend `409 Conflict` is surfaced to Admin in the UI.
- [ ] Backend persistence and authorization: timetable changes persist through the real Django/PostgreSQL backend and enforce backend RBAC (unauthorized mutations rejected with `403 Forbidden`; UI hiding alone is strictly insufficient).
- [ ] Correct Student, Parent and Faculty timetable visibility: published timetables are correctly scoped and visible across Student, Parent, and Faculty views.
- [ ] Authorized users (Admin and Principal) can publish, update, and manage academic events and holidays.
- [ ] School-sanctioned event (holiday) rules remain compatible with the existing `ON_DUTY` attendance policy.
- [ ] Admin calendar management: create, read, update, delete calendar events with category, date range, target roles, and holiday flag.
- [ ] Principal timetable and calendar overview is read-only with no mutation controls.
- [ ] Vitest tests added for new Admin timetable and calendar UI logic (min. 12 new frontend tests).
- [ ] No regression in Admin module tests from Phase 5.

**Dependencies**: Tasks 6.1, 6.2, 6.4, and 6.5 (REST APIs and base frontend service layer established).

---

### Task 6.7 — Realtime Client Integration

**Objective**: Implement the typed frontend WebSocket integration, connection lifecycle, reconnection behaviour, authorization handling, and live timetable/calendar updates.

> **Note**: Keep generic notification infrastructure and the broader notification system within Phase 7. Only implement the narrowly scoped WebSocket integration for timetable and calendar updates in this task.

**Scope**:

- Implement `useWebSocket` custom hook or equivalent service managing: WebSocket URL construction (from `VITE_WS_BASE_URL`), connection lifecycle, reconnection with exponential back-off (max 5 retries), authorization handshake using the approved mechanism from Task 6.3 (PROP_006_A pending approval), and typed message event dispatch.
- Integrate the hook into timetable and calendar pages for all 5 roles.
- Handle realtime timetable updates (room changes, period swaps, new assignments) pushed from the server.
- Handle realtime calendar event announcements (new events, cancellations).
- Connection state management: display connection indicators without blocking the UI.
- TypeScript types for all WebSocket message payloads.

**Acceptance criteria**:

- [ ] Frontend establishes authenticated WebSocket connections and joins the correct channel groups based on role.
- [ ] Timetable and calendar pages update in realtime upon server-pushed messages without requiring page refresh.
- [ ] Reconnection logic with exponential back-off is implemented and visible to users on repeated failure.
- [ ] Unauthenticated connections are refused and the UI handles the rejection gracefully.
- [ ] WebSocket connection does not block initial page render (progressive enhancement).
- [ ] Vitest tests for WebSocket hook/service logic (min. 6 new tests, using mock WebSocket).
- [ ] Generic notifications are NOT implemented in this task.

**Dependencies**: Task 6.3 (server-side consumer infrastructure). Tasks 6.4, 6.5, and 6.6 (frontend timetable/calendar pages established). Owner approval of PROP_006_A.

---

### Task 6.8 — Full System Verification and Release Gate

**Objective**: Verify the entire Phase 6 implementation through comprehensive testing and issue a release verdict supported by recorded evidence.

**Scope**:

- Execute full backend pytest regression suite; all existing tests must pass plus all Phase 6 tests.
- Execute full frontend Vitest regression suite; all existing tests must pass plus all Phase 6 tests.
- Run `manage.py check` to confirm 0 issues.
- Run `manage.py makemigrations --check` to confirm 0 migration drift.
- Verify Option B dual-role PostgreSQL security for Phase 6 tables (erp_migrator ownership, erp_app CRUD grants, no erp_app DDL).
- Verify timetable conflict detection end-to-end.
- Execute 5-role browser QA across all Phase 6 features (Student, Parent, Faculty, Admin, Principal).
- Execute realtime integration tests (WebSocket: connect, authenticate, receive update, disconnect).
- Update `docs/phases/PHASE_06_STATUS.md` with all task completion evidence.
- Update `docs/PROJECT_STATUS.md`, `docs/CHANGELOG.md`, and `docs/API_CONTRACT.md`.
- Issue formal release gate verdict (PASS or FAIL with blocking items).

**Mandatory acceptance criteria for PASS**:

- [ ] All backend pytest tests pass (520 + Phase 6 additions).
- [ ] All frontend Vitest tests pass (283 + Phase 6 additions).
- [ ] Clean production build (0 TypeScript errors).
- [ ] 0 Django check issues; 0 migration drift.
- [ ] Option B database security verified for Phase 6 tables.
- [ ] 5-role browser QA completed with recorded evidence.
- [ ] Realtime WebSocket integration verified end-to-end.
- [ ] Admin timetable conflict detection verified.
- [ ] All mock timetable and calendar data replaced with live API responses (zero mock/live mixing).
- [ ] Phase 6 documentation fully updated.

**Dependencies**: Tasks 6.1 through 6.7 all complete.

---

## 6. Dependency Structure

```
Tasks 6.1 and 6.2 --> establish backend domain and REST APIs
                                |
              +-----------------+-----------------+
              v                 v                 v
         Task 6.4          Task 6.5           Task 6.6
    (Student/Parent     (Faculty timetable  (Admin builder +
     integration)        integration)        calendar mgmt)
              +-----------------+-----------------+
                                |
Task 6.3 ──────────────────────+──> server-side realtime infrastructure
(WebSocket consumers)           |
                                v
                           Task 6.7
                    (Realtime client integration)
                                |
                                v
                           Task 6.8
                    (Full system verification)
```

**Parallel execution rules**:

- Tasks 6.1 and 6.2 may execute in parallel (no dependency between them).
- Task 6.3 may begin in parallel with 6.1/6.2 for ASGI/Channels infrastructure setup but must not deploy timetable/calendar consumers until domain models exist.
- Tasks 6.4, 6.5, and 6.6 may not start until Tasks 6.1 and 6.2 are complete.
- Tasks 6.4, 6.5, and 6.6 may execute in parallel with each other once 6.1 and 6.2 are done.
- Task 6.7 requires Task 6.3 plus at least one of 6.4/6.5/6.6 to have produced frontend timetable/calendar pages.
- Task 6.8 is strictly gated on Tasks 6.1 through 6.7 all being complete.

---

## 7. Test Requirements

### 7.1 Backend Tests

| Task | New Test File | Minimum New Tests | Coverage |
| :--- | :--- | :--- | :--- |
| 6.1 | `tests/test_phase6_timetable_task61.py` | 15 | Model constraints, conflict detection, REST CRUD, RBAC scoping |
| 6.2 | `tests/test_phase6_calendar_task62.py` | 12 | Model constraints, target_roles filtering, REST CRUD, RBAC |
| 6.3 | `tests/test_phase6_websocket_task63.py` | 8 (in-memory) | Consumer auth, connection lifecycle, channel groups, message routing |
| 6.8 | Regression | 0 new; all >= 520 + Phase 6 | Full regression pass |

Redis integration tests require separate marker `pytest -m redis_integration` and are not part of the standard CI gate.

### 7.2 Frontend Tests

| Task | New Test File | Minimum New Tests | Coverage |
| :--- | :--- | :--- | :--- |
| 6.4 | `tests/timetable_calendar_student_parent.test.ts` | 8 | API service calls, role scoping, fallback |
| 6.5 | Extend `tests/faculty_api_integration.test.ts` | 6 | Timetable scope, attendance linkage |
| 6.6 | `tests/admin_timetable_calendar.test.ts` | 12 | Builder CRUD, conflict UI, calendar management |
| 6.7 | `tests/websocket_integration.test.ts` | 6 | Hook lifecycle, reconnection, typed message dispatch |
| 6.8 | Regression | 0 new; all >= 283 + Phase 6 | Full regression pass |

### 7.3 Browser QA (Task 6.8)

Conduct browser QA sessions for all 5 roles against the live development environment, recorded as WebP video evidence:

- Student: timetable view, calendar view.
- Parent: child timetable view, calendar view.
- Faculty: scoped timetable, attendance roll-call linkage.
- Admin: master timetable builder, conflict detection demo, calendar event management.
- Principal: read-only timetable and calendar overview.
- Realtime: demonstrate live push update received by a connected client.

---

## 8. Governance Invariants for Phase 6

1. Do not modify Phase 5 attendance statuses (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`) or calculation formula.
2. Do not modify CBSE 8-tier grading logic or marks-out-of-100 semantics.
3. Do not alter existing audit immutability (`audit_logs` trigger, ORM guards, Option B `erp_app` restrictions).
4. Do not introduce a `PeriodDefinition` model without explicit schema amendment approval.
5. Do not silently mark PROP_006_A or PROP_006_B as approved ADRs. Record them as approved only after explicit owner sign-off.
6. Do not implement Phase 7 features (generic notifications, AI recommendations, allocation analytics) in Phase 6.
7. The mock-data files in `mock-data/timetable.json` and `mock-data/events.json` remain as historical reference; they must not be served to production UI components after Phase 6 is complete.
8. Preserve existing `apps/allocation` section allocation logic without modification.
9. All new migrations must be Option B-compatible (tables owned by `erp_migrator`, CRUD granted to `erp_app`).
10. Production Redis configuration (`CHANNEL_LAYERS`) must be kept separate from automated test configuration (`TEST_CHANNEL_LAYERS` or equivalent).

---

## 9. Stop Conditions

Halt Phase 6 implementation and escalate to the owner if any of the following occur:

- The database schema for `timetables` requires a structural change not covered by the authoritative `docs/DATABASE_SCHEMA.md`.
- The WebSocket authentication handshake (PROP_006_A) or test strategy (PROP_006_B) requires implementation before owner approval is received.
- A conflict between timetable scheduling and Phase 5 attendance semantics is discovered that cannot be resolved without modifying existing behaviour.
- Task 6.8 regression tests reveal a Phase 5 behaviour regression (any of the 520 backend or 283 frontend baseline tests fail).
- A naming discrepancy between the proposed timetable model and `DATABASE_SCHEMA.md` cannot be reconciled without a schema amendment.

---

## 10. Documentation Deliverables

Upon completion of each task, update:

- `docs/phases/PHASE_06_STATUS.md` — mark task complete and record evidence.
- `docs/PROJECT_STATUS.md` — update phase status and component statuses.
- `docs/API_CONTRACT.md` — add or confirm implemented endpoint specifications.
- `docs/CHANGELOG.md` — add a dated changelog entry for the task.
- `docs/DECISIONS.md` — add an ADR for any accepted architectural decision (pending proposals become ADRs only after owner approval).
