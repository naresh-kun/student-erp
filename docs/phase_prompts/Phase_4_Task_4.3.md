# PHASE 4 — TASK 4.3
# RBAC Architecture & Permission Model

**Project:** Student ERP — Enterprise Educational Management System
**Phase:** 4 — Authentication + RBAC
**Task:** 4.3 — RBAC Architecture & Permission Model
**Status:** Specification / Pending Implementation
**Prerequisite:** Task 4.2 COMPLETE

---

# 1. TASK OBJECTIVE

Establish the authoritative Role-Based Access Control (RBAC) architecture for the Student ERP.

Task 4.3 defines:

- role hierarchy;
- permission model;
- permission naming convention;
- role-to-permission mapping;
- global vs scoped access;
- object-level ownership concepts;
- reusable DRF permission architecture;
- authorization service boundary;
- permission evaluation rules;
- denial behavior;
- authorization test architecture.

Task 4.3 is primarily an ARCHITECTURE + PERMISSION-MODEL task.

Task 4.4 owns broad integration and enforcement across ERP endpoints.

---

# 2. MANDATORY DOCUMENTATION READ

Before modifying ANYTHING, read:

1. `docs/PROJECT_STRUCTURE.md`
2. `docs/ARCHITECTURE.md`
3. `docs/BACKEND_ARCHITECTURE.md`
4. `docs/DATABASE_SCHEMA.md`
5. `docs/API_CONTRACT.md`
6. `docs/RBAC_PERMISSIONS.md`
7. `docs/FRONTEND_ARCHITECTURE.md`
8. `docs/DEVELOPMENT_WORKFLOW.md`
9. `docs/GIT_WORKFLOW.md`
10. `docs/TESTING_STRATEGY.md`
11. `docs/DEPLOYMENT.md`
12. `docs/PROJECT_STATUS.md`
13. `docs/CHANGELOG.md`
14. `docs/DECISIONS.md`
15. `docs/phases/PHASE_03_STATUS.md`
16. `docs/phases/PHASE_04_STATUS.md`
17. `docs/phase_prompts/Phase_4_Task_4.1.md`
18. `docs/phase_prompts/Phase_4_Task_4.2.md`
19. This file

Then inspect the actual backend.

Do not reconstruct the permission model from memory.

---

# 3. PREREQUISITE GATE

Verify:

- Task 4.1 authentication foundation exists;
- Task 4.2 login/JWT exists;
- `accounts.User` is functional;
- authenticated requests work;
- JWT authentication works;
- Phase 3 remains regression-free.

Run:

```bash
python manage.py check
python manage.py makemigrations --check
pytest -q

If prerequisites are broken:
STOP and report the issue.
4. EXACT ROLE SET
The ERP has exactly five roles:
1. Admin
2. Principal
3. Faculty
4. Student
5. Parent
Do NOT create additional business roles.
Do NOT introduce:
- SuperTeacher;
- VicePrincipal;
- HOD;
- Accountant;
- Librarian;
- Staff;
- Guest
unless explicitly approved in authoritative documentation.
Django's internal superuser concept must remain distinct from ERP business-role design.
5. RBAC MODEL
The authorization model must distinguish:
Authentication
Who is the user?
Role
Which ERP role does the user have?
Permission
What operation may the role perform?
Scope
Which records may the user operate on?
The architecture must support all four concepts.
6. PERMISSION NAMING
Use a consistent permission naming convention.
Preferred conceptual structure:
<domain>.<action>
Examples:
- students.view
- students.create
- students.update
- students.delete
- attendance.view
- attendance.mark
- attendance.approve_leave
- marks.view
- marks.enter
- timetable.view
The final permission names MUST follow docs/RBAC_PERMISSIONS.md.
Do not invent aliases for the same permission.
7. STANDARD ACTIONS
Where applicable, permissions may cover:
- view;
- create;
- update;
- delete;
- approve;
- mark;
- enter;
- manage;
- publish;
- export.
Only actions supported by the actual domain should exist.
Do not create hundreds of meaningless micro-permissions.
8. ROLE PERMISSION MATRIX
Establish the authoritative matrix in:
docs/RBAC_PERMISSIONS.md
At minimum the matrix must cover:
ADMIN
School-wide administrative management including:
- students;
- parents;
- faculty;
- classes;
- sections;
- subjects;
- attendance administration;
- marks administration;
- timetable;
- calendar/events;
- allocation;
- reports;
- relevant system administration.
PRINCIPAL
School-wide oversight including:
- student information;
- attendance;
- marks;
- academics;
- faculty descriptive information;
- reports;
- allocation workflows approved for Principal;
- student section allocation update/delete;
- Class Teacher allocation update/delete.
Principal must NOT receive arbitrary system-superuser powers merely because of the business role.
FACULTY
Scoped academic operations including:
- assigned classes/sections;
- assigned subjects;
- attendance for assigned scope;
- LEAVE approval/marking;
- marks entry for assigned scope;
- timetable visibility;
- relevant student academic information;
- absentees within authorized scope;
- Attendance Not Entered within authorized scope.
Faculty is NOT allowed to:
- manage users;
- modify school-wide role assignments;
- perform unrestricted student administration;
- manipulate unrelated classes;
- manage Class Teacher allocation unless explicitly authorized later.
STUDENT
Self-service access limited to the authenticated student:
- own profile;
- own attendance;
- own marks;
- own timetable;
- own calendar;
- approved student self-service operations.
A student must not access another student's records.
PARENT
Child-scoped access:
- linked child/children;
- child attendance;
- child marks;
- child timetable;
- child calendar;
- approved child-facing information.
A parent must NOT access unrelated students.
9. GLOBAL VS SCOPED ACCESS
The architecture must distinguish:
GLOBAL ACCESS
User may access school-wide records.
Examples:
- Admin;
- Principal for approved oversight operations.
ASSIGNMENT-SCOPED ACCESS
User may access only records connected to assigned:
- class;
- section;
- subject;
- academic context.
This is particularly important for Faculty.
SELF-SCOPED ACCESS
User may access only their own record.
Student.
CHILD-SCOPED ACCESS
User may access only records belonging to linked child/children.
Parent.
10. FACULTY SCOPING
Faculty authorization must support assignment-aware access.
At the data/authorization level, Faculty access may be scoped by:
- assigned class;
- assigned section;
- assigned subject;
- academic period/context.
Do NOT grant Faculty school-wide access simply because they are authenticated.
Do NOT hard-code class IDs or subject IDs.
11. PARENT SCOPING
Parent authorization must derive from the canonical Parent ↔ Student relationship.
Do NOT authorize a parent based on a submitted arbitrary student ID alone.
The authenticated parent relationship must be checked server-side.
12. STUDENT SCOPING
Student authorization must derive from the authenticated user/profile relationship.
Do NOT trust a client-provided student ID as proof of ownership.
Example:
A Student requesting:
/students/STU202600002/
must NOT be allowed to view another student merely by changing the URL.
13. PRINCIPAL SCOPE
Principal has school-wide oversight for approved domains.
However:
Principal is NOT equivalent to unrestricted Django is_superuser.
Do not automatically map:
Principal → is_superuser = True
The business role and Django infrastructure privilege must remain separate.
14. ADMIN SCOPE
Admin may have broad ERP management access.
However, even Admin authorization should use the explicit permission architecture rather than scattered if role == "Admin" checks.
Do not create an undocumented “Admin bypass everything” path.
15. DJANGO SUPERUSER
Keep Django's technical superuser concept distinct.
A Django superuser can remain a development/admin infrastructure account.
Do NOT use is_superuser as a substitute for the ERP role model.
ERP authorization must remain explicit.
16. PERMISSION ARCHITECTURE
Implement a reusable authorization architecture.
Possible components:
- role resolver;
- permission constants;
- permission mapping;
- DRF permission base class;
- scope evaluator;
- authorization service.
Use the project's established modular structure.
Do not create a new competing authorization framework.
17. DRF PERMISSION BASE CLASS
Create a reusable DRF permission architecture where appropriate.
It should support conceptual checks such as:
is_authenticated
→ role allowed?
→ action allowed?
→ object scope allowed?

Do not hard-code every endpoint into one enormous permission class.
18. AUTHORIZATION SERVICE
Where domain-level logic is required, establish an AuthorizationService or equivalent centralized architecture.
Potential responsibilities:
- resolve user's ERP role;
- check permission;
- resolve access scope;
- evaluate object ownership;
- evaluate Faculty assignment scope;
- evaluate Parent-child linkage;
- evaluate Student ownership.
Avoid duplicating identical authorization logic across views.
19. PERMISSION CONSTANTS
Define permission identifiers centrally.
Do not use scattered literal strings such as:
if user.role.name == "Faculty":


throughout the codebase.
Use centralized permission definitions.
20. OBJECT-LEVEL AUTHORIZATION
The permission architecture must support object-level access.
Examples:
Student
Student A may access:
- Student A
but not:
- Student B.
Parent
Parent A may access:
- linked child A;
but not:
- unrelated student.
Faculty
Faculty A may access:
- assigned sections/subjects.
but not:
- unrelated sections.
21. LIST ENDPOINT SCOPING
Object-level checks are not sufficient if a list endpoint returns every record.
Authorization must apply to querysets as well.
For scoped roles:
Authorized User
     ↓
Scope Resolution
     ↓
Filtered QuerySet
     ↓
Serializer

Do not retrieve all rows and filter them only after serialization.
22. QUERYSET AUTHORIZATION
Provide a reusable mechanism for filtering querysets according to the authenticated user's scope.
The architecture should support:
- global scope;
- faculty scope;
- student scope;
- parent-child scope.
Avoid duplicating queryset filtering logic in every view.
23. WRITE AUTHORIZATION
For create/update/delete operations, evaluate:
1. authenticated identity;
2. role permission;
3. resource scope;
4. ownership/assignment;
5. operation-specific rule.
Do not trust client-supplied role or scope fields.
24. ATTENDANCE AUTHORIZATION
The authorization architecture must support later enforcement of:
Faculty
Faculty can mark attendance only for authorized assigned class/section/subject scope.
Faculty can approve/mark LEAVE according to the approved workflow.
Admin
Administrative attendance access.
Principal
School-wide attendance oversight.
Student
Own attendance only.
Parent
Linked child's attendance only.
The actual endpoint enforcement belongs primarily to Task 4.4.
25. MARKS AUTHORIZATION
Support later enforcement for:
Faculty
Marks entry/view within authorized assignment scope.
Admin
Administrative marks management.
Principal
School-wide academic oversight.
Student
Own marks only.
Parent
Linked child marks only.
Again, Task 4.3 establishes the model; Task 4.4 applies it broadly.
26. STUDENT SECTION ALLOCATION
Approved requirement:
- Admin can manage student section allocation;
- Principal can manage student section allocation;
- allocation supports Update/Delete.
Faculty does not receive allocation-management permission merely by being Faculty.
The permission model must explicitly represent this.
27. CLASS TEACHER ALLOCATION
Approved requirement:
- Admin can manage Class Teacher allocation;
- Principal can manage Class Teacher allocation;
- Faculty remains view-only unless explicitly approved otherwise.
Permissions must distinguish:
- view;
- update;
- delete.
Do not collapse them into one generic allocation permission.
28. ABSENTEE ACCESS
Approved requirement:
- Admin can view school-wide absentees;
- Principal can view school-wide absentees;
- Faculty can view absentees within authorized scope.
Students/Parents do not receive arbitrary absentee-list access.
29. ATTENDANCE NOT ENTERED
Approved requirement:
- Principal can identify school-wide Attendance Not Entered;
- Faculty can identify Attendance Not Entered within authorized scope.
The permission architecture must distinguish this from viewing recorded absence.
30. SEARCH AUTHORIZATION
Search does NOT bypass RBAC.
A search query must operate within the caller's authorized scope.
Example:
Faculty searching for a student must not return students outside the Faculty's permitted scope merely because the name matches.
31. DENIAL BEHAVIOR
Authorization failures must use standard DRF behavior.
Typical semantics:
- unauthenticated → 401;
- authenticated but unauthorized → 403.
Do not leak whether a restricted object exists when the security architecture requires a generic response.
32. ROLE TAMPERING
A client must never be able to elevate its own role by submitting:
{
  "role": "Admin"
}

Role identity must be derived server-side.
JWT role claims must not be treated as a trusted client-controlled input.
33. JWT CLAIMS AND RBAC
JWT may carry the current role for efficient identity context.
However:
Authorization must not blindly trust stale role information if role changes can occur server-side.
Document how current database role state and JWT claims interact.
Avoid security gaps caused by stale tokens.
34. ROLE CHANGE BEHAVIOR
Document what happens when a user's role changes.
Consider:
- existing access tokens;
- refreshed tokens;
- current-user lookup;
- authorization checks.
Do not silently leave a known privilege-escalation path.
The final behavior must be consistent with the project's token architecture.
35. NO ROLE HIERARCHY ASSUMPTION
Do not assume:
Admin > Principal > Faculty > Student > Parent
means that higher roles automatically inherit every lower role.
Permissions must be explicitly assigned.
Role hierarchy, if used, must be documented.
36. API CONTRACT BOUNDARY
Do not redesign API endpoints during this task unless an authorization requirement exposes an actual contract defect.
Authorization should sit around the existing API structure.
Do not build unrelated CRUD.
37. FRONTEND BOUNDARY
Do NOT implement frontend authorization enforcement as a substitute for backend authorization.
Frontend role guards may remain later-facing UI concerns.
The backend must remain authoritative.
Do not connect the frontend to new live auth/RBAC behavior in Task 4.3.
38. TESTING REQUIREMENTS
Create an authorization test matrix covering all five roles.
At minimum test:
Admin
Allowed school-wide management operations.
Principal
Allowed school-wide oversight operations.
Faculty
Allowed scoped academic operations.
Student
Self-only access.
Parent
Linked-child-only access.
39. CROSS-ROLE NEGATIVE TESTING
Test that:
- Student cannot access another student's data;
- Parent cannot access unrelated student data;
- Faculty cannot access unrelated classes/sections;
- Faculty cannot manage allocation unless explicitly permitted;
- Student cannot manage attendance;
- Parent cannot modify marks;
- lower-privilege roles cannot invoke Admin/Principal operations.
Negative tests are mandatory.
40. OBJECT-LEVEL TESTING
Test:
- authorized object;
- unauthorized object;
- object not found;
- filtered list;
- direct detail URL;
- create;
- update;
- delete.
Ensure authorization is enforced before sensitive data is returned.
41. QUERYSET SCOPE TESTING
For Faculty:
- assigned section appears;
- unrelated section does not.
For Student:
- own record appears;
- other students do not.
For Parent:
- linked child's records appear;
- unrelated child records do not.
For Admin/Principal:
- approved school-wide visibility works.
42. AUTHORIZATION SERVICE TESTING
Test the central authorization mechanism independently.
Examples:
- role resolution;
- permission resolution;
- scope resolution;
- object ownership;
- parent-child linkage;
- faculty assignment linkage.
43. SECURITY TESTING
Search for:
- is_superuser being incorrectly used for business authorization;
- raw role string checks scattered through views;
- client-supplied role trust;
- client-supplied student ownership trust;
- unrestricted querysets;
- missing object-level authorization;
- permission bypass through alternate endpoints.
44. MIGRATION REQUIREMENT
Prefer zero schema migrations in Task 4.3.
Permission architecture should primarily use code/configuration unless RBAC_PERMISSIONS.md explicitly requires persistent permission tables or model changes.
Do not introduce database complexity without architectural justification.
45. PERFORMANCE
Authorization should not cause an excessive number of database queries.
Avoid:
- repeated role lookups;
- repeated Faculty assignment queries;
- repeated Parent-child queries.
Use appropriate query optimization.
Do not sacrifice correctness for premature caching.
46. ARCHITECTURAL PROHIBITIONS
Do NOT introduce:
- a second authentication framework;
- Firebase/Supabase/Auth0 authorization unless explicitly approved;
- custom crypto;
- client-trusted roles;
- hard-coded user IDs;
- hard-coded class IDs;
- hard-coded Student IDs;
- frontend-only security;
- role bypasses;
- giant monolithic permission files.
47. DOCUMENTATION UPDATES
After implementation:
- docs/phase_prompts/Phase_4_Task_4.3.md
- docs/phases/PHASE_04_STATUS.md
- docs/PROJECT_STATUS.md
- docs/CHANGELOG.md
Update:
- docs/RBAC_PERMISSIONS.md
to reflect the authoritative permission matrix.
Record major architectural decisions in:
docs/DECISIONS.md
48. DEFINITION OF DONE
Task 4.3 is complete only when:
1. five-role RBAC model is explicitly defined;
2. permission naming is standardized;
3. role-permission mapping is documented;
4. global/scoped/self/child access is defined;
5. Faculty scope architecture exists;
6. Parent-child scope architecture exists;
7. Student self-scope exists;
8. Admin/Principal scope is explicit;
9. reusable permission infrastructure exists;
10. authorization service boundary exists where required;
11. object-level authorization architecture exists;
12. queryset authorization architecture exists;
13. attendance authorization model is defined;
14. marks authorization model is defined;
15. allocation permissions are defined;
16. absentee permissions are defined;
17. Attendance Not Entered permissions are defined;
18. unauthenticated vs unauthorized behavior is defined;
19. cross-role negative tests pass;
20. existing authentication remains functional;
21. frontend remains mock-driven;
22. no full endpoint-wide enforcement has leaked beyond task scope;
23. documentation is synchronized.
49. FINAL REPORT
Return:
A. Prerequisite Verification
B. Role Model
C. Permission Naming
D. Role-Permission Matrix
E. Scope Model
F. Faculty Authorization Scope
G. Parent/Student Object Ownership
H. Authorization Service
I. DRF Permission Infrastructure
J. Queryset Scope Architecture
K. Security Audit
L. Tests
M. Frontend Regression
N. Documentation
O. Deviations
Explicitly confirm:
- Task 4.4 endpoint-wide enforcement was NOT prematurely completed unless required for architecture tests;
- Student/Parent special authentication remains Task 4.5;
- frontend authentication/RBAC integration remains deferred;
- no competing authorization architecture was introduced.
Next Task
PHASE 4 — TASK 4.4: Role-Based Access Enforcement