# PHASE 3 — TASK 3.5
# Migrations, Constraints & Seed Data

**Project:** Student ERP — Enterprise Educational Management System
**Phase:** 3 — Backend Foundation + Database
**Task:** 3.5 — Migrations, Constraints & Seed Data
**Status:** COMPLETED (Migrations, Constraints & Seed Data Verified)
**Prerequisites:** Task 3.2 signed off + Task 3.3 verified + Task 3.4 verified

---

# 1. TASK OBJECTIVE

Task 3.5 is the database hardening and reproducibility stage of Phase 3.

The objective is to take the concrete database layer established in:

- Task 3.3 — Core Database Models
- Task 3.4 — Attendance & Marks Database Layer

and verify that the resulting PostgreSQL schema is:

- migration-safe;
- structurally correct;
- protected by appropriate database constraints;
- correctly indexed;
- reproducible from an empty database;
- deterministic when seeded;
- compatible with the approved domain architecture.

This task is NOT intended to introduce a new business domain.

Its purpose is to harden the existing schema and establish controlled development/verification seed data.

---

# 2. MANDATORY DOCUMENTATION READ

Before modifying anything, read:

1. `docs/PROJECT_STRUCTURE.md`
2. `docs/ARCHITECTURE.md`
3. `docs/BACKEND_ARCHITECTURE.md`
4. `docs/DATABASE_SCHEMA.md`
5. `docs/API_CONTRACT.md`
6. `docs/RBAC_PERMISSIONS.md`
7. `docs/DEVELOPMENT_WORKFLOW.md`
8. `docs/TESTING_STRATEGY.md`
9. `docs/PROJECT_STATUS.md`
10. `docs/CHANGELOG.md`
11. `docs/DECISIONS.md`
12. `docs/phase_prompts/PHASE_03.md`
13. `docs/phase_prompts/Phase_3_Task_3.2.md`
14. `docs/phase_prompts/Phase_3_Task_3.3.md`
15. `docs/phase_prompts/Phase_3_Task_3.4.md`
16. `docs/phases/PHASE_03_STATUS.md`
17. This file.

Then inspect the actual repository before making assumptions.

---

# 3. PREREQUISITE GATE

Task 3.5 MUST NOT begin if:

- Task 3.2 architecture remains inconsistent;
- Task 3.3 core models are incomplete;
- Task 3.4 attendance/marks implementation is incomplete;
- existing migrations do not reflect the actual model state;
- Django system checks fail.

Run:

```bash
python manage.py check
python manage.py makemigrations --check