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

### 4.2 Backend Enforcement Architecture
Each DRF API view specifies explicit permission classes:
```python
# Conceptual DRF permission architecture
class IsFacultyOrAdminForClass(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['Faculty', 'Admin']
        
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'Admin':
            return True
        # Faculty can only edit attendance for their assigned section
        return obj.section.class_teacher == request.user.faculty_profile
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

