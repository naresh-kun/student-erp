# STUDENT ERP â€” TASK 2.7
# OPERATIONAL ALLOCATION, SEARCH & ATTENDANCE VISIBILITY REVISION

The previously completed Phase 2 is now receiving an approved functional/UI amendment.

Task 2.7 introduces the following newly approved requirements:

1. Student section allocation when a student joins
2. Class Teacher allocation
3. Student absentees visibility
4. Attendance-not-entered visibility
5. Search functionality for Admin, Principal and Faculty
6. Faculty subject assignment visibility
7. Update/Delete actions restricted to Admin and Principal

This task is a controlled extension of the existing frontend.

DO NOT redesign the application.
DO NOT start Phase 3.
DO NOT implement Django/API/PostgreSQL/Redis.
DO NOT change the approved stack.
DO NOT create new competing architecture.

==================================================
1. MANDATORY WORKFLOW
==================================================

Before making changes:

1. Read:
   - docs/PROJECT_STRUCTURE.md
   - docs/ARCHITECTURE.md
   - docs/FRONTEND_ARCHITECTURE.md
   - docs/RBAC_PERMISSIONS.md
   - docs/DECISIONS.md
   - docs/PROJECT_STATUS.md
   - docs/phases/PHASE_02_STATUS.md
   - docs/phase_prompts/Phase_2_Task_2.5.md
   - docs/phase_prompts/Phase_2_Task_2.6.md
   - relevant feature documentation

2. Inspect the current implementation of:
   - Admin
   - Principal
   - Faculty
   - Students
   - Attendance
   - Classes/Sections
   - Allocation
   - Faculty directory

3. Identify what already exists.

4. Reuse existing components, services, hooks, tables, dialogs, search patterns and permission utilities wherever possible.

5. Do not duplicate existing business logic.

==================================================
2. IMPORTANT ROLE DECISION
==================================================

Approved role behavior:

ADMIN:
- Can search students
- Can search faculty
- Can view allocation records
- Can update allocation records
- Can delete allocation records
- Can manage student section allocation
- Can manage Class Teacher allocation
- Can view student absentees
- Can view attendance-not-entered records

PRINCIPAL:
- Can search students
- Can search faculty
- Can view allocation records
- Can update allocation records
- Can delete allocation records
- Can manage Class Teacher allocation
- Can manage student section allocation where the allocation workspace exposes it
- Can view student absentees
- Can view attendance-not-entered records

FACULTY:
- Can search students
- Can search faculty
- Can view relevant student/faculty information
- Can view absentees for assigned classes/sections/subjects
- Can view attendance-not-entered records for their assigned attendance responsibilities
- MUST NOT receive Update/Delete controls for student/faculty master data or allocation records

The Update/Delete capability belongs to ADMIN and PRINCIPAL.

Do not expose admin/principal modification controls in Faculty UI.

==================================================
3. STUDENT SECTION ALLOCATION
==================================================

Implement/refine student section allocation.

Use the hierarchy already defined by the project:

Academic Year
â†’ Grade
â†’ Stream where applicable
â†’ Section
â†’ Student

When a student joins/is assigned:

Admin manages the section allocation.

Principal also has the approved Update/Delete capability for allocation records.

The allocation UI must visibly show the student record being allocated.

Recommended table columns:

- Student ID
- Student Name
- Grade
- Stream
- Section
- Roll Number
- Allocation Status
- Actions

Actions for Admin and Principal:

[Update]
[Delete]

Faculty must not see these actions.

Use confirmation before deletion.

Deletion must clearly communicate what is being deleted:
"Remove this student from the section allocation?"
Do not silently delete.

Do not change the student's immutable Student ID.

==================================================
4. CLASS TEACHER ALLOCATION
==================================================

Implement/refine Class Teacher allocation.

Admin and Principal are the authorized roles for this workflow.

Display:

- Faculty ID
- Faculty Name
- Designation
- Subject(s) Handling
- Academic Year
- Grade
- Stream where applicable
- Section
- Class Teacher status

Actions:

[Update]
[Delete]

Use the same enterprise table/action pattern as the student allocation interface.

Update should open a proper form/dialog.

Delete must require confirmation.

Do not use browser alert().

Use the existing non-blocking UI feedback pattern.

==================================================
5. FACULTY SUBJECT VISIBILITY
==================================================

Whenever a faculty member is displayed in an allocation or directory context, clearly show the subject(s) that faculty handles.

Examples:

Mathematics
Physics

or multiple compact subject badges/tags where appropriate.

Faculty subject information should be visible in:

- Faculty search results
- Faculty directory
- Class Teacher allocation
- Faculty allocation
- Relevant Admin views
- Relevant Principal views

Do not invent additional subjects for existing mock faculty.

Use the current mock faculty-service data.

==================================================
6. STUDENT ABSENTEES LIST
==================================================

Add/refine a dedicated attendance visibility surface for:

ADMIN
FACULTY
PRINCIPAL

The interface must clearly show students whose attendance status is:

ABSENT

Do not combine:

LEAVE
ABSENT

They remain distinct statuses.

ON_DUTY must not appear in the absentee list.

PRESENT must not appear.

Recommended filters:

- Academic Year
- Date
- Grade
- Stream where applicable
- Section
- Subject
- Period/slot where applicable

Recommended columns:

- Student ID
- Student Name
- Grade
- Section
- Subject
- Date
- Period
- Attendance Status

For Admin and Principal:

allow school-wide visibility.

For Faculty:

scope the list to the faculty member's assigned classes/subjects/attendance responsibilities.

==================================================
7. ATTENDANCE NOT ENTERED LIST
==================================================

Add/refine a dedicated visibility surface for attendance sessions that have NOT been entered/marked.

This must be accessible to:

- Admin
- Principal
- Faculty

Meaning:

show the expected attendance session/slot where attendance has not yet been entered.

This is NOT the same as an absent student.

The distinction must be visually and semantically clear.

Example:

Attendance Not Entered
Class 8-A
Mathematics
Period 3
26 Sep 2026

Possible table columns:

- Date
- Grade
- Stream
- Section
- Subject
- Period
- Faculty
- Session Status

Possible status:

NOT ENTERED

Do not invent fake attendance records.

Use the current mock attendance/session data architecture.

For Faculty:
Only show attendance sessions relevant to that faculty's assigned responsibilities.

For Admin and Principal:
Allow broader school-wide visibility.

==================================================
8. SEARCH BAR â€” ADMIN
==================================================

Admin must have search capability for:

STUDENTS
FACULTY

Student search should support appropriate existing fields such as:

- Student ID
- Student Name
- Class
- Section

Faculty search should support:

- Faculty ID
- Faculty Name
- Subject
- Designation

Search should be fast and non-blocking.

Use a clear search input.

Example placeholder:

"Search Student ID, name, class or section..."

Faculty:

"Search Faculty ID, name or subject..."

Search results should use the existing enterprise table patterns.

Admin sees Update/Delete actions where the role is authorized.

==================================================
9. SEARCH BAR â€” PRINCIPAL
==================================================

Principal receives the same search capability:

Students
Faculty

Maintain Principal's approved role separation.

The search interface should allow the Principal to quickly locate:

- student allocation
- faculty allocation
- class teacher assignment
- relevant descriptive faculty information

Update/Delete appears only where this new approved permission explicitly applies.

Do not turn Principal into a general replacement for all Admin CRUD.

==================================================
10. SEARCH BAR â€” FACULTY
==================================================

Faculty receives a search interface.

Faculty may search for:

- Student
- Faculty

Faculty search is for finding/viewing information.

Do NOT provide Update/Delete controls.

Keep Faculty within the approved non-evaluative scope.

No:
- faculty ratings
- performance scores
- rankings
- evaluations
- appraisal fields

==================================================
11. SEARCH UX
==================================================

Follow the existing School ERP visual language.

Use:

- bordered input
- search icon
- clear placeholder
- table results
- result count
- "No results found" state
- loading state if applicable

Search should work on the client-side mock data through the service layer.

Do NOT directly import raw JSON into UI components.

Preferred architecture:

Search UI
â†“
Hook
â†“
Domain Service
â†“
MockDataService
â†“
Synthetic Data

==================================================
12. UPDATE DIALOGS
==================================================

For authorized Admin/Principal actions:

Update dialogs/forms should be designed as real enterprise forms.

Student allocation update:

- Student
- Grade
- Stream when applicable
- Section
- Roll Number if allocation-owned
- Allocation status

Faculty/Class Teacher update:

- Faculty
- Grade
- Stream when applicable
- Section
- Academic Year
- Assignment

Use existing form components and validation.

Do not allow editing immutable Student ID.

Do not introduce backend persistence.

Phase 2/2.7 remains mock-state based.

Clearly label simulated state when necessary.

==================================================
13. DELETE WORKFLOW
==================================================

Delete actions only for:

Admin
Principal

Use confirmation dialog.

Dialog must state the exact record:

Example:

"Remove Arun Kumar (STU202600001) from Class 8-A?"

For Class Teacher:

"Remove R. Suresh as Class Teacher for Class 8-A?"

After confirmation:

- update mock UI state
- display non-blocking success feedback
- refresh result list

Do not use alert().

Do not claim server/database deletion.

==================================================
14. STREAM-AWARE BEHAVIOR
==================================================

Preserve existing stream rules:

Grades 11â€“12:

Computer Science A
Bio-Maths B
Commerce C
Pure Science D

Sections remain:

A1/A2/A3
B1/B2/B3
C1/C2/C3
D1/D2/D3

Lower grades do not use streams.

Do not create cross-stream allocations.

==================================================
15. ATTENDANCE MODEL MUST REMAIN UNCHANGED
==================================================

Exactly four statuses:

PRESENT
ABSENT
ON_DUTY
LEAVE

LATE and EXCUSED remain removed.

Attendance formula remains:

(PRESENT + ON_DUTY)
/
(PRESENT + ABSENT + ON_DUTY + LEAVE)
Ã— 100

Absentee list:

ONLY ABSENT

Attendance-not-entered:

A session has no attendance submitted/marked.

Do not confuse these two concepts.

==================================================
16. UI DESIGN TARGET
==================================================

Use the existing School ERP design system.

Traditional enterprise school software.

No:
- dark mode
- neon
- AI sparkle aesthetics
- glassmorphism
- futuristic dashboards
- excessive rounded cards
- decorative animation

Use:
- deep blue
- light theme
- flat bordered tables/panels
- compact action buttons
- restrained badges
- clear page titles
- breadcrumb
- search/filter toolbar

Use the generated allocation mockup only as visual inspiration for:
- table hierarchy
- search placement
- action buttons
- allocation information density

Do NOT copy its fictional school branding or data.

==================================================
17. COMPONENT REUSE
==================================================

Before creating new components, inspect whether the project already contains reusable:

- SearchInput
- DataTable
- FilterBar
- Modal
- ConfirmationDialog
- EmptyState
- LoadingState
- ErrorState
- StatusBadge
- ActionButtons

Reuse existing components.

Do not create duplicate versions.

==================================================
18. TESTING REQUIREMENTS
==================================================

Add tests for:

Student allocation:
- visible to Admin
- visible to Principal
- Update visible to Admin
- Update visible to Principal
- Delete visible to Admin
- Delete visible to Principal
- Faculty cannot see modification actions

Class Teacher allocation:
- Admin can update
- Admin can delete
- Principal can update
- Principal can delete
- Faculty cannot modify

Search:
- Admin student search
- Admin faculty search
- Principal student search
- Principal faculty search
- Faculty student search
- Faculty faculty search
- no-result handling

Absentee list:
- ABSENT appears
- PRESENT does not appear
- ON_DUTY does not appear
- LEAVE does not appear

Attendance Not Entered:
- unmarked session appears
- marked session does not appear
- Faculty scope is respected
- Admin/Principal broader visibility is respected

Faculty subject visibility:
- subject data appears in faculty results/allocation views

Run the entire existing test suite as well.

Do not delete or weaken existing tests.

==================================================
19. BROWSER QA
==================================================

Test all three roles:

ADMIN
PRINCIPAL
FACULTY

Verify:

- login
- dashboard
- search
- search result filtering
- student allocation
- faculty/class teacher allocation
- Update dialog
- Delete confirmation
- success feedback
- absentee list
- attendance-not-entered list
- faculty subject display
- unauthorized action visibility
- responsive behavior
- 404
- logout/login

Check browser console.

No unhandled runtime errors.

==================================================
20. DOCUMENTATION
==================================================

Create:

docs/phase_prompts/Phase_2_Task_2.7.md

Update:

docs/phases/PHASE_02_STATUS.md
docs/PROJECT_STATUS.md
docs/CHANGELOG.md
docs/RBAC_PERMISSIONS.md

If this amendment requires an architectural/permission decision, update:

docs/DECISIONS.md

Documentation must explicitly state:

- this is an approved post-Phase-2 functional amendment
- Admin permissions
- Principal permissions
- Faculty restrictions
- student allocation behavior
- Class Teacher allocation behavior
- absentee visibility
- attendance-not-entered visibility
- search behavior
- mock-state limitation

Do not silently overwrite historical Phase 2 records.

==================================================
21. PHASE BOUNDARY
==================================================

STRICTLY OUT OF SCOPE:

- Django
- DRF
- PostgreSQL
- Redis
- WebSockets
- real authentication
- JWT
- backend persistence
- real audit backend
- Phase 3 implementation
- new major ERP domains

This task is frontend/UI/service/mock-data work only.

==================================================
22. COMPLETION CRITERIA
==================================================

Task 2.7 is COMPLETE only when:

[ ] Student section allocation visible
[ ] Admin can Update/Delete student allocation
[ ] Principal can Update/Delete student allocation
[ ] Class Teacher allocation visible
[ ] Admin can Update/Delete Class Teacher allocation
[ ] Principal can Update/Delete Class Teacher allocation
[ ] Faculty cannot modify allocations
[ ] Faculty subjects visibly displayed
[ ] Admin student search implemented
[ ] Admin faculty search implemented
[ ] Principal student search implemented
[ ] Principal faculty search implemented
[ ] Faculty student search implemented
[ ] Faculty faculty search implemented
[ ] Admin absentee list implemented
[ ] Faculty absentee list implemented
[ ] Principal absentee list implemented
[ ] Admin attendance-not-entered list implemented
[ ] Faculty attendance-not-entered list implemented
[ ] Principal attendance-not-entered list implemented
[ ] Four-status attendance model unchanged
[ ] No LATE/EXCUSED reintroduced
[ ] Stream rules preserved
[ ] No faculty evaluation functionality introduced
[ ] No browser alert() introduced
[ ] Existing service abstraction preserved
[ ] No raw JSON imports in UI
[ ] Tests pass
[ ] Build passes
[ ] Browser QA passes
[ ] Documentation updated

==================================================
23. FINAL REPORT
==================================================

Report:

# Task 2.7 Completion Report

## Status

COMPLETE / BLOCKED

## Requirements Implemented

## Files Changed

## Student Allocation

## Class Teacher Allocation

## Faculty Subject Visibility

## Search

## Absentee Lists

## Attendance Not Entered

## Role Permissions

## Tests

Report exact test count.

## Build

Report exact build result.

## Browser QA

Report roles/routes/workflows tested.

## Documentation

List all updated documents.

## Known Limitations

State clearly that changes are mock/frontend state until later backend integration.

## Architecture Verification

Confirm that the Phase 2 service abstraction remains intact.

Do NOT start Phase 3.

Stop after the final report.
