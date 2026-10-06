# Student ERP — Approved Project Modification MOD_001
# Homework Management + Faculty/Class-Teacher Assignment Architecture

**Status:** APPROVED PROJECT MODIFICATION (COMPLETED)  
**Date:** 2026-10-06  
**Scope:** MOD_001 — Faculty/Class Teacher Assignment Architecture + Homework Management  
**Governance:** Independent Approved Modification (NOT Phase 5)

---

## 1. Purpose

This task introduces the school's Homework domain and formalizes the distinction between:

- Class Teacher assignment
- Subject Faculty assignment

The task must preserve the existing ERP architecture, RBAC model, academic allocation hierarchy, and Phase 4 security model.

This is an application/domain task. It must not be implemented by bypassing the existing service, API, authorization, queryset-scoping, or object-authorization architecture.

---

# PART A — FACULTY / CLASS TEACHER ASSIGNMENT RULES

## 2. Faculty Is Not Automatically a Class Teacher

Being a Faculty member does **not** automatically make the person a Class Teacher.

Both states are valid:

1. Faculty member with no Class Teacher assignment.
2. Faculty member with one Class Teacher assignment.

A faculty member may remain a Subject Faculty member without being a Class Teacher.

The system must never automatically assign every faculty member as Class Teacher.

---

## 3. Class Teacher Cardinality

For a given Academic Year:

> One Faculty member may be assigned as Class Teacher for **at most one class/section**.

Therefore:

```text
Faculty → 0 or 1 Class Teacher assignment / Academic Year
```

This must be treated as a domain/business invariant.

The invariant must be enforced at the authoritative backend/domain layer, not only in the UI.

If the current database structure supports a reliable database-level uniqueness constraint, use it. If the current structure requires a different enforcement mechanism, use the minimum architecture-compatible mechanism discovered during audit.

No implementation decision should be made before the current allocation models are inspected.

---

## 4. Subject Faculty Assignments

Class Teacher allocation and Subject Faculty allocation are separate concepts.

A Faculty member may have multiple authorized teaching assignments across different:

- classes
- sections
- subjects
- timetable slots

Example:

```text
R. Suresh
├── Class Teacher → Grade 11 — Section A2
├── Subject Faculty → Grade 12 — Section A1 — Mathematics
└── Subject Faculty → Grade 10 — Section A — Mathematics
```

Another valid case:

```text
Priya
├── Subject Faculty → Grade 10 — Section A — English
├── Subject Faculty → Grade 11 — Section B1 — English
└── No Class Teacher assignment
```

The system must not interpret "Faculty assigned to a class" as automatically meaning "Class Teacher".

---

## 5. Class Teacher Does Not Automatically Own Every Subject

Being Class Teacher for a class/section does **not** automatically authorize the faculty member to perform every subject's academic operations.

A Class Teacher's subject permissions continue to depend on actual Subject Faculty assignment.

Therefore:

```text
Class Teacher assignment
        ≠
All-subject authority
```

This rule applies to Homework, Marks, Attendance, and any future subject-scoped academic operation.

---

# PART B — HOMEWORK DOMAIN

## 6. Homework Requirement

Faculty must be able to assign homework to students belonging to an authorized teaching scope.

Students must be able to view homework assigned to their own class/section and applicable subject.

Parents must be able to view homework relevant to their linked child/children.

Homework is a school academic communication record and must be associated with:

- Faculty/teacher
- Class
- Section
- Subject
- Academic context
- Homework content
- Assignment/publication information
- Due date where applicable

---

## 7. Faculty Homework Capability

A Faculty member may create homework only for a class/section/subject combination for which that faculty member has an authorized teaching assignment.

The authorization must be server-side.

The backend must not trust submitted identifiers such as:

```text
faculty_id
class_id
section_id
subject_id
```

as proof of authority.

### Faculty may

- create homework
- view homework within their authorized teaching scope
- update their own homework where allowed by the final RBAC contract
- delete their own homework where allowed by the final RBAC contract

### Faculty may not

- create homework for unrelated classes
- create homework for unrelated subjects
- view or modify unrelated faculty members' private homework management data
- use a forged class/section/subject ID to bypass assignment scope

---

## 8. Class Teacher Homework Rule

A Faculty member who is a Class Teacher may assign homework to the Class Teacher class/section **only when the selected subject is also within that faculty member's authorized Subject Faculty assignment**.

Class Teacher status alone must not grant unrestricted authority over every subject taught in that class.

Example:

```text
Faculty:
Class Teacher → XI-A2
Subject Assignment → Mathematics in XI-A2
```

Allowed:

```text
Homework → XI-A2 → Mathematics
```

Not automatically allowed:

```text
Homework → XI-A2 → Physics
```

unless the Faculty member also has an authorized Physics assignment.

---

## 9. Homework Visibility — Student

A Student may view homework that applies to:

- the Student's current class
- the Student's current section
- the relevant subject

Students must not see homework belonging to unrelated classes/sections.

Students cannot:

- create homework
- edit homework
- delete homework
- publish/approve homework

---

## 10. Homework Visibility — Parent

A Parent may view homework for their linked child/children.

Visibility must follow the child's current academic allocation.

Parents must not:

- view unrelated students' homework
- create homework
- edit homework
- delete homework
- publish/approve homework

For multiple linked children, the parent must be able to distinguish which child each homework record belongs to.

---

# PART C — ADMIN / PRINCIPAL

## 11. Admin

Admin should have operational oversight/management capability for Homework according to the final RBAC contract.

The implementation must not silently assume unrestricted CRUD if the existing permission architecture does not grant it.

---

## 12. Principal

Principal should have school-wide oversight/view capability for Homework according to the final RBAC contract.

Principal permissions must be explicitly represented in RBAC.

Do not assume unrestricted mutation authority without an approved permission mapping.

---

# PART D — HOMEWORK DATA CONTRACT

## 13. Minimum Homework Data

The final model/API should support, at minimum:

- unique homework ID
- Faculty/creator
- Class
- Section
- Subject
- Academic Year or equivalent academic context
- Title
- Instructions/description
- Assigned/published date
- Due date
- Status sufficient to distinguish draft/published if the final workflow supports drafts
- created timestamp
- updated timestamp

Do not add file attachments, grading, submissions, comments, or notifications unless separately approved.

---

## 14. Homework Status

The implementation may support an explicit lifecycle such as:

```text
DRAFT
PUBLISHED
CLOSED
```

but the exact lifecycle must be finalized during the audit against the current API architecture.

Do not introduce unnecessary status complexity if the existing project architecture only needs published homework.

---

# PART E — AUTHORIZATION

## 15. Homework Permissions

The task must extend the existing RBAC architecture rather than create a parallel authorization mechanism.

The final implementation should define explicit Homework permissions such as:

```text
homework.view
homework.create
homework.update
homework.delete
```

or an equivalent naming scheme consistent with `common/constants.py`.

The exact permissions and role matrix must be reconciled with the existing authoritative RBAC design during the audit.

Do not invent a second permission model.

---

## 16. Scope Rules

Homework scope must align with existing ERP scopes.

Conceptually:

```text
Admin
    → permitted school-wide scope

Principal
    → permitted school-wide oversight scope

Faculty
    → authorized teaching assignments only

Student
    → own class/section/subject

Parent
    → linked child/children
```

The actual implementation must use the established AuthorizationService, DRF permissions, queryset filtering, and object-level checks.

---

# PART F — API

## 17. API Requirements

The final REST API should support the minimum necessary Homework operations.

Likely operations include:

```text
GET    /api/v1/homework/
POST   /api/v1/homework/
GET    /api/v1/homework/<id>/
PATCH  /api/v1/homework/<id>/
DELETE /api/v1/homework/<id>/
```

These are **proposed endpoint shapes only**.

The implementation must first inspect `API_CONTRACT.md` and existing routing conventions before finalizing paths.

Do not create duplicate or inconsistent API patterns.

---

## 18. Queryset Scoping

List endpoints must be scoped before serialization.

Faculty must only receive homework in their authorized teaching scope.

Student must only receive homework applicable to the student's own class/section/subjects.

Parent must only receive homework applicable to linked children.

Admin/Principal visibility must follow the final RBAC contract.

Do not retrieve school-wide homework and filter it afterward in Python.

---

## 19. Object-Level Authorization

Detail endpoints must prevent direct ID manipulation.

Examples:

```text
Faculty A → Homework created by Faculty B outside A's teaching scope
Student A → Homework for another section
Parent A → Homework belonging only to another child
```

These must be rejected or made inaccessible according to the existing authorization semantics.

A valid homework UUID is not proof of access.

---

# PART G — AUDIT / TRACEABILITY

## 20. Auditability

Homework creation and mutation should remain attributable to the authenticated Faculty/Admin user.

Use the existing audit architecture where appropriate.

Do not introduce a second audit framework.

---

# PART H — OUT OF SCOPE

## 21. Explicitly Out of Scope

This task must NOT implement:

- homework submission by students
- homework grading
- marks integration
- teacher performance evaluation
- AI homework generation
- AI plagiarism detection
- push notifications
- email/SMS notifications
- file upload/attachments unless separately approved
- chat/discussion/comments
- calendar auto-generation
- parent approval workflow
- attendance changes
- marks changes
- Student/Parent authentication changes
- redesign of Phase 4 authentication/RBAC

---

# PART I — TESTING

## 22. Required Tests

The final implementation must test:

### Faculty

- authorized homework creation
- unauthorized class rejection
- unauthorized section rejection
- unauthorized subject rejection
- cross-faculty object access rejection
- valid update/delete only where permitted

### Student

- correct homework visibility
- cross-section isolation
- cross-subject isolation where applicable
- no mutation access

### Parent

- linked-child homework visibility
- multi-child visibility
- unrelated-child isolation
- no mutation access

### Class Teacher

- Class Teacher can assign homework only for subjects they actually teach
- Class Teacher assignment alone does not grant all-subject authority
- one Class Teacher assignment maximum per faculty per academic year

### RBAC

- Admin permissions
- Principal permissions
- Faculty permissions
- Student permissions
- Parent permissions
- unauthenticated → 401
- authenticated but unauthorized → 403 where applicable
- role tampering rejected
- object ID manipulation rejected

### Regression

Run the entire existing backend and frontend suites after implementation.

---

# PART J — DOCUMENTATION

## 23. Required Documentation Updates

After implementation, update the relevant authoritative documents:

- `PROJECT_STATUS.md`
- `ARCHITECTURE.md`
- `BACKEND_ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `API_CONTRACT.md`
- `RBAC_PERMISSIONS.md`
- `CHANGELOG.md`
- `DECISIONS.md`
- relevant Phase 5 status file
- this task specification

Document:

- Faculty/Class Teacher distinction
- Class Teacher cardinality
- Subject Faculty scope
- Homework domain
- Homework API
- Homework RBAC
- Homework scoping
- test results
- migration results
- implementation decisions

---

# PART K — IMPLEMENTATION GATE

## 24. Governance

This specification is the authoritative task contract.

Before implementation:

1. Read all relevant current Markdown documentation.
2. Audit current models, allocation structures, RBAC, API patterns, and frontend architecture.
3. Run baseline verification.
4. Produce an audit report.
5. STOP for human review.
6. Only after approval implement the task.
7. Run full verification.
8. Update documentation.
9. Produce final completion/sign-off report.

No implementation should occur during the kickoff audit.
