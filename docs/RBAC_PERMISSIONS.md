# Role-Based Access Control (RBAC) & Security Boundaries

> **Status**: Authoritative Security Governance  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-24

---

## 1. Security Architecture & Boundary Philosophy

### 1.1 The Crucial Distinction
In the Student ERP architecture, there is a strict separation between navigation aesthetics and security enforcement:

```text
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND ROUTE RESTRICTIONS                 │
│  - Purpose: UX optimization, navigation layout, clutter reduction│
│  - Mechanism: React Router guards, sidebar menu filtering   │
│  - Security Level: NON-AUTHORITATIVE (Can be bypassed in DOM) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (HTTP Request / WebSocket Frame)
┌─────────────────────────────────────────────────────────────┐
│                BACKEND AUTHORIZATION ENGINE                 │
│  - Purpose: Actual Security & Integrity Boundary            │
│  - Mechanism: Django REST Framework Permission Classes,     │
│    Object-Level Ownership checks, Database Transaction Locks│
│  - Security Level: AUTHORITATIVE & NON-BYPASSABLE           │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Frontend route protection or hiding buttons does **NOT** constitute security. Every backend API endpoint and WebSocket consumer MUST independently authenticate identity, check role permissions, and verify object-level ownership before returning or mutating data.

---

## 2. The Five Major System Roles

1. **Student**: Enrolled learner. Access is strictly scoped to self-profile, personal timetable, registered courses, personal attendance, personal marks, and school-wide calendar events.
2. **Parent / Guardian**: Family sponsor. Scoped read-only access to academic, attendance, and timetable records of their specifically linked children.
3. **Faculty / Teacher**: Academic staff member. Full operational authority over assigned classes/subjects (marking attendance, grading assessments, viewing timetables), read-only access to departmental directories.
4. **Admin (System Administrator)**: Operational and technical operator. Full CRUD authority across institutional configuration, user management, academic terms, master scheduling, and audit telemetry.
5. **Principal / Head of Institution**: Executive leadership. School-wide oversight, cross-department analytics, final report card approvals, policy approvals, and audit log inspection.

---

## 3. RBAC Entitlement Matrix

| Domain Module | Student | Parent | Faculty | Admin | Principal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Profile** | Read (Self), Update (Self Contact) | Read (Self), Update (Self Contact) | Read (Self), Update (Self Bio) | Full CRUD (All Users) | Read (All Users), Oversight |
| **Student Directory** | Read (Self Only) | Read (Linked Children) | Read (Assigned Classes) | Full CRUD | Read (All), Oversight |
| **Academic Setup (Classes, Subjects)** | Read (Enrolled) | Read (Enrolled) | Read (Departmental) | Full CRUD | Read (All), Approval |
| **Attendance Management** | Read (Self Only) | Read (Linked Children) | Create / Update (Assigned Classes) | Full CRUD & Override | Read (All), Oversight |
| **Marks & Grading** | Read (Self Only) | Read (Linked Children) | Create / Update (Assigned Subjects) | Read (All), Audit Overrides | Read (All), Final Approval |
| **Timetable Management** | Read (Enrolled Class) | Read (Children Classes) | Read (Assigned / Dept) | Full CRUD | Read (All), Oversight |
| **Institutional Calendar** | Read (Targeted Events) | Read (Targeted Events) | Read, Create (Dept Drafts) | Full CRUD | Full CRUD & Approval |
| **Allocation Engine** | No Access | No Access | Read (Draft Output) | Execute & Configure | Final Approval & Lock |
| **Reports & Analytics** | Read (Personal Card) | Read (Child Card) | Read (Class Performance) | Full Generation & Export | School-wide Analytics & Sign-off |
| **Audit Logs** | No Access | No Access | No Access | Read / Filter | Read / Executive Oversight |

*Legend*:
- **Read (Self / Child)**: Scoped access strictly verified via foreign key ownership (`user_id == request.user.id`).
- **Create / Update**: Operational ability to record data in assigned scopes.
- **Attendance Leave Approval**: Per Master Plan Amendment 2, Faculty alone holds authority to mark/approve student `LEAVE` for their assigned classes/sections (`approved_by_faculty_id`). Parents and Students can view status or submit absence advisories, but cannot mark or approve `LEAVE`. Admin retains system-wide audit and override privileges.
- **Oversight**: Read-only institution-wide visibility across all departments and performance metrics.
- **Approval**: Final authority to lock terms, sign off grade reports, and finalize master class allocations.

---

## 4. Frontend Route Guards vs. Backend Enforcement

### 4.1 Frontend UX Route Guards
Frontend routes are wrapped in an `<AuthGuard allowedRoles={['Admin', 'Principal']} />` component. If a Student navigates to `/admin/allocation`, the client-side router redirects them to `/dashboard/student`. This provides an intuitive user experience and prevents UI clutter.

### 4.2 Backend Enforcement Architecture (Task 4.3 Implementation)
The backend authorization engine is implemented in `backend/common/authorization.py` and `backend/common/permissions.py`:

```python
# Authoritative DRF permission architecture (Task 4.3)
from common.permissions import HasRequiredPermission, require_permission, IsOwnerOrScopedAccess
from common.constants import PERM_ATTENDANCE_MARK
from common.authorization import AuthorizationService

# View-level permission evaluation
class AttendanceRecordView(APIView):
    permission_classes = [require_permission(PERM_ATTENDANCE_MARK), IsOwnerOrScopedAccess]

    def get_queryset(self):
        # Database-level queryset scoping: Faculty assigned only, Student self, Parent child
        qs = Attendance.objects.all()
        return AuthorizationService.filter_queryset_for_user(qs, self.request.user, domain='attendance')
```

Key Enforcement Flow:
```text
HTTP Request
  ↓
Authenticated & Active? (401 if unauthenticated/inactive)
  ↓
Role Resolution (from live DB user.role, immune to client tampering or stale claims)
  ↓
Permission Check (ROLE_PERMISSIONS_MATRIX in common/authorization.py)
  ↓
Scope Resolution (GLOBAL, FACULTY_ASSIGNED, SELF, LINKED_CHILD)
  ↓
Object Ownership Verification (can_access_object)
  ↓
Queryset Scoping (filter_queryset_for_user on list/search endpoints)
  ↓
ALLOW / DENY (403 if forbidden)
```

---

## 5. Items Requiring Later Refinement

The following edge-case rules are marked as **PLANNED FOR REFINEMENT** in future phases:
1. **Multi-Child Parent Switching**: Mechanism for parents with children in multiple disparate grade levels to toggle active student context in both UI and API queries.
2. **Substitute Teacher Delegation**: Temporary delegation of attendance/marks entry privileges to a substitute teacher when primary faculty is on leave.
3. **Dual Role Accounts**: Handling staff members who are simultaneously parents of enrolled students (e.g. active role switching sessions).

---

## 6. Task 2.7 Approved Functional Amendment — Operational Allocation, Search & Attendance Visibility Governance

> **Amendment Status**: APPROVED / AUTHORITATIVE (Post-Phase-2 Functional Amendment)  
> **Effective Date**: 2026-09-27  

Task 2.7 establishes explicit operational allocation, search, and attendance visibility rules across Admin, Principal, and Faculty roles:

### 6.1 Role Entitlement Matrix (Task 2.7)

| Operational Capability | Admin | Principal | Faculty | Student / Parent |
| :--- | :--- | :--- | :--- | :--- |
| **Student Section Allocation** | View, Update, Delete (Full) | View, Update, Delete (Full) | View-Only (Assigned classes/sections) | No Access |
| **Class Teacher Allocation** | View, Update, Delete (Full) | View, Update, Delete (Full) | View-Only (Directory reference) | No Access |
| **Global Directory Search** | Students & Faculty (with Update/Delete) | Students & Faculty (with Update/Delete) | Students & Faculty (View-Only; No Update/Delete) | Scoped Profile Only |
| **Student Absentees List** | School-Wide (Status: `ABSENT` only) | School-Wide (Status: `ABSENT` only) | Scoped (Assigned classes/subjects only) | No Access |
| **Attendance Not Entered** | School-Wide (`NOT ENTERED` sessions) | School-Wide (`NOT ENTERED` sessions) | Scoped (Assigned teaching sessions only) | No Access |
| **Faculty Subject Visibility** | Full visibility across all views | Full visibility across all views | Full visibility in directory/search | View assigned teachers |

### 6.2 Specific Permission Invariants

1. **Update and Delete Authority**:
   - Strictly reserved for **Admin** and **Principal**.
   - Faculty members **MUST NOT** receive modification controls (buttons, modals, or API endpoints) for student allocations, Class Teacher assignments, or master data.
   - Principal allocation mutations are explicitly authorized for section and Class Teacher operational governance; this does not generalize Principal into an all-purpose administrative CRUD operator for lower-level infrastructure.
2. **Student Section Allocation**:
   - Follows institutional hierarchy: `Academic Year → Grade → Stream (Grades 11–12) → Section → Student`.
   - The system-generated Student ID (e.g. `STU202600001`) is permanent and immutable; it cannot be modified during section updates.
   - Deletion requires an explicit confirmation dialog detailing the exact student and section being unassigned, with non-blocking feedback.
3. **Class Teacher Allocation**:
   - Displays Faculty ID, Name, Designation, and Assigned Subject(s).
   - Deletion removes the Class Teacher appointment (status resets to `Unassigned`) with explicit confirmation.
4. **Attendance Visibility Boundaries**:
   - **Student Absentees List**: Contains strictly students whose attendance status is `ABSENT`. Excludes `PRESENT`, `ON_DUTY`, and `LEAVE` (`LEAVE` and `ABSENT` are never combined).
   - **Attendance Not Entered List**: Denotes unentered timetable sessions (status `NOT ENTERED`). Semantically distinct from student absentees.
   - Faculty visibility in both surfaces is strictly scoped to the authenticated teacher's assigned subjects, classes, and sessions.
5. **Faculty Non-Evaluative Architecture**:
   - Faculty information across all search results, allocation views, and directories remains strictly descriptive (Name, Designation, Assigned Subjects, Workload).
   - Zero ratings, rankings, appraisal scores, or evaluative metrics.
6. **Phase 2 Mock-State Limitation**:
   - All mutations in Task 2.7 operate on client-side state via the `AllocationService` domain layer.
   - Backend persistence (Django/DRF/PostgreSQL) remains scheduled for Phase 3.

---

## 7. Authoritative REST Endpoint RBAC Inventory & Enforcement Mapping (Task 4.4)

Every implemented API route is strictly enforced with authentication, role permissions, queryset scoping, and object ownership:

| Endpoint | Method | View Class | Authentication | Required Permission | Operational Scope | Object-Level Check |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/health/` | GET | `HealthCheckView` | No (Public) | None | N/A | None |
| `/api/v1/auth/login/` | POST | `TokenObtainPairView` | No (Public) | None | N/A | None |
| `/api/v1/auth/refresh/` | POST | `TokenRefreshView` | No (Public) | None | N/A | None |
| `/api/v1/auth/me/` | GET | `CurrentUserProfileView` | Yes | Authenticated Active | `SCOPE_SELF` | Self identity only |
| `/api/v1/students/` | GET | `StudentListView` | Yes | `students.view` | Scoped per role | Queryset scoped |
| `/api/v1/students/` | POST | `StudentListView` | Yes | `students.create` | `SCOPE_GLOBAL` | Admin only |
| `/api/v1/students/{id}/` | GET | `StudentDetailView` | Yes | `students.view` | Scoped per role | `IsOwnerOrScopedAccess` |
| `/api/v1/students/{id}/` | PATCH | `StudentDetailView` | Yes | `students.update` | `SCOPE_GLOBAL` | `IsOwnerOrScopedAccess` (Admin only) |
| `/api/v1/parents/` | GET | `ParentListView` | Yes | `students.view` | Scoped per role | Queryset scoped |
| `/api/v1/parents/{id}/` | GET | `ParentDetailView` | Yes | `students.view` | Scoped per role | `IsOwnerOrScopedAccess` |
| `/api/v1/parents/{id}/children/` | GET | `ParentChildrenView` | Yes | `students.view` | Scoped per role | `IsOwnerOrScopedAccess` |
| `/api/v1/faculty/` | GET | `FacultyListView` | Yes | `users.view` | Active directory | `is_active=True` |
| `/api/v1/faculty/` | POST | `FacultyListView` | Yes | `users.create` | `SCOPE_GLOBAL` | Admin only |
| `/api/v1/faculty/{id}/` | GET | `FacultyDetailView` | Yes | `users.view` | Active directory / self | `IsOwnerOrScopedAccess` |
| `/api/v1/faculty/{id}/` | PATCH | `FacultyDetailView` | Yes | `users.update` | Admin global / Self bio | `IsOwnerOrScopedAccess` (Admin fields protected) |
| `/api/v1/classes/` | GET | `ClassListView` | Yes | `academics.view` | All authenticated | None |
| `/api/v1/classes/` | POST | `ClassListView` | Yes | `academics.manage` | Admin / Principal | Role matrix |
| `/api/v1/classes/{id}/` | GET | `ClassDetailView` | Yes | `academics.view` | All authenticated | None |
| `/api/v1/classes/{id}/sections/` | GET | `ClassSectionsView` | Yes | `academics.view` | All authenticated | None |
| `/api/v1/subjects/` | GET | `SubjectListView` | Yes | `academics.view` | All authenticated | None |
| `/api/v1/subjects/` | POST | `SubjectListView` | Yes | `academics.manage` | Admin / Principal | Role matrix |
| `/api/v1/subjects/{id}/` | GET | `SubjectDetailView` | Yes | `academics.view` | All authenticated | None |
| `/api/v1/academics/years/` | GET | `AcademicYearListView` | Yes | `academics.view` | All authenticated | None |
| `/api/v1/attendance/` | GET | `AttendanceOverviewView` | Yes | `attendance.view` | Scoped per role | Queryset scoped |
| `/api/v1/attendance/bulk/` | POST | `BulkAttendanceCreateView` | Yes | `attendance.mark` | Faculty assigned section | Assignment check (cross-section 403) |
| `/api/v1/attendance/absentees/` | GET | `StudentAbsenteesView` | Yes | `attendance.view_absentees` | Admin, Principal, Faculty scoped | Queryset scoped |
| `/api/v1/attendance/leaves/` | GET | `LeaveApplicationListView` | Yes | `attendance.view` | Scoped per role | Queryset scoped |
| `/api/v1/attendance/leaves/` | POST | `LeaveApplicationListView` | Yes | Student self / Staff | Self student identity | Tampering check |
| `/api/v1/attendance/{id}/` | GET | `AttendanceDetailView` | Yes | `attendance.view` | Scoped per role | `IsOwnerOrScopedAccess` |
| `/api/v1/attendance/{id}/` | PATCH | `AttendanceDetailView` | Yes | `attendance.mark` | Scoped per role | `IsOwnerOrScopedAccess` |
| `/api/v1/marks/` | GET | `MarkListView` | Yes | `marks.view` | Scoped per role | Queryset scoped |
| `/api/v1/marks/bulk/` | POST | `BulkMarkCreateView` | Yes | `marks.enter` | Faculty assigned section | Assignment check (cross-section 403) |
| `/api/v1/marks/exam-types/` | GET | `ExamTypeListView` | Yes | `marks.view` | All authenticated | None |
| `/api/v1/marks/exam-types/` | POST | `ExamTypeListView` | Yes | `marks.override` | Admin only | Role matrix |
| `/api/v1/marks/report-card/{student_id}/` | GET | `ReportCardView` | Yes | `reports.view` | Scoped per role | `can_access_object` verification |
| `/api/v1/marks/{id}/` | GET | `MarkDetailView` | Yes | `marks.view` | Scoped per role | `IsOwnerOrScopedAccess` |
| `/api/v1/marks/{id}/` | PATCH | `MarkDetailView` | Yes | `marks.enter` | Scoped per role | `IsOwnerOrScopedAccess` |
| `/api/v1/allocation/` | GET | `AllocationListView` | Yes | `allocation.view` | Admin, Principal, Faculty | Scaffolding view |
| `/api/v1/audit/` | GET | `AuditLogListView` | Yes | `audit.view` | Admin, Principal only | Scaffolding view |
| `/api/v1/calendar/events/` | GET | `CalendarEventListView` | Yes | `calendar.view` | All authenticated | Scaffolding view |
| `/api/v1/timetable/` | GET | `TimetableListView` | Yes | `timetable.view` | All authenticated | Scaffolding view |
| `/api/v1/reports/` | GET | `ReportListView` | Yes | `reports.view` | All authenticated | Scaffolding view |
| `/api/v1/notifications/` | GET | `NotificationListView` | Yes | `users.view` | All authenticated | Scaffolding view |


