# Phase 5 — Task 5.2 Specification
## Real API Integration — Parent Module

> **Phase**: Phase 5 (Core ERP API Integration & Advanced Workflows)  
> **Task**: Task 5.2 (Real API Integration — Parent Module)  
> **Status**: **COMPLETE**  
> **Authoritative Specification**: Student ERP Phase 5 Roadmap  
> **Date**: 2026-10-07  

---

## 1. Task Objective

Migrate the **Parent** module from synthetic/mock-backed datasets to the live Django REST Framework backend while strictly preserving the established frontend domain abstraction, UI presentation, and security boundaries.

### Scoped Functional Areas:
1. **Parent Profile & Identity**:
   - Live endpoints: `GET /api/v1/parents/me/` and `GET /api/v1/parents/{id}/`
   - Relation, occupation, address, contact details, and linked children count
   - Boundary enforcement: Parents can only inspect their own profile; foreign parent IDs return `403 Forbidden`
2. **Linked Children Scoping**:
   - Live endpoints: `GET /api/v1/parents/me/children/` and `GET /api/v1/parents/{id}/children/`
   - Detailed child profile inspection via `GET /api/v1/students/{student_id}/`
   - Class, section, stream, academic year, and Class Teacher metadata
   - Strict boundary protection: Parents can only select and inspect children linked to their authenticated record; foreign children return `403 Forbidden`
3. **Ward Attendance & Absence Justification**:
   - Live endpoints: `GET /api/v1/attendance/?student_id={id}` and `GET /api/v1/attendance/leaves/?student_id={id}`
   - Canonical 4 statuses: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`
   - Formula: `(PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100`
   - Absence notification / leave application submission: `POST /api/v1/attendance/leaves/` (strictly initial `PENDING` state; parents cannot self-approve; foreign child submission rejected with `403 Forbidden`)
4. **Ward Academic Standing & Report Card**:
   - Live endpoint: `GET /api/v1/marks/report-card/{student_id}/` and `GET /api/v1/marks/?student_id={id}`
   - Scored out of 100 with CBSE 8-tier grading (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `D`, `E`)
   - Cumulative totals, overall percentage, passing threshold (33%)
   - Strict absence of GPA, CGPA, or credit hours
5. **Parent Dashboard**:
   - Real-time hydration of parent welcome banner, linked ward selection, attendance cards, and marks summary
   - Safe preservation of modules scheduled for future Phase 5 tasks (Timetable, Calendar)

---

## 2. Architecture & Service Flow

```text
React Page / Component (e.g. ParentDashboardPage, ParentAttendancePage)
          ↓
Reusable Hook (e.g. useParentProfile, useLinkedChildren, useChildAttendance)
          ↓
Domain Service Layer (ParentService)
          ↓
API Client Layer (ParentApiService -> ApiClient)
          ↓ [Bearer JWT, 401 Auto-Refresh]
Django REST Framework (/api/v1/parents/me/, /api/v1/parents/me/children/, /api/v1/marks/report-card/{id}/)
          ↓ [Authoritative RBAC & Scoped Querysets]
PostgreSQL Database
```

---

## 3. Endpoints Implemented & Verified

| HTTP Method | Endpoint | Description | Authoritative Clearance |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/parents/me/` | Retrieves authenticated parent profile | `ROLE_PARENT` (Self) |
| `GET` | `/api/v1/parents/{id}/` | Retrieves parent profile by UUID | `ROLE_PARENT` (Self only; 403 on other) |
| `GET` | `/api/v1/parents/me/children/` | Retrieves linked student profiles for parent | `ROLE_PARENT` (Self) |
| `GET` | `/api/v1/parents/{id}/children/` | Retrieves linked student profiles by parent ID | `ROLE_PARENT` (Self only; 403 on other) |
| `GET` | `/api/v1/students/{id}/` | Retrieves student profile by student ID | `ROLE_PARENT` (Linked child only; 403 on other) |
| `GET` | `/api/v1/attendance/?student_id={id}` | Retrieves ward attendance logs and summary | `ROLE_PARENT` (Linked child only) |
| `GET` | `/api/v1/attendance/leaves/?student_id={id}` | Retrieves ward leave history | `ROLE_PARENT` (Linked child only) |
| `POST` | `/api/v1/attendance/leaves/` | Submits absence notice / leave application | `ROLE_PARENT` (Linked child only in PENDING; 403 on other) |
| `GET` | `/api/v1/marks/report-card/{id}/`| Retrieves authoritative calculated report card | `ROLE_PARENT` (Linked child only; 403 on other) |
| `GET` | `/api/v1/marks/?student_id={id}` | Retrieves individual mark records | `ROLE_PARENT` (Linked child only) |

---

## 4. Verification Gates & Deliverables

- [x] Backend test suite passing 100% (408/408 tests, including 18 dedicated Task 5.2 tests)
- [x] Frontend test suite passing 100% (199/199 tests, including 9 dedicated Task 5.2 tests)
- [x] Django system check: 0 issues
- [x] Migration drift check: 0 changes detected
- [x] Production build passes cleanly in 14.43s with 0 errors
- [x] E2E live server verification across parent login, dashboard, attendance, marks, homework, and child scoping
