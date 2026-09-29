# PHASE 2 — TASK 2.5
# Deep Admin & Principal Role Experiences

## Objective

Deepen the **Admin** and **Principal** roles into authoritative, production-grade domain experiences for the Indian School ERP.

This task delivers:

- **Admin Domain** (11 Dedicated Routes):
  1. Admin Executive Dashboard (`/admin/dashboard`)
  2. Student Master Directory (`/admin/students`)
  3. Parent Master Directory (`/admin/parents`)
  4. Faculty Master Directory (`/admin/faculty`)
  5. Classes, Sections & Capacity Management (`/admin/classes`)
  6. Course & Subjects Catalog (`/admin/subjects`)
  7. School-Wide Attendance Oversight (`/admin/attendance`)
  8. Examination Marks & Grade Audit Register (`/admin/marks`)
  9. Master Timetable Overview (`/admin/timetable`)
  10. Institutional Calendar & Event Publisher (`/admin/calendar`)
  11. Class & Section Allocation Engine (`/admin/allocation`)

- **Principal Domain** (5 Dedicated Routes):
  1. Head of Institution Executive Console (`/principal/dashboard`)
  2. Academic Syllabus & Cohort Analytics (`/principal/academics`)
  3. School-Wide Attendance Telemetry & Progression (`/principal/attendance`)
  4. Departmental Faculty Roster & Workload Oversight (`/principal/faculty`)
  5. Executive Reports & Statutory Endorsement Dossier Archive (`/principal/reports`)

This remains a **PHASE 2 frontend/mock-data task**.

DO NOT start Phase 3 (Backend Integration).

---

# 1. AUTHORITATIVE RULES & CONSTRAINTS

The project technology stack remains:

- **Frontend**: React 18+ with TypeScript, Vite 5+, Tailwind CSS
- **Component Primitives**: shadcn/ui patterns & Radix UI accessible primitives
- **Data Fetching / State**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form with Zod schemas
- **Data Visualization**: Recharts
- **Iconography**: Lucide React
- **Unit & Integration Testing**: Vitest & React Testing Library

### Phase 2 Data Flow
```text
React Page Component
        ↓
  Feature Hook
        ↓
Domain Service Layer
        ↓
 MockDataService (Async)
        ↓
   mock-data/*.json
```

Do not alter this architecture. UI components must consume data strictly via domain services and hooks.

### Core Institutional Branding & Visual Language
- **Application Branding**: School ERP
- **Visual Standard**: Deep Navy (`bg-blue-900`) enterprise header, clean slate/zinc borders, WCAG AA contrast.
- **Academic Year**: `2026–27` (configurable via `src/config/schoolConfig.ts`).

---

# 2. MANDATORY PRE-REQUISITES & CONTEXT

Inspect and adhere to:
1. `docs/PROJECT_STRUCTURE.md`
2. `docs/ARCHITECTURE.md`
3. `docs/FRONTEND_ARCHITECTURE.md`
4. `docs/RBAC_PERMISSIONS.md`
5. `docs/API_CONTRACT.md`
6. `docs/DATABASE_SCHEMA.md`
7. `docs/PROJECT_STATUS.md`
8. `docs/DECISIONS.md`
9. `docs/CHANGELOG.md`
10. `docs/phase_prompts/PHASE_02.md`
11. `docs/phases/PHASE_02_STATUS.md`
12. `docs/phase_prompts/Phase_2_Task_2.4.md`

---

# 3. NON-NEGOTIABLE GOVERNANCE RULES

### 3.1 Permanent & Immutable Student ID
- Every student has a permanent, unique, system-wide Student ID (e.g. `STU202600001`).
- The Student ID is **permanent and immutable**. It can never be regenerated, edited, or reallocated.
- The Student ID serves as the child linking key for the Parent Portal.
- Admission Number (e.g. `ADM20240091`) and Roll Number (e.g. `11-A2-04`) are distinct institutional identifiers.

### 3.2 Indian School Secondary & Senior Secondary Structure
- **Grade 10**: General secondary curriculum. Strictly **NO stream** designation.
- **Grades 11 & 12**: Senior secondary curriculum with exactly **4 approved streams**:
  1. `Computer Science A`
  2. `Bio-Maths B`
  3. `Commerce C`
  4. `Pure Science D`
- Stream sections follow canonical designations (e.g. `A1`, `A2`, `A3` for Stream A; `B1`, `B2` for Stream B, etc.).

### 3.3 Canonical 4-Status Attendance Model (Master Plan Amendment 2)
The application strictly enforces the 4 canonical attendance statuses across all mock datasets, domain types, services, and UI presentations:
1. `PRESENT` (Counts as Presence in numerator and denominator)
2. `ABSENT` (Counts as Absence in denominator)
3. `ON_DUTY` (Counts as Presence in numerator and denominator)
4. `LEAVE` (Sanctioned institutional leave; counted in denominator as absence, visually purple/violet token)

Legacy statuses `LATE` and `EXCUSED` remain permanently removed.

Calculation formula:
$$\text{Attendance \%} = \frac{\text{PRESENT} + \text{ON\_DUTY}}{\text{PRESENT} + \text{ABSENT} + \text{ON\_DUTY} + \text{LEAVE}} \times 100$$

### 3.4 Indian School Academic Model (CBSE/ICSE)
- Academic marks scored out of 100 (0–100 or 'AB' for Absent).
- Cumulative marks (e.g. `435 / 500`), overall percentage (e.g. `87.00%`).
- Canonical 8-tier letter grades derived via `src/utils/grading.ts`:
  - `A1`: 91% – 100%
  - `A2`: 81% – 90.99%
  - `B1`: 71% – 80.99%
  - `B2`: 61% – 70.99%
  - `C1`: 51% – 60.99%
  - `C2`: 41% – 50.99%
  - `D`: 33% – 40.99%
  - `E`: Below 33% (Needs Improvement)
- **STRICTLY PROHIBITED**: University metrics — GPA, CGPA, credits, credit hours, quality points, semester majors/minors.

### 3.5 Faculty Non-Evaluative Governance
- The Faculty modules (under both Admin and Principal views) must contain **STRICTLY NO**:
  - Faculty performance ratings
  - Student reviews or appraisals
  - Teaching scores or stars
  - Teacher rankings or leaderboards
  - AI performance commentary or attribution
- Faculty records are purely descriptive: Name, Designation, Department, Qualifications, Assigned Classes, Assigned Sections, Weekly Period Workload (e.g. 24 Periods / wk), Room/Office.

---

# 4. ADMIN ROLE SPECIFICATION (`/admin/*`)

The Administrator is the operational custodian of the school system. Admin capabilities cover master registries, structural configurations, audit oversight, calendar scheduling, and section allocation.

## 4.1 Admin Dashboard (`/admin/dashboard`)
- **Key Metrics Overview**:
  - Total Students Enrolled (1,248)
  - Teaching Faculty Staff (86)
  - Active Classes (6) & Total Sections (18)
  - Overall School Attendance Rate
  - Student-Teacher Ratio (`15:1`)
  - Active Examinations
  - Upcoming Events
- **System Health & Operations Strip**:
  - Academic session indicator (`2026–27`)
  - Backup & synchronization status
- **Longitudinal Trend Chart**:
  - School-wide monthly attendance progression (Recharts AreaChart)
- **Direct Navigation Panels**:
  - Quick action links to Students, Faculty, Allocation Workspace, and Calendar Publisher.

## 4.2 Student Master Directory (`/admin/students`)
- **Search & Filters**:
  - Real-time search by Student Name, Permanent Student ID, Admission Number, or Roll Number.
  - Filter by Grade Level (Grade 9 through Grade 12).
  - Filter by Senior Secondary Stream (`Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`).
  - Filter by Enrollment Status (`Active`, `Inactive`).
- **Student Master Register Table**:
  - Permanent Student ID (locked, copyable)
  - Admission Number
  - Roll Number
  - Student Full Name & Gender
  - Class, Section & Stream
  - Parent Name & Contact Phone
  - Verified Attendance Rate (%)
  - Academic Percentage & Derived 8-Tier CBSE Letter Grade
  - Status Badge
- **Student Profile Inspection Modal**:
  - Full personal details (DOB in DD/MM/YYYY Indian format, Blood Group, Gender)
  - Complete academic credentials (locked, immutable Student ID)
  - Parent/Guardian details and emergency contacts
- **Export Action**:
  - Direct CSV download of the filtered or full student master registry.

## 4.3 Parent Master Directory (`/admin/parents`)
- **Lookup & Filter**:
  - Search by Parent/Guardian Name, Phone Number, Email, or Ward's Student ID.
- **Directory Table**:
  - Guardian Name & Relation (`Father`, `Mother`, `Guardian`)
  - Occupation
  - Contact Details (Phone, Email, Residential Address)
  - Linked Children Mappings:
    - Child Name
    - Permanent Student ID (verified link to Parent login)
    - Class & Section
    - Roll Number
  - Account Status (`Active`)

## 4.4 Faculty Master Directory (`/admin/faculty`)
- **Lookup & Filter**:
  - Search by Faculty Name, Employee Code, or Subject Specialization.
  - Filter by Department (`Mathematics`, `Physics`, `Computer Science`, `Chemistry`, `English`, `Commerce`, etc.).
- **Directory Table**:
  - Employee Code (e.g. `FAC-MATH-012`)
  - Faculty Name & Official Email
  - Department & Academic Designation (`Senior PGT & Department Head`, `PGT`, `TGT`)
  - Qualifications (e.g. `M.Sc. Mathematics, B.Ed.`)
  - Class Teacher Designation (e.g. `Class Teacher: Grade 11 — A2`)
  - Assigned Classes & Sections (badges)
  - Weekly Period Workload (e.g. `24 Periods / wk`)
  - Status (`Active`, `On Leave`)
- **Governance**:
  - Strict compliance with Non-Evaluative Rule (zero ratings, rankings, or appraisal scores).

## 4.5 Classes, Sections & Capacity Management (`/admin/classes`)
- **Hierarchy Structure**:
  - Grade 10: General curriculum without stream. Sections A, B, C.
  - Grade 11: 4 Streams (`Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`). Sections A1–A3, B1–B3, etc.
  - Grade 12: 4 Streams matching Grade 11.
- **Class Card Grid**:
  - Class Name, Code, Academic Year
  - Stream designation (or `General / No Stream` for Grade 10)
  - Class Teacher assignment
  - Total Enrolled vs Total Room Capacity
  - Section Breakdown:
    - Section Name
    - Room Number (e.g. `Room XI-A2`)
    - Capacity & Enrolled Count
    - Occupancy utilization progress bar

## 4.6 Course & Subjects Catalog (`/admin/subjects`)
- **Curriculum Grid**:
  - Subject Name & Subject Code (e.g. `SUB-MAT-101`)
  - Academic Department
  - Weekly Instructional Periods (e.g. `6 Periods / wk`)
  - Applicable Grades (e.g. `Grades 11, 12`)
  - Applicable Streams (e.g. `Computer Science A, Bio-Maths B` or `All Streams`)
  - Assigned Faculty Names
  - Status (`Active`)
- **Governance**:
  - Strictly NO university credits, credit hours, or grade points.

## 4.7 Institutional Attendance Oversight (`/admin/attendance`)
- **Audit Register**:
  - Date-filtered school-wide attendance log.
  - Grade, Stream, and Section selector.
- **4-Status Audit Breakdown**:
  - Total Enrolled
  - Present Count
  - On Duty Count
  - Approved Leave Count (purple badge)
  - Absent Count (rose badge)
  - Verified Attendance Rate (%) adhering to $(P + OD) / Total \times 100$
  - Verification Authority (`Verified by Class Teacher: R. Suresh`)
  - Roll Call Session Status (`Completed`, `Pending`)

## 4.8 Examination Marks & Grade Audit Register (`/admin/marks`)
- **Score Register**:
  - Filter by Academic Examination (`Half-Yearly Examination 2026`, `Term 1`, `Unit Test 2`).
  - Class, Stream, Section, and Subject selector.
- **Academic Performance Metrics**:
  - Total Students Evaluated
  - Class Average Percentage (%)
  - Highest Marks Achieved (/100)
  - Pass Percentage (%)
  - CBSE 8-Tier Grade Distribution breakdown (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `D`, `E`)
  - Publication Status (`Published`, `In Progress`)

## 4.9 Master Timetable Overview (`/admin/timetable`)
- **Scheduling View**:
  - Filter by Class and Section.
  - Monday through Friday weekly grid.
  - Period timings (08:30 AM to 02:45 PM; Periods 1 through 8).
  - Subject name, assigned faculty member, and classroom location.
  - Room allocation verification to prevent scheduling collisions.

## 4.10 Institutional Calendar & Event Publisher (`/admin/calendar`)
- **Event Management**:
  - Published institutional events list with chronological grouping.
  - Event categories: `Examination`, `Academic`, `Holiday`, `PTM`, `Sports`, `Cultural`.
  - Flags: `is_holiday` (school closed), `od_eligible` (participating students eligible for On Duty attendance credit).
- **Zod-Validated Event Creation Modal**:
  - Title, Category, Start/End Date, Start/End Time, Location, Description.
  - Target Audience (`All School`, `Grades 11-12`, `Parents`).
  - Form validation with reactive error states.

## 4.11 Class & Section Allocation Engine (`/admin/allocation`)
- **Allocation Parameters**:
  - Target Academic Year (`2026–27`)
  - Target Grade Cohort (`Grade 10`, `Grade 11`, `Grade 12`)
  - Target Stream (strictly enforced for Grades 11–12): `Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`.
  - Allocation Method:
    1. **Merit-Based**: Ordered descending by qualifying marks score and distributed across selected target sections in round-robin sequence.
    2. **Random**: Seeded balanced distribution ensuring even class sizes.
  - Target Section Selection: Checkbox toggle for available sections with room capacities.
- **Workflow & Safeguards**:
  - Pre-allocation cohort verification.
  - **Interactive Preview Modal**: Displays proposed section assignments, qualifying score, merit rank, and distribution method before committing.
  - **Publish Action**: Generates confirmed allocation batch with success notification.
  - **Historical Audit Log**: Complete history of past allocation batches with timestamp, method, student count, and administrator signature.

---

# 5. PRINCIPAL ROLE SPECIFICATION (`/principal/*`)

The Principal is the Head of Institution. The Principal portal provides executive oversight, institutional analytics, statutory compliance reviews, and formal document endorsement.

## 5.1 Head of Institution Executive Console (`/principal/dashboard`)
- **Institutional Branding & Header**:
  - Official institution name (`School ERP` / `Modern Public Senior Secondary School`).
  - Executive badge: `Head of Institution Executive Console • Session 2026–27`.
  - Quick access buttons to Academic Analytics and Pending Institutional Reports.
- **KPI Summary Cards**:
  - Total Student Enrollment (1,248)
  - Academic Faculty Strength (86)
  - Student-Teacher Ratio (`15:1`)
  - School Attendance Rate (%)
  - School Academic Average (%)
  - Pending Statutory Reports
- **Visual Analytics**:
  - School-Wide 8-Tier CBSE Grade Distribution (Recharts BarChart).
  - Longitudinal School Attendance Progression (Recharts AreaChart).
- **Upcoming Institutional Milestones**:
  - Board exam submissions, PTM dates, and executive review deadlines.

## 5.2 Academic Syllabus & Cohort Analytics (`/principal/academics`)
- **Grade-Level Performance Comparison**:
  - Grades 9, 10, 11, 12 average academic percentage, pass rates, highest marks, and derived letter grades.
  - Zero university credits or GPA metrics.
- **Senior Secondary Stream Comparison**:
  - Comparative analytics across the 4 approved streams (`Computer Science A`, `Bio-Maths B`, `Commerce C`, `Pure Science D`) for Grades 11 and 12.
  - Top performing subjects per stream.
- **Subject-Wise Quality Assurance Table**:
  - School-wide performance across Mathematics, Physics, Chemistry, Computer Science, English, etc.
  - Average percentage, pass rate, and student count.
- **CBSE 8-Tier Letter Grade Distribution Table**:
  - Percentage and student volume in each tier (`A1` through `E`).

## 5.3 School-Wide Attendance Telemetry & Progression (`/principal/attendance`)
- **Institutional Presence Telemetry**:
  - Overall school presence rate adhering strictly to Master Plan Amendment 2.
  - 4-Status Distribution Cards:
    - `PRESENT` (counts as Presence)
    - `ON_DUTY` (counts as Presence)
    - `LEAVE` (approved leave; counts in denominator as absence, violet token)
    - `ABSENT` (counts as Absence, rose token)
  - Status distribution percentage bar and session volume telemetry.
- **Longitudinal Cohort Progression**:
  - Multi-line chart (Recharts LineChart) tracking Grade 9, 10, 11, and 12 monthly attendance rates over the academic session.

## 5.4 Departmental Faculty Roster & Workload Oversight (`/principal/faculty`)
- **Operational Staff Roster**:
  - Faculty member name, Department, Academic Designation.
  - Educational qualifications (e.g. `Ph.D. Physics`, `M.Sc., B.Ed.`).
  - Assigned teaching classes and sections.
  - Weekly period workload (e.g. `24 Periods / wk`).
  - Contact information and official email.
- **Non-Evaluative Governance**:
  - Strictly non-evaluative: zero appraisal ratings, student reviews, or teacher rankings.

## 5.5 Executive Reports & Statutory Endorsement Dossier Archive (`/principal/reports`)
- **Institutional Reports Registry**:
  - Official school dossiers across categories: `Academic`, `Attendance`, `Faculty`, `Governance`, `Event`.
  - File formats (`PDF`, `XLSX`, `CSV`), file size, generation date.
  - Approval state tracking: `Draft`, `Review`, `Approved`.
- **Statutory Endorsement Workflow (`ReportReviewModal`)**:
  - Principal reviews executive dossier metadata, description, and summary metrics.
  - Statutory endorsement action: Transition from `Draft` / `Review` to `Approved`.
  - Records official audit trail: `approved_by` (`Dr. K. Radhakrishnan (Principal)`), timestamp, and official review remarks (e.g. "Endorsed for official submission to CBSE Regional Directorate").
- **Dossier Download Action**:
  - Generates downloadable official institutional filing dossier text document.

---

# 6. MODULAR FEATURE DOMAIN ARCHITECTURE

Both roles are implemented under modular feature directories adhering to the project's standard barrel export pattern:

### Admin Domain Module (`frontend/src/features/admin/`)
```text
frontend/src/features/admin/
├── types/
│   └── index.ts                 # Admin domain interfaces (KPIs, Students, Parents, Faculty, Classes, Allocation, etc.)
├── schemas/
│   ├── allocationSchema.ts      # Zod validation schema for section allocation parameters
│   └── eventSchema.ts           # Zod validation schema for calendar event publishing
├── services/
│   └── adminService.ts          # AdminService: typed domain adapter over MockDataService
├── hooks/
│   ├── useAdminDashboard.ts     # Hook for dashboard summary & KPIs
│   ├── useAdminStudents.ts      # Hook for student master directory search/filter/export
│   ├── useAdminParents.ts       # Hook for parent master directory
│   ├── useAdminFaculty.ts       # Hook for faculty directory
│   ├── useAdminClasses.ts       # Hook for classes & sections capacity
│   ├── useAdminSubjects.ts      # Hook for subjects catalog
│   ├── useAdminAttendance.ts    # Hook for attendance audits
│   ├── useAdminMarks.ts         # Hook for examination marks oversight
│   ├── useAdminTimetable.ts     # Hook for master timetable
│   ├── useAdminCalendar.ts      # Hook for calendar event management
│   ├── useAdminAllocation.ts    # Hook for allocation workspace, preview & history
│   └── index.ts
├── components/
│   ├── AdminDashboard.tsx       # Executive dashboard layout with KPIs and Recharts
│   ├── StudentDirectory.tsx     # Student master directory with search, filter, modal, CSV export
│   ├── ParentDirectory.tsx      # Parent master directory with child linking
│   ├── FacultyDirectory.tsx     # Non-evaluative faculty staff directory
│   ├── ClassesOverview.tsx      # Classes, sections, and room capacity cards
│   ├── SubjectsCatalog.tsx      # Subject catalog with weekly periods
│   ├── AttendanceOversight.tsx  # 4-status attendance audit register
│   ├── MarksOversight.tsx       # CBSE 8-tier marks register & pass rate audit
│   ├── TimetableOverview.tsx    # Master timetable period grid
│   ├── CalendarEventsManager.tsx# Institutional calendar publisher & Zod modal
│   ├── AllocationWorkspace.tsx  # Section allocation engine with Merit/Random options
│   ├── AllocationPreviewModal.tsx # Allocation preview modal before publication
│   └── index.ts
└── index.ts                     # Feature barrel export
```

### Principal Domain Module (`frontend/src/features/principal/`)
```text
frontend/src/features/principal/
├── types/
│   └── index.ts                 # Principal domain interfaces (Executive KPIs, Analytics, Reports, Telemetry)
├── schemas/
│   └── reportReviewSchema.ts    # Zod validation schema for report endorsement
├── services/
│   └── principalService.ts      # PrincipalService: typed domain adapter over MockDataService
├── hooks/
│   ├── usePrincipalDashboard.ts # Hook for executive dashboard summary
│   ├── useAcademicAnalytics.ts  # Hook for grade and stream academic analytics
│   ├── useAttendanceAnalytics.ts# Hook for 4-status telemetry & cohort trends
│   ├── usePrincipalFaculty.ts   # Hook for faculty oversight roster
│   ├── useInstitutionalReports.ts# Hook for reports registry and endorsement
│   └── index.ts
├── components/
│   ├── PrincipalDashboard.tsx   # Executive console with KPIs, grade distribution, attendance progression
│   ├── AcademicAnalytics.tsx    # Academic analytics with stream breakdown and 8-tier grades
│   ├── AttendanceAnalytics.tsx  # Attendance telemetry with 4-status distribution & longitudinal trends
│   ├── PrincipalFacultyDirectory.tsx # Non-evaluative departmental faculty roster
│   ├── ReportsOverview.tsx      # Official reports registry and filter
│   ├── ReportReviewModal.tsx    # Report endorsement modal with audit trail
│   └── index.ts
└── index.ts                     # Feature barrel export
```

### Page Views Layer (`frontend/src/pages/admin/` & `frontend/src/pages/principal/`)
All page files under `frontend/src/pages/admin/` and `frontend/src/pages/principal/` are thin views consuming their respective domain feature components and hooks. Each directory contains a clean `index.tsx` barrel export:
- Admin (11 pages): `AdminDashboardPage.tsx`, `AdminStudentsPage.tsx`, `AdminParentsPage.tsx`, `AdminFacultyPage.tsx`, `AdminClassesPage.tsx`, `AdminSubjectsPage.tsx`, `AdminAttendancePage.tsx`, `AdminMarksPage.tsx`, `AdminTimetablePage.tsx`, `AdminCalendarPage.tsx`, `AdminAllocationPage.tsx`.
- Principal (5 pages): `PrincipalDashboardPage.tsx`, `PrincipalAcademicsPage.tsx`, `PrincipalAttendancePage.tsx`, `PrincipalFacultyPage.tsx`, `PrincipalReportsPage.tsx`.

---

# 7. AUTOMATED VITEST TEST SUITE

The implementation includes 28 automated Vitest unit tests across 2 dedicated test files:

### `frontend/tests/admin.test.ts` (18 Tests)
1. Loads authoritative admin dashboard KPIs and session context.
2. Retrieves student list with query search and grade level filtering.
3. Verifies permanent, immutable Student ID format (`STU\d{9}`) and admission number (`ADM\d{8}`) on all students.
4. Respects senior secondary stream designations for Grades 11–12.
5. Loads parents and verifies child Student ID linking to parent account.
6. Searches parents by child Student ID.
7. Loads faculty directory with descriptive operational data only.
8. Strictly asserts absence of teacher appraisal ratings, reviews, rankings, or scores.
9. Loads class hierarchy with Grade 10 no-stream and Grades 11–12 stream designations.
10. Validates room capacity numbers across all class sections.
11. Retrieves subjects catalog with weekly period allocations and strictly no credits or GPA.
12. Validates attendance oversight across canonical 4 statuses (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`).
13. Verifies marks register scored out of 100 with CBSE 8-tier letter grade distributions.
14. Validates institutional calendar event creation schema via Zod.
15. Allocates students based on merit ranking (highest qualifying score distributed first).
16. Allocates students based on seeded random distribution.
17. Strictly restricts Grade 11–12 allocations within the selected senior secondary stream.
18. Generates complete preview records and preserves historical allocation logs.

### `frontend/tests/principal.test.ts` (10 Tests)
1. Loads authoritative executive dashboard summary and KPIs.
2. Loads grade-level academic performance scored out of 100 with 8-tier letter grade derivation.
3. Asserts strictly no university metrics (`gpa`, `cgpa`, `credits`, `grade_points`).
4. Provides stream-specific performance breakdown for Grades 11 and 12.
5. Provides 8-tier CBSE letter grade distribution across the institution.
6. Evaluates attendance telemetry across canonical 4 statuses and matches `calculateAttendancePercentage`.
7. Tracks longitudinal monthly attendance trends by grade cohort.
8. Loads faculty directory with qualifications and workload period counts.
9. Strictly asserts absence of teacher ratings, scores, stars, appraisal grades, or rankings.
10. Retrieves institutional reports and executes report endorsement workflow updating status, approver signature, and audit remarks.

---

# 8. VERIFICATION & ACCEPTANCE CHECKLIST

- [x] All 11 Admin routes (`/admin/*`) render without runtime errors or broken layouts.
- [x] All 5 Principal routes (`/principal/*`) render without runtime errors or broken layouts.
- [x] Permanent Student ID (`STU2026...`) is displayed, locked, and immutable across all views.
- [x] Secondary vs. Senior Secondary rules enforced: Grade 10 has no stream; Grades 11–12 support 4 streams.
- [x] Canonical 4-status attendance model (`PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`) enforced with correct formula.
- [x] CBSE 8-tier grading (`A1`–`E`) used exclusively; university GPA/CGPA/credits completely absent.
- [x] Faculty governance strictly non-evaluative (zero ratings, rankings, or appraisal scores).
- [x] Section allocation engine supports Merit and Random distribution with interactive preview and historical logs.
- [x] Principal statutory report review and endorsement workflow functional.
- [x] Vitest test suite passes 128/128 tests across all 7 test suites with zero regressions.
- [x] Production build (`npm run build`) compiles with zero TypeScript errors or warnings.
