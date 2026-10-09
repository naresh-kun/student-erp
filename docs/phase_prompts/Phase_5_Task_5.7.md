# Phase 5 — Task 5.7 Specification
## Dashboard + Cross-Module Integration

**Project:** Student ERP — Enterprise Educational Management System  
**Phase:** 5 — Core ERP Integration  
**Task:** 5.7  
**Status:** NOT STARTED  
**Prerequisites:** Tasks 5.1–5.6 complete  
**Phase 5 overall:** IN PROGRESS

---

## 1. Purpose

Task 5.7 completes Phase 5 dashboard integration by replacing remaining mock-backed dashboard metrics and cross-module summary data with authoritative live ERP data.

The task composes already-integrated domains rather than creating a second business-logic layer.

Required architecture remains:

```text
React UI
  ↓
Domain Service
  ↓
API Service(s)
  ↓
Shared ApiClient
  ↓
Django REST Framework
  ↓
PostgreSQL
```

Where existing APIs already provide the required authoritative data, reuse them. Add a new backend aggregate endpoint only when the current contracts cannot provide the dashboard data efficiently or correctly.

---

## 2. Mandatory Reading Order

Before any implementation, the coding agent MUST read the current versions of:

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
11. `docs/phase_prompts/Phase_5_Task_5.7.md`
12. Latest Task 5.6 completion report
13. Latest Task 5.5 completion report
14. Latest Task 5.4 completion report
15. MOD_001 documentation where Homework is displayed
16. Relevant dashboard documentation and current page/service implementations

The Master Project Context remains the higher-level authority.

Do not silently override business rules or architecture.

---

## 3. Core Objective

The dashboard must become a truthful operational summary of the already-live ERP domains.

Dashboard values must be consistent with the corresponding detail modules and must not rely on stale hardcoded synthetic values where a live source exists.

The dashboard is a presentation/composition layer, not an alternate source of truth.

---

## 4. In-Scope Role Dashboards

### 4.1 Student Dashboard

Use live data for dashboard information already represented by the current UI, including where supported:

- Student identity and academic placement
- Current class/section context
- Attendance percentage and relevant attendance summary
- Cumulative marks / maximum marks
- Overall percentage and overall grade
- Recent/current academic information
- Published homework relevant to the student

Requirements:

- Own-student scope only.
- Official marks metrics must match the backend report-card result.
- Attendance metrics must match the backend attendance result.
- Do not independently recalculate official marks or attendance figures.

### 4.2 Parent Dashboard

Use live data for:

- Parent identity
- Linked child/children
- Active child context
- Child class/section context
- Child attendance summary
- Child marks summary
- Relevant published homework
- Existing academic summary cards and charts represented by the current UI

Requirements:

- Multi-child context must remain explicit.
- Child-specific metrics must never mix children.
- Parent dashboard figures must match the corresponding child detail pages.
- Parent remains read-only for academic records.

### 4.3 Faculty Dashboard

Use live data for:

- Faculty identity and descriptive profile information
- Assigned class/section context
- Class Teacher assignment where applicable
- Teaching workload already represented by the application
- Attendance work requiring action where an existing live endpoint supports it
- Marks work requiring action where an existing live endpoint supports it
- Homework activity/summary within authorized teaching scope

Requirements:

- No faculty performance score, ranking, appraisal, or comparative evaluation.
- Dashboard scope must follow active TeachingAssignment and Class Teacher rules.
- Class Teacher status must not expand subject authority.

### 4.4 Admin Dashboard

Use live data for operational school metrics already represented by the current UI, such as:

- Active students
- Active parents
- Active faculty
- Academic-year/class/section counts
- Attendance oversight summaries
- Marks oversight summaries
- Allocation/current academic-structure indicators
- Operational items requiring attention where supported by existing live modules

Requirements:

- School-wide operational scope is allowed for Admin.
- Metrics must originate from live backend-backed domain data.
- Do not reintroduce the old mock summary arrays.

### 4.5 Principal Dashboard

Use live data for institutional oversight already represented by the current UI, such as:

- Student/faculty/academic structure counts where available
- School attendance telemetry
- Marks/academic performance telemetry
- Grade distribution
- Pass percentage
- Subject/class/cohort summaries
- Stream summaries for Grades 11–12 where existing marks analytics support them

Requirements:

- Read-only academic oversight.
- No unrestricted operational mutation controls.
- No individual faculty performance attribution, ranking, rating, or evaluation.

---

## 5. Cross-Module Consistency Requirements

The following values must have one authoritative source and remain consistent across dashboard and detail surfaces:

### Student identity / placement

```text
Student
  → Active Enrollment
  → Class / Section
  → Academic Year
```

### Attendance

Dashboard attendance must agree with live attendance APIs and preserve the canonical four-status model:

```text
PRESENT
ABSENT
ON_DUTY
LEAVE
```

### Marks

Dashboard marks must use the Task 5.6 backend-authoritative result set, including:

- cumulative marks
- maximum marks
- overall percentage
- overall grade
- AB handling

### Homework

Where shown, dashboard homework must follow MOD_001 permissions and published/active enrollment scope.

### Academic structure

Dashboard class/section/academic-year labels must come from the live academic structure integration, not duplicate frontend mock constants.

---

## 6. API Integration Strategy

Before creating any endpoint:

1. Inspect existing Task 5.1–5.6 APIs.
2. Reuse current domain API services where possible.
3. Prefer multiple existing focused APIs over duplicate dashboard-specific business logic when performance and correctness remain acceptable.
4. Add a dedicated dashboard aggregation endpoint only when needed for efficiency or when a cross-domain result cannot be represented cleanly through existing contracts.
5. Keep official calculations in the backend/domain services.
6. Apply RBAC and queryset scoping server-side.

No UI-only security.

---

## 7. Frontend Architecture Requirements

Use the established service boundaries.

Required principles:

- Typed request/response models.
- Reuse the shared `ApiClient`.
- No direct raw `fetch` duplication.
- No direct JSON imports on migrated dashboard surfaces.
- Dashboard components must not contain duplicated business calculations.
- Preserve existing page and component structure wherever practical.
- Keep loading, empty, error, and unauthorized states explicit.
- Do not silently substitute hardcoded mock values after a live API failure on a surface declared complete.
- Any fallback behavior must be intentional, documented, and must not disguise a backend failure as valid ERP data.

---

## 8. Business and Security Rules

Verify all five roles.

### Student

- Own dashboard only.
- Cannot access another student's dashboard data through identifiers or query manipulation.
- Cannot mutate academic records.

### Parent

- Only linked children.
- Multi-child context remains isolated.
- Cannot mutate academic records.

### Faculty

- Only authorized teaching/supervisory scope.
- No cross-section dashboard leakage.
- Class Teacher status does not grant all-subject authority.

### Admin

- School-wide operational dashboard access.
- Authorized operational actions only.

### Principal

- School-wide oversight.
- No unauthorized academic mutation controls.
- No teacher ranking/evaluation metrics.

Unauthenticated requests must receive the established `401` behavior; authenticated but unauthorized requests must receive `403` where applicable.

---

## 9. Data Integrity Requirements

The implementation must prevent:

- dashboard/detail mismatches caused by independent calculations
- stale mock counts overriding live values
- cross-child parent aggregation errors
- cross-student leakage
- cross-faculty leakage
- academic-year mismatches
- inactive enrollment records being treated as current placement
- invalid section/class relationships
- teacher-performance metrics appearing as academic dashboard metrics

When a metric is unavailable because no applicable records exist, show an intentional empty/zero state rather than fabricated synthetic data.

---

## 10. Explicitly Out of Scope

Do NOT implement:

- Timetable editor
- Student/Faculty timetable integration beyond existing placeholders
- Calendar/event integration
- WebSockets / Django Channels
- Redis realtime
- Notifications
- Merit allocation
- Random allocation
- Allocation history engine
- Printable board-style report cards
- New report-generation engine
- New analytics engines beyond the already-live Task 5.5/5.6 attendance and marks analytics
- AI recommendations or AI-generated insights
- Teacher performance evaluation/ranking
- GPA/CGPA/credits
- New business domains
- Architecture rewrite
- Frontend/backend merge

Timetable, calendar, realtime and related infrastructure remain Phase 6. Allocation, reports, broader analytics, notifications and AI remain Phase 7.

---

## 11. Testing Requirements

### Backend

Add focused Task 5.7 tests where backend changes are required.

Cover at minimum:

- dashboard aggregation correctness
- role-based visibility
- active enrollment filtering
- cross-student isolation
- cross-child isolation
- cross-faculty isolation
- Admin global scope
- Principal read-only scope
- no faculty ranking/evaluation data
- consistency with attendance/marks source APIs where applicable
- empty-data handling

### Frontend

Add focused tests covering:

- Student dashboard live integration
- Parent dashboard live integration + child switching
- Faculty dashboard live integration
- Admin dashboard live integration
- Principal dashboard live integration
- loading/error/empty states
- no stale hardcoded metrics
- service-layer/API wiring
- permission handling

### Regression

Run the complete backend and frontend test suites after implementation.

---

## 12. Browser Verification

Use real authenticated demo accounts.

Verify actual DOM/UI behavior, successful API calls, correct values, no stale dashboard mocks, no unexpected redirects, and no console errors.

Minimum role coverage:

1. Student — dashboard matches attendance and marks detail pages.
2. Parent — dashboard switches between linked children without mixing data.
3. Faculty — dashboard shows only authorized classes/workload/action context.
4. Admin — dashboard shows live operational counts and oversight summaries.
5. Principal — dashboard shows live institutional telemetry with no unauthorized mutation or teacher-evaluation controls.

---

## 13. Migration Rules

Do not create migrations unless a genuine schema change is required.

Run:

```text
python manage.py check
python manage.py makemigrations --check
```

Any genuine schema change must be documented before sign-off.

---

## 14. Documentation Requirements

At completion update where actually changed:

- `docs/phase_prompts/Phase_5_Task_5.7.md`
- `docs/phase_prompts/Phase_5_Task_5.7_Completion_Report.md`
- `docs/phases/PHASE_05_STATUS.md`
- `docs/PROJECT_STATUS.md`
- `docs/CHANGELOG.md`
- `docs/API_CONTRACT.md` if new/changed APIs exist
- `docs/DATABASE_SCHEMA.md` if schema changes exist
- `docs/RBAC_PERMISSIONS.md` if permission semantics change
- `docs/DECISIONS.md` only for genuine architectural decisions

The completion report must record:

- objective
- exact scope
- backend changes
- frontend changes
- endpoints used/added
- RBAC/scoping
- cross-module consistency verification
- exact test counts
- migration/check results
- browser QA
- build result
- known non-blocking issues
- remaining mock dependencies
- Git status/commit
- final task state

---

## 15. Governance Gate

The first execution prompt for Task 5.7 must be **AUDIT ONLY**.

The coding agent must:

1. Read all required documentation.
2. Inspect the current five dashboard pages/components and their domain services.
3. Identify every remaining mock/hardcoded dashboard metric.
4. Map every metric to its authoritative live domain/API source.
5. Identify any missing backend aggregation capability.
6. Verify role scoping and active enrollment rules.
7. Run baseline tests/checks.
8. Produce an audit report with proposed minimal implementation changes.
9. STOP for human approval.

No source implementation or migrations during the audit-only kickoff.

---

## 16. Completion Criteria

Task 5.7 is complete only when:

- Remaining in-scope dashboard mock metrics are removed or intentionally retired.
- Student dashboard consumes live authoritative data.
- Parent dashboard consumes live authoritative data and preserves child isolation.
- Faculty dashboard consumes live authorized data.
- Admin dashboard consumes live operational data.
- Principal dashboard consumes live institutional data.
- Dashboard/detail values are demonstrably consistent.
- No teacher performance ranking/evaluation is exposed.
- Server-side RBAC/scoping is verified.
- Full backend suite passes.
- Task 5.7 backend tests pass where applicable.
- Full frontend suite passes.
- Task 5.7 frontend tests pass.
- Django checks pass.
- Migration check passes.
- Frontend production build passes.
- Browser QA passes across all five roles.
- Documentation is updated.
- Git status is reviewed and changes are committed.

---

## 17. Governance Stop Condition

When all completion criteria pass:

```text
TASK 5.7 = COMPLETE
PHASE 5 = IN PROGRESS
TASK 5.8 = NOT STARTED
```

The coding agent MUST STOP.

Do not automatically begin Task 5.8.
