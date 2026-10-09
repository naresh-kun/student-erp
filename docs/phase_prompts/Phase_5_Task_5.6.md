# Phase 5 — Task 5.6 Specification
## Marks API Integration + Oversight

**Project:** Student ERP — Enterprise Educational Management System  
**Phase:** 5 — Core ERP Integration  
**Task:** 5.6  
**Status:** COMPLETE  
**Prerequisites:** Tasks 5.1–5.5 complete  
**Phase 5 overall:** IN PROGRESS

## 1. Purpose

Task 5.6 completes the live marks integration across the remaining Student, Parent, Faculty, Admin, and Principal surfaces while preserving the existing React → Domain Service → API Service → ApiClient → Django REST Framework → PostgreSQL architecture.

The task must strengthen the already-existing marks backend rather than create a competing marks architecture.

## 2. Mandatory Reading Order

Before implementation, the coding agent MUST read the current versions of:

1. `docs/PROJECT_STRUCTURE.md`
2. `docs/ARCHITECTURE.md`
3. `docs/BACKEND_ARCHITECTURE.md`
4. `docs/DATABASE_SCHEMA.md`
5. `docs/API_CONTRACT.md`
6. `docs/RBAC_PERMISSIONS.md`
7. `docs/DEVELOPMENT_WORKFLOW.md`
8. `docs/TESTING_STRATEGY.md`
9. `docs/phases/PHASE_05_STATUS.md`
10. `docs/PROJECT_STATUS.md`
11. `docs/phase_prompts/Phase_5_Task_5.6.md`
12. Latest Task 5.5 completion report
13. Latest Task 5.3 completion report
14. Relevant marks/grading documentation in the Master Project Context
15. Relevant RBAC/authorization and audit documentation

The Master Project Context remains the higher-level authority. Do not silently invent or replace business rules.

## 3. Marks Business Rules

### 3.1 Assessment Model

- Marks are recorded per **student + subject + exam type**.
- Default exam types include **Cycle Test, Quarter, Half Year, Final**, with configured equivalents supported.
- Maximum mark is **100** for every subject.
- Valid numeric marks are **0–100 inclusive**.
- Out-of-range or invalid values must be rejected by the backend as well as the UI.
- An absent student assessment is represented as **AB**, not numeric 0.
- How AB contributes to totals remains a configurable school rule; do not silently reinterpret it.

### 3.2 Calculations

The backend is authoritative for official calculations.

- Cumulative marks = sum of counted subject marks.
- Maximum marks = 100 × counted subjects.
- Overall percentage = cumulative ÷ maximum × 100, rounded to 2 decimals.
- Subject percentage equals the subject mark because every subject is out of 100.
- Displayed grade must be derived from the displayed rounded percentage so grade and percentage cannot disagree.

### 3.3 Default Grade Bands

Use the established default scale unless the current implementation already provides the documented configurable board-scale mechanism:

| Grade | Percentage |
|---|---|
| A1 | 91 and above |
| A2 | 81 to <91 |
| B1 | 71 to <81 |
| B2 | 61 to <71 |
| C1 | 51 to <61 |
| C2 | 41 to <51 |
| D | 33 to <41 |
| E | below 33 |

Do not introduce GPA/CGPA.

The Master Project Context specifies that grading scales are data-backed, board-selectable, versioned, and preserved with stored results. The audit must verify whether the current backend satisfies this requirement. If it does not, implement only the minimum necessary correction justified by the existing architecture and task scope.

## 4. Authorization Model

Server-side RBAC and object/query scoping are mandatory.

### Student

- View own marks only.
- View own report-card data exposed by current Phase 5 APIs.
- No mark creation, update, deletion, exam-type management, or school-wide analytics.

### Parent

- View marks only for linked child/children.
- Multi-child responses must retain child context.
- No mark mutation or exam-type management.

### Faculty

- View marks within permitted teaching scope.
- Enter/update marks only for subjects/classes covered by an active `TeachingAssignment`.
- Class Teacher status alone does NOT grant subject-marks authority.
- Cannot modify another faculty member's out-of-scope marks.

### Admin

- School-wide operational marks visibility.
- May enter/correct marks.
- May manage exam types where the existing permission model grants `marks.enter`.
- Mark edits must remain auditable through the existing audit architecture.

### Principal

- School-wide read-only marks oversight.
- No unauthorized mark-entry or correction controls.
- May view class/subject summaries, grade distribution, and pass percentage where already part of the ERP design.
- No individual-faculty performance attribution, ranking, or evaluation.

## 5. Functional Scope

### 5.1 Student Marks

Replace any remaining mock-backed Student marks surfaces with live APIs while preserving existing UI structure.

Verify:
- subject rows
- exam type context
- marks /100
- AB representation
- subject grade
- cumulative marks
- maximum marks
- overall percentage
- overall grade

### 5.2 Parent Marks

Replace remaining mock-backed Parent marks surfaces with live data.

Verify:
- linked-child isolation
- multi-child context
- exam/subject visibility
- same backend-authoritative calculations as Student views

### 5.3 Faculty Marks

Preserve the Task 5.3 live marks workflow and harden it where required.

Verify:
- assigned subject/class scope
- 0–100 validation
- AB handling
- duplicate/conflicting submissions are handled according to current data model
- grade derivation is backend-authoritative
- cross-faculty and cross-section access is rejected
- Class Teacher does not gain all-subject marks authority

### 5.4 Admin Marks Oversight

Integrate the remaining Admin marks audit/management surfaces that are still mock-backed.

Where represented by the current UI, provide live:
- marks register/search/filtering
- exam-type visibility/management
- class/section/subject oversight
- correction/edit workflow
- school-wide marks summaries

Do not create report-card generation here; printable board-style reports remain Phase 7.

### 5.5 Principal Marks Oversight

Integrate existing Principal marks/performance oversight surfaces that are still mock-backed.

Where already represented, provide live:
- cohort/class performance summaries
- subject-level averages
- grade distribution
- pass percentage
- exam-cycle trend views

These views must not expose faculty performance ratings or rankings.

### 5.6 Report-Card Data Contract

Preserve the existing live report-card endpoint semantics used by Tasks 5.1–5.3.

Verify that:
- authorization is correct
- calculations come from backend services
- unrelated students cannot be accessed by ID/UUID manipulation
- Student and Parent views match the same authoritative result set

Printable report-card generation is OUT OF SCOPE.

## 6. Required Security Checks

At minimum test:

- unauthenticated → 401
- Student cross-student access → 403 / inaccessible
- Parent unrelated-child access → 403 / inaccessible
- Faculty cross-assignment access → 403 / inaccessible
- Faculty marks mutation outside assignment → 403
- Class Teacher without subject assignment → 403
- Student/Parent/Principal marks mutation → 403
- Non-Admin exam-type creation → 403
- Admin correction remains allowed
- Object-ID tampering cannot bypass authorization
- Query filters do not leak school-wide data to scoped roles

Security must be enforced server-side, not merely by hiding UI controls.

## 7. Frontend Architecture Requirements

Use the established service layering:

`UI → Domain Service → Marks API Service → ApiClient → DRF`

Requirements:
- typed request/response interfaces
- reuse shared `ApiClient`
- no direct raw `fetch` duplication
- no direct JSON imports on migrated live surfaces
- preserve existing page/component structure unless the current UI cannot support the live contract
- frontend calculations may be used for immediate field feedback, but official totals/percentages/grades must come from the backend

## 8. Testing Requirements

### Backend

Add a dedicated Task 5.6 integration/security suite covering:
- mark list scoping
- bulk mark entry
- mark detail read/update
- exam types
- report-card access
- 0 and 100 boundary values
- invalid values
- AB behavior
- grade-threshold boundaries
- calculation correctness
- Admin correction authority
- Faculty teaching-assignment authority
- Student/Parent isolation
- Principal read-only behavior
- auditability where applicable

### Frontend

Add dedicated tests covering:
- live Student marks
- live Parent marks + multi-child context
- live Faculty entry/update
- Admin marks management/oversight
- Principal marks oversight
- error/permission handling
- API/service contract wiring

### Regression

Run the complete existing backend and frontend suites.

## 9. Browser Verification

Use real authenticated demo accounts.

Verify actual DOM/UI behavior, successful API calls, correct backend data, no stale mock marks, no unexpected redirects, and no console errors for:

- Student
- Parent
- Faculty
- Admin
- Principal

At minimum exercise one valid marks-entry/update flow for Faculty/Admin and one read-only flow for Student/Parent/Principal.

## 10. Migration Rules

Do not create migrations unless a genuine schema change is required.

Run:

```text
python manage.py check
python manage.py makemigrations --check
```

Any genuine schema change must be documented before sign-off.

## 11. Explicitly Out of Scope

Do NOT implement:

- timetable editor
- calendar/events
- WebSockets / Django Channels
- Redis realtime
- notifications
- printable report-card generation
- merit/random allocation
- new allocation engine
- AI grading or AI performance feedback
- faculty performance evaluation/ranking
- GPA/CGPA
- new mark statuses outside the documented marks model
- architecture rewrite
- frontend/backend merge

## 12. Documentation Requirements

At completion update, where actually changed:

- `docs/phase_prompts/Phase_5_Task_5.6.md`
- `docs/phase_prompts/Phase_5_Task_5.6_Completion_Report.md`
- `docs/phases/PHASE_05_STATUS.md`
- `docs/PROJECT_STATUS.md`
- `docs/CHANGELOG.md`
- `docs/API_CONTRACT.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/RBAC_PERMISSIONS.md`
- `docs/DECISIONS.md` only for genuine architectural decisions

The completion report must record exact changes, endpoints, RBAC/scoping, calculation verification, exact test counts, checks/migrations, browser QA, build result, known non-blocking issues, remaining mock dependencies, Git result, and final task state.

## 13. Governance Gate

The first execution prompt for Task 5.6 is AUDIT ONLY.

The coding agent must:

1. Read all required documentation.
2. Inspect the current marks models/services/serializers/views/URLs/tests.
3. Inspect current Student/Parent/Faculty/Admin/Principal marks pages and services.
4. Establish exactly which marks surfaces are already live and which remain mock-backed.
5. Verify the current grading/calculation implementation against the Master Project Context.
6. Verify current marks RBAC and object/query scoping.
7. Run baseline tests/checks where practical.
8. Produce an audit report with gaps and proposed minimal changes.
9. STOP for human approval.

No implementation should begin during the audit-only kickoff.

## 14. Completion Stop Condition

When the approved implementation is fully verified:

```text
TASK 5.6 = COMPLETE
PHASE 5 = IN PROGRESS
TASK 5.7 = NOT STARTED
```

The agent must stop after the completion report and Git verification. Do not automatically begin Task 5.7.
