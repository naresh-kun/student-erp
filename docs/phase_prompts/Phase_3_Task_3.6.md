# PHASE 3 — TASK 3.6
# Initial REST API Foundation

**Project:** Student ERP — Enterprise Educational Management System
**Phase:** 3 — Backend Foundation + Database
**Task:** 3.6 — Initial REST API Foundation
**Status:** **COMPLETED**
**Prerequisites:** Task 3.2 signed off + Task 3.3 verified + Task 3.4 verified + Task 3.5 verified

---

# 1. TASK OBJECTIVE

Task 3.6 establishes the first production-oriented REST API foundation for the Student ERP backend.

The goal is to expose the stable Django domain/database layer through a clean, versioned, documented, testable REST boundary.

The implementation must establish:

- API versioning;
- URL routing;
- serializer architecture;
- API views/viewsets where appropriate;
- request validation;
- response formatting;
- error handling;
- pagination;
- basic filtering/query behavior where explicitly documented;
- API test architecture;
- initial endpoint coverage defined by the authoritative API contract.

The API must remain compatible with the existing frontend service architecture.

The frontend must NOT be switched from mock services to backend APIs in Task 3.6.

That integration belongs to the later ERP API integration phase.

---

# 2. MANDATORY DOCUMENTATION READ

Before modifying ANY code, read:

1. `docs/PROJECT_STRUCTURE.md`
2. `docs/ARCHITECTURE.md`
3. `docs/BACKEND_ARCHITECTURE.md`
4. `docs/DATABASE_SCHEMA.md`
5. `docs/API_CONTRACT.md`
6. `docs/RBAC_PERMISSIONS.md`
7. `docs/FRONTEND_ARCHITECTURE.md`
8. `docs/DEVELOPMENT_WORKFLOW.md`
9. `docs/TESTING_STRATEGY.md`
10. `docs/PROJECT_STATUS.md`
11. `docs/CHANGELOG.md`
12. `docs/DECISIONS.md`
13. `docs/phase_prompts/PHASE_03.md`
14. `docs/phase_prompts/Phase_3_Task_3.3.md`
15. `docs/phase_prompts/Phase_3_Task_3.4.md`
16. `docs/phase_prompts/Phase_3_Task_3.5.md`
17. `docs/phases/PHASE_03_STATUS.md`
18. This file.

Then inspect the actual repository.

Documentation must be treated as authoritative.

Do not invent API endpoints simply because a database model exists.

---

# 3. PREREQUISITE GATE

Task 3.6 MUST NOT begin if:

- database migrations are inconsistent;
- `makemigrations --check` fails unexpectedly;
- required Task 3.3/3.4 models are missing;
- Task 3.5 database hardening has unresolved issues;
- Django system checks fail.

At minimum verify:

```bash
python manage.py check
python manage.py makemigrations --check
python manage.py showmigrations
pytest -q