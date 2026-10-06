# PHASE 4 — TASK 4.5
## Student/Parent Special Authentication

**Status:** PLANNED — Specification Approved for Audit Kickoff
**Phase:** 4 — Authentication + RBAC
**Task:** 4.5
**Prerequisites:** Tasks 4.1, 4.2, 4.3, and 4.4 COMPLETE

---

## 1. Purpose

Task 4.5 introduces the ERP-specific login identifiers for the **Student** and **Parent** roles while preserving the existing Django authentication, JWT, and RBAC architecture.

The required user-facing behavior is:

- **Student login:** Student ID + password.
- **Parent login:** linked child's Student ID + password.

The resulting authenticated identity must continue to be the existing `accounts.User` record, and the existing JWT authentication and Task 4.4 endpoint-level RBAC enforcement must remain authoritative.

This task changes the **login identifier/credential resolution flow** for Student and Parent users. It does not create a second authentication architecture.

---

## 2. Authoritative Architecture

The following remain the source of truth:

- Existing `accounts.User` model and authentication foundation from Task 4.2.
- Existing JWT implementation from Task 4.2.
- Existing five-role RBAC architecture from Task 4.3.
- Existing endpoint-level RBAC from Task 4.4.
- Existing Student ID rules and Student/Parent relationships already established by the project.
- Existing API and security conventions documented in the repository.

No competing authentication, authorization, identity, or role system may be introduced.

---

## 3. Canonical ERP Roles

The system has exactly five canonical roles:

1. Admin
2. Principal
3. Faculty
4. Student
5. Parent

Task 4.5 must not add role variants such as `StudentUser`, `ParentUser`, `Guardian`, or `Learner`.

Student and Parent remain normal ERP users with their existing canonical roles.

---

## 4. Student Authentication Requirement

### 4.1 Login Identifier

A Student must be able to authenticate using:

```text
Student ID + Password
```

Example Student ID:

```text
STU202600001
```

The Student ID is the permanent ERP identifier and is not a disposable username alias.

### 4.2 Required Resolution Flow

The logical authentication flow is:

```text
Submitted Student ID
        ↓
Find Student record
        ↓
Resolve linked User
        ↓
Verify password
        ↓
Verify account is active
        ↓
Issue existing JWT
        ↓
Authenticated role = Student
```

The implementation must resolve the User from the server-side Student relationship. It must not trust a client-supplied user ID or role.

### 4.3 Student ID Integrity

The implementation must preserve existing Student ID rules:

- Student ID is unique.
- Student ID is immutable after assignment.
- Student ID is generated/managed by the server according to the existing project rules.
- Authentication must not permit changing a Student ID.
- Authentication must not create duplicate Student IDs.

Normalization/case behavior must follow the existing Student ID contract and must be explicitly tested. Do not silently invent a new normalization policy.

### 4.4 Student Account State

A Student login must fail when the linked authentication User is inactive.

If the project's Student model has an active/inactive state, the implementation must also follow the existing domain rule for that state. Do not allow an inactive Student or inactive linked User to authenticate through the special login path.

### 4.5 Failure Behavior

Student authentication failures must use the project's existing generic authentication error behavior.

The response must not reveal whether:

- the Student ID exists,
- the Student record exists,
- the linked User exists,
- the password was incorrect,
- or the account was inactive.

Do not create a Student-ID enumeration oracle.

---

## 5. Parent Authentication Requirement

### 5.1 Login Identifier

A Parent must be able to authenticate using:

```text
Linked Child's Student ID + Parent Password
```

Example:

```text
Child Student ID: STU202600001
Password: ********
```

The Student ID identifies the child relationship used to resolve the Parent account.

### 5.2 Required Resolution Flow

The logical authentication flow is:

```text
Submitted Child Student ID
        ↓
Find Student
        ↓
Resolve linked Parent relationship(s)
        ↓
Resolve the intended Parent User
        ↓
Verify password
        ↓
Verify account is active
        ↓
Issue existing JWT
        ↓
Authenticated role = Parent
```

The implementation must use the existing Student-to-Parent relationship in the database.

Do not trust a client-supplied Parent ID, User ID, role, or child relationship to establish identity.

### 5.3 Multiple Children

If one Parent is linked to multiple Students, the Parent must be able to authenticate using the Student ID of any currently valid linked child, subject to the existing relationship model and account state.

Authentication must resolve the existing Parent User; it must not create duplicate Parent users for each child.

### 5.4 Multiple Parents for One Child

If the existing schema permits multiple Parent accounts linked to the same Student, the implementation must preserve that relationship model and use password verification to resolve the correct active Parent account without exposing parent-account existence information.

The audit must confirm whether this case exists in the current schema. If the current schema makes the login flow ambiguous in a way that cannot be resolved without a schema change, implementation must stop and report the blocker rather than inventing a new identity rule.

### 5.5 Failure Behavior

Parent authentication must use the project's generic authentication failure behavior.

Do not reveal whether:

- the child Student ID exists,
- the Student has a linked Parent,
- a particular Parent exists,
- the password is incorrect,
- or the Parent account is inactive.

---

## 6. Existing Admin / Principal / Faculty Authentication

Task 4.5 must not break or redesign existing authentication for:

- Admin
- Principal
- Faculty

Their existing login behavior from Task 4.2 must continue to work exactly as documented unless the approved API design requires a backward-compatible shared authentication change.

No role may be downgraded or upgraded through the special Student/Parent login flow.

---

## 7. JWT Requirements

Student and Parent authentication must reuse the existing JWT implementation.

Do not introduce a second token type, secret, signing process, or authentication backend.

Preserve the existing JWT security properties, including the established signing configuration, access/refresh behavior, and server-derived identity claims.

The role in the resulting token must be derived from the authenticated server-side User/Role relationship.

Never derive authorization from:

```json
{"role": "Admin"}
```

or any similar client payload.

Do not allow the submitted Student ID to overwrite the stored User identity.

Do not change the User's username merely because Student or Parent special authentication is being used.

---

## 8. API Design Requirements

Task 4.5 must preserve the existing authentication API contract as much as possible.

The implementation may either:

1. extend the existing login endpoint in a backward-compatible way, or
2. introduce a dedicated Student/Parent authentication endpoint,

but the choice must be based on the existing repository architecture, Task 4.2 implementation, API contract, and the Task 4.5 audit.

Do not introduce duplicate login mechanisms without a documented architectural reason.

The final API contract must document:

- endpoint path(s),
- accepted identifier field(s),
- password field,
- successful response envelope,
- failure response envelope,
- status codes,
- rate/security behavior if already supported by the project,
- backward compatibility behavior for existing roles.

Authentication endpoints remain intentionally unauthenticated at the endpoint level; credential validation itself is the authentication control.

---

## 9. Endpoint Authorization Boundary

Task 4.5 is authentication-specific.

Once authentication succeeds, the resulting JWT must pass through the already implemented Task 4.4 endpoint-level RBAC system.

Do not bypass:

- `HasRequiredPermission`,
- `IsOwnerOrScopedAccess`,
- `AuthorizationService`,
- queryset-level scope filtering,
- object-level authorization,
- or any other approved Task 4.4 authorization layer.

A successful Student/Parent login must never imply unrestricted API access.

---

## 10. Security Requirements

The implementation must prevent:

- Student ID enumeration.
- Parent existence enumeration.
- Cross-student authentication.
- Cross-parent account access.
- Authentication using another user's User ID.
- Client-supplied role escalation.
- JWT role tampering.
- Inactive-account bypass.
- Password bypass.
- Duplicate Student ID resolution.
- Ambiguous Parent resolution without a documented safe rule.
- Authentication through deleted/invalid relationships.
- Logging of plaintext passwords.

Passwords must continue to be handled by Django's secure password hashing/authentication facilities.

Credentials must never be written to application logs, debug logs, test output, or documentation.

---

## 11. Student ID Handling

Student ID lookup must follow the project's established canonical representation.

The implementation must explicitly test:

- valid Student ID,
- nonexistent Student ID,
- malformed Student ID,
- incorrect case/normalization according to the existing contract,
- duplicate-data protection,
- valid password,
- invalid password,
- inactive linked User,
- inactive Student where applicable.

Do not alter Student ID generation, sequence policy, or immutability in this task unless a pre-existing defect blocks the authentication requirement.

---

## 12. Parent-Child Relationship Handling

The Parent authentication flow must rely on the existing relational model.

The implementation must verify:

- Student → Parent linkage,
- Parent → User linkage,
- one Parent with one child,
- one Parent with multiple children if supported,
- multiple Parents for one child if supported,
- inactive/deleted relationship handling,
- unauthorized child ID substitution.

A Parent must not authenticate merely by knowing a Student ID. The Parent password and server-side relationship must still be validated.

---

## 13. Error and HTTP Semantics

Authentication failures must use the existing API error conventions.

At minimum, verify correct behavior for:

```text
Missing credentials       → authentication failure
Invalid identifier        → authentication failure
Wrong password            → authentication failure
Inactive account          → authentication failure
Valid credentials         → 200 successful login response
```

Do not expose internal traceback information or relationship details in authentication responses.

Do not change Task 4.4's 401/403 semantics for protected ERP endpoints.

---

## 14. Frontend Boundary

Task 4.5 may require minimal frontend login changes only if the approved implementation and existing application architecture require them.

The frontend must not duplicate credential-resolution logic.

The frontend may submit the special identifier and password, but:

```text
UI → authentication API → Django authentication logic → JWT
```

The frontend must not determine the authenticated role from user input.

The final redirect must use the server-authenticated role/session state according to the existing frontend architecture.

Do not redesign the ERP UI during this task.

---

## 15. Database Boundary

Prefer application-level authentication logic using the existing schema.

No database migration should be required if the existing Student/User and Parent/User relationships already support the required behavior.

Do not add fields merely to simplify implementation.

Do not add duplicate identifiers such as:

- `student_login_id`,
- `parent_login_id`,
- `child_username`,

unless the audit proves that an existing required relationship cannot support the feature and the change is explicitly approved.

If schema changes are unavoidable, stop and report the exact blocker before creating migrations.

---

## 16. Testing Requirements

Create or extend tests following the project's existing testing conventions.

### Student authentication tests

Must cover:

- valid Student ID + password,
- wrong password,
- nonexistent Student ID,
- malformed identifier,
- inactive User,
- inactive Student where applicable,
- successful JWT issuance,
- JWT role = Student,
- `/api/v1/auth/me/` works after login,
- Student cannot authenticate as another Student by changing the ID.

### Parent authentication tests

Must cover:

- valid linked child Student ID + Parent password,
- wrong password,
- nonexistent Student ID,
- child without a valid Parent relationship,
- inactive Parent User,
- multiple children for one Parent if supported,
- multiple Parents for one child if supported,
- JWT role = Parent,
- `/api/v1/auth/me/` works after login,
- Parent cannot authenticate against an unrelated child's Student ID.

### Regression tests

Existing roles must continue to authenticate:

- Admin
- Principal
- Faculty

Existing refresh behavior must continue to work.

Existing protected endpoints must continue to enforce Task 4.4 RBAC.

### Security tests

Test that:

- client payload `{ "role": "Admin" }` does not escalate privileges,
- supplied User IDs cannot substitute for the resolved User,
- inactive users cannot obtain tokens,
- authentication errors do not disclose account existence,
- Student tokens have Student role,
- Parent tokens have Parent role,
- successful login does not bypass endpoint permissions.

---

## 17. Regression Requirements

The following must pass after implementation:

```text
python manage.py check
python manage.py makemigrations --check
pytest
npm test -- --run
npm run build
```

Exact test counts and command results must be recorded.

No schema drift may be introduced unless explicitly approved.

No unrelated failures may be silently ignored.

---

## 18. Documentation Requirements

At completion, update the existing project documentation as appropriate.

Expected documents include:

```text
docs/phase_prompts/Phase_4_Task_4.5.md
docs/phases/PHASE_04_STATUS.md
PROJECT_STATUS.md
CHANGELOG.md
DECISIONS.md
API_CONTRACT.md
BACKEND_ARCHITECTURE.md
RBAC_PERMISSIONS.md
```

Document the actual implementation, not the planned behavior if it differs.

Record:

- final authentication flow,
- Student ID login behavior,
- Parent child-ID login behavior,
- API endpoint changes,
- error behavior,
- security controls,
- tests,
- migration result,
- architectural decisions,
- known limitations,
- final sign-off.

---

## 19. Implementation Governance

Task 4.5 follows the strict ERP workflow:

```text
Specification
    ↓
Audit-only kickoff
    ↓
Human review
    ↓
Implementation
    ↓
Testing
    ↓
Security verification
    ↓
Documentation
    ↓
Task sign-off
```

The audit phase must be completed before implementation.

If the audit discovers an ambiguity in the current schema, authentication architecture, or API contract, the agent must stop and report it rather than inventing a new rule.

---

## 20. Explicitly Out of Scope

The following are NOT part of Task 4.5:

- New ERP roles.
- RBAC redesign.
- Permission-matrix redesign.
- Endpoint-level RBAC redesign.
- Redis integration.
- WebSockets/Django Channels.
- Timetable realtime features.
- Notification delivery infrastructure.
- Passwordless authentication.
- OTP authentication unless separately approved.
- Social login.
- Biometric authentication.
- Student deletion.
- Parent deletion.
- Unrelated schema redesign.
- General account-management redesign.
- Broad frontend redesign.
- Phase 5 API integration work beyond what is strictly required for the authentication contract.

---

## 21. Acceptance Criteria

Task 4.5 is complete only when all of the following are true:

### Student

- Student can log in using Student ID + password.
- Student authentication resolves the existing linked User.
- Resulting JWT role is Student.
- Invalid credentials fail safely.
- Inactive accounts cannot authenticate.
- Student cannot authenticate as another Student by changing identifiers.

### Parent

- Parent can log in using a linked child's Student ID + password.
- Existing Parent/Student relationships are respected.
- Resulting JWT role is Parent.
- Multiple-child behavior works where supported by the schema.
- Invalid/unrelated child identifiers do not authenticate the Parent.
- Inactive accounts cannot authenticate.

### Existing roles

- Admin login still works.
- Principal login still works.
- Faculty login still works.

### JWT

- Existing JWT architecture is reused.
- No unauthorized role can be injected through request data.
- Server-side User/Role determines the resulting role.

### RBAC

- Task 4.4 endpoint permissions remain intact.
- Successful Student/Parent authentication does not bypass authorization.

### Security

- No credential leakage.
- No account-existence leakage through authentication errors.
- No cross-user identity substitution.
- No inactive-account bypass.

### Quality

- Backend checks pass.
- Migration check passes.
- Full backend tests pass.
- Frontend tests pass.
- Frontend production build passes.
- Documentation is updated.
- No unrelated architecture changes were introduced.

---

## 22. Final Sign-Off Requirement

The Task 4.5 completion report must explicitly state:

1. Student authentication flow implemented.
2. Parent authentication flow implemented.
3. Existing Admin/Principal/Faculty authentication preserved.
4. JWT architecture preserved.
5. Task 4.4 RBAC preserved.
6. Security tests passed.
7. Backend test result.
8. Frontend test result.
9. Build result.
10. Migration result.
11. Documentation updated.
12. Any known limitations or unresolved issues.

Only then may Task 4.5 be marked **COMPLETE** and Phase 4 be closed.
