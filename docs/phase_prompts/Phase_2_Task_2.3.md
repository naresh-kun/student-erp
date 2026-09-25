# PHASE 2 â€” TASK 2.3
# Deep Parent Role Experience

## Objective

Deepen the Parent role into a proper modular parent-domain experience for the Indian School ERP.

The current application has:
- Phase 2.1 foundation/demo work completed
- Attendance Amendment 2 completed
- Indian School ERP reconciliation completed
- Branding standardized to "School ERP"
- Phase 2.2 Student Role Experience completed
- 59/59 frontend tests passing
- Production build passing

Now implement ONLY Task 2.3.

Do NOT start Phase 3.

---

# 1. BEFORE IMPLEMENTATION

Read first:

1. docs/PROJECT_STRUCTURE.md
2. docs/ARCHITECTURE.md
3. docs/FRONTEND_ARCHITECTURE.md
4. docs/RBAC_PERMISSIONS.md
5. docs/API_CONTRACT.md
6. docs/PROJECT_STATUS.md
7. docs/DECISIONS.md
8. docs/CHANGELOG.md
9. docs/phase_prompts/PHASE_02.md
10. docs/phases/PHASE_02_STATUS.md

Then inspect:

- Existing Parent pages
- Existing Parent mock services
- Parent/student mock data
- Authentication flow
- Student domain implementation
- Shared attendance/grading utilities
- Existing reusable UI components

Do not modify code before understanding the existing implementation.

---

# 2. PARENT ROLE â€” APPROVED SCOPE

Parent can:

- View own profile
- View their child/children
- Log in using the child's permanent Student ID
- View child attendance
- View subject-wise attendance
- View child marks
- View cumulative marks
- View overall percentage
- View letter grade
- View child timetable
- View school calendar/events
- View child academic performance
- View attendance charts
- Receive/see relevant feedback and advisories

Parent MUST NOT:

- Edit marks
- Edit attendance
- Edit student academic records
- Approve their own child's leave
- Access unrelated students
- Access faculty/admin functions
- Access school-wide private administrative records

The backend authorization is future Phase 4 work; Phase 2 remains mocked.

---

# 3. IMPORTANT STUDENT ID RULE

Parent authentication uses the child's permanent Student ID as the username.

Example:

Student:
Arun Kumar

Student ID:
STU202600001

Parent login username:
STU202600001

The Student ID must remain visible and consistently presented.

Do not replace Student ID with admission number or roll number for Parent login.

---

# 4. MULTI-CHILD SUPPORT

The master allows a parent to have child/children.

Build the Parent domain so it can represent multiple linked children where supported by the existing mock data architecture.

However:

DO NOT invent a new authentication policy for multi-child parents.

Specifically, do not silently decide:
- one login per parent
- one child per login
- automatic child switching
- separate credentials for every child

unless the current implementation/documentation already defines it.

If a child selector is implemented, it must operate only on children already linked to the authenticated Parent mock record.

Never allow a parent to manually enter another student's ID to access unrelated student data.

---

# 5. PARENT FEATURE MODULE

Create/extend a modular domain structure:

frontend/src/features/parents/

Prefer a structure similar to the Student domain:

features/parents/
â”œâ”€â”€ types/
â”œâ”€â”€ schemas/
â”œâ”€â”€ services/
â”œâ”€â”€ hooks/
â”œâ”€â”€ components/
â””â”€â”€ index.ts

Use the existing project structure and extend it rather than creating competing folders.

---

# 6. PARENT DOMAIN TYPES

Create strongly typed domain models as required for:

- ParentProfile
- LinkedChild
- ParentAttendanceSummary
- ParentSubjectAttendance
- ParentAttendanceRecord
- ParentAcademicSummary
- ParentMarkSummary
- ParentAdvisory
- ParentChildContext
- any other types genuinely required

Reuse shared types/utilities instead of duplicating business models unnecessarily.

---

# 7. PARENT SERVICE LAYER

Implement a dedicated Parent service adapter.

The UI must follow:

React Page
â†“
Parent Feature Hook
â†“
Parent Service
â†“
MockDataService
â†“
Mock JSON

Do NOT import large JSON datasets directly into Parent pages/components.

Design the service so it can later be replaced by:

Parent UI
â†“
API Service
â†“
Django REST API

without rewriting the presentation layer.

---

# 8. PARENT DASHBOARD

Deepen:

/parent/dashboard

The dashboard should feel like a real Indian school parent portal.

Show:

- Parent name
- Child name
- Student ID
- Class / Grade
- Section
- Stream where applicable
- Academic Year
- Overall Attendance
- Present
- On Duty
- Approved Leave
- Absent
- Cumulative Marks
- Maximum Marks
- Overall Percentage
- Overall Letter Grade
- Recent assessment performance
- Upcoming school events
- Upcoming examinations
- Attendance advisory / academic advisory

Avoid unnecessary KPI overload.

The dashboard should prioritize information a parent actually needs.

---

# 9. LINKED CHILDREN

Deepen:

/parent/children

Display linked children in a clear school-oriented manner.

For each child show:

- Student Name
- Student ID
- Admission Number where appropriate
- Class / Grade
- Section
- Stream where applicable
- Academic Year
- Class Teacher where appropriate

Only children actually linked to the authenticated Parent mock record may be displayed.

Do not expose unrelated students.

If the current synthetic data contains one child, keep the UI compatible with future multiple-child data without fabricating additional relationships.

---

# 10. CHILD ATTENDANCE

Deepen:

/parent/attendance

Use the exact canonical attendance system:

PRESENT
ABSENT
ON_DUTY
LEAVE

Business rules:

PRESENT = counts as present
ON_DUTY = counts as present
LEAVE = counts as absence
ABSENT = counts as absence

Formula:

(PRESENT + ON_DUTY)
/
(PRESENT + ABSENT + ON_DUTY + LEAVE)
Ã— 100

Reuse:

frontend/src/utils/attendance.ts

Do NOT create another attendance calculation.

Show:

- Overall attendance %
- Present count
- On Duty count
- Approved Leave count
- Absent count
- Subject-wise attendance
- Attendance history
- Attendance trend

LEAVE must remain visually distinct from ABSENT.

Use terminology such as:

Approved Leave
Absent
On Duty
Present

Do not reintroduce LATE or EXCUSED.

---

# 11. SUBJECT-WISE ATTENDANCE

Parent should be able to understand which subjects have lower attendance.

Example:

Mathematics
Present: 20
On Duty: 1
Leave: 2
Absent: 1
Attendance: 84.62%

Use interactive charts where useful.

Keep charts understandable on desktop and mobile.

Provide a tabular/data alternative where appropriate.

Do not attribute attendance performance as a faculty rating.

---

# 12. ATTENDANCE ADVISORIES

Implement deterministic/demo advisories only.

Examples:

"Mathematics attendance is lower than the student's other subjects."

"Attendance is currently within the school's recorded range."

"3 approved leave records were recorded during this period."

Advisories must be based on actual mock data.

Do not claim AI-generated intelligence unless the implementation is actually AI.

Do not build a complex AI system for Task 2.3.

The master explicitly allows deterministic feedback at this stage.

---

# 13. PARENT MARKS EXPERIENCE

Deepen:

/parent/marks

The page must resemble a school academic performance/report-card view.

Show:

- Assessment name
- Subject
- Marks Obtained
- Maximum Marks
- Percentage
- Letter Grade

Example:

Mathematics
88 / 100
88.00%
A2

Also show:

Cumulative Marks
435 / 500

Overall Percentage
87.00%

Overall Grade
A2

Do NOT display:

GPA
CGPA
Credits
Grade Points

Use the existing grading utility.

Never duplicate grading formulas inside Parent components.

---

# 14. ACADEMIC PROGRESS

Include a useful parent-facing performance view.

Possible sections:

- Current assessment results
- Previous assessment comparison
- Subject-wise marks
- Overall percentage trend
- Grade distribution
- Focus subjects

Do not create teacher/faculty performance metrics.

The parent is viewing the child's academic performance only.

---

# 15. PARENT TIMETABLE

Deepen:

/parent/timetable

Show the child's school timetable.

Include:

- Day
- Period
- Time
- Subject
- Faculty
- Room / Classroom

Example:

Monday
Period 1
08:30â€“09:15
Mathematics
R. Suresh
Room XI-A2

Do not use:
- Credit hours
- University course codes
- Semester schedules

Keep the presentation school-oriented.

---

# 16. PARENT CALENDAR

Deepen:

/parent/calendar

Display relevant school events:

- Examinations
- Parent-Teacher Meetings
- Holidays
- Academic exhibitions
- School functions
- Sports events
- Cultural events
- Important school activities

Use the existing events mock data/service.

Do not invent an external calendar integration.

---

# 17. ABSENCE / LEAVE ADVISORY

Where an existing absence/leave request interface already exists:

- Preserve the existing workflow.
- A parent may submit a request/justification only if the current implementation supports it.
- The parent must NEVER approve the request.
- Approval must remain with the authorized Faculty/Class Teacher.
- A submitted request must not automatically become LEAVE.
- Only an approved record can become the attendance status LEAVE.

Do not introduce a new approval hierarchy.

If the existing implementation contains a workflow that is not documented in the approved project decisions, flag it in the final report instead of silently expanding the business rules.

---

# 18. PARENT PROFILE

Deepen:

/parent/children
and/or the existing parent profile area as appropriate.

Show:

- Parent/Guardian name
- Relationship to child
- Linked student(s)
- Contact information where appropriate

Keep sensitive information minimal.

Do not expose unrelated parent/student records.

---

# 19. SCHOOL ERP VISUAL LANGUAGE

Maintain the verified Indian School ERP presentation:

- "School ERP" branding
- Light theme
- Deep navy primary
- White/neutral surfaces
- Flat bordered panels
- Traditional enterprise layout
- Fixed sidebar
- Clear top header
- Academic Year 2026â€“27
- Tables as primary data surfaces
- Clear badges
- Minimal animation
- Responsive layout

Do NOT introduce:

- futuristic AI visuals
- neon gradients
- glassmorphism
- dark sci-fi styling
- floating decorative cards
- emoji UI icons
- excessive motion

---

# 20. SCHOOL TERMINOLOGY

Use:

- Parent
- Student
- Student ID
- Class
- Grade
- Section
- Stream
- Subject
- Marks
- Percentage
- Letter Grade
- Attendance
- Approved Leave
- On Duty
- Timetable
- Academic Year
- Examination
- School Event

Do NOT use:

- GPA
- CGPA
- Credits
- Grade Points
- Semester GPA
- University Transcript
- Degree
- Major
- Minor

---

# 21. INDIA-SCHOOL DATA

Use existing synthetic Indian school data.

Example:

Parent:
S. Ramanathan

Child:
Arun Kumar

Student ID:
STU202600001

Class:
Grade 11

Stream:
Computer Science A

Section:
A2

Academic Year:
2026â€“27

Do not create fictional relationships that do not exist in the current mock data.

---

# 22. ACCESS CONTROL IN PHASE 2

Parent is READ-ONLY for academic records.

Do not provide:

- Edit marks
- Edit attendance
- Delete marks
- Delete attendance
- Edit student academic identity
- Admin controls
- Faculty controls

Parent may see information and relevant advisory/request workflows only where explicitly supported.

Phase 2 authentication/RBAC remains MOCKED.

Do not claim real backend security.

---

# 23. TESTING

Add/update automated tests for:

- Parent profile handling
- Linked-child filtering
- Student ID relationship
- Attendance calculations
- Four-status attendance handling
- LEAVE as absence
- Subject attendance
- Academic percentage
- Letter grade derivation
- Parent read-only behavior
- Advisory generation
- Invalid/unrelated Student ID protection
- Child-context switching if implemented

Run:

npm run test:run

npm run build

Existing tests must continue passing.

Do not weaken or delete existing tests to make the suite pass.

---

# 24. VISUAL QA

Use the running Vite application and inspect:

/parent/dashboard
/parent/children
/parent/attendance
/parent/marks
/parent/timetable
/parent/calendar

Verify:

- School ERP branding
- Parent identity
- Child identity
- Student ID
- Indian school terminology
- Class/section/stream
- Marks /100
- Cumulative marks
- Percentage
- Letter grade
- Present / Absent / On Duty / Approved Leave
- Attendance calculation
- Subject-wise attendance
- Timetable
- School events
- Responsive layout
- No GPA/CGPA/credits
- No unrelated student access

---

# 25. DOCUMENTATION

Update:

- docs/PROJECT_STATUS.md
- docs/phases/PHASE_02_STATUS.md
- docs/CHANGELOG.md

Update docs/DECISIONS.md only if a genuine new architectural/business decision is introduced.

If an existing Parent leave-submission workflow is still present but not formally approved in DECISIONS.md, record it as an existing implementation point requiring explicit future confirmation rather than declaring it a finalized policy.

Document:

- Parent feature architecture
- Parent dashboard
- Linked child handling
- Student-ID relationship
- Attendance views
- Academic performance views
- Timetable/calendar
- Advisory logic
- Mock vs planned functionality

---

# 26. ARCHITECTURE PROTECTION

Do NOT:

- Start Django implementation
- Start PostgreSQL implementation
- Start Phase 3
- Implement real authentication
- Add Firebase
- Add Supabase
- Add MongoDB
- Create duplicate folders
- Replace React/Vite
- Replace the service architecture
- Rewrite unrelated Student/Faulty/Admin/Principal modules
- Introduce unnecessary dependencies

Preserve:

React
â†“
Feature / Hook
â†“
Service abstraction
â†“
MockDataService
â†“
Mock JSON

---

# 27. FINAL ACCEPTANCE CRITERIA

Task 2.3 is complete only when:

1. Parent dashboard is a complete school-oriented experience.
2. Parent can see only linked child/children.
3. Student ID is correctly used as the Parent login identifier.
4. Attendance uses PRESENT / ABSENT / ON_DUTY / LEAVE.
5. LEAVE counts as absence.
6. Attendance uses the shared canonical calculation utility.
7. Subject-wise attendance is available.
8. Parent can view marks out of 100.
9. Parent can view cumulative marks, percentage and letter grade.
10. No GPA/CGPA/credits/grade points exist in active Parent UI.
11. Parent can view timetable.
12. Parent can view school calendar/events.
13. Parent can receive deterministic/demo attendance or academic advisories.
14. Parent cannot modify academic records.
15. School ERP branding and Indian-school terminology remain consistent.
16. Tests pass.
17. Build passes.
18. Documentation reflects the actual implementation.

---

# 28. FINAL REPORT

Return:

## Implemented
What was actually built.

## Parent Feature Structure
Exact feature folders/files.

## Parent Dashboard
What is displayed.

## Linked Children
How the relationship is handled.

## Attendance
Four-status handling and formula.

## Academic Performance
Marks/100, cumulative, percentage and letter grade.

## Timetable & Calendar
What was implemented.

## Advisories
How they are generated.

## Leave Workflow
Exactly what exists and whether any part remains pending confirmation.

## Files Changed
Exact paths.

## Tests
Commands and exact results.

## Build
Exact result.

## Visual QA
Pages inspected and findings.

## Documentation Updated
Exact .md files.

## Known Issues
Only genuine issues or pending business decisions.

## Next Task
Recommend only the immediate next Phase 2 task.

Do NOT proceed to Phase 3.
