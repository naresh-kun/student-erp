# Phase 5 — Task 5.3: Core ERP API Integration — Faculty Module

## 1. Context & Objectives

Following the completion of Task 5.1 (Student Module Live API Integration) and Task 5.2 (Parent Module Live API Integration), **Task 5.3** establishes authoritative API integration for the **Faculty** module.

The primary objective is to replace synthetic mock data in the Faculty module with real Django REST Framework endpoints under `/api/v1/` following the established architecture:
`React → FacultyService → FacultyApiService → ApiClient (from Task 5.1) → Django REST Framework → PostgreSQL`

### Scope of Integration:
1. **Faculty Profile**: `GET /api/v1/faculty/me/` and `/api/v1/faculty/{id}/`
2. **Assigned Classes & Teaching Assignments**: `GET /api/v1/faculty/me/classes/` and `/api/v1/faculty/{id}/classes/`
3. **Assigned Students**: `GET /api/v1/students/?section_id=...` scoped to authorized teaching assignments and Class Teacher sections
4. **Attendance Workflows**: `POST /api/v1/attendance/bulk/` (canonical 4 statuses: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`)
5. **Class Teacher Leave Review**: `GET /api/v1/attendance/leaves/` and `PATCH /api/v1/attendance/leaves/{id}/`
6. **Examination Marks Entry**: `POST /api/v1/marks/bulk/` and `GET /api/v1/marks/` (strictly governed by `TeachingAssignment`)
7. **Homework Management**: `GET, POST, PATCH, DELETE /api/v1/homework/` (MOD_001 TeachingAssignment authority)

---

## 2. Critical Faculty RBAC Rules

1. **Teaching Assignment Authority**:
   - `TeachingAssignment` is the sole authority for entering marks and creating/modifying homework.
   - Being designated a Class Teacher does **not** grant marks entry or homework creation authority for subjects taught by other teachers in that class.
2. **Class Teacher Boundary**:
   - Only the designated Class Teacher of a section (or Administrator) may review (approve/reject) student leave applications for that section.
   - Subject Faculty who teach a class but are not the Class Teacher receive `403 Forbidden` if attempting to approve/reject student leave applications.
3. **Restricted Faculty Permissions**:
   - Faculty members must NOT gain school-wide unrestricted access, student allocation mutation authority, student deletion, marks approval/override, or audit log access.
   - Cross-section access to students, attendance registers, and unassigned subject marks returns `403 Forbidden`.

---

## 3. Implementation Summary

### 3.1 Backend Enhancements
- **`backend/apps/accounts/serializers.py`**:
  - Enhanced `FacultySerializer` with `full_name`, `status`, `class_teacher_of` (with `class_id`, `section_id`, `class_name`, `section_name`, `name`, `display_name`, `room`), `assigned_classes_count`, `assigned_students_count`, and `weekly_periods`.
- **`backend/apps/accounts/urls_faculty.py`**:
  - Added routes for `me/`, `me/classes/`, `<str:pk>/classes/`, and `<str:pk>/`.
- **`backend/apps/accounts/views.py`**:
  - `FacultyDetailView`: Supports `pk='me'` and enforces anti-tampering guards on administrative fields (`employee_code`, `department`, `designation`, `joining_date`, `is_active`).
  - `FacultyClassesView`: Returns authoritative teaching assignments and Class Teacher sections. Cross-faculty queries by unauthorized roles rejected with `403 Forbidden`.
- **`backend/apps/attendance/views.py` & `backend/apps/attendance/urls.py`**:
  - Added `LeaveApplicationDetailView` (`GET` and `PATCH /api/v1/attendance/leaves/<uuid:pk>/`).
  - Strictly enforces that only the designated Class Teacher of the student's active section can approve or reject leave applications (`status='APPROVED' | 'REJECTED'`).
- **`backend/common/authorization.py`**:
  - Scoped `_scope_student_queryset`, `_can_faculty_access_object`, `_scope_enrollment_queryset`, and `_scope_parent_queryset` to allow Faculty access to students enrolled in sections where they have active `TeachingAssignment` or are `class_teacher`.
  - Maintained strict `can_faculty_teach_subject` enforcement on marks entry (`BulkMarkCreateView`).

### 3.2 Frontend Enhancements
- **`frontend/src/features/faculty/services/facultyApiService.ts`**:
  - Created strongly typed API client consuming Django REST endpoints using shared `ApiClient`.
  - Methods: `getFacultyProfile`, `getAssignedClasses`, `getAssignedStudents`, `recordBulkAttendance`, `getLeaveApplications`, `reviewLeaveApplication`, `recordBulkMarks`, `getHomework`, `createHomework`, `updateHomework`, `deleteHomework`.
- **`frontend/src/features/faculty/services/facultyService.ts`**:
  - Wired `getFacultyProfile`, `getAssignedClasses`, `getAssignedStudents`, `getPendingLeaveNotices`, `reviewLeaveNotice`, `submitAttendanceRollCall`, and `saveMarksEntrySheet` to `FacultyApiService` with resilient fallback to local storage / demo seed data.
- **`frontend/src/features/faculty/index.ts`**:
  - Barrel export for `FacultyApiService`.

---

## 4. Verification

1. **Backend Integration Tests**:
   - `backend/tests/test_phase5_faculty_integration_task53.py` (24 tests, 100% pass rate).
   - Full regression suite: **436 / 436 passing**.
2. **Frontend Vitest Tests**:
   - `frontend/tests/faculty_api_integration.test.ts` (14 tests, 100% pass rate).
   - Full frontend test suite: **213 / 213 passing across 13 test files**.
3. **Frontend Production Build**:
   - `npm run build` passed cleanly with 0 errors.
4. **Interactive Browser Verification**:
   - Verified on `http://localhost:5173` using `faculty_suresh` / `demo123`.
   - Flow tested: Login → Faculty Dashboard → Classes & Students → Attendance Register → Marks & Gradebook → Homework → Logout.
