# PHASE 2 — TASK 2.4
# Deep Faculty Role Experience

## Objective

Deepen the Faculty role into a proper modular faculty-domain experience for the Indian School ERP.

This task focuses on:

- Faculty Dashboard
- Assigned Classes
- Assigned Students
- Timetable
- Attendance Roll Call
- Faculty-approved LEAVE workflow
- Marks Entry
- Grading Sheets
- Faculty academic-data visibility

This remains a PHASE 2 frontend/mock-data task.

DO NOT start Phase 3.

---

# 1. AUTHORITATIVE RULES

The project remains:

Frontend:
React + TypeScript + Vite

Backend:
Django + Django REST Framework + Django Channels

Database:
PostgreSQL

Realtime/Cache:
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

Do not change the architecture.

The application branding is:

School ERP

The frontend must continue following the verified Indian school ERP visual language.

---

# 2. BEFORE IMPLEMENTATION

Read first:

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
12. docs/phase_prompts/Phase_2_Task_2.3.md

Then inspect:

- Existing Faculty pages
- Existing Faculty mock data
- Existing Faculty services
- Existing Attendance utilities
- Existing Grading utilities
- Existing Student and Parent feature modules
- Existing authentication/role handling
- Existing navigation
- Existing shared UI components

Understand the current implementation before changing it.

---

# 3. FACULTY ROLE — APPROVED RESPONSIBILITIES

Faculty can:

- View assigned classes
- View assigned students
- View relevant student details
- View assigned timetable
- Mark class-wise attendance
- Enter marks out of 100 for assigned subjects
- View relevant academic data
- Handle permitted attendance/academic workflows within assigned scope

Faculty must NOT have unrestricted access to:

- Other faculty data
- Administrative functions
- Unrelated classes
- School-wide private records

---

# 4. FACULTY PERFORMANCE PROHIBITION

The Faculty module must contain NO:

- Faculty performance ratings
- Faculty reviews
- Teaching-performance scores
- Appraisal stars
- Faculty leaderboards
- Teacher ranking
- AI teaching-performance commentary
- Student-performance attribution used to rank teachers

Faculty profiles remain descriptive.

Allowed examples:

- Name
- Designation
- Subject
- Class Teacher assignment
- Assigned classes
- Assigned sections
- Timetable
- Periods/week workload
- Contact information where appropriate

---

# 5. FACULTY FEATURE MODULE

Create/extend:

frontend/src/features/faculty/

Prefer:

features/faculty/
├── types/
├── schemas/
├── services/
├── hooks/
├── components/
└── index.ts

Follow the same modular pattern successfully used by:

features/students/
features/parents/

Do not create competing folders or replace the existing architecture.

---

# 6. FACULTY DOMAIN TYPES

Create strongly typed models where genuinely required:

- FacultyProfile
- FacultyAssignment
- AssignedClass
- AssignedStudent
- FacultyTimetableEntry
- AttendanceSessionContext
- FacultyAttendanceRecord
- FacultyMarkEntry
- FacultyLeaveReview
- FacultyDashboardSummary
- any other required faculty-domain type

Reuse existing shared types for:

- AttendanceStatus
- Student
- Subject
- Class
- Section
- Marks
- Timetable

Avoid unnecessary duplicate models.

---

# 7. FACULTY SERVICE LAYER

Create/extend:

frontend/src/features/faculty/services/facultyService.ts

UI flow must remain:

React Page
↓
Faculty Hook
↓
Faculty Service
↓
MockDataService
↓
Mock JSON

The service should provide data/actions for:

- Faculty profile
- Assigned classes
- Assigned students
- Assigned timetable
- Attendance sessions
- Attendance records
- Marks entry
- Pending leave review

Do NOT import large JSON datasets directly into pages.

The service abstraction must remain replaceable by future API services.

---

# 8. FACULTY DASHBOARD

Deepen:

/faculty/dashboard

The dashboard should feel like a real Indian school teacher's working dashboard.

Display:

- Faculty name
- Designation
- Department/subject where applicable
- Class Teacher assignment where applicable
- Today's timetable
- Today's classes
- Assigned classes count
- Assigned student count
- Attendance actions
- Marks entry shortcuts
- Pending leave requests requiring review
- Recent class activity

Do NOT display faculty ratings or performance scores.

Example:

R. Suresh
Senior PGT Mathematics

Class Teacher:
Grade 11 — Section A2

Today's Classes:
Period 1 — Mathematics — XI-A2
Period 3 — Mathematics — XII-A1
...

Pending Leave Reviews:
2

---

# 9. ASSIGNED CLASSES

Deepen:

/faculty/classes

Only show classes assigned to the authenticated faculty member.

Example:

Grade 11 — Computer Science A — Section A2
Subject: Mathematics
Class Teacher: R. Suresh

Grade 12 — Section A1
Subject: Mathematics

Grade 10 — Section A
Subject: Mathematics

Include:

- Grade / Class
- Stream when applicable
- Section
- Subject
- Class Teacher status where appropriate
- Student count
- Timetable references

Do not expose unrelated school classes.

---

# 10. ASSIGNED STUDENTS

Faculty should be able to inspect students belonging to the faculty member's authorized class/subject assignment.

Display relevant information:

- Student Name
- Student ID
- Admission Number where appropriate
- Roll Number
- Class
- Section
- Stream where applicable
- Relevant academic/attendance information

Do not expose unrelated students.

Do not allow faculty to modify immutable Student ID.

---

# 11. FACULTY TIMETABLE

Deepen:

/faculty/timetable

Show:

- Day
- Period
- Start time
- End time
- Subject
- Class
- Section
- Stream where applicable
- Room / Classroom
- Session type

Use Indian school period terminology.

Example:

Monday
Period 1
08:30–09:15
Mathematics
Grade 11 — A2
Room XI-A2

No university credit-hour concepts.

---

# 12. ATTENDANCE ROLL CALL

Deepen:

/faculty/attendance

This is one of the most important Faculty workflows.

The faculty first selects:

- Academic Year
- Date
- Grade/Class
- Stream where applicable
- Section
- Subject
- Timetable Period

Only authorized assignments should appear.

Then show the student roll list.

Each student can be assigned exactly one status:

PRESENT
ABSENT
ON_DUTY
LEAVE

---

# 13. ATTENDANCE BUSINESS RULES

PRESENT:
Counts as attendance.

ON_DUTY:
School-sanctioned duty.
Counts as attendance.

LEAVE:
Faculty-approved absence.
Counts as absence.

ABSENT:
Absence.
Counts as absence.

Formula:

(PRESENT + ON_DUTY)
/
(PRESENT + ABSENT + ON_DUTY + LEAVE)
× 100

Use the existing shared utility:

frontend/src/utils/attendance.ts

Do NOT implement a second formula.

---

# 14. MARK ALL PRESENT

Provide:

"Mark All Present"

After clicking:

- All eligible students become PRESENT.
- Faculty can then modify individual students.
- Live counts update immediately.
- Live attendance percentage updates immediately.

Show:

Present
On Duty
Approved Leave
Absent
Attendance %

Do not use LATE or EXCUSED.

---

# 15. FACULTY LEAVE APPROVAL

This task must complete the frontend demonstration workflow started in Task 2.3.

Faculty/Class Teacher is the authority for approving/marking LEAVE.

Where pending parent/student absence notices exist:

Faculty should be able to review:

- Student
- Student ID
- Date
- Reason
- Explanation
- Submitted status

Actions:

Approve Leave
Reject

Rules:

PENDING_FACULTY_REVIEW
↓
Approve
↓
LEAVE

OR

PENDING_FACULTY_REVIEW
↓
Reject
↓
Rejected / remains non-LEAVE

Approval must:

- record the approving faculty ID
- associate the leave with the correct student/class/session
- make the approved leave visible in attendance views
- update relevant mock state
- affect attendance calculations

A parent/student request MUST NOT automatically become LEAVE.

Do not allow:

Student self-approval
Parent self-approval
Unauthorized faculty approval

Only the authorized faculty/class teacher may approve within the allowed assignment scope.

---

# 16. LEAVE AUDIT INFORMATION

Where displayed, show:

- Student
- Date
- Leave reason
- Status
- Approved by
- Approval date/time where available

Example:

Arun Kumar
STU202600001

12/09/2026
Medical Leave

Approved Leave
Approved by:
R. Suresh

Keep this as frontend/mock demonstration data.

Real audit persistence belongs to future backend phases.

---

# 17. ATTENDANCE SESSION RULES

Respect the existing attendance session architecture.

Attendance context:

Academic Year
→ Grade
→ Stream where applicable
→ Section
→ Date
→ Timetable Slot
→ Student

Do not create attendance records without class/section context.

Within the UI:

- One session per date/section/timetable slot
- Prevent accidental duplicate session creation
- Surface existing marked sessions clearly
- Show session state such as:
  Not Marked
  In Progress
  Marked

Do not invent additional attendance policies.

---

# 18. MARKS ENTRY

Deepen:

/faculty/marks

Faculty can enter marks only for:

- Assigned subjects
- Assigned classes
- Authorized students

Marks model:

0–100

or:

AB

Do not use:

GPA
CGPA
Credits
Grade Points

---

# 19. MARKS ENTRY UI

Use a school examination register style.

Example:

Student | Mark / 100 | Grade

Arun Kumar | 92 | A1
Priya S | 87 | A2

Show:

- Student Name
- Student ID
- Roll Number
- Subject
- Exam Type
- Mark / 100
- Derived Percentage
- Derived Letter Grade

The grade must come from:

frontend/src/utils/grading.ts

Do not duplicate grading logic.

---

# 20. ASSESSMENT TYPES

Use the existing configurable school assessment terminology such as:

- Cycle Test
- Unit Test
- Quarterly Examination
- Half-Yearly Examination
- Annual Examination

Do not hardcode these as the only possible future types.

---

# 21. ABSENT ASSESSMENT

When a student is absent from an assessment:

Use:

AB

not 0.

Do not invent a new AB-total calculation policy.

Respect the existing documented configurable treatment of AB.

---

# 22. MARKS VALIDATION

Validate:

Minimum:
0

Maximum:
100

Accept:
AB

Reject:

- negative marks
- marks above 100
- invalid text
- malformed values

Use the existing project validation architecture.

---

# 23. MARKS SUMMARY

Provide useful faculty summaries such as:

- Students assessed
- Pending marks
- Completed entries
- Class mark distribution
- Grade distribution

Do NOT show faculty performance metrics.

Do NOT rank teachers.

---

# 24. FACULTY ACADEMIC VIEW

Faculty may view academic information relevant to their assigned classes/subjects.

Examples:

- Class average
- Subject marks distribution
- Assessment completion
- Students with missing marks
- Grade distribution

This is about class/subject administration, NOT teacher performance evaluation.

Do not generate statements like:

"Teacher X performs better than Teacher Y."

---

# 25. FACULTY DASHBOARD QUICK ACTIONS

Provide clear actions such as:

Mark Attendance
Enter Marks
View Classes
View Timetable
Review Leave Requests

Use the existing enterprise UI components.

---

# 26. INDIAN SCHOOL UI

Maintain:

School ERP branding
Deep navy primary
White/neutral surfaces
Flat bordered panels
Traditional school ERP structure
Sidebar
Header
Breadcrumb
Page title
Tables
Filters
Badges
Minimal animation

No:

- futuristic styling
- neon
- glassmorphism
- AI sparkle
- emoji UI icons
- 3D effects
- floating dashboard cards
- excessive animations

---

# 27. FACULTY TERMINOLOGY

Use:

Faculty
Teacher
Class Teacher
PGT
Subject
Class
Grade
Section
Stream
Period
Timetable
Attendance
Marks
Examination
Student ID

Avoid:

Professor
University Course
Credit Hour
Semester GPA
Degree
Major
Minor

unless some internal technical documentation genuinely requires the historical term.

---

# 28. SCHOOL MOCK DATA

Use the existing synthetic Indian school records.

Example:

R. Suresh
Senior PGT Mathematics
Class Teacher — Grade 11 A2

Assigned classes:
XI-A2
XII-A1
X-A

Weekly workload:
24 Periods / week

Use existing mock-data records whenever possible.

Do not create duplicate faculty identities.

---

# 29. ACCESS CONTROL — PHASE 2

Mock restrictions must ensure the Faculty UI only exposes:

- assigned classes
- assigned students
- assigned subjects
- assigned timetable
- relevant attendance sessions
- relevant marks

Do not rely on frontend restrictions as real security.

Real server-side authorization belongs to Phase 4.

---

# 30. TESTING

Add/update tests for:

- Faculty profile
- Assigned class scoping
- Assigned student scoping
- Timetable filtering
- Attendance status handling
- Mark All Present
- Attendance percentage
- LEAVE approval
- LEAVE rejection
- Pending leave workflow
- Unauthorized leave approval attempts
- Marks validation
- 0–100 boundaries
- AB handling
- Grade derivation
- Faculty performance governance constraints

Run:

npm run test:run

npm run build

Do not delete or weaken existing tests.

---

# 31. VISUAL QA

Inspect:

/faculty/dashboard
/faculty/classes
/faculty/attendance
/faculty/marks
/faculty/timetable

Verify:

- School ERP branding
- Faculty identity
- Assigned class scope
- Indian school terminology
- Four attendance statuses
- LEAVE approval
- Correct attendance formula
- Marks /100
- AB handling
- Letter grades
- No GPA/CGPA/credits
- No faculty ratings/reviews
- Responsive design
- Enterprise school UI

---

# 32. DOCUMENTATION

Update:

docs/PROJECT_STATUS.md
docs/phases/PHASE_02_STATUS.md
docs/CHANGELOG.md

Update docs/DECISIONS.md only for a genuine new business/architectural decision.

Document:

- Faculty feature architecture
- Assigned class/student boundaries
- Attendance workflow
- Faculty LEAVE approval
- Marks entry
- Grading
- Mock limitations
- Tests
- Visual QA

Clearly distinguish:

IMPLEMENTED
MOCKED
PLANNED
NOT IMPLEMENTED
BLOCKED

Do not describe Phase 2 mock behavior as real backend functionality.

---

# 33. ARCHITECTURE PROTECTION

Do NOT:

- Start Django
- Start PostgreSQL
- Build real backend APIs
- Implement real authentication
- Start Phase 3
- Change React/Vite
- Replace service abstraction
- Add Firebase
- Add Supabase
- Add MongoDB
- Create duplicate folders
- Rewrite unrelated modules

---

# 34. FINAL ACCEPTANCE CRITERIA

Task 2.4 is complete only when:

1. Faculty domain module exists and is modular.
2. Faculty dashboard is functional with mock data.
3. Assigned classes are correctly scoped.
4. Assigned students are correctly scoped.
5. Faculty timetable is available.
6. Faculty can run attendance roll call.
7. Attendance has exactly:
   PRESENT
   ABSENT
   ON_DUTY
   LEAVE
8. LEAVE is faculty-approved.
9. LEAVE counts as absence.
10. Mark All Present works.
11. Attendance percentage uses the canonical utility.
12. Faculty can review pending leave notices.
13. Approved leave becomes LEAVE in the mock attendance workflow.
14. Faculty can enter marks out of 100.
15. AB is supported for absent assessments.
16. Letter grades derive from the shared grading utility.
17. GPA/CGPA/credits/grade points remain absent.
18. Faculty performance reviews/ratings remain absent.
19. Faculty only sees authorized mock data.
20. Tests pass.
21. Build passes.
22. Documentation is synchronized.

---

# 35. FINAL REPORT

Return:

## Implemented

## Faculty Feature Structure

## Dashboard

## Assigned Classes & Students

## Attendance

## LEAVE Approval Workflow

## Marks Entry & Grading

## Access Scoping

## Files Changed

## Tests

## Build

## Visual QA

## Documentation Updated

## Known Issues

## Next Task

Recommend ONLY the immediate next Phase 2 task.

Do NOT proceed to Phase 3.