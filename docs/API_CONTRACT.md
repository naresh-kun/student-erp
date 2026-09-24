# REST API Contract Specification (`/api/v1/`)

> **Status**: Authoritative API Specification  
> **API Version**: `v1`  
> **Current Status**: **PLANNED** (Phase 1 establishes design contracts only; NO API endpoints are currently implemented)  
> **Base URL**: `/api/v1`  
> **Last Updated**: 2026-09-24

---

## 1. Implementation Status Legend

| Status Token | Definition | Current Count |
| :--- | :--- | :--- |
| **`IMPLEMENTED`** | Endpoint exists, unit tested, accessible via network | 0 |
| **`MOCKED`** | Simulated in frontend via `mock-data/` & `services/mockService.ts` | 10 Datasets |
| **`PLANNED`** | Fully documented schema & contract, scheduled for future backend phases | All v1 endpoints below |

---

## 2. Global Standards & Conventions

1. **Format**: All payloads must be formatted as UTF-8 encoded `application/json`.
2. **Authentication**: All endpoints (except public `/auth/login/`) require an `Authorization: Bearer <JWT_ACCESS_TOKEN>` header.
3. **Response Envelope**: Standard responses adhere to the following schema:
   ```json
   {
     "success": true,
     "data": {},
     "meta": {
       "page": 1,
       "page_size": 20,
       "total_records": 105
     }
   }
   ```
4. **Error Envelope**: Standardized error responses adhere to:
   ```json
   {
     "success": false,
     "error": {
       "code": "PERMISSION_DENIED",
       "message": "You lack clearance to access student records outside your department.",
       "details": []
     }
   }
   ```

---

## 3. Endpoint Specifications

### 3.1 Authentication & Profile (`/api/v1/auth/`)
- `POST /api/v1/auth/login/` `[PLANNED]`
  - Request: `{ "username": "...", "password": "..." }`
  - Response: `{ "access": "<jwt>", "refresh": "<jwt>", "user": { "id": "...", "role": "..." } }`
- `POST /api/v1/auth/refresh/` `[PLANNED]`
  - Request: `{ "refresh": "<jwt>" }`
  - Response: `{ "access": "<jwt>" }`
- `GET /api/v1/auth/me/` `[PLANNED]`
  - Returns authenticated user profile, permissions, and active role context.

### 3.2 Students (`/api/v1/students/`)
- `GET /api/v1/students/` `[PLANNED]`
  - Filters: `class_id`, `section_id`, `academic_year`, `search`
  - Permitted Roles: Admin, Principal, Faculty
- `GET /api/v1/students/{id}/` `[PLANNED]`
  - Permitted Roles: Admin, Principal, Faculty, Student (self), Parent (linked child)
- `POST /api/v1/students/` `[PLANNED]`
  - Permitted Roles: Admin
- `PATCH /api/v1/students/{id}/` `[PLANNED]`
  - Permitted Roles: Admin

### 3.3 Parents (`/api/v1/parents/`)
- `GET /api/v1/parents/` `[PLANNED]`
  - Permitted Roles: Admin, Principal
- `GET /api/v1/parents/{id}/` `[PLANNED]`
  - Permitted Roles: Admin, Principal, Parent (self)
- `GET /api/v1/parents/{id}/children/` `[PLANNED]`
  - Returns list of verified student profiles linked to this parent.

### 3.4 Faculty (`/api/v1/faculty/`)
- `GET /api/v1/faculty/` `[PLANNED]`
  - Permitted Roles: Admin, Principal, Faculty, Student
- `GET /api/v1/faculty/{id}/` `[PLANNED]`
  - Permitted Roles: Admin, Principal, Faculty
- `POST /api/v1/faculty/` `[PLANNED]`
  - Permitted Roles: Admin
- `PATCH /api/v1/faculty/{id}/` `[PLANNED]`
  - Permitted Roles: Admin, Faculty (self for biographical fields)

### 3.5 Classes & Sections (`/api/v1/classes/`)
- `GET /api/v1/classes/` `[PLANNED]`
  - Permitted Roles: All authenticated roles
- `POST /api/v1/classes/` `[PLANNED]`
  - Permitted Roles: Admin
- `GET /api/v1/classes/{id}/sections/` `[PLANNED]`
  - Lists sections, capacities, and assigned class teachers.

### 3.6 Subjects (`/api/v1/subjects/`)
- `GET /api/v1/subjects/` `[PLANNED]`
  - Lists institutional courses, credit hours, and syllabus metadata.
- `POST /api/v1/subjects/` `[PLANNED]`
  - Permitted Roles: Admin, Principal

### 3.7 Attendance (`/api/v1/attendance/`)
- `GET /api/v1/attendance/` `[PLANNED]`
  - Query parameters: `student_id`, `class_id`, `date`, `month`
  - Permitted Roles: Admin, Principal, Faculty, Student (self only), Parent (child only)
  - Calculation Rule: Attendance % strictly follows Master Plan Amendment 2:
    `Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100`
- `POST /api/v1/attendance/bulk/` `[PLANNED]`
  - Bulk records session or daily attendance for an entire class/section.
  - Allowed Statuses: `['PRESENT', 'ABSENT', 'ON_DUTY', 'LEAVE']` (`LATE` and `EXCUSED` strictly prohibited).
  - Attributes: When `status === 'LEAVE'`, `approved_by_faculty_id` is required.
  - Permitted Roles: Faculty (assigned class), Admin
- `PATCH /api/v1/attendance/{id}/` `[PLANNED]`
  - Updates attendance state (e.g. faculty approving and marking `LEAVE`).
  - Allowed Statuses: `['PRESENT', 'ABSENT', 'ON_DUTY', 'LEAVE']`.
  - Permitted Roles: Faculty, Admin

### 3.8 Marks & Examinations (`/api/v1/marks/`)
- `GET /api/v1/marks/` `[PLANNED]`
  - Query parameters: `student_id`, `subject_id`, `exam_type_id`
  - Permitted Roles: Admin, Principal, Faculty, Student (self only), Parent (child only)
- `POST /api/v1/marks/bulk/` `[PLANNED]`
  - Records student evaluation marks for a test.
  - Permitted Roles: Faculty, Admin
- `GET /api/v1/marks/transcript/{student_id}/` `[PLANNED]`
  - Returns calculated GPA, cumulative grades, and term report.

### 3.9 Timetable (`/api/v1/timetable/`)
- `GET /api/v1/timetable/class/{class_id}/` `[PLANNED]`
  - Returns weekly schedule grid for a class section.
- `GET /api/v1/timetable/faculty/{faculty_id}/` `[PLANNED]`
  - Returns weekly schedule grid for an instructor.
- `POST /api/v1/timetable/` `[PLANNED]`
  - Creates or modifies timetable slots.
  - Permitted Roles: Admin

### 3.10 Institutional Calendar (`/api/v1/calendar/`)
- `GET /api/v1/calendar/events/` `[PLANNED]`
  - Returns institutional calendar entries filtered by date range and role relevance.
- `POST /api/v1/calendar/events/` `[PLANNED]`
  - Permitted Roles: Admin, Principal

### 3.11 Allocation Engine (`/api/v1/allocation/`)
- `POST /api/v1/allocation/run/` `[PLANNED]`
  - Executes batch allocation algorithms to balance student section distribution.
  - Permitted Roles: Admin, Principal
- `GET /api/v1/allocation/status/{run_id}/` `[PLANNED]`
  - Checks state of background allocation computation.

### 3.12 Reports & Analytics (`/api/v1/reports/`)
- `GET /api/v1/reports/attendance-summary/` `[PLANNED]`
  - Aggregates school-wide or class-specific attendance percentages.
- `GET /api/v1/reports/academic-performance/` `[PLANNED]`
  - Aggregates grading distribution, passing rates, and subject rankings.
- `GET /api/v1/reports/export/{type}/` `[PLANNED]`
  - Generates downloadable CSV or PDF institutional transcripts/reports.
