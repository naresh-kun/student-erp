# PHASE 4 — TASK 4.1
# Authentication Foundation

**Project:** Student ERP — Enterprise Educational Management System
**Phase:** 4 — Authentication + RBAC
**Task:** 4.1 — Authentication Foundation
**Status:** **COMPLETED**
**Date:** 2026-10-05
**Prerequisite:** Phase 3 COMPLETE & SIGNED OFF

---

# 1. OBJECTIVE

Establish the secure authentication foundation for the Student ERP backend.

Task 4.1 prepares the project for actual login and role-based authorization by establishing:

- authentication architecture;
- Django authentication integration;
- password-security configuration;
- token/JWT infrastructure;
- authentication service boundaries;
- authentication URL namespace;
- authentication serializers/views scaffolding;
- secure authentication settings;
- authentication test architecture.

Task 4.1 must NOT become the complete login/RBAC implementation.

---

# 2. MANDATORY DOCUMENTATION READ

Before modifying anything, read:

1. docs/PROJECT_STRUCTURE.md
2. docs/ARCHITECTURE.md
3. docs/BACKEND_ARCHITECTURE.md
4. docs/DATABASE_SCHEMA.md
5. docs/API_CONTRACT.md
6. docs/RBAC_PERMISSIONS.md
7. docs/FRONTEND_ARCHITECTURE.md
8. docs/DEVELOPMENT_WORKFLOW.md
9. docs/GIT_WORKFLOW.md
10. docs/TESTING_STRATEGY.md
11. docs/DEPLOYMENT.md
12. docs/PROJECT_STATUS.md
13. docs/CHANGELOG.md
14. docs/DECISIONS.md
15. docs/phase_prompts/PHASE_03.md
16. docs/phases/PHASE_03_STATUS.md
17. all existing Phase 4 documentation
18. this file

Then inspect the actual repository.

Do not assume authentication state from previous reports.

---

# 3. PREREQUISITE VERIFICATION

Verify Phase 3 is actually intact.

Run:

python manage.py check
python manage.py showmigrations
python manage.py makemigrations --check
pytest -q

Confirm:

- PostgreSQL is connected;
- migrations are applied;
- existing 154+ backend tests remain green;
- seed data remains available;
- `/api/v1/` remains operational;
- frontend remains mock-driven.

If Phase 3 is broken:

STOP.

Do not silently repair unrelated Phase 3 defects.

---

# 4. AUTHENTICATION ARCHITECTURE

The backend remains:

Django + Django REST Framework + PostgreSQL.

Authentication must use Django's supported authentication architecture.

Do not create:

- custom password algorithms;
- parallel user databases;
- separate authentication frameworks;
- hand-built JWT encoding;
- duplicate identity systems.

Use the authentication/token library approved by the project's dependency and API architecture.

If the repository does not specify the token implementation, document the proposed choice before silently introducing a new dependency.

---

# 5. EXISTING USER MODEL

Task 3.3 already established the persistent User model.

Before changing it:

- inspect `accounts.User`;
- inspect Django auth configuration;
- inspect current relationships;
- inspect migrations;
- inspect role relationship.

Do NOT replace the existing user model casually.

If structural changes are required, preserve migration integrity and document the reason.

---

# 6. PASSWORD SECURITY

Passwords must use Django's password hashing system.

Never store plaintext passwords.

Never log passwords.

Never return password hashes through API serializers.

Never seed production credentials.

Development seed credentials must remain synthetic and documented.

Password validation should use Django's supported password validators where appropriate.

---

# 7. TOKEN / JWT FOUNDATION

Task 4.1 prepares the token authentication layer.

Where JWT is the approved architecture, establish:

- token configuration;
- signing/security configuration;
- access-token lifetime;
- refresh-token lifetime;
- token authentication class/configuration;
- authentication URL namespace;
- token-related serializer/service architecture.

Do NOT yet implement the complete production login workflow unless explicitly assigned to Task 4.2.

Do NOT implement role-based token authorization yet.

---

# 8. AUTHENTICATION CONFIGURATION

Configure:

- DRF authentication classes;
- token configuration;
- password validators;
- authentication-related settings;
- secure cookie/token behavior where applicable;
- development vs production security boundaries.

Do not hard-code secrets.

JWT signing secrets must come from environment configuration.

---

# 9. ENVIRONMENT VARIABLES

Authentication secrets/configuration must use `.env`.

Potential configuration includes:

- secret key;
- JWT signing configuration;
- access token lifetime;
- refresh token lifetime;
- secure cookie flags where relevant.

Do not commit real secrets.

Update `.env.example` with placeholders only.

---

# 10. AUTHENTICATION SERVICE ARCHITECTURE

Create or refine a dedicated authentication service boundary if required by the backend architecture.

Possible responsibilities:

- credential verification;
- password operations;
- token preparation;
- authenticated-user lookup.

However:

Do not place the entire authentication system inside one giant service.

Keep reusable security concerns separated.

---

# 11. SERIALIZER ARCHITECTURE

Establish authentication serializers for the later login workflow.

Serializers must handle:

- credential input validation;
- safe user representation;
- token payload representation where appropriate.

Do NOT expose:

- password;
- password hash;
- internal security metadata.

Large authentication workflows do not belong directly inside serializers.

---

# 12. API NAMESPACE

Authentication endpoints must live under:

`/api/v1/auth/`

Do not create unversioned authentication routes.

The exact endpoint set must follow:

`docs/API_CONTRACT.md`

Task 4.1 may establish route scaffolding without implementing every login operation.

---

# 13. CURRENT USER IDENTITY

Prepare the architecture for an authenticated-user endpoint such as:

`/api/v1/auth/me/`

The response must eventually expose only safe identity information.

Potential fields may include:

- user ID;
- role;
- display name;
- associated profile identifier.

Do not expose:

- password;
- password hash;
- security secrets.

---

# 14. ROLE FOUNDATION

The system has exactly five approved roles:

- Admin
- Principal
- Faculty
- Student
- Parent

Task 4.1 must preserve the existing role model.

Do NOT yet implement complete role-based permission enforcement.

RBAC is a later Phase 4 task.

---

# 15. ROLE VS AUTHENTICATION

Authentication answers:

"Who are you?"

Authorization answers:

"What are you allowed to do?"

Task 4.1 primarily establishes the first.

Do not embed all RBAC decisions inside authentication code.

---

# 16. STUDENT ID

Student identity remains separate from the database UUID.

Approved business identifier:

`STUYYYYNNNNN`

Example:

`STU202600001`

Do not change Student ID architecture during Task 4.1.

---

# 17. PARENT AUTHENTICATION PREPARATION

The approved parent login requirement uses the linked child's Student ID.

Task 4.1 should preserve the data/authentication architecture needed to support this later.

Do NOT implement the complete parent login workflow yet.

Task 4.5 owns Student & Parent Authentication.

---

# 18. FACULTY / ADMIN / PRINCIPAL PREPARATION

The system must be able to associate authenticated users with:

- Faculty;
- Admin;
- Principal.

Do not create duplicate identities.

Do not implement role-specific permission rules yet.

---

# 19. AUTHENTICATION FAILURE HANDLING

Authentication failures must return safe, predictable responses.

Do not reveal whether sensitive account information exists when the security design requires generic credential errors.

Do not expose:

- stack traces;
- database details;
- internal exceptions;
- password validation internals.

---

# 20. BRUTE-FORCE / SECURITY BOUNDARY

Task 4.1 should establish the configuration/documentation extension point for authentication throttling/rate limiting.

Do not build an elaborate external security system unless required by project documentation.

DRF throttling or the approved later mechanism may be implemented in the appropriate authentication task.

---

# 21. ACCOUNT STATUS

Inspect the existing user/account status model.

Authentication should respect disabled/inactive users where the schema supports it.

Do not bypass account state.

Do not invent multiple conflicting status fields.

---

# 22. SESSION / TOKEN ARCHITECTURE

Do not accidentally activate multiple competing authentication mechanisms.

The project must have one clearly documented API authentication strategy.

If session authentication remains enabled for Django admin/development tooling, distinguish that from the REST API authentication mechanism.

---

# 23. ADMIN SITE

Django admin may continue using Django's normal authentication.

Do not confuse:

- Django admin authentication;
- REST API authentication;
- future frontend authentication.

Document their boundaries.

---

# 24. FRONTEND BOUNDARY

Task 4.1 must NOT migrate the React frontend to live authentication.

Do not yet:

- replace MockDataService;
- implement frontend JWT storage;
- build login API integration;
- rewrite AuthContext around backend tokens.

Frontend authentication integration comes after backend authentication is stable and explicitly scheduled.

---

# 25. TESTING REQUIREMENTS

Create authentication foundation tests covering:

### Configuration
- authentication settings;
- token configuration;
- environment loading;
- secret configuration.

### User
- valid user creation;
- password hashing;
- password verification;
- inactive-user behavior.

### Security
- plaintext password not stored;
- password hash not exposed by serializers;
- secrets not included in API responses.

### Roles
- exactly five supported roles;
- role relationship remains valid.

### API Foundation
- `/api/v1/auth/` routing;
- unauthenticated/protected behavior as defined by contract;
- safe authentication errors.

Do not weaken existing Phase 3 tests.

---

# 26. REGRESSION REQUIREMENT

Run:

python manage.py check
python manage.py makemigrations --check
pytest -q

Then:

npm test -- --run
npm run build

Phase 3 must remain regression-free.

---

# 27. MIGRATION RULES

Do not create migrations merely for configuration.

If model changes are genuinely required:

- inspect them;
- generate migrations;
- review them;
- test them;
- document them.

Avoid unnecessary user-table schema changes.

---

# 28. SECURITY TESTING

At minimum test:

- wrong password;
- missing credentials;
- inactive account;
- password hash not returned;
- token secret not exposed;
- safe error responses.

Do not test or log actual production secrets.

---

# 29. ARCHITECTURAL PROHIBITIONS

Do not introduce:

- FastAPI;
- Flask;
- Firebase Auth;
- Supabase Auth;
- Auth0 unless explicitly approved;
- custom authentication databases;
- custom crypto;
- plaintext credential storage;
- frontend token integration;
- Redis-dependent authentication;
- WebSockets.

Django remains the authentication foundation.

---

# 30. DOCUMENTATION UPDATES

After successful implementation update:

- docs/phase_prompts/Phase_4_Task_4.1.md
- docs/phases/PHASE_04_STATUS.md
- docs/PROJECT_STATUS.md
- docs/CHANGELOG.md

Update:

- docs/API_CONTRACT.md
- docs/RBAC_PERMISSIONS.md

only where the approved authentication foundation changes their documented contract.

Record architectural decisions in:

`docs/DECISIONS.md`

---

# 31. DEFINITION OF DONE

Task 4.1 is complete only when:

1. authentication architecture is established;
2. Django authentication remains authoritative;
3. existing User model remains structurally sound;
4. password hashing uses Django security mechanisms;
5. token/JWT foundation is configured according to the approved architecture;
6. auth routing is established under `/api/v1/auth/`;
7. safe serializer boundaries exist;
8. environment-based secrets are configured;
9. no plaintext secrets are introduced;
10. exactly five ERP roles remain supported;
11. no full RBAC enforcement has leaked into 4.1;
12. frontend authentication has NOT been integrated;
13. backend tests pass;
14. frontend regression passes;
15. documentation is synchronized.

---

# 32. FINAL REPORT

Return:

## A. Prerequisite verification
## B. Authentication architecture
## C. User model state
## D. Password security
## E. Token/JWT foundation
## F. Authentication routing
## G. Serializers/services
## H. Security configuration
## I. Environment variables
## J. Tests
## K. Frontend regression
## L. Documentation
## M. Deviations/issues
## N. Scope confirmation

Explicitly confirm:

- login workflow NOT prematurely completed unless assigned;
- RBAC NOT implemented;
- frontend authentication NOT integrated;
- Phase 3 remains regression-free.

## Next Task

`PHASE 4 — TASK 4.2: Custom User & Login`