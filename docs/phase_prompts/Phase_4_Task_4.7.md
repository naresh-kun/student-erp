# PHASE 4 — TASK 4.7
## Phase-Wide Testing, Security Verification & Regression Hardening

**Status:** COMPLETED — Verified & Signed Off
**Phase:** 4 — Authentication + RBAC
**Task:** 4.7
**Prerequisites:** Tasks 4.1, 4.2, 4.3, 4.4, 4.5 and 4.6 COMPLETE

---

## 1. Purpose

Task 4.7 is the Phase 4-wide verification and hardening gate.

The objective is to prove that the complete authentication and RBAC architecture implemented during Phase 4 works correctly as an integrated system across:

- Django authentication
- JWT issuance and validation
- Student authentication
- Parent authentication
- Faculty authentication
- Admin authentication
- Principal authentication
- Role resolution
- Endpoint-level RBAC
- Object-level authorization
- Queryset-level scoping
- Frontend authentication/session handling
- Protected frontend routes
- 401/403 semantics
- Security boundaries
- Regression behavior
- Browser-level authentication flows

This task is primarily a testing and verification task.

Do not redesign the authentication architecture.

Do not redesign RBAC.

Do not open Phase 5.

---

## 2. Authoritative Architecture

The following remain authoritative:

- PROJECT_STRUCTURE.md
- ARCHITECTURE.md
- BACKEND_ARCHITECTURE.md
- DATABASE_SCHEMA.md
- API_CONTRACT.md
- RBAC_PERMISSIONS.md
- FRONTEND_ARCHITECTURE.md
- DEVELOPMENT_WORKFLOW.md
- GIT_WORKFLOW.md
- TESTING_STRATEGY.md
- DEPLOYMENT.md
- PROJECT_STATUS.md
- CHANGELOG.md
- DECISIONS.md
- docs/phases/PHASE_04_STATUS.md
- Phase 4 task specifications
- Approved Phase 4 completion records

The implementation must continue to use:

React + TypeScript + Vite
        ↓
Frontend service/authentication layer
        ↓
Django REST Framework
        ↓
PostgreSQL

JWT remains the authentication mechanism.

The five canonical roles remain:

1. Admin
2. Principal
3. Faculty
4. Student
5. Parent

No sixth role or role variant may be introduced.

---

## 3. Mandatory Audit-Only Kickoff

Before modifying any code:

1. Read all required project documentation.
2. Read the Phase 4 status ledger.
3. Read Task 4.1 through Task 4.6 specifications/completion records.
4. Inspect the current repository.
5. Inspect the current authentication implementation.
6. Inspect the current RBAC implementation.
7. Inspect frontend authentication/session handling.
8. Inspect existing backend and frontend tests.
9. Establish the actual current test baseline.
10. Establish current migration/schema state.
11. Establish whether the development backend and frontend can run.
12. Identify any existing known failures.

The audit MUST NOT modify code, tests, migrations, configuration, or documentation.

Produce an audit report before implementation/testing fixes begin.

If the current baseline is broken, document the exact failure and determine whether it is:

- pre-existing,
- caused by a previous task,
- caused by approved MOD_001 work,
- or a genuine Phase 4 regression.

Do not silently normalize a failing baseline.

---

## 4. Authentication Verification

Verify the complete login lifecycle for all five roles.

### Admin

Verify:

- valid credentials
- invalid password
- invalid username
- successful JWT issuance
- correct role claim
- `/api/v1/auth/me/`
- refresh token
- logout/session clearing on frontend
- protected route behavior

### Principal

Verify the same authentication lifecycle.

### Faculty

Verify the same authentication lifecycle.

### Student

Verify:

- Student ID + password
- valid Student ID
- invalid Student ID
- malformed Student ID
- incorrect password
- case/normalization behavior according to the existing contract
- inactive User
- inactive Student where applicable
- JWT role = Student
- `/api/v1/auth/me/`
- refresh behavior
- protected endpoint access

### Parent

Verify:

- linked child's Student ID + Parent password
- invalid child Student ID
- unrelated child Student ID
- wrong password
- inactive Parent
- relationship resolution
- JWT role = Parent
- `/api/v1/auth/me/`
- refresh behavior
- protected endpoint access

Authentication failures must remain generic and must not reveal account existence.

---

## 5. JWT Verification

Verify:

- access token is issued only after successful authentication
- refresh token is valid
- access token expiration behavior
- refresh behavior
- server-derived user identity
- server-derived role
- correct role claim
- token type semantics
- invalid token rejection
- malformed token rejection
- missing token behavior
- inactive-user token rejection where supported
- client-supplied role cannot alter authorization
- client-supplied user ID cannot substitute identity

Do not weaken token validation to make tests pass.

---

## 6. RBAC Verification

Verify the authoritative permission matrix against the actual API.

Test all five roles using both positive and negative cases.

At minimum verify:

### Admin

Expected unrestricted administrative permissions according to RBAC_PERMISSIONS.md.

### Principal

Verify permitted school-wide operations and rejection of prohibited administrative mutations.

### Faculty

Verify:

- assigned-class/section attendance boundaries
- leave approval authority
- marks-entry authority
- timetable visibility
- teaching-assignment visibility
- homework permissions according to the approved current system
- rejection of unrelated administrative mutations

### Student

Verify:

- self-scoped access only
- personal attendance
- personal marks
- personal timetable
- personal calendar/report access
- rejection of staff-only operations

### Parent

Verify:

- linked-child scoped access only
- child attendance
- child marks
- child timetable
- child calendar/report access
- rejection of unrelated student/staff operations

---

## 7. 401 / 403 Verification

Confirm the API consistently distinguishes:

```text
Unauthenticated request → 401
Authenticated but unauthorized request → 403
Authenticated and authorized request → 2xx

Test:
- missing Authorization header
- invalid Bearer token
- expired token
- valid token with insufficient permission
- valid token with correct permission
- cross-user object access
- cross-parent access
- cross-faculty access
- cross-section access
Do not alter established API semantics merely to simplify tests.
8. Object-Level Authorization
Explicitly test that users cannot access records outside their permitted scope.
Verify:
- Student A cannot access Student B data.
- Parent A cannot access another parent's child.
- Faculty cannot access an unrelated section.
- Faculty cannot modify unrelated student records.
- Principal/Admin school-wide permissions behave according to the matrix.
- Object IDs cannot be manipulated to bypass permission checks.
- Queryset filtering happens before unauthorized data is exposed.
Test both collection and detail endpoints.
9. Queryset-Level Security
Verify database/queryset scoping for:
- students
- parents
- faculty
- attendance
- marks
- leave records
- homework/current approved domain features
- assignments where applicable
A user must not receive unauthorized records merely because the frontend hides them.
Security must be enforced server-side.
10. Privilege Escalation Tests
Explicitly attempt:
{
  "role": "Admin"
}

and similar malicious payload manipulation.
Also test:
- supplied user IDs
- manipulated ownership IDs
- manipulated student IDs
- manipulated parent IDs
- manipulated faculty IDs
- manipulated section IDs
- manipulated permission fields
- direct endpoint URL access
- frontend route bypass followed by API calls
None of these may grant unauthorized privileges.
11. Frontend Authentication Verification
Verify the real frontend authentication architecture implemented in Task 4.6.
Confirm:
- login uses the real Django authentication API
- JWT tokens are stored according to the current implementation
- session restoration uses the backend
- /api/v1/auth/me/ is used correctly
- refresh behavior works
- logout removes session credentials
- authenticated state survives page refresh when expected
- protected routes reject unauthenticated users
- role-based redirects work
- frontend does not trust a client-supplied role
- old Phase 2 MockAuthService does not regain authentication authority
Do not reconnect unrelated Phase 2 mock services to authentication.
12. Browser Verification
Perform live browser verification for all five roles where valid seeded/demo accounts exist.
At minimum verify:
- login page
- successful login
- correct dashboard redirect
- authenticated navigation
- protected route behavior
- logout
- page refresh/session restoration
- invalid credentials
- unauthorized route/API behavior
Record browser-observable failures and console/network errors.
Do not treat a page merely rendering as proof of backend authorization.
13. Regression Testing
Run the complete existing backend and frontend suites.
Required commands:
python manage.py check
python manage.py makemigrations --check
pytest
npm test -- --run
npm run build

Do not run only newly-created Task 4.7 tests.
Exact:
- test counts
- pass counts
- fail counts
- skipped counts
- durations where useful
- exit codes
must be recorded.
Any failure must be classified.
14. Migration and Schema Integrity
Verify:
python manage.py makemigrations --check

No undocumented schema drift may remain.
Do not create migrations merely to silence the test suite.
If an existing model change requires a migration, identify:
- exact model change
- migration name
- responsible task/modification
- whether it is legitimate
- whether it is already approved
Do not silently fold unrelated schema changes into Task 4.7.
15. Security Regression Checklist
Explicitly test for:
- role escalation
- identity substitution
- account enumeration
- Student ID enumeration
- Parent relationship bypass
- cross-student access
- cross-parent access
- cross-faculty access
- inactive-account bypass
- token misuse
- object ID manipulation
- direct API access bypassing UI
- frontend role spoofing
- plaintext credential logging
Passwords and secrets must never appear in logs or test reports.
16. Test Quality Requirements
Tests must verify behavior, not implementation trivia.
Prefer:
- API integration tests
- permission tests
- object-scope tests
- authentication tests
- regression tests
- frontend integration tests
- browser/E2E verification
Avoid tests that merely duplicate implementation details.
Any new tests must follow the existing testing architecture.
Do not delete useful existing tests simply to obtain a green build.
17. Defect Handling
If a defect is discovered:
1. Record the defect.
2. Identify the affected layer.
3. Identify the root cause.
4. Determine whether the fix belongs to Task 4.7.
5. Make the smallest safe correction.
6. Add or update a regression test.
7. Re-run affected tests.
8. Re-run the complete regression suite.
9. Document the correction.
Do not use broad refactoring as a substitute for targeted fixes.
18. MOD_001 Boundary
MOD_001 remains a separate approved project modification.
Task 4.7 must not:
- convert MOD_001 into Phase 5
- start Phase 5
- redesign Faculty/Class Teacher architecture
- add unrelated Homework features
- expand Homework beyond its approved scope
Current approved functionality affected by authentication/RBAC may be regression-tested.
Any MOD_001 defect discovered during Phase 4 verification must be documented with its ownership boundary.
19. Documentation Requirements
After implementation/testing, update the appropriate documentation.
At minimum review:
docs/phase_prompts/Phase_4_Task_4.7.md
docs/phases/PHASE_04_STATUS.md
docs/PROJECT_STATUS.md
docs/CHANGELOG.md
docs/DECISIONS.md
docs/API_CONTRACT.md
docs/BACKEND_ARCHITECTURE.md
docs/RBAC_PERMISSIONS.md

Document actual behavior only.
Record:
- baseline state
- audit findings
- tests executed
- security tests
- browser tests
- defects discovered
- fixes made
- regression results
- migration result
- known limitations
- remaining risks
- Task 4.7 status
Do not mark Phase 4 complete yet.
20. Acceptance Criteria
Task 4.7 is complete only when:
- all five roles are authentication-tested
- JWT behavior is verified
- 401/403 semantics are verified
- RBAC positive and negative cases pass
- object-level authorization passes
- queryset-level scoping passes
- privilege escalation attempts fail
- frontend real authentication remains intact
- protected frontend routes behave correctly
- browser verification passes for available demo accounts
- backend test suite passes
- frontend test suite passes
- production build passes
- migration drift check passes
- Django system check passes
- no unexplained regression remains
- documentation is updated
21. Final Task Report
The completion report must explicitly include:
1. Audit baseline
2. Authentication verification
3. JWT verification
4. Five-role RBAC verification
5. 401/403 verification
6. Object-level authorization results
7. Queryset-scope results
8. Privilege-escalation results
9. Frontend integration results
10. Browser verification
11. Backend test result
12. Frontend test result
13. Build result
14. Migration result
15. Defects discovered
16. Defects fixed
17. Known limitations
18. Documentation updated
19. Phase 4 status after Task 4.7
Task 4.7 may be marked COMPLETE only after all required verification is green or every remaining issue is explicitly accepted as an unresolved blocker.
22. Governance Stop Point
After Task 4.7 completion:
TASK 4.7 = COMPLETE
TASK 4.8 = NEXT
PHASE 5 = NOT STARTED

Do not implement Task 4.8 automatically.
Stop after documenting Task 4.7.