# PHASE 4 — TASK 4.2
# Custom User & Login

**Project:** Student ERP — Enterprise Educational Management System
**Phase:** 4 — Authentication + RBAC
**Task:** 4.2 — Custom User & Login
**Status:** **COMPLETED**
**Date:** 2026-10-05
**Prerequisite:** Task 4.1 COMPLETE

---

# 1. TASK OBJECTIVE

Implement the actual backend login workflow using the custom Django User model and the JWT authentication foundation established in Task 4.1.

Task 4.2 owns:

- credential authentication;
- password verification;
- JWT access/refresh issuance;
- refresh-token handling;
- authenticated current-user identity;
- safe authentication responses;
- invalid credential handling;
- inactive-user rejection;
- authentication-related tests.

The implementation must use the already-established:

- `accounts.User`;
- Django password hashing;
- Django REST Framework;
- SimpleJWT;
- `/api/v1/auth/`.

Do not replace the existing authentication architecture.

---

# 2. MANDATORY DOCUMENTATION READ

Before changing anything, read:

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
18. This file

Then inspect the actual repository.

---

# 3. PREREQUISITE GATE

Verify Task 4.1 before modifying anything.

Run:

```bash
python manage.py check
python manage.py makemigrations --check
pytest -q

Confirm:
- custom User model is intact;
- JWT configuration is intact;
- auth routes exist;
- Phase 3 remains regression-free;
- frontend remains mock-driven.
If the prerequisite state is broken:
STOP and report it.
4. AUTHENTICATION ARCHITECTURE
The authoritative authentication stack is:
- Django;
- Django custom User model;
- Django password hashing;
- Django REST Framework;
- djangorestframework-simplejwt;
- stateless Bearer JWT authentication.
Do not introduce another authentication framework.
5. CUSTOM USER MODEL
The existing model is:
accounts.User
It extends Django's AbstractUser.
The database PK remains the UUID.
Do not replace the model.
Do not create a second user table.
Do not use Student ID as the database PK.
6. USERNAME / LOGIN IDENTITY
The login identifier MUST follow the identity rules defined in:
docs/API_CONTRACT.md
The implementation must not silently change the project's chosen login identifier.
For the general account model, preserve the existing username architecture.
Student/Parent-specific login rules belong to Task 4.5.
7. LOGIN ENDPOINT
The canonical authentication namespace is:
/api/v1/auth/
The login endpoint is:
POST /api/v1/auth/login/
The implementation must:
1. validate credentials;
2. authenticate the user;
3. reject invalid credentials safely;
4. reject inactive users;
5. issue access and refresh JWTs;
6. return the standardized authentication response.
8. LOGIN REQUEST
The request payload must follow docs/API_CONTRACT.md.
Do not invent additional required fields.
Passwords must be:
- write-only;
- never logged;
- never stored in plaintext;
- never returned.
9. LOGIN RESPONSE
The response must follow the project's standardized response contract.
Where specified, it should contain:
- access token;
- refresh token;
- token type;
- safe authenticated-user information where defined.
Do not return:
- password;
- password hash;
- signing key;
- internal exception details;
- database credentials.
10. JWT ACCESS TOKEN
Use the Task 4.1 JWT configuration.
Current approved foundation includes:
- access token lifetime: 15 minutes;
- refresh token lifetime: 7 days;
- Bearer authentication;
- environment-driven signing key;
- HS256 as already configured.
Do not casually change these values.
Any required change must be documented.
11. JWT CLAIMS
Use only the safe claims defined by the project architecture.
Current foundation includes:
- user_id;
- role;
- username.
Do not put sensitive information in JWT claims.
Do not include:
- password;
- password hash;
- unnecessary profile data;
- secrets.
If claims need extension, document why before implementing.
12. REFRESH TOKEN
The refresh endpoint is:
POST /api/v1/auth/refresh/
It must:
- validate the refresh token;
- issue a new access token according to configuration;
- obey refresh rotation settings;
- return safe standardized output.
Do not introduce an alternative refresh mechanism.
13. CURRENT USER
The current-user endpoint is:
GET /api/v1/auth/me/
It must:
- require successful API authentication;
- resolve the authenticated User;
- return safe identity/profile data;
- never expose password hashes;
- use the standardized response envelope.
Unauthenticated requests must return the correct 401 behavior.
14. INACTIVE USERS
Users with:
is_active = False
must not successfully authenticate.
They must not receive usable JWT credentials.
The behavior must be deterministic and tested.
Do not create a second conflicting account-status mechanism.
15. INVALID CREDENTIALS
Wrong credentials must return a safe generic authentication failure.
Do not reveal:
- whether the username exists;
- internal database state;
- password validation internals;
- stack traces.
The exact response/status must follow API_CONTRACT.md.
16. PASSWORD SECURITY
Continue using Django's password hashing.
Verify:
- set_password() / Django hashing;
- check_password();
- configured password validators where appropriate.
Never compare plaintext passwords manually.
Never store plaintext passwords.
Never log passwords.
17. ROLE INFORMATION
The system still has exactly five roles:
- Admin
- Principal
- Faculty
- Student
- Parent
Task 4.2 must preserve role integrity and may expose the authenticated user's role as identity information.
However:
Do NOT implement authorization based on these roles yet.
Role permissions belong to Tasks 4.3 and 4.4.
18. AUTHENTICATION VS AUTHORIZATION
Task 4.2 answers:
"Who is this user?"
It does NOT answer:
"What can this user access?"
Do not add role-based permission logic to login views.
Do not add per-role endpoint checks.
Do not create IsAdmin, IsFaculty, etc. permission enforcement yet.
19. STUDENT & PARENT BOUNDARY
Do not implement special Student/Parent login workflows in 4.2.
The approved Parent identity rule involving the linked child's Student ID belongs to:
Task 4.5 — Student & Parent Authentication
Task 4.2 should preserve compatibility with that later extension.
20. FACULTY / ADMIN / PRINCIPAL
General credential authentication should work through the established User model.
Do not yet implement:
- Faculty-specific authorization;
- Admin-specific authorization;
- Principal-specific authorization.
Those belong to later RBAC work.
21. AUTH SERVICE
Use the existing AuthService architecture where appropriate.
The service may handle:
- credential verification;
- token generation;
- user lookup;
- authentication-related domain operations.
Do not move the whole workflow into serializers or views.
Maintain:
View → Service → Django Auth/ORM
where applicable.
22. SERIALIZERS
Use the existing authentication serializers or refine them.
They must:
- validate request data;
- represent safe authentication responses;
- never expose password/hash fields.
Do not put significant database orchestration inside serializers.
23. AUTH VIEWS
Keep views thin.
The login view should:
- receive credentials;
- invoke authentication;
- issue the correct response;
- translate known authentication failures.
Do not implement business authorization inside it.
24. AUTHENTICATION CLASSES
Continue using:
JWTAuthentication
as the primary API authentication mechanism.
Session authentication may remain for Django admin/development browsing as already established.
Do not mix authentication responsibilities without documentation.
25. API RESPONSE FORMAT
Use the project's standardized response and error infrastructure:
- common/responses.py
- common/exceptions.py
Do not create one-off login response formats.
26. SECURITY
Verify:
- secrets come from environment configuration;
- JWT signing key is not hard-coded;
- passwords are never logged;
- password hashes are never serialized;
- authentication errors do not leak account information;
- JWTs are not stored in the database unless specifically required by the approved architecture;
- no token secrets appear in source control.
27. TOKEN STORAGE BOUNDARY
Backend JWT issuance is implemented here.
Frontend token storage is NOT implemented here.
Do not modify React authentication storage.
The frontend continues using mock authentication until the later integration phase.
28. DATABASE CHANGES
Avoid unnecessary schema changes.
Task 4.2 should normally require no new ERP database tables.
If a schema change is genuinely required:
- explain why;
- generate migration;
- inspect it;
- test it;
- document it.
Do not create token tables if the approved architecture is stateless.
29. API SECURITY BASELINE
Verify that:
- /api/health/ remains public;
- /api/v1/auth/login/ is public;
- /api/v1/auth/refresh/ is public;
- /api/v1/auth/me/ requires authentication.
Exact contract behavior remains authoritative.
30. TESTING REQUIREMENTS
Create deterministic tests for:
Login
- valid credentials;
- wrong password;
- unknown username;
- empty username;
- empty password;
- inactive user.
Token issuance
- access token exists;
- refresh token exists;
- Bearer type;
- safe claims;
- token expiration configuration.
Refresh
- valid refresh token;
- invalid refresh token;
- malformed token.
Current user
- authenticated request succeeds;
- unauthenticated request returns 401;
- correct user is returned;
- password/hash absent.
Password security
- password hash stored;
- password not stored plaintext;
- password verification works.
Role integrity
- exactly five roles remain valid;
- authenticated user role is represented correctly.
Security
- secrets not leaked;
- password hashes not serialized;
- authentication errors are safe.
31. REGRESSION TESTING
Run:
python manage.py check
python manage.py makemigrations --check
pytest -q

Then:
npm test -- --run
npm run build

All Phase 3 and Phase 4.1 tests must remain green.
Do not weaken tests.
32. MANUAL/API SMOKE TEST
Where practical, verify using an actual running server:
POST /api/v1/auth/login/
POST /api/v1/auth/refresh/
GET  /api/v1/auth/me/

Test both success and failure paths.
Do not report endpoint verification unless actually executed.
33. ARCHITECTURAL PROHIBITIONS
Do NOT introduce:
- FastAPI;
- Flask;
- Firebase Auth;
- Supabase Auth;
- custom cryptography;
- custom password storage;
- duplicate user models;
- custom token database;
- RBAC enforcement;
- Redis authentication dependency;
- frontend JWT integration.
34. DOCUMENTATION UPDATES
Update after successful implementation:
- docs/phase_prompts/Phase_4_Task_4.2.md
- docs/phases/PHASE_04_STATUS.md
- docs/PROJECT_STATUS.md
- docs/CHANGELOG.md
Update docs/API_CONTRACT.md only where an approved implementation correction is required.
Update docs/DECISIONS.md for architectural decisions.
35. DEFINITION OF DONE
Task 4.2 is complete only when:
1. real credential authentication works;
2. custom User model remains authoritative;
3. Django password hashing is used;
4. inactive users are rejected;
5. JWT access/refresh issuance works;
6. refresh flow works;
7. /api/v1/auth/me/ works for authenticated users;
8. unauthenticated current-user requests return 401;
9. password/hash data is never exposed;
10. safe authentication errors are returned;
11. role identity remains valid;
12. no RBAC enforcement is introduced;
13. Student/Parent special login is deferred to 4.5;
14. frontend remains mock-driven;
15. backend tests pass;
16. frontend regression passes;
17. documentation is synchronized.
36. FINAL REPORT
Return:
A. Prerequisite verification
B. User model state
C. Login implementation
D. JWT access/refresh implementation
E. Current-user endpoint
F. Password security
G. Inactive/invalid credential handling
H. Role identity
I. API smoke-test results
J. Backend tests
K. Frontend regression
L. Documentation
M. Deviations/issues
N. Boundary confirmation
Explicitly confirm:
- RBAC NOT implemented;
- Student/Parent special authentication NOT implemented;
- frontend authentication NOT integrated;
- no new competing authentication architecture;
- no unrelated Phase 4 work.
Next Task
PHASE 4 — TASK 4.3: RBAC Architecture & Permission Model