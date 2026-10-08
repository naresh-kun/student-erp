# Phase 5 — Task 5.4 Specification
## Academic Structure + Administrative Integration

**Project:** Student ERP — Enterprise Educational Management System  
**Phase:** 5 — Core ERP Integration  
**Task:** 5.4  
**Status:** COMPLETE  
**Prerequisite:** Tasks 5.1, 5.2, and 5.3 complete  
**Phase 5 overall:** IN PROGRESS

---

## 1. Purpose

Task 5.4 integrates the remaining **core academic-structure data** and related **administrative management surfaces** with the real Django REST Framework backend and PostgreSQL database.

The established architecture must remain:

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

The objective is to remove the relevant mock-data dependency without rewriting the existing UI architecture.

---

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
10. `docs/phase_prompts/Phase_5_Task_5.4.md`
11. Relevant academic-structure documentation
12. Relevant allocation/Class Teacher documentation
13. `docs/phase_prompts/MOD_001_Faculty_Assignment_and_Homework.md` where applicable
14. Latest Task 5.3 completion report

The Master Project Context remains the higher-level project authority.

If a lower-level document conflicts with the Master Project Context, the Master Project Context governs and the discrepancy must be documented rather than silently ignored.

---

## 3. In-Scope Functional Areas

### 3.1 Academic Years

Integrate real backend data for:

- Academic Year listing
- Academic Year identifiers/status used by academic structure
- Correct academic-year relationships
- Correct filtering/scoping where required

Do not introduce a second academic-year model or competing architecture.

### 3.2 Classes / Grades

Integrate real backend data for:

- Class / grade listing
- Existing class details required by current Admin surfaces
- Academic-year relationship
- Relevant section relationships
- Existing capacity information where represented by the current UI

Preserve the Indian school grade model already established by the project.

### 3.3 Sections

Integrate real backend data for:

- Section listing
- Class → Section relationships
- Academic-year relationships
- Stream awareness for Grades 11–12
- Section identifiers and metadata already represented by the application

Rules:

- Lower grades do not use streams.
- Grades 11–12 use the approved stream model.
- Stream sections follow the established naming rules.
- Section records must remain associated with the correct class and academic year.
- Do not create timetable functionality in this task.

### 3.4 Subjects

Integrate real backend data for:

- Subject listing
- Subject details used by current Admin academic/catalog surfaces
- Existing subject/class relationships where already supported
- Existing faculty subject visibility without introducing evaluative metrics

Do not introduce faculty performance ratings, rankings, or reviews.

### 3.5 Enrollment Relationships

Ensure the frontend can consume authoritative backend enrollment relationships needed by:

- Student academic placement
- Class / section context
- Academic-year context
- Existing directory and allocation surfaces

Enrollment data must remain the authoritative source for current student academic placement.

Do not create duplicate frontend-only enrollment state as the source of truth.

---

## 4. Admin Integration Scope

Replace mock-backed academic/admin data with live API-backed data where the current Admin UI already represents:

### Administrative directories

- Students
- Parents
- Faculty

### Academic catalog

- Academic Years
- Classes
- Sections
- Subjects
- Existing capacity/catalog information already represented in the current UI

### Operational academic visibility

Integrate existing backend capabilities required for the current Admin surfaces without redesigning the module.

The UI must continue using service abstractions.

No raw JSON imports may be introduced into page/components for live data.

---

## 5. Existing Allocation Workflow Integration

Task 2.7 already approved Student Section Allocation and Class Teacher Allocation workflows for Admin and Principal.

Task 5.4 may connect those **existing operational workflows** to authoritative backend data where the required backend capability exists or must be minimally exposed.

### 5.1 Student Section Allocation

Preserve:

```text
Academic Year
  → Grade
  → Stream (Grades 11–12 where applicable)
  → Section
  → Student
```

Rules:

- Student ID is permanent and immutable.
- Admin may Update and Delete allocation.
- Principal may Update and Delete allocation.
- Faculty is view-only.
- Student/Parent have no access to administrative allocation controls.
- Deletion must preserve the project's approved “Unassigned” operational behavior where that behavior is already established.
- Academic-year and section relationships must remain valid.

Do NOT implement the future merit/random allocation engine in Task 5.4.

### 5.2 Class Teacher Allocation

Preserve:

- Faculty and Class Teacher are separate concepts.
- Faculty may have zero Class Teacher assignments.
- A faculty member may be Class Teacher for at most one class/section in an academic year.
- Class Teacher status does not grant all-subject authority.
- Subject operations remain controlled by `TeachingAssignment`.

Permissions:

- Admin: Update/Delete
- Principal: Update/Delete
- Faculty: View-only
- Student/Parent: No access

Any mutation must respect the authoritative backend constraint and authorization model.

---

## 6. Authorization and Security Requirements

All live APIs must preserve Phase 4 RBAC.

At minimum verify:

### Student

- Cannot access Admin academic management operations.
- Cannot mutate classes, sections, subjects, academic years, enrollments, or allocation records.

### Parent

- Cannot access Admin academic management operations.
- Cannot mutate academic structure or allocation.

### Faculty

- May view only information explicitly permitted by the existing RBAC model.
- Must not receive Admin academic mutation controls.
- Must remain view-only for Student Section Allocation and Class Teacher Allocation.
- Class Teacher status must not grant unrestricted subject-management authority.

### Admin

- Full operational management of the in-scope academic/admin surfaces.
- Must still pass server-side validation and constraints.

### Principal

- School-wide oversight.
- Update/Delete only for the specifically approved allocation workflows.
- Must not automatically receive unrestricted CRUD over all academic master data unless the existing authoritative RBAC documentation explicitly grants it.

### Cross-scope protections

Verify:

- No cross-academic-year corruption.
- No invalid class/section relationship.
- No invalid stream/section combination.
- No unauthorized student placement mutation.
- No unauthorized Class Teacher mutation.
- No Student ID mutation.

Security must be enforced server-side, not only by hiding buttons in React.

---

## 7. API Integration Requirements

Use existing `/api/v1/...` contracts where available.

Before adding endpoints:

1. Inspect existing API implementation.
2. Reuse existing serializers/views/services where possible.
3. Add only the minimum missing backend capability.
4. Preserve response conventions already established in the project.
5. Apply permissions and queryset/object scoping server-side.
6. Avoid breaking Tasks 5.1–5.3.

Frontend requirements:

- Typed domain interfaces.
- Dedicated domain API services where appropriate.
- Existing shared `ApiClient`.
- No direct raw `fetch` duplication when the established service layer already provides the correct boundary.
- No direct JSON imports in live-integrated UI components.

---

## 8. Data Integrity Requirements

The implementation must preserve:

### Academic hierarchy

```text
Academic Year
  ↓
Class / Grade
  ↓
Section
  ↓
Enrollment
  ↓
Student
```

For Grades 11–12:

```text
Academic Year
  ↓
Grade
  ↓
Stream
  ↓
Section
  ↓
Student
```

Do not permit relationships that violate the established hierarchy.

### Student ID

- Permanent
- Unique
- System-generated
- Immutable

### Class Teacher

- At most one Class Teacher assignment per faculty member per academic year
- No automatic Class Teacher assignment
- No subject-authority escalation

---

## 9. Testing Requirements

Add focused Task 5.4 tests while preserving all previous tests.

### Backend tests

Cover at minimum:

- Academic Year retrieval
- Class retrieval
- Section retrieval
- Subject retrieval
- Enrollment relationships
- Academic-year filtering
- Stream/section validation
- Admin permissions
- Principal allocation permissions
- Faculty restrictions
- Student/Parent restrictions
- Student ID immutability
- Student Section Allocation update/delete authorization
- Class Teacher Allocation update/delete authorization
- Class Teacher one-per-year rule
- No regression of TeachingAssignment authorization

### Frontend tests

Cover at minimum:

- Academic Years service integration
- Classes service integration
- Sections service integration
- Subjects service integration
- Enrollment data mapping
- Admin directory/API integration
- Allocation UI data integration
- Admin Update/Delete controls
- Principal Update/Delete controls
- Faculty view-only behavior
- Loading/error/empty states
- No raw JSON dependency in the integrated surfaces

---

## 10. Browser Verification

Use real authenticated accounts.

At minimum verify:

### Admin

- Login
- Student directory
- Parent directory
- Faculty directory
- Academic Years
- Classes
- Sections
- Subjects
- Existing allocation workflow
- Update
- Delete
- Refresh and confirm persisted state

### Principal

- Login
- Existing allocation workflow
- Update
- Delete
- Confirm authorized controls
- Confirm unrelated Admin-only mutations remain blocked

### Faculty

- Login
- View approved academic/allocation information
- Confirm Update/Delete controls for allocation are absent
- Confirm normal Faculty module functionality remains intact

Check:

- Actual DOM/UI behavior
- Successful HTTP requests
- Correct backend data
- No console errors
- No unexpected redirects
- No stale mock data shown after successful API integration

---

## 11. Migration Requirements

Only create migrations when the implementation genuinely changes the database schema.

Required checks:

```text
python manage.py check
python manage.py makemigrations --check
```

There must be no accidental schema drift.

Do not add database changes merely to satisfy frontend presentation.

---

## 12. Explicitly Out of Scope

The following MUST NOT be implemented in Task 5.4:

- Timetable
- Faculty timetable
- Student timetable
- Calendar
- Events
- Holidays workflow
- Django Channels
- WebSockets
- Redis realtime
- Notifications
- Merit-based allocation algorithm
- Random allocation algorithm
- Allocation preview/publish/history engine
- Advanced reports generation
- Principal analytics overhaul
- Attendance feedback
- AI features
- New unrelated modules
- Architecture redesign
- Frontend/backend merge
- Replacement of Django/PostgreSQL
- Replacement of React/Vite
- New competing service architecture

These belong to later phases/tasks according to the Master Project Context.

---

## 13. Documentation Requirements

At completion, update:

- `docs/phase_prompts/Phase_5_Task_5.4.md`
- `docs/phase_prompts/Phase_5_Task_5.4_Completion_Report.md`
- `docs/phases/PHASE_05_STATUS.md`
- `docs/PROJECT_STATUS.md`
- `docs/CHANGELOG.md`
- `docs/API_CONTRACT.md` if API behavior changes
- `docs/DATABASE_SCHEMA.md` if schema changes
- `docs/DECISIONS.md` only if a real architectural decision was required

The completion report must record:

- Objective
- Scope implemented
- Exact backend changes
- Exact frontend changes
- API endpoints used/added
- Authorization decisions
- Data-integrity checks
- Tests with exact counts
- Migration/check results
- Browser verification
- Build result
- Known non-blocking issues
- Remaining mock dependencies
- Git commit/result
- Final task status

---

## 14. Completion Criteria

Task 5.4 is complete only when all of the following are true:

- Academic Years are live-integrated where in scope.
- Classes are live-integrated where in scope.
- Sections are live-integrated where in scope.
- Subjects are live-integrated where in scope.
- Enrollment relationships are correctly represented.
- Admin academic/directories surfaces no longer depend on mock data where integrated.
- Existing allocation workflows use authoritative backend data where supported.
- RBAC is enforced server-side.
- Student ID remains immutable.
- Class Teacher constraints remain enforced.
- Full backend test suite passes.
- Task 5.4 backend tests pass.
- Full frontend test suite passes.
- Task 5.4 frontend tests pass.
- Django checks pass.
- Migration check passes.
- Frontend production build passes.
- Browser verification passes for Admin, Principal, and Faculty.
- Documentation is updated.
- Git status is reviewed and changes are committed.

---

## 15. Governance Stop Condition

When all completion criteria pass:

```text
TASK 5.4 = COMPLETE
PHASE 5 = IN PROGRESS
TASK 5.5 = NOT STARTED
```

The agent MUST STOP after Task 5.4.

Do not automatically begin Task 5.5.

---

## 16. Expected Next Task

The next authorized task after successful Task 5.4 completion is:

**Phase 5 — Task 5.5: Attendance API Integration**

Task 5.5 remains NOT STARTED until explicitly authorized.
