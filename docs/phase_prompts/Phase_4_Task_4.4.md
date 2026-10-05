PHASE 4 — TASK 4.4
Endpoint-Level RBAC Enforcement
Objective
Connect the existing RBAC system from Task 4.3 to the actual Django REST API endpoints so that:
Request → Authentication → Permission check → Scope/queryset filtering → Object check → Business action
is consistently enforced.
The task is about enforcement, not inventing another authorization system.
4.4 Scope
1. Audit the existing API surface
Before changing anything, the agent must identify every currently implemented API endpoint.
It must inspect:
backend/
    */views.py
    */viewsets.py
    */urls.py
    */routers.py
    */serializers.py
    common/permissions.py
    common/authorization.py
    common/constants.py

It must produce an endpoint inventory similar to:
Endpoint	Method	View	Authentication	Required Permission	Scope	Object Check
/api/v1/auth/me/	GET	...	Yes	...	SELF	...
/api/v1/students/...	GET	...	Yes	students.view	...	...
etc.						


Do not invent endpoints that do not currently exist.
2. Authentication enforcement
All protected ERP endpoints must require authenticated users.
Expected semantics:
No token
    ↓
401 Unauthorized

Valid token + insufficient permission
    ↓
403 Forbidden

Valid token + permission + correct scope
    ↓
200/201/204 depending on operation

The agent must ensure inactive users cannot bypass authentication or authorization.
3. Use the existing RBAC system
Task 4.4 must reuse:
common/constants.py
common/authorization.py
common/permissions.py

The agent must not create a second permission matrix.
For example, do not introduce another system like:
if user.role == "ADMIN":


when the existing authorization service already provides permission checking.
The existing architecture remains the source of truth.
4. Endpoint permission enforcement
Each existing ERP endpoint must be mapped to the appropriate Task 4.3 permission.
Examples:
students.view
students.create
students.update
students.delete

attendance.view
attendance.mark
attendance.approve_leave
attendance.view_absentees
attendance.view_not_entered

marks.view
marks.enter
marks.override
marks.approve

allocation.view
allocation.update_student_section
allocation.delete_student_section
allocation.update_class_teacher
allocation.delete_class_teacher

The exact mapping must come from the current implementation and documented RBAC matrix.
The agent must not silently expand permissions.
5. Queryset-level scope enforcement
This is one of the most important parts.
A user having:
attendance.view

does not automatically mean they can see every attendance record.
The endpoint must apply the appropriate scope.
Existing scopes:
SCOPE_GLOBAL
SCOPE_FACULTY_ASSIGNED
SCOPE_SELF
SCOPE_LINKED_CHILD
SCOPE_NONE

Expected conceptual behavior:
Admin
School-wide/global access where Task 4.3 grants it.
Principal
School-wide oversight within their permitted domains.
Faculty
Only records belonging to their assigned academic scope.
Student
Only their own records.
Parent
Only their linked child's records.
This filtering must happen before serialization, ideally at the queryset/database layer.
Bad:
records = Attendance.objects.all()serializer = AttendanceSerializer(records)# filter later


Good:
records = authorization_service.filter_queryset_for_user(    request.user,    Attendance.objects.all(),    ...)


The exact integration must follow the existing Task 4.3 implementation.
6. Object-level authorization
Queryset filtering alone is not enough.
For detail endpoints such as:
GET /students/<id>/
PATCH /students/<id>/
DELETE /students/<id>/

the agent must ensure that a user cannot access an object simply by knowing its ID.
Example:
Student A
Student B
Student C

Student A must not be able to request:
/students/B-ID/

and receive Student B's data.
Likewise:
Parent A → Child A

must not allow:
Parent A → Child B

through a manually supplied object ID.
7. Mutation protection
For every existing mutation endpoint, enforce the correct action permission.
Examples:
POST
PATCH
PUT
DELETE

must not merely rely on:
IsAuthenticated


They must also require the appropriate domain/action permission.
For example:
attendance.mark
marks.enter
allocation.update_student_section
allocation.delete_student_section

etc.
8. Admin / Principal allocation rules
The approved Phase 2 amendment must remain enforced at the backend.
Student Section Allocation
Admin    → Update + Delete
Principal → Update + Delete
Faculty  → View only
Student  → No mutation
Parent   → No mutation

Class Teacher Allocation
Admin    → Update + Delete
Principal → Update + Delete
Faculty  → View only
Student  → No mutation
Parent   → No mutation

This must come from the existing permission architecture rather than hardcoded role checks scattered throughout views.
9. Faculty restrictions
Faculty must retain their approved boundaries.
They can perform permitted academic operations such as:
attendance marking
leave approval/marking
marks entry
assigned academic viewing

But cannot gain:
student deletion
allocation mutation
marks approval
marks override
audit access
school-wide unrestricted data access

unless the existing Task 4.3 matrix explicitly grants it.
10. Student and Parent scope
Task 4.5 is still separate.
Therefore Task 4.4 must not implement new Student/Parent login mechanisms.
This task only enforces authorization for already-existing authenticated users.
Student
Self-only where applicable.
Parent
Linked-child-only where applicable.
Do not introduce:
parent username lookup
special parent authentication
Student ID login changes

Those belong to Task 4.5.
11. Public endpoints
The agent must explicitly identify intentional public endpoints.
For example:
/api/health/

must remain public if that is how Task 3.1 defined it.
Authentication endpoints such as:
POST /api/v1/auth/login/
POST /api/v1/auth/refresh/

must remain usable without an access token.
But:
GET /api/v1/auth/me/

must remain protected.
The agent should document every intentional public endpoint rather than accidentally exposing one.
12. No is_superuser RBAC bypass
Task 4.3 explicitly removed the unsafe assumption that:
user.is_superuser


automatically means unrestricted ERP access.
Task 4.4 must preserve that decision.
Authorization must continue to be based on the canonical ERP RBAC system.
13. No role tampering
Never trust:
request.data["role"]


or similar client input to determine authorization.
The authenticated user's role comes from the server-side user/account relationship.
Test attempts such as:
{
    "role": "Admin"
}

must not elevate privileges.
14. HTTP behavior
The agent must verify correct HTTP semantics.
Expected:
Unauthenticated       → 401
Authenticated but denied → 403
Authorized             → normal endpoint response

It should also make sure authorization failures do not leak sensitive information.
15. Testing requirements
This task should substantially expand backend authorization coverage.
At minimum test:
Authentication
No JWT
Expired JWT
Inactive user
Valid JWT

Roles
All five:
Admin
Principal
Faculty
Student
Parent

Permissions
Positive and negative cases.
Example:
Admin can delete permitted object
Principal cannot perform excluded operation
Faculty cannot perform allocation mutation
Student cannot modify another student's data
Parent cannot access another child's data

Scope
Test actual data leakage.
For example:
Student A requests Student B
→ denied / inaccessible

Parent A requests Child B
→ denied / inaccessible

Faculty A requests Faculty B's unrelated class data
→ inaccessible

Mutation
Verify:
POST
PATCH
PUT
DELETE

where currently implemented.
Role tampering
Attempt privilege escalation through request payload.
Object IDs
Attempt direct access using IDs belonging to another user/child/class.
Queryset leakage
Make sure list endpoints do not return records outside the caller's scope.
16. Regression requirements
The agent must verify that Task 4.4 does not break:
Task 4.1
Task 4.2
Task 4.3

Required checks:
python manage.py check
python manage.py makemigrations --check
pytest

And frontend regression:
npm test
npm run build

from the frontend directory, according to the project's actual scripts.
The expected frontend behavior should remain unchanged because frontend integration is not Task 4.4.
17. Documentation requirements
At completion, update the project's existing documentation rather than creating random new documentation files.
At minimum, update the relevant:
docs/phase_prompts/
docs/phases/
PROJECT_STATUS.md
CHANGELOG.md
DECISIONS.md
RBAC_PERMISSIONS.md
API_CONTRACT.md
BACKEND_ARCHITECTURE.md

Only update files that are actually relevant to the implementation.
Document:
endpoint inventory
permission mapping
scope enforcement
object authorization
public endpoints
401/403 behavior
tests
bugs discovered
fixes
architectural decisions
final verification

Explicitly OUT OF SCOPE
This is critical.
Do NOT implement:
Task 4.5 Student/Parent Special Authentication

No:
Student ID login changes
Parent child-based authentication
OTP
special authentication flows
passwordless login

Do NOT implement:
Frontend auth integration

Do NOT implement:
Redis
WebSockets
Django Channels

Do NOT redesign:
Role matrix
AuthorizationService
Scope architecture
Database schema

unless the audit discovers a genuine blocker, in which case the agent must stop and report it before making unrelated architectural changes.
The workflow for Task 4.4
We should keep the same strict gate we've been using.
STEP 1
Read documentation
        ↓
STEP 2
Inspect current implementation
        ↓
STEP 3
Run baseline tests/checks
        ↓
STEP 4
Audit endpoint inventory
        ↓
STEP 5
Map endpoints → permissions → scopes
        ↓
STOP
        ↓
Human review
        ↓
STEP 6
Implement enforcement
        ↓
STEP 7
Run tests
        ↓
STEP 8
Security/regression audit
        ↓
STEP 9
Update documentation
        ↓
STEP 10
Final Task 4.4 sign-off

And right now we should only do Steps 1–4.