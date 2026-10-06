# Phase 5 — Task 5.1 Specification
## Real API Integration — Student Module

> **Phase**: Phase 5 (Core ERP API Integration & Advanced Workflows)  
> **Task**: Task 5.1 (Real API Integration — Student Module)  
> **Status**: **COMPLETE**  
> **Authoritative Specification**: Student ERP Phase 5 Roadmap  
> **Date**: 2026-10-07  

---

## 1. Task Objective

Migrate the **Student** module from mock-backed data to the live Django REST Framework backend while strictly preserving the established frontend service abstraction, UI presentation, and security boundaries.

### Scoped Functional Areas:
1. **Student Profile & Identity**:
   - Live endpoint: `GET /api/v1/students/me/` and `GET /api/v1/students/{id}/`
   - Permanent immutable Student ID (`STU202600001`)
   - Class, section, stream, guardian, and Class Teacher details
   - Mutation protection: Students cannot mutate administrative fields via `PATCH` (403 Forbidden)
2. **Student Attendance & Leaves**:
   - Live endpoints: `GET /api/v1/attendance/` and `GET /api/v1/attendance/leaves/`
   - Canonical 4 statuses: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`
   - Formula: `(PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100`
   - Leave submission: `POST /api/v1/attendance/leaves/` (strictly initial `PENDING` state)
3. **Student Marks & Report Card**:
   - Live endpoint: `GET /api/v1/marks/report-card/{student_id}/`
   - Scored out of 100 with CBSE 8-tier grading (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `D`, `E`)
   - Cumulative totals, overall percentage, passing threshold (33%)
   - Strict absence of GPA, CGPA, or credit hours
4. **Student Dashboard**:
   - Real-time hydration of student welcome banner, marks summary cards, and attendance stats
   - Safe preservation of modules scheduled for future Phase 5 tasks (Timetable, Calendar)

---

## 2. Architecture & Service Flow

```text
React Page / Component (e.g. StudentProfilePage)
          ↓
Reusable Hook (e.g. useStudentProfile)
          ↓
Domain Service Layer (StudentService)
          ↓
API Client Layer (StudentApiService -> ApiClient)
          ↓ [Bearer JWT, 401 Auto-Refresh]
Django REST Framework (/api/v1/students/me/)
          ↓ [Authoritative RBAC & Object Scope]
PostgreSQL Database
```

---

## 3. Endpoints Implemented & Verified

| HTTP Method | Endpoint | Description | Authoritative Clearance |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/students/me/` | Retrieves authenticated student profile | `ROLE_STUDENT` (Self) |
| `GET` | `/api/v1/students/{id}/` | Retrieves student profile by UUID or Student ID | `ROLE_STUDENT` (Self only; 403 on other) |
| `GET` | `/api/v1/attendance/` | Retrieves scoped attendance logs and calculated summary | `ROLE_STUDENT` (Self only) |
| `GET` | `/api/v1/attendance/leaves/` | Retrieves student's leave applications | `ROLE_STUDENT` (Self only) |
| `POST` | `/api/v1/attendance/leaves/` | Submits new leave application in PENDING status | `ROLE_STUDENT` (Self only; 403 on impersonation) |
| `GET` | `/api/v1/marks/report-card/{id}/`| Retrieves authoritative calculated report card | `ROLE_STUDENT` (Self only; 403 on other) |
| `GET` | `/api/v1/marks/` | Retrieves individual mark records | `ROLE_STUDENT` (Self only) |

---

## 4. Verification Gates & Deliverables

- [x] Backend test suite passing 100% (390/390 tests, including 13 dedicated Task 5.1 tests)
- [x] Frontend test suite passing 100% (190/190 tests, including 9 dedicated Task 5.1 tests)
- [x] Django system check: 0 issues
- [x] Migration drift check: 0 changes detected
- [x] Production build passes cleanly with 0 errors
- [x] E2E browser verification across login, dashboard, profile, attendance, marks, homework, and logout
