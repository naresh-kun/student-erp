# STUDENT ERP — PHASE 2 TASK 2.6
## Hardening, Cross-Module Reconciliation, QA & Phase 2 Closure

You are working on the Student ERP project.

This is the FINAL task of PHASE 2.

Do NOT start Phase 3.
Do NOT introduce backend/API/database integration.
Do NOT redesign the architecture.

Your responsibility is to perform a complete hardening, reconciliation, quality assurance, documentation, and demo-readiness pass over all Phase 2 work from Tasks 2.1–2.5.

==================================================
1. NON-NEGOTIABLE WORKFLOW
==================================================

Before changing anything:

1. Read all relevant existing Markdown documentation.
2. Read:
   - docs/phase_prompts/
   - docs/phases/
   - PHASE_02_STATUS.md
   - PROJECT_STATUS.md
   - CHANGELOG.md
   - relevant master/context documentation already present in the repository
3. Inspect the current frontend implementation.
4. Inspect the actual route structure.
5. Inspect services, hooks, utilities, mock data, types, tests, configuration and layouts.
6. Compare implementation against the approved Phase 2 scope and amendments.
7. Build an explicit issue checklist before making changes.

Do NOT assume the current implementation is correct simply because previous tasks passed.

For every discovered issue:

DISCOVER → VERIFY → FIX → TEST → DOCUMENT.

At the end of the task:
- update documentation,
- run tests,
- run production build,
- perform browser/demo QA,
- verify no architecture drift,
- report exact changes.

==================================================
2. AUTHORITATIVE PHASE 2 ARCHITECTURE
==================================================

Phase 2 remains frontend-first and mock-data driven.

Required architecture:

UI
  ↓
Feature/service abstraction
  ↓
Mock service
  ↓
JSON / deterministic mock data

Later architecture:

UI
  ↓
API service
  ↓
Django REST API
  ↓
PostgreSQL

The UI must remain decoupled from the underlying data source.

DO NOT:
- connect to Django
- add real authentication
- add PostgreSQL
- add Redis
- add Channels
- add real APIs
- replace mock services with API calls
- create a competing architecture
- move backend responsibilities into frontend pages

==================================================
3. PRIMARY TASK OBJECTIVE
==================================================

Perform a full Phase 2 hardening audit covering:

A. Architecture consistency
B. Route consistency
C. Role and authorization behavior
D. Indian-school academic model
E. Attendance model
F. Grading model
G. Student ID model
H. Grade 11–12 stream model
I. Faculty scope restrictions
J. Admin/Principal separation
K. Mock-data/service separation
L. Branding consistency
M. UI/UX consistency
N. Accessibility
O. Responsive behavior
P. Error/empty/loading states
Q. Test coverage and regression
R. Demo readiness
S. Documentation consistency

==================================================
4. CRITICAL ACADEMIC MODEL AUDIT
==================================================

Search the ENTIRE ACTIVE CODEBASE.

There must be ZERO active usage of:

- GPA
- CGPA
- university GPA concepts
- credits as academic grading
- university-style grading
- semester-credit calculations

The system must use:

- raw marks out of 100
- cumulative marks
- maximum marks
- overall percentage
- letter grade

Percentage:

percentage =
(cumulative marks / maximum marks) * 100

Round to 2 decimal places.

Grade bands must remain:

A1 = 91+
A2 = 81 to <91
B1 = 71 to <81
B2 = 61 to <71
C1 = 51 to <61
C2 = 41 to <51
D  = 33 to <41
E  = <33

These thresholds must come from the shared grading utility/data configuration.

There must be ONE shared grading calculation utility.

Pages/components must NOT duplicate grading logic.

Verify edge cases:

32.99
33
40.99
41
90.99
91
100

Run and verify the grading tests.

==================================================
5. ATTENDANCE AUDIT
==================================================

The FINAL active attendance statuses are exactly:

PRESENT
ABSENT
ON_DUTY
LEAVE

LATE must remain removed.
EXCUSED must remain removed.

LEAVE rules:

- LEAVE is distinct from ABSENT.
- Faculty/school permission is required.
- Faculty is responsible for approving/marking LEAVE.
- LEAVE counts as absence for attendance percentage.

ON_DUTY rules:

- ON_DUTY is a distinct status.
- ON_DUTY counts as present for attendance percentage.

Attendance percentage:

(PRESENT + ON_DUTY)
/
(PRESENT + ABSENT + ON_DUTY + LEAVE)
× 100

Audit all:
- types
- mock data
- utilities
- tables
- badges
- filters
- charts
- dashboards
- student pages
- parent pages
- faculty pages
- admin pages
- principal pages
- reports
- notifications

Ensure every module uses the same four-status model.

Search for accidental:
- LATE
- EXCUSED
- old three-status implementations
- inconsistent formulas
- duplicated attendance calculations

Where appropriate, centralize repeated attendance calculations into reusable utilities/services.

==================================================
6. STUDENT ID AUDIT
==================================================

Student ID must remain:

- permanent
- unique
- immutable
- system-generated business identifier
- uppercase/case-insensitive

Approved proposed format:

STU + 4-digit admission year + 5-digit sequence

Example:

STU202600001

Verify that:
- student pages display Student ID consistently
- parent login uses Student ID
- mock records use consistent IDs
- parent-child relationships use Student ID correctly
- Student ID is never editable through UI
- there is no competing identifier presented as the primary business ID

==================================================
7. PARENT LOGIN / CHILD SCOPING
==================================================

Verify:

Parent username = linked child's Student ID.

Parent must only see authorized linked-child data.

No parent route should expose:
- unrelated students
- administrative records
- faculty management
- other parents
- school-wide controls

If multi-child behavior is already implemented, verify it against the current documented behavior.

Do NOT invent a new multi-child policy in this task.

==================================================
8. GRADE 11–12 STREAM AUDIT
==================================================

For Grades 11 and 12:

Computer Science:
A
A1/A2/A3 sections

Bio-Maths:
B
B1/B2/B3 sections

Commerce:
C
C1/C2/C3 sections

Pure Science:
D
D1/D2/D3 sections

Verify:
- grade 11/12 students have one stream + section
- lower grades do not incorrectly use streams
- Admin hierarchy reflects:

Academic Year
→ Grade
→ Stream (11–12)
→ Section
→ Student

- allocation does not cross stream boundaries
- Principal filtering respects streams

Do NOT invent additional stream structures.

==================================================
9. FACULTY SCOPE AUDIT
==================================================

Faculty scope must NOT contain:

- performance reviews
- ratings
- star ratings
- performance scores
- rankings
- evaluative remarks
- AI teaching-performance analysis
- faculty appraisal forms

Allowed faculty information includes:

- name
- designation
- contact details
- subjects
- class assignments
- timetable
- descriptive workload counts
- audit/activity information

Search all active code/data/docs for accidental evaluative faculty content.

==================================================
10. IMPORTANT TASK 2.5 CLEANUP
==================================================

Audit the Admin and Principal implementation for terminology that was introduced without being explicitly approved in the master architecture.

In particular inspect:

1. "statutory endorsement workflow"
2. "OD-eligible credit flags"

These terms must NOT be presented as established official school policy unless explicitly supported by the approved project documentation.

If they are merely demo/internal concepts:

- rename them to neutral mock/demo terminology, OR
- remove them if unnecessary.

Do NOT invent statutory requirements.

Do NOT invent board rules.

Do NOT add unsupported compliance claims.

The application should clearly distinguish:
- actual project requirements
- configurable assumptions
- synthetic demo data
- future/backend functionality

==================================================
11. BRANDING AUDIT
==================================================

The active product name is:

School ERP

Search the entire active application for:
- previous synthetic school names
- old branding
- conflicting titles
- inconsistent sidebar/header names
- old domain names
- university branding
- placeholder project names visible to users

Ensure:
- browser title is consistent
- login page is consistent
- header is consistent
- sidebar is consistent
- printable/report views are consistent
- mock emails/domains use the approved School ERP identity

Do NOT introduce a new school brand.

==================================================
12. UI/UX AUDIT
==================================================

Required design language:

Traditional enterprise school software.

Verify:
- fixed left sidebar
- text labels
- top header
- school/academic year/user/role context
- breadcrumb
- page title
- 12-column/grid-based layout where appropriate
- tables as primary data presentation
- restrained charts
- light theme

Typography:
- Inter / Segoe UI / Arial
- body text >= 14px where practical

Visual requirements:
- deep blue enterprise-style palette
- flat bordered panels
- radius <= 6px
- minimal shadow
- minimal motion
- transitions <= approximately 150ms

Must NOT contain:
- neon
- glowing UI
- dark sci-fi dashboards
- glassmorphism
- animated backgrounds
- 3D blobs
- oversized rounded cards
- AI sparkle aesthetics
- emoji-heavy UI

Dark mode is out of scope.

Fix obvious inconsistencies.

==================================================
13. MOCK-DATA / SERVICE ABSTRACTION AUDIT
==================================================

Inspect every feature.

Pages/components should NOT directly depend on raw JSON imports where a service abstraction already exists.

Expected model:

page
→ hook/service
→ MockDataService
→ mock data

Look for:
- inline large datasets
- duplicated mock records
- hardcoded business logic inside components
- direct JSON imports in UI files
- duplicated calculations
- role logic repeated across pages
- duplicated formatting utilities

Refactor only where necessary.

Do not over-engineer.

==================================================
14. ROUTE AUDIT
==================================================

Verify all intended Phase 2 application routes.

Verify:
- root redirect behavior
- login route
- role routes
- nested routes
- unauthorized route handling
- unknown route → 404
- protected routes
- role guards
- navigation links
- breadcrumbs
- direct URL navigation

Test role boundaries.

Examples:

Student → must not access Admin
Parent → must not access Faculty/Admin
Faculty → must not access Principal-only pages
Admin → must not accidentally render Principal-only UI
Principal → must not receive operational editing controls reserved for Admin

Do not confuse UI hiding with future secure backend authorization.

Phase 2 auth remains DEMO/MOCK authentication.

==================================================
15. AUTHENTICATION HONESTY
==================================================

Verify the login experience accurately communicates its Phase 2 nature.

It may use synthetic demo credentials.

It must NOT imply:
- production-grade authentication
- hashed backend credentials
- secure server-side authorization
- real institutional identity verification

The role must come from the synthetic user record rather than a manual role selector.

The dev-only helper must remain development-oriented and must not become the primary public login flow.

==================================================
16. LOADING / EMPTY / ERROR STATES
==================================================

Audit every major page.

Ensure realistic states exist where appropriate:

Loading
Empty
No results
Invalid input
Unauthorized
Not found
Action success
Action failure

Do not create fake functionality.

Where a feature is intentionally mock-only, show an appropriate neutral status rather than implying backend persistence.

==================================================
17. ACCESSIBILITY AUDIT
==================================================

Perform a practical accessibility review.

Verify:
- keyboard navigation
- visible focus states
- button labels
- form labels
- semantic headings
- sufficient contrast
- table headers
- accessible dialogs/modals
- no critical information conveyed by color alone
- reasonable screen-reader semantics

Target WCAG AA contrast of 4.5:1 for normal text.

Fix high-impact issues discovered.

==================================================
18. RESPONSIVE / BROWSER AUDIT
==================================================

Test important routes at:

Desktop
Tablet
Mobile-width viewport

Look for:
- overflowing tables
- clipped buttons
- broken sidebars
- unusable dialogs
- overlapping headers
- broken charts
- unreadable text
- horizontal overflow
- broken navigation

Preserve the enterprise desktop layout while making smaller screens usable.

==================================================
19. DATA CONSISTENCY AUDIT
==================================================

Check cross-module consistency.

The same synthetic person must not have contradictory:
- Student ID
- class
- section
- stream
- attendance totals
- marks
- role
- parent linkage
- faculty assignment

Check relationships between:

Student
Parent
Faculty
Admin
Principal
Class
Section
Subject
Attendance
Marks
Timetable
Calendar
Allocation

Avoid contradictory demo data.

==================================================
20. REALISM WITHOUT FALSE CLAIMS
==================================================

The app is for a higher-up/demo presentation.

Make demo data realistic and coherent.

However:

DO NOT claim that mock data is:
- live
- official
- statutory
- government-verified
- board-certified
- institution-approved

unless the documentation explicitly supports that claim.

Use labels such as:
- Demo data
- Mock data
- Sample
- Preview
- Simulated

where necessary.

==================================================
21. TESTING
==================================================

Run the complete frontend test suite.

Do not merely run newly added tests.

Verify:
- all existing tests pass
- grading edge cases pass
- attendance status tests pass
- role guard tests pass
- route tests pass
- parent scoping tests pass
- mock service tests pass
- Admin/Principal tests pass
- component tests pass

Fix regressions instead of deleting tests.

Then run:

npm run build

There must be zero build errors.

Investigate significant warnings.

Do NOT use:

npm audit fix --force

Do NOT perform unrelated dependency upgrades.

Do NOT upgrade major packages merely for the sake of upgrading.

==================================================
22. BROWSER / VISUAL QA
==================================================

Perform a browser-based walkthrough.

At minimum validate:

LOGIN
Student dashboard
Student attendance
Student marks
Student timetable

Parent dashboard
Parent attendance
Parent marks
Parent timetable

Faculty dashboard
Faculty attendance
Faculty leave approval/marking
Faculty marks
Faculty timetable

Admin dashboard
Student management
Parent management
Faculty directory
Classes/sections/streams
Subjects
Attendance
Marks
Timetable
Calendar
Allocation

Principal dashboard
Academics
Attendance
Faculty directory
Reports

Also test:
- invalid route
- unauthorized route
- logout/login
- navigation
- dialogs
- forms
- filters
- tables
- charts

Check console for runtime errors.

Zero known blocking runtime errors.

==================================================
23. DEPENDENCY / CODE QUALITY AUDIT
==================================================

Inspect:
- unused imports
- dead components
- duplicated components
- stale files
- conflicting utilities
- stale route definitions
- stale docs
- accidental build files
- Python cache files if present
- temporary debug code
- console.log statements that should not ship

Do not remove files blindly.

Verify references before deleting.

==================================================
24. DOCUMENTATION REQUIREMENT
==================================================

At the end of this task update:

1. docs/phase_prompts/Phase_2_Task_2.6.md
2. docs/phases/PHASE_02_STATUS.md
3. docs/PROJECT_STATUS.md
4. docs/CHANGELOG.md

Documentation must include:

- task objective
- audit scope
- issues discovered
- fixes made
- tests run
- build result
- browser QA result
- accessibility checks
- architecture verification
- known limitations
- unresolved assumptions
- final Phase 2 status

Do NOT silently alter architecture rules.

If a discovered assumption remains unresolved, document it explicitly.

==================================================
25. PHASE 2 EXIT CRITERIA
==================================================

Task 2.6 is complete only when all are true:

[ ] No active GPA/CGPA implementation
[ ] No university-credit grading model
[ ] Marks are /100
[ ] Shared grading utility is used
[ ] Grading edge cases pass
[ ] Attendance has exactly PRESENT/ABSENT/ON_DUTY/LEAVE
[ ] LATE and EXCUSED remain removed
[ ] Attendance formula is consistent
[ ] LEAVE is distinct from ABSENT
[ ] ON_DUTY is handled consistently
[ ] Student ID is consistent
[ ] Parent login uses Student ID
[ ] Parent child scoping works
[ ] Grade 11–12 streams are consistent
[ ] Faculty evaluation functionality is absent
[ ] Admin/Principal boundaries are correct
[ ] Unsupported "statutory" claims are removed/relabelled
[ ] Unsupported OD-credit terminology is removed/relabelled
[ ] School ERP branding is consistent
[ ] Mock/service abstraction remains intact
[ ] No backend/API integration has been introduced
[ ] Routes are coherent
[ ] Unauthorized routes are guarded
[ ] 404 works
[ ] Loading/empty/error states are acceptable
[ ] Accessibility issues are addressed
[ ] Responsive layout is acceptable
[ ] Cross-module demo data is consistent
[ ] Full test suite passes
[ ] Production build passes
[ ] Browser QA passes
[ ] Console/runtime errors are resolved
[ ] Required documentation is updated
[ ] No unapproved architecture changes exist

==================================================
26. FINAL REPORT FORMAT
==================================================

After implementation provide a concise but complete report:

# Task 2.6 Completion Report

## 1. Status
COMPLETE / BLOCKED

## 2. Hardening Scope
What was audited.

## 3. Issues Found
Exact issues discovered.

## 4. Fixes Applied
Exact files/modules changed and what changed.

## 5. Architecture Verification
Confirm Phase 2 mock-service architecture remains intact.

## 6. Academic / Attendance Verification
Confirm grading and four-status attendance model.

## 7. Role / Security Verification
Confirm mock authentication and role boundaries.

## 8. UI / Accessibility / Responsive QA
Summary of results.

## 9. Testing
Report exact test count.

## 10. Build
Report exact build result.

## 11. Browser QA
Report routes/workflows checked and console result.

## 12. Documentation
List every Markdown file updated.

## 13. Known Limitations
Only genuine remaining Phase 2 limitations.

## 14. Phase 2 Readiness
State whether all Phase 2 exit criteria are satisfied.

IMPORTANT:

Do NOT begin Phase 3 implementation.

Phase 3 starts only after explicit approval following the Phase 2 completion review.