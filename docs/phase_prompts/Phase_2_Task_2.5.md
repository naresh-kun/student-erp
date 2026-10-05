# PHASE 2 — TASK 2.5
# Deep Admin & Principal Role Experiences

## Objective

Deepen the Admin and Principal roles into complete, professional institutional-management experiences for the Indian School ERP.

This task covers:

ADMIN:
- Dashboard
- Student directory
- Parent directory
- Faculty directory
- Classes
- Subjects
- Attendance oversight
- Marks oversight
- Timetable
- Calendar/events
- Class/section/stream allocation
- Operational management surfaces

PRINCIPAL:
- Executive dashboard
- Academic overview
- Attendance analytics
- Faculty directory oversight
- Reports
- Institutional summaries
- Report/oversight actions where appropriate

This remains a PHASE 2 frontend + mock-data task.

DO NOT start Phase 3.

---

# 1. AUTHORITATIVE ARCHITECTURE

Frontend:
React + TypeScript + Vite

Backend:
Django + Django REST Framework + Django Channels

Database:
PostgreSQL

Realtime / Cache:
Redis

Phase 2 data flow:

React
↓
Feature / Hook
↓
Service abstraction
↓
MockDataService
↓
Mock JSON

The architecture must remain unchanged.

Application branding:

School ERP

Indian school model:
- Academic Year
- Grade/Class
- Stream
- Section
- Student ID
- Marks /100
- Cumulative Marks
- Percentage
- Letter Grade
- PRESENT
- ABSENT
- ON_DUTY
- LEAVE

---

# 2. BEFORE IMPLEMENTATION

Read:

1. docs/PROJECT_STRUCTURE.md
2. docs/ARCHITECTURE.md
3. docs/FRONTEND_ARCHITECTURE.md
4. docs/RBAC_PERMISSIONS.md
5. docs/API_CONTRACT.md
6. docs/DATABASE_SCHEMA.md
7. docs/PROJECT_STATUS.md
8. docs/DECISIONS.md
9. docs/CHANGELOG.md
10. docs/phase_prompts/PHASE_02.md
11. docs/phases/PHASE_02_STATUS.md
12. docs/phase_prompts/Phase_2_Task_2.4.md

Also inspect:

- Existing Admin implementation
- Existing Principal implementation
- Student feature module
- Parent feature module
- Faculty feature module
- Mock services
- Mock datasets
- Navigation
- Shared components
- Attendance utility
- Grading utility
- School configuration

Understand the existing implementation before making changes.

---

# 3. ADMIN ROLE — APPROVED SCOPE

Admin is responsible for operational school management.

Admin can manage:

- Students
- Parents
- Faculty
- Classes
- Sections
- Streams
- Subjects
- Academic Years
- Enrollment
- Attendance
- Marks
- Timetable
- Academic Calendar
- Events
- Class Allocation
- Operational school records

Admin is the primary operational-management role.

---

# 4. PRINCIPAL ROLE — APPROVED SCOPE

Principal has school-wide oversight.

Principal can view:

- School-wide academic information
- Student performance
- Class-wise attendance
- Section-wise attendance
- Faculty directory information
- Faculty subject/class assignments
- Faculty timetable
- Reports
- Academic overview
- School-wide dashboards
- Student/class performance analytics

Principal may have approval/oversight capabilities.

Principal does NOT need unrestricted CRUD over every administrative record.

---

# 5. FEATURE ARCHITECTURE

Create/extend:

frontend/src/features/admin/

and:

frontend/src/features/principal/

Use the established modular pattern:

features/<domain>/
├── types/
├── schemas/
├── services/
├── hooks/
├── components/
└── index.ts

Follow the architecture already established in:

features/students/
features/parents/
features/faculty/

Do not create duplicate or competing structures.

---

# 6. ADMIN DOMAIN TYPES

Create strongly typed models only where needed:

- AdminDashboardSummary
- AdminStudentRecord
- AdminParentRecord
- AdminFacultyRecord
- AdminClassRecord
- AdminSectionRecord
- AdminSubjectRecord
- AdminAcademicYear
- AdminAttendanceSummary
- AdminMarksSummary
- AdminAllocationRequest
- AllocationPreview
- AllocationHistory
- AdminCalendarEvent
- any other genuinely required model

Reuse shared domain types wherever possible.

---

# 7. PRINCIPAL DOMAIN TYPES

Create strongly typed models only where needed:

- PrincipalDashboardSummary
- AcademicOverview
- PrincipalAttendanceSummary
- GradePerformanceSummary
- SectionPerformanceSummary
- PrincipalFacultyDirectoryItem
- PrincipalReport
- ReportApprovalState
- PrincipalEventSummary
- any other genuinely required model

Do not create faculty performance-scoring models.

---

# 8. ADMIN SERVICE

Create/extend:

frontend/src/features/admin/services/adminService.ts

The UI must use:

React
↓
Admin Hook
↓
Admin Service
↓
MockDataService
↓
Mock JSON

Service capabilities should include:

- Dashboard summaries
- Student directory
- Parent directory
- Faculty directory
- Class/section data
- Subject catalog
- Attendance summaries
- Marks summaries
- Timetable information
- Calendar/events
- Allocation preview
- Allocation execution in mock state
- Allocation history

Do not import large JSON files directly into pages.

---

# 9. PRINCIPAL SERVICE

Create/extend:

frontend/src/features/principal/services/principalService.ts

Service should provide:

- Executive dashboard data
- Academic overview
- Attendance analytics
- Faculty directory
- Reports
- School events
- Institutional summaries
- Oversight state where required

Keep Principal data read/oversight oriented.

---

# 10. ADMIN DASHBOARD

Deepen:

/admin/dashboard

The dashboard should feel like an Indian school office-management dashboard.

Display useful institutional KPIs such as:

- Total Students
- Total Parents
- Total Faculty
- Total Classes
- Total Sections
- Current Academic Year
- Today's Attendance
- Recent Examination Activity
- Upcoming School Events
- Pending Operational Actions
- Class Allocation Entry Point

Use concise school-management language.

Do not overload the dashboard with unnecessary analytics.

---

# 11. ADMIN STUDENT DIRECTORY

Deepen:

/admin/students

Provide a professional student master register.

Show:

- Student ID
- Admission Number
- Roll Number
- Student Name
- Class / Grade
- Stream where applicable
- Section
- Academic Year
- Attendance %
- Academic %
- Letter Grade
- Parent/Guardian
- Status

Provide:

- Search
- Filtering
- Sorting
- Pagination where appropriate
- Student detail action
- Export action if supported by current architecture

Student ID must remain permanent and immutable.

Do not expose editing of the Student ID itself.

---

# 12. ADMIN PARENT DIRECTORY

Deepen:

/admin/parents

Show:

- Parent name
- Relationship
- Linked child/children
- Student ID
- Contact information where appropriate
- Account/status information appropriate for the mock UI

Ensure parent-child relationships come from mock data.

Do not expose unrelated private records.

---

# 13. ADMIN FACULTY DIRECTORY

Deepen:

/admin/faculty

Display descriptive faculty information:

- Faculty Name
- Faculty ID / Employee Code where available
- Designation
- Subject
- Class Teacher assignment
- Assigned Classes
- Timetable/workload
- Contact information where appropriate
- Status

DO NOT include:

- Rating
- Performance score
- Review score
- Appraisal stars
- Teacher ranking
- Teaching-performance leaderboard
- AI-generated teacher evaluation

Faculty information is descriptive and operational only.

---

# 14. ADMIN CLASSES & SECTIONS

Deepen:

/admin/classes

Represent school hierarchy:

Academic Year
→ Grade/Class
→ Stream (Grades 11–12)
→ Section
→ Students

Grades below 11:
- No stream

Grades 11–12:
- Computer Science A → A1, A2, A3
- Bio-Maths B → B1, B2, B3
- Commerce C → C1, C2, C3
- Pure Science D → D1, D2, D3

Display:

- Grade
- Stream
- Section
- Class Teacher
- Student Count
- Subject Count where appropriate
- Weekly Periods where appropriate

Do not use university department/degree terminology.

---

# 15. ADMIN SUBJECT CATALOG

Deepen:

/admin/subjects

Show a school curriculum-style subject catalog.

Fields may include:

- Subject
- Subject Code where appropriate
- Grade applicability
- Stream applicability
- Assigned faculty count
- Weekly Periods

Use school terminology.

Do not use:

- Credits
- Credit Hours
- GPA weighting

---

# 16. ADMIN ATTENDANCE OVERVIEW

Deepen:

/admin/attendance

Provide school-wide operational attendance oversight.

Use exactly:

PRESENT
ABSENT
ON_DUTY
LEAVE

Rules:

PRESENT = presence
ON_DUTY = presence
LEAVE = absence
ABSENT = absence

Formula:

(PRESENT + ON_DUTY)
/
(PRESENT + ABSENT + ON_DUTY + LEAVE)
× 100

Reuse:

frontend/src/utils/attendance.ts

Display:

- Overall attendance
- Class-wise attendance
- Section-wise attendance
- Present count
- On Duty count
- Approved Leave count
- Absent count
- Date
- Academic Year
- Grade
- Stream
- Section
- Attendance session state

LEAVE must remain visually distinct from ABSENT.

Do not reintroduce LATE or EXCUSED.

---

# 17. ADMIN MARKS OVERVIEW

Deepen:

/admin/marks

Provide operational examination oversight.

Show:

- Academic Year
- Exam Type
- Grade
- Stream
- Section
- Subject
- Students assessed
- Marks completion
- Average percentage
- Grade distribution

Student-level records may display:

- Student ID
- Student Name
- Marks /100
- Percentage
- Letter Grade

Do not allow this task to introduce:

- GPA
- CGPA
- Credits
- Grade Points

---

# 18. ADMIN TIMETABLE

Deepen:

/admin/timetable

Show/manage the school timetable structure.

Include:

- Academic Year
- Grade
- Stream
- Section
- Day
- Period
- Time
- Subject
- Faculty
- Room

Use school period terminology.

The timetable must remain compatible with the Faculty attendance-slot architecture.

---

# 19. ADMIN CALENDAR & EVENTS

Deepen:

/admin/calendar

Admin can manage mock school calendar information:

- Examinations
- Parent-Teacher Meetings
- Holidays
- Academic activities
- Science exhibitions
- Sports events
- Cultural events
- School functions
- Other school-important dates

Events may include:

- Date
- Start time
- End time
- Event type
- Venue
- Description
- Audience
- Academic relevance
- OD eligibility where already supported

Do not invent new approval policies.

---

# 20. CLASS / SECTION ALLOCATION

Deepen:

/admin/allocation

This is a core Task 2.5 feature.

Provide a school-oriented allocation workspace.

Required allocation methods:

1. Merit-based allocation
2. Random allocation

## Merit-based

Students are ordered by the relevant marks/performance measure from highest to lowest according to the existing documented allocation model.

## Random

Students are assigned randomly.

Where practical, use reproducible/seeded behavior for the mock implementation.

The UI must provide:

- Academic Year selector
- Grade selector
- Stream selector where applicable
- Source student list
- Target sections
- Allocation method
- Allocation preview
- Allocation result
- Publish action
- Allocation history

---

# 21. STREAM-AWARE ALLOCATION

For Grades 11–12:

Allocation must stay within the selected stream.

Example:

Grade 11
Computer Science A
→ A1 / A2 / A3

Do not mix students from:

Computer Science
Bio-Maths
Commerce
Pure Science

into one allocation operation unless the existing documented business rules explicitly support it.

---

# 22. ALLOCATION PREVIEW

Before publishing:

Show a clear preview.

Example:

Student | Current Section | Proposed Section | Basis

Arun Kumar | Unassigned | A2 | Merit
Priya S | Unassigned | A2 | Merit

Allow:

Cancel
Back
Publish Allocation

Do NOT silently overwrite existing allocations.

---

# 23. ALLOCATION HISTORY

Display previous allocation actions where mock support exists.

Include:

- Date
- Academic Year
- Grade
- Stream
- Allocation Method
- Number of Students
- Published By
- Status

This is mock history only in Phase 2.

---

# 24. PRINCIPAL DASHBOARD

Deepen:

/principal/dashboard

The Principal dashboard should look like an institutional oversight screen.

Show:

- Total Students
- Total Faculty
- Total Classes
- Total Sections
- Overall Attendance
- Overall Academic Performance
- Current Academic Year
- Grade distribution
- Attendance trend
- Recent school events
- Pending oversight/report actions

Do not display faculty ratings.

---

# 25. PRINCIPAL ACADEMICS

Deepen:

/principal/academics

Show school-wide academic analytics:

- Grade-wise academic average %
- Section-wise academic average %
- Stream-wise performance for Grades 11–12
- Grade distribution
- Pass percentage
- Assessment-cycle trends
- Subject performance overview

Use:

Marks
Percentage
Letter Grade

Do not use GPA/CGPA/credits.

Do not rank individual faculty.

---

# 26. PRINCIPAL ATTENDANCE

Deepen:

/principal/attendance

Show:

- School-wide attendance
- Grade-wise attendance
- Section-wise attendance
- Stream-wise attendance where applicable
- Present
- On Duty
- Approved Leave
- Absent
- Attendance trends

Use the canonical attendance utility and four-status model.

Do not show faculty performance rankings.

---

# 27. PRINCIPAL FACULTY DIRECTORY

Deepen:

/principal/faculty

Provide descriptive institutional faculty visibility.

Show:

- Faculty name
- Designation
- Subject
- Class Teacher role
- Assigned classes
- Assigned sections
- Timetable
- Workload counts

DO NOT show:

- Teacher rating
- Appraisal score
- Performance rank
- Student feedback score
- Teaching-quality score
- AI teacher evaluation

This remains descriptive only.

---

# 28. PRINCIPAL REPORTS

Deepen:

/principal/reports

Provide a professional institutional reports area.

Examples:

- School Attendance Report
- Class Attendance Report
- Section Attendance Report
- Student Performance Report
- Grade Distribution Report
- Academic Summary
- Subject Performance Report
- School Event Summary
- Faculty Directory / Assignment Summary

Report tables should emphasize:

Marks /100
Total
Maximum Marks
Percentage
Letter Grade

Attendance reports should include:

Present
On Duty
Leave
Absent
Attendance %

Potential exports:

- PDF
- Excel
- CSV

Only implement/mock these where appropriate to current Phase 2 scope.

Do not claim server-generated reports.

---

# 29. REPORT APPROVAL / OVERSIGHT

Where an oversight action is implemented:

Use a mock state such as:

Draft
→ Review
→ Approved

Do not represent this as real backend approval.

Principal may review/approve institutional report mock states where appropriate.

Do not create unrestricted CRUD for Principal.

---

# 30. PRINCIPAL SCHOOL OVERVIEW

The Principal should be able to understand at a glance:

How many students?
How many faculty?
How many classes?
How is attendance?
How is academic performance?
What are the current assessment trends?
What events are upcoming?
What reports require attention?

Keep this concise and executive-oriented.

---

# 31. INDIAN SCHOOL TERMINOLOGY

Use:

School ERP
Student
Parent
Faculty
Principal
Admin
Academic Year
Grade
Class
Section
Stream
Subject
Attendance
Marks
Percentage
Letter Grade
Examination
Report Card
Timetable
School Calendar
Allocation

Avoid:

University
Degree
Department as an academic program concept
Semester GPA
Credits
Grade Points
Transcript
Major
Minor

---

# 32. SCHOOL ACADEMIC MODEL

Continue using:

Marks out of 100
+
Cumulative Marks
+
Overall Percentage
+
Letter Grade

Use the existing centralized grading utility:

frontend/src/utils/grading.ts

No duplicate grading formula.

---

# 33. STUDENT ID

Student ID remains:

- Permanent
- Unique
- Immutable
- System-generated

Use Student ID in:

- Admin student directory
- Parent relationships
- Faculty rosters
- Principal reports where relevant
- Operational tables

Do not let Admin/Principal UI imply that Student ID can be casually changed.

---

# 34. SCHOOL STRUCTURE

Use:

Academic Year
→ Grade
→ Stream
→ Section
→ Student

For Grades 11–12 use the approved four streams.

For lower grades no stream should be displayed.

---

# 35. SERVICE ABSTRACTION

DO NOT bypass services.

Keep:

React
↓
Feature Hooks
↓
Domain Service
↓
MockDataService
↓
Mock JSON

No large hardcoded datasets inside pages.

---

# 36. ACCESS BOUNDARIES — PHASE 2

Admin:

Operational management across school records.

Principal:

School-wide oversight and appropriate approval/review actions.

Principal does not need unrestricted CRUD.

Student/Parent/Faculty data must remain scoped according to their existing role boundaries.

These restrictions are frontend demonstration boundaries in Phase 2.

Real server-side authorization belongs to Phase 4.

---

# 37. TESTING

Add/update tests for:

ADMIN:

- Student directory
- Parent directory
- Faculty directory
- Class/section/stream hierarchy
- Subject catalog
- Attendance summaries
- Marks summaries
- Allocation calculations
- Merit allocation ordering
- Random allocation behavior
- Allocation preview
- Allocation history
- Admin access boundaries

PRINCIPAL:

- Dashboard summaries
- Academic analytics
- Attendance analytics
- Stream/section filtering
- Faculty directory descriptive constraints
- Report data
- Oversight state handling
- Prohibition of faculty performance metrics

Also verify:

- Four attendance statuses
- LEAVE counts as absence
- Marks /100
- Percentage
- Letter Grade
- No GPA/CGPA/credits

Run:

npm run test:run

npm run build

Do not remove/weaken existing tests.

---

# 38. VISUAL QA

Inspect:

ADMIN
/admin/dashboard
/admin/students
/admin/parents
/admin/faculty
/admin/classes
/admin/subjects
/admin/attendance
/admin/marks
/admin/timetable
/admin/calendar
/admin/allocation

PRINCIPAL
/principal/dashboard
/principal/academics
/principal/attendance
/principal/faculty
/principal/reports

Verify:

- School ERP branding
- Indian school terminology
- Academic Year
- Grade / Stream / Section
- Student ID
- Marks /100
- Percentage
- Letter grades
- Four attendance statuses
- Allocation UI
- Reports
- No GPA/CGPA/credits
- No faculty ratings/reviews
- No futuristic UI
- Responsive layout
- Clear tables/filters
- Consistent navigation

---

# 39. DOCUMENTATION

Update:

docs/PROJECT_STATUS.md
docs/phases/PHASE_02_STATUS.md
docs/CHANGELOG.md

Update docs/DECISIONS.md only if a genuine new business/architectural decision is introduced.

Document:

- Admin feature module
- Principal feature module
- Operational management surfaces
- Allocation workflow
- Principal oversight
- Report views
- Mock limitations
- Tests
- Visual QA

Clearly distinguish:

IMPLEMENTED
MOCKED
PLANNED
NOT IMPLEMENTED
BLOCKED

---

# 40. SCOPE PROTECTION

Do NOT:

- Start Phase 3
- Build Django APIs
- Build PostgreSQL
- Implement real authentication
- Implement real server-side RBAC
- Implement Redis/WebSockets
- Add Firebase
- Add Supabase
- Add MongoDB
- Create duplicate frontend/backend structures
- Rewrite the completed Student/Parent/Faculty features unnecessarily
- Introduce unnecessary dependencies

---

# 41. FINAL ACCEPTANCE CRITERIA

Task 2.5 is complete only when:

1. Admin dashboard is complete and school-oriented.
2. Admin student directory is usable.
3. Admin parent directory is usable.
4. Admin faculty directory is descriptive and non-evaluative.
5. Admin classes/sections/streams are represented correctly.
6. Admin subjects are represented correctly.
7. Admin attendance oversight uses the canonical four-status model.
8. Admin marks oversight uses marks /100, percentage and letter grade.
9. Admin timetable is available.
10. Admin calendar/events are available.
11. Admin allocation supports merit-based and random allocation.
12. Allocation preview exists.
13. Allocation history exists or is appropriately mocked.
14. Grade 11–12 allocation is stream-aware.
15. Principal dashboard provides school-wide institutional oversight.
16. Principal academics provides grade/section/stream analytics.
17. Principal attendance provides school/class/section insights.
18. Principal faculty view contains no ratings/reviews/rankings.
19. Principal reports provide school-level report views.
20. No GPA/CGPA/credits/grade points remain in active UI.
21. School ERP branding remains consistent.
22. Mock/service architecture remains intact.
23. Existing Student, Parent and Faculty functionality has no regression.
24. Tests pass.
25. Production build passes.
26. Documentation is synchronized.

---

# 42. FINAL REPORT

Return:

## Implemented

## Admin Feature Structure

## Admin Dashboard

## Student / Parent / Faculty Directories

## Classes / Sections / Streams / Subjects

## Attendance

## Marks

## Timetable & Calendar

## Allocation

## Principal Feature Structure

## Principal Dashboard

## Academic Analytics

## Attendance Analytics

## Faculty Directory

## Reports / Oversight

## Access Boundaries

## Files Changed

## Tests

## Build

## Visual QA

## Documentation Updated

## Known Issues

## Next Task

Recommend ONLY the next Phase 2 task.

Do NOT proceed to Phase 3 automatically.