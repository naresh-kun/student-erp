# Phase 3 Task 3.1: Backend Foundation & Environment Specification

> **Phase**: Phase 3 (Backend Foundation + Database)  
> **Task**: Task 3.1 (Backend Foundation & Environment)  
> **Status**: IN PROGRESS  
> **Authoritative Scope**: Foundation only — no business models, no authentication, no RBAC, no frontend API integration.

---

## 1. Task Objective

Establish a clean, stable, and reproducible Django 5+ and Django REST Framework foundation ready for subsequent data modeling, migrations, and API implementations.

### In Scope
1. Python virtual environment setup (`backend/.venv`) and dependency installation from `backend/requirements/development.txt`.
2. Safe environment configuration with `backend/.env.example` and `python-dotenv` integration.
3. Database configuration supporting `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_URL`, and compatibility fallbacks.
4. Django project configuration check and registration of `common` (`CommonConfig`) and 11 domain apps.
5. DRF baseline configuration preservation (pagination, error formatting, authentication placeholders).
6. Unauthenticated health check endpoint at `GET /api/health/` with non-crashing database connectivity probe.
7. Development-friendly logging configuration.
8. WSGI and ASGI entry-point verification.
9. Backend test foundation with `backend/pytest.ini` and unit tests (`test_settings.py`, `test_apps.py`, `test_health.py`).
10. Container specification alignment with `backend/Dockerfile`.

### Strictly Out of Scope
- ERP domain business models (`Student`, `Parent`, `Faculty`, `Attendance`, `Marks`, `Timetable`, etc.).
- Authentication implementation (JWT login, refresh, sessions, password hashing).
- Authorization & RBAC enforcement.
- Frontend API consumption (Phase 2 frontend remains strictly on mock services).
- Django Channels WebSocket consumers and Redis realtime layers (Phase 6).
- Production security hardening (Phase 8).
