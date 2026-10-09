# REST API Contract Specification (`/api/v1/`)

> **Status**: Authoritative API Specification  
> **API Version**: `v1`  
> **Current Status**: **Phase 4 Task 4.4 COMPLETE** (Comprehensive endpoint-level RBAC enforcement, query scoping, and object-level authorization across all 33 API routes; frontend integration deferred to Phase 5)  
> **Base URL**: `/api/v1`  
> **Last Updated**: 2026-10-06

---

## 1. Implementation Status Legend

| Status Token | Definition | Current Count |
| :--- | :--- | :--- |
| **`IMPLEMENTED`** | Endpoint exists, unit & RBAC tested, accessible via network | 33 Endpoints (Task 4.4 Broad RBAC Enforcement) |
| **`MOCKED`** | Simulated in frontend via `mock-data/` & `services/mockService.ts` | 10 Datasets (Phase 2 Prototyping) |
| **`PLANNED`** | Fully documented schema & contract, scheduled for future backend phases | Advanced background pipelines (Task 4.5+ / Phase 6) |

---

## 2. Global Standards & Conventions

1. **Format**: All payloads must be formatted as UTF-8 encoded `application/json`.
2. **Authentication**: All endpoints (except public `/api/health/`, `/api/v1/auth/login/`, and `/api/v1/auth/refresh/`) require an `Authorization: Bearer <JWT_ACCESS_TOKEN>` header.
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
5. **Denial Semantics**:
   - `401 Unauthorized`: Missing, expired, invalid JWT, or inactive user.
   - `403 Forbidden`: Authenticated user lacks required permission or fails object-level scope checks.

---

## 3. Endpoint Specifications

### 3.1 Public Liveness Check (`/api/`)
- `GET /api/health/` `[IMPLEMENTED]`
  - Authentication: Unauthenticated (Public)
  - Returns: Liveness probe with database connectivity status (`status: ok`).

### 3.2 Authentication & Profile (`/api/v1/auth/`)
- `POST /api/v1/auth/login/` `[IMPLEMENTED]`
  - Authentication: Unauthenticated (Public)
  - Request: `{ "username": "<identifier>", "password": "<password>" }`
  - Identifier Resolution Order (Task 4.5):
    - **Student Authentication**: If `<identifier>` matches `^STU\d{4}\d{5}$` (case-insensitive, trimmed whitespace), resolves `Student` -> `student.user`. Verifies student password, `student.user.is_active == True`, and `student.status != 'Withdrawn'`. On success, issues JWT with `role = 'Student'`.
    - **Parent Authentication**: If `<identifier>` matches Student ID and student authentication does not succeed, resolves `student.parent` -> `parent.user`. Verifies parent password and `parent.user.is_active == True`. Supports multi-child parents (any linked child's Student ID authenticates the parent). On success, issues JWT with `role = 'Parent'`.
    - **Standard Fallback**: Preserves direct username authentication for Admin, Principal, Faculty, and direct username credentials.
  - Security Controls:
    - Server-derived identity and role claims strictly from database (`user.role.name`, `user.id`); client payload tampering (`role`, `user_id`, `student_id`) is ignored.
    - All authentication failures return generic HTTP 401 Unauthorized (`NO_ACTIVE_ACCOUNT`) with zero account existence or linkage leakage.
    - Dummy password hashing mitigates enumeration timing differences on non-existent identifiers.
  - Response: `{ "access": "<jwt>", "refresh": "<jwt>", "token_type": "Bearer", "user": { "id": "...", "username": "...", "email": "...", "first_name": "...", "last_name": "...", "role": "..." }, "success": true, "data": { ... } }`
- `POST /api/v1/auth/refresh/` `[IMPLEMENTED]`
  - Authentication: Unauthenticated (Public)
  - Request: `{ "refresh": "<jwt>" }`
  - Response: `{ "access": "<jwt>" }`
- `GET /api/v1/auth/me/` `[IMPLEMENTED]`
  - Authentication: Required (`IsAuthenticated`, active user)
  - Permitted Roles: All 5 roles (`Admin`, `Principal`, `Faculty`, `Student`, `Parent`)
  - Returns: Safe authenticated user profile and role context.

### 3.3 Students (`/api/v1/students/`)
- `GET /api/v1/students/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `students.view`
  - Scoping: Admin/Principal: Global; Faculty: Assigned section; Student: Self; Parent: Linked child.
  - Query Parameters: `class_id`, `section_id`, `academic_year`, `search`, `status`
- `POST /api/v1/students/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `students.create`
  - Permitted Roles: Admin only
- `GET /api/v1/students/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `students.view` + Object Check (`IsOwnerOrScopedAccess`)
  - Permitted Roles: Admin, Principal, Faculty (assigned section), Student (self), Parent (linked child)
- `PATCH /api/v1/students/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `students.update` + Object Check (`IsOwnerOrScopedAccess`)
  - Permitted Roles: Admin only

### 3.4 Parents (`/api/v1/parents/`)
- `GET /api/v1/parents/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `students.view`
  - Scoping: Admin/Principal: Global; Faculty: Assigned section parents; Parent: Self.
- `GET /api/v1/parents/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `students.view` + Object Check (`IsOwnerOrScopedAccess`)
  - Permitted Roles: Admin, Principal, Faculty (if student in section), Parent (self)
- `GET /api/v1/parents/{id}/children/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `students.view` + Object Check (`IsOwnerOrScopedAccess`)
  - Permitted Roles: Admin, Principal, Parent (self)

### 3.5 Faculty (`/api/v1/faculty/`)
- `GET /api/v1/faculty/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `users.view`
  - Scoping: Descriptive active directory lookup for all authenticated roles (`is_active=True`).
- `POST /api/v1/faculty/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `users.create`
  - Permitted Roles: Admin only
- `GET /api/v1/faculty/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `users.view` + Object Check (`IsOwnerOrScopedAccess`)
  - Permitted Roles: All roles (active profile), self
- `PATCH /api/v1/faculty/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `users.update` + Object Check (`IsOwnerOrScopedAccess`)
  - Permitted Roles: Admin (all fields), Faculty (self bio/office only; administrative fields protected)

### 3.6 Classes & Sections (`/api/v1/classes/` and `/api/v1/academics/classes/`)
- `GET /api/v1/classes/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.view` (All authenticated roles)
- `POST /api/v1/classes/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.manage` (Admin and Principal)
- `GET /api/v1/classes/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.view` (All authenticated roles)
- `GET /api/v1/classes/{id}/sections/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.view` (All authenticated roles)

### 3.7 Subjects (`/api/v1/subjects/` and `/api/v1/academics/subjects/`)
- `GET /api/v1/subjects/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.view` (All authenticated roles)
- `POST /api/v1/subjects/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.manage` (Admin and Principal)
- `GET /api/v1/subjects/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.view` (All authenticated roles)

### 3.8 Academic Years (`/api/v1/academics/years/`)
- `GET /api/v1/academics/years/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `academics.view` (All authenticated roles)

### 3.9 Attendance (`/api/v1/attendance/`)
- `GET /api/v1/attendance/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.view`
  - Scoping: Admin/Principal: Global; Faculty: Assigned section; Student: Self; Parent: Linked child.
  - Formula: `(PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100`
- `POST /api/v1/attendance/bulk/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.mark`
  - Permitted Roles: Admin/Principal (Global), Faculty (Assigned Class Teacher or active TeachingAssignment faculty for that section; cross-section rejected with 403)
  - Allowed Statuses: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE` (`LATE` and `EXCUSED` strictly rejected)
- `GET /api/v1/attendance/absentees/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.view_absentees`
  - Permitted Roles: Admin, Principal, Faculty (Assigned scope). Student/Parent denied.
  - Strict Filter: Enforces status strictly `ABSENT` (excludes PRESENT, ON_DUTY, LEAVE).
- `GET /api/v1/attendance/summary/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.view`
  - Permitted Roles: Admin, Principal (Global section daily audit roll-up), Faculty (Assigned sections).
- `GET /api/v1/attendance/analytics/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.view`
  - Permitted Roles: Admin, Principal. Institutional presence telemetry, 4-status distribution, and cohort trends.
- `GET /api/v1/attendance/not-entered/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.view_not_entered`
  - Permitted Roles: Admin, Principal, Faculty (Assigned scope). Student/Parent denied.
  - Identifies scheduled sessions with no attendance submission.
- `GET /api/v1/attendance/leaves/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.view` (Scoped by user)
- `POST /api/v1/attendance/leaves/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: Student (Self only), Faculty, Admin
- `GET /api/v1/attendance/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.view` + Object Check (`IsOwnerOrScopedAccess`)
- `PATCH /api/v1/attendance/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `attendance.mark` + Object Check (`IsOwnerOrScopedAccess`)

### 3.10 Marks & Examinations (`/api/v1/marks/`)
- `GET /api/v1/marks/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `marks.view`
  - Scoping: Admin/Principal: Global; Faculty: Assigned section; Student: Self; Parent: Linked child.
  - Query Parameters: `student_id`, `subject_id`, `subject_code`, `exam_type_id`, `exam_type`, `class_id`, `section_id`
- `GET /api/v1/marks/summary/` `[IMPLEMENTED — TASK 5.6]`
  - Authentication: Required
  - Required Permission: `marks.view`
  - Permitted Roles: Admin, Principal (Global school-wide marks oversight), Faculty (Scoped to assigned teaching sections). Student and Parent denied (403).
  - Query Parameters: `academic_year_id`, `exam_type_id`, `grade_level`, `section_id`, `subject_id`
  - Response: Institutional roll-ups (`total_records`, `evaluated_students`, `school_average`, `pass_rate`, `grade_distribution`, `section_rollups`, `subject_rollups`).
- `GET /api/v1/marks/analytics/` `[IMPLEMENTED — TASK 5.6]`
  - Authentication: Required
  - Required Permission: `marks.view`
  - Permitted Roles: Admin, Principal (Executive academic analytics). Faculty, Student, and Parent denied (403).
  - Query Parameters: `grade_level`, `stream`, `academic_year_id`, `exam_type_id`
  - Response: Longitudinal academic performance (`kpis`, `gradePerformance`, `streamPerformance`, `subjectPerformance`, `schoolGradeDistribution`).
- `POST /api/v1/marks/bulk/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `marks.enter`
  - Permitted Roles: Admin (Global), Faculty (Authorized Subject Faculty with active `TeachingAssignment` for that section and subject; Class Teacher alone does NOT grant all-subject marks authority; unassigned subject rejected with 403). Principal, Student, Parent denied (403).
  - Body: `{ records: [{ student_id, subject_id, exam_type_id, marks_obtained, max_marks?, remarks? }] }`
  - Validation: `marks_obtained` must be numeric 0–100 or `'AB'` (Absent). Negative or >100 rejected. Accepts UUID or code/name for `subject_id` and `exam_type_id`.
- `GET /api/v1/marks/exam-types/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `marks.view` (All authenticated roles)
- `POST /api/v1/marks/exam-types/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `marks.override` (Admin only)
- `GET /api/v1/marks/report-card/{student_id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `reports.view` + Object Check (`can_access_object`)
  - Permitted Roles: Admin, Principal, Faculty (Assigned section), Student (Self), Parent (Linked child)
  - Computations: Backend-authoritative cumulative marks, max marks, overall percentage, and CBSE 8-tier letter grade. Absent ('AB') subjects counted with 0 marks obtained.
- `GET /api/v1/marks/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `marks.view` + Object Check (`IsOwnerOrScopedAccess`)
- `PATCH /api/v1/marks/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `marks.enter` + Object Check (`IsOwnerOrScopedAccess`)

### 3.11 Homework (`/api/v1/homework/`) `[IMPLEMENTED — MOD_001]`
- `GET /api/v1/homework/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `homework.view`
  - Permitted Roles: Admin/Principal (Global), Faculty (Assigned teaching scope), Student (Enrolled section, `PUBLISHED` only), Parent (Linked children sections, `PUBLISHED` only)
  - Scoping: Scoped server-side before serialization. DRAFT items strictly invisible to Students/Parents.
  - Query Parameters: `section_id`, `class_id`, `subject_id`, `status`, `due_date_from`, `due_date_to`, `search`
- `POST /api/v1/homework/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `homework.create`
  - Permitted Roles: Admin (Global), Faculty (Authorized Subject Faculty teaching the section and subject; server-side verified via `TeachingAssignment`; unassigned subject/section rejected with 403; forged `faculty` in payload ignored). Students and Parents strictly denied (403).
- `GET /api/v1/homework/scope/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `homework.create`
  - Permitted Roles: Faculty (returns active `TeachingAssignment` tuples for dropdown population: assignment_id, class_id, class_name, section_id, section_name, subject_id, subject_name, subject_code, academic_year_id, academic_year_name). Admin returns all active assignments. Other roles denied (403).
- `GET /api/v1/homework/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `homework.view` + Object Check (`can_access_object`)
  - Permitted Roles: Admin, Principal (School-wide view), Faculty (Assigned scope/author), Student (Enrolled section, published only), Parent (Linked child section, published only). Cross-section ID manipulation rejected (403/404).
- `PATCH /api/v1/homework/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `homework.update` + Object Check (`can_access_object`)
  - Permitted Roles: Admin (Global), Faculty (Author only; cross-faculty mutation rejected with 403/404). Students, Parents, and Principals denied (403).
- `DELETE /api/v1/homework/{id}/` `[IMPLEMENTED]`
  - Authentication: Required
  - Required Permission: `homework.delete` + Object Check (`can_access_object`)
  - Permitted Roles: Admin (Global), Faculty (Author only; cross-faculty deletion rejected with 403/404). Returns `204 No Content`. Students, Parents, and Principals denied (403).

### 3.12 Scaffolding Endpoints
- `GET /api/v1/allocation/` `[IMPLEMENTED]`
  - Required Permission: `allocation.view` (Admin, Principal, Faculty)
- `GET /api/v1/audit/` `[IMPLEMENTED]`
  - Required Permission: `audit.view` (Admin, Principal only)
- `GET /api/v1/calendar/events/` `[IMPLEMENTED]`
  - Required Permission: `calendar.view` (All authenticated roles)
- `GET /api/v1/timetable/` `[IMPLEMENTED]`
  - Required Permission: `timetable.view` (All authenticated roles)
- `GET /api/v1/reports/` `[IMPLEMENTED]`
  - Required Permission: `reports.view` (All authenticated roles)
- `GET /api/v1/notifications/` `[IMPLEMENTED]`
  - Required Permission: `users.view` (All authenticated roles)
