# Phase 5 — Task 5.5 Specification
## Attendance API Integration + Oversight

**Project:** Student ERP — Enterprise Educational Management System  
**Phase:** 5 — Core ERP Integration  
**Task:** 5.5  
**Status:** COMPLETE  
**Prerequisites:** Tasks 5.1, 5.2, 5.3 and 5.4 complete  
**Phase 5 overall:** IN PROGRESS

## 1. Purpose

Task 5.5 completes the live attendance integration by replacing remaining mock-backed attendance and oversight surfaces with the established Django REST Framework + PostgreSQL implementation.

Architecture remains:

```text
React UI
  ↓
Domain Service
  ↓
API Service
  ↓
Shared ApiClient
  ↓
Django REST Framework
  ↓
PostgreSQL
```

Tasks 5.1–5.4 already established live attendance behavior for Student, Parent, and Faculty flows. Task 5.5 completes the remaining attendance integration and oversight surfaces without unnecessarily rewriting those implementations.

## 2. Authority and Reading Order

Before implementation, the coding agent MUST read:

1. `docs/PROJECT_STRUCTURE.md`
2. `docs/ARCHITECTURE.md`
3. `docs/BACKEND_ARCHITECTURE.md`
4. `docs/DATABASE_SCHEMA.md`
5. `docs/API_CONTRACT.md`
6. `docs/RBAC_PERMISSIONS.md`
7. `docs/DEVELOPMENT_WORKFLOW.md`
8. `docs/TESTING_STRATEGY.md`
9. `docs/phases/PHASE_05_STATUS.md`
10. `docs/phase_prompts/Phase_5_Task_5.5.md`
11. Latest Task 5.4 completion report
12. Relevant attendance documentation
13. Relevant Task 2.7 attendance-visibility documentation
14. Latest Task 5.3 completion report where Faculty attendance behavior is referenced
15. Relevant MOD_001 documentation where Class Teacher leave review applies

The Master Project Context remains the higher-level authority. Do not silently invent or override rules when documentation conflicts.

## 3. Attendance Business Rules

### 3.1 Canonical Statuses

Exactly:

- `PRESENT`
- `ABSENT`
- `ON_DUTY`
- `LEAVE`

Do not introduce `LATE`, `EXCUSED`, or replacement statuses.

`LEAVE` remains distinct from `ABSENT` but counts as absence. `ON_DUTY` counts as present.

### 3.2 Attendance Percentage

Authoritative formula:

```text
(PRESENT + ON_DUTY)
/
(PRESENT + ABSENT + ON_DUTY + LEAVE)
× 100
```

The denominator includes `LEAVE`.

Business-critical attendance calculations should come from the backend where already supported.

### 3.3 Scope

Attendance remains organized by:

```text
Academic Year
  → Class / Grade
  → Section
  → Subject / Session
  → Student
```

For Grades 11–12, stream/section relationships remain valid.

There is no unscoped Faculty attendance entry.

## 4. Task 5.5 Functional Scope

### 4.1 Attendance Overview

Complete live API integration for attendance surfaces that remain mock-backed, including where already represented:

- Student attendance history
- Subject-wise attendance
- Attendance percentage
- Attendance status
- Daily/history views
- Class/section attendance oversight
- Existing summaries and counts

Do not unnecessarily rewrite Task 5.1–5.4 live implementations.

### 4.2 Admin Attendance Oversight

Replace remaining Admin mock attendance data with live API data for:

- Attendance overview
- School-wide attendance records
- Student attendance records
- Student Absentees list
- Attendance Not Entered list
- Existing filters and summary information

Admin attendance mutations must follow the authoritative RBAC and server-side validation.

### 4.3 Principal Attendance Oversight

Replace remaining Principal mock attendance data with live API data for:

- School-wide attendance overview
- Existing attendance analytics/presence surfaces
- Student Absentees list
- Attendance Not Entered list
- Existing attendance summaries

Principal receives school-wide visibility but no automatic unrestricted attendance-entry authority.

### 4.4 Faculty Attendance

Task 5.3 already integrated Faculty attendance. Task 5.5 must regression-verify and preserve:

- Assigned class/section/subject scoping
- Attendance entry
- Four canonical statuses
- Scoped absentees
- Not Entered visibility where supported
- Class Teacher leave-review behavior
- Cross-section protection

Do not duplicate or redesign the Faculty attendance architecture.

### 4.5 Student Attendance

Task 5.1 already integrated Student attendance. Regression-verify:

- Own attendance only
- History
- Correct percentage
- `LEAVE` counts as absence
- `ON_DUTY` counts as present
- No unrelated student access
- No mutation capability

### 4.6 Parent Attendance

Task 5.2 already integrated Parent attendance. Regression-verify:

- Linked child/children only
- Correct child context
- Correct totals and subject-wise attendance
- `LEAVE` / `ON_DUTY` semantics
- No modification capability
- No cross-child leakage

## 5. Student Absentees Requirement

The Student Absentees list MUST contain only records with:

```text
ABSENT
```

It MUST exclude:

- `PRESENT`
- `ON_DUTY`
- `LEAVE`

Filtering must be enforced at backend queryset/API level.

Visibility:

- Admin: school-wide
- Principal: school-wide
- Faculty: assigned operational scope
- Student: no school-wide absentee access
- Parent: no school-wide absentee access

## 6. Attendance Not Entered Requirement

`Attendance Not Entered` means scheduled sessions where attendance has not yet been submitted.

It is distinct from an absentee record.

Visibility:

- Admin: school-wide
- Principal: school-wide
- Faculty: assigned teaching/session scope
- Student/Parent: no administrative Not Entered list

Reuse existing session/timetable structures where already available.

IMPORTANT: Do NOT implement the full timetable system in Task 5.5. Do not start Phase 6 timetable editing or realtime work. If more attendance-side data is needed, add only the minimum necessary capability and document any dependency.

## 7. Leave Workflow

Preserve the approved leave model:

- Student submits own leave through the existing flow.
- Faculty/Class Teacher reviews within authorized scope.
- Admin/Principal visibility follows existing RBAC.
- Leave stays distinct from `ABSENT`.
- Leave counts as absence in attendance percentage.
- Leave approval state remains separate from attendance status.

Do not redesign MOD_001 leave architecture.

## 8. Authorization Requirements

All authorization must remain server-side.

**Admin:** school-wide attendance visibility and authorized management.  
**Principal:** school-wide oversight/approved capabilities only.  
**Faculty:** assigned operational scope; no cross-section mutations; leave review only within Class Teacher authority.  
**Student:** own attendance only; no mutation.  
**Parent:** linked children only; no mutation.

Cross-scope access must return the appropriate authorization response.

## 9. API Integration Requirements

Inspect and reuse existing endpoints before adding new ones.

Expected existing areas include:

```text
/api/v1/attendance/
/api/v1/attendance/bulk/
/api/v1/attendance/{id}/
/api/v1/attendance/absentees/
/api/v1/attendance/leaves/
/api/v1/attendance/leaves/{id}/
```

Do not assume these are sufficient without inspecting the current implementation.

Frontend:

- Shared `ApiClient`
- Typed attendance contracts
- API service/domain service separation
- No raw JSON imports in live-integrated surfaces
- No direct API/database calls from UI components
- Preserve Task 5.1–5.4 service boundaries

Backend:

- Queryset scoping
- Object-level authorization
- Server-side status validation
- Server-side attendance calculations where authoritative
- Correct role permissions

## 10. Data Integrity

Verify:

- Attendance belongs to the correct student
- Student belongs to the correct academic enrollment/section
- Attendance has valid class/section context
- Subject/session context is valid
- Academic year is not mixed incorrectly
- `LEAVE` remains distinct from `ABSENT`
- `ON_DUTY` remains distinct from `PRESENT`
- Attendance percentage is correct
- Historical attendance is preserved
- No duplicate or silent overwrite behavior is introduced

Attendance edits must not silently modify unrelated academic records.

## 11. Testing Requirements

Add focused Task 5.5 tests.

### Backend

Cover:

- Attendance list scoping
- Student self-scoping
- Parent linked-child scoping
- Faculty assigned-scope filtering
- Admin school-wide access
- Principal school-wide access
- Canonical status validation
- Leave handling
- `LEAVE` counts as absence
- `ON_DUTY` counts as present
- Attendance percentage calculation
- Absentees strict `ABSENT` filtering
- Absentees exclusion of `PRESENT`, `ON_DUTY`, `LEAVE`
- Attendance Not Entered permissions/scoping
- Unauthorized mutation rejection
- Cross-section mutation rejection
- Object-level access control
- Regression of Task 5.1–5.4 attendance behavior

### Frontend

Cover:

- Attendance API service
- Data mapping
- Admin integration
- Principal integration
- Absentee list
- Not Entered list
- Correct status rendering
- Correct percentage rendering
- Loading/error/empty states
- Student/Parent regression behavior
- Faculty regression behavior
- No raw JSON dependency

## 12. Browser Verification

Use real authenticated accounts.

### Admin

Verify login, attendance overview, school-wide attendance, Student Absentees, Attendance Not Entered, filters, correct data, and authorized mutations where applicable.

### Principal

Verify login, attendance overview, school-wide visibility/analytics, Student Absentees, Attendance Not Entered, and absence of unauthorized attendance-entry controls.

### Faculty

Verify login, assigned attendance scope, attendance entry, four canonical statuses, scoped absentees, scoped Not Entered sessions, leave review where applicable, and cross-section protection.

### Student

Verify own attendance, correct percentage, and no unrelated records.

### Parent

Verify linked-child attendance, multi-child context, correct percentage, and no unrelated records.

Check actual DOM/UI behavior, successful API calls, correct backend data, no console errors, no unexpected redirects, and no stale mock attendance on migrated surfaces.

## 13. Migration Requirements

Do not create migrations unless a genuine database schema change is necessary.

Run:

```text
python manage.py check
python manage.py makemigrations --check
```

Document any genuine migration.

## 14. Explicitly Out of Scope

Do NOT implement:

- Timetable editor
- Student timetable
- Faculty timetable
- Calendar/events
- WebSockets
- Django Channels
- Redis realtime
- Notifications
- Merit allocation
- Random allocation
- Allocation history engine
- Reports generation
- Analytics redesign beyond existing attendance surfaces
- AI attendance feedback
- New attendance statuses
- New attendance workflow concepts
- Architecture redesign
- Frontend/backend merge

These belong to later phases/tasks.

## 15. Documentation Requirements

Update:

- `docs/phase_prompts/Phase_5_Task_5.5.md`
- `docs/phase_prompts/Phase_5_Task_5.5_Completion_Report.md`
- `docs/phases/PHASE_05_STATUS.md`
- `docs/PROJECT_STATUS.md`
- `docs/CHANGELOG.md`

Update `docs/API_CONTRACT.md` or `docs/DATABASE_SCHEMA.md` only when actually changed. Update `docs/DECISIONS.md` only for a genuine architectural decision.

The completion report must include objective, exact scope, backend/frontend changes, endpoints, RBAC, attendance-rule verification, exact test counts, migration/check results, browser QA, build result, known non-blocking issues, remaining mock dependencies, Git result, and final task state.

## 16. Completion Criteria

Task 5.5 is complete only when:

- Remaining in-scope attendance mock surfaces are replaced by live APIs.
- Admin attendance oversight is live.
- Principal attendance oversight is live.
- Existing Student attendance remains correct.
- Existing Parent attendance remains correct.
- Existing Faculty attendance remains correct.
- Absentees contains ONLY `ABSENT`.
- Not Entered remains distinct from absences.
- `LEAVE` counts as absence.
- `ON_DUTY` counts as present.
- Server-side RBAC/scoping is verified.
- Full backend suite passes.
- Task 5.5 backend tests pass.
- Full frontend suite passes.
- Task 5.5 frontend tests pass.
- Django checks pass.
- Migration check passes.
- Frontend production build passes.
- Browser QA passes across required roles.
- Documentation is updated.
- Git status is reviewed and changes are committed.

## 17. Governance Stop Condition

When all completion criteria pass:

```text
TASK 5.5 = COMPLETE
PHASE 5 = IN PROGRESS
TASK 5.6 = NOT STARTED
```

The agent MUST STOP. Do not automatically begin Task 5.6.

## 18. Expected Next Task

After successful completion:

**Phase 5 — Task 5.6: Marks API Integration**

Task 5.6 remains NOT STARTED until explicitly authorized.
