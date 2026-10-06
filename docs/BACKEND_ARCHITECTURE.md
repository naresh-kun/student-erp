# Backend Architecture Specification

> **Status**: Authoritative Backend Specification  
> **Tech Stack**: Python 3.11+, Django 5+, Django REST Framework, Django Channels, Redis, PostgreSQL  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. Modular Monolith Architecture

The backend adopts a **Modular Monolith** pattern. Rather than distributing business domains across complex microservices, all functionality resides within a single codebase under `backend/apps/`, bound by strict encapsulation rules.

```text
backend/
├── config/                       # Central application routing & configuration
│   ├── asgi.py                   # ASGI router for Channels / WebSockets
│   ├── settings.py               # Settings (database, cache, installed apps)
│   ├── urls.py                   # Root URL router mapping /api/v1/
│   └── wsgi.py                   # WSGI server entry point
├── apps/                         # Domain modules (isolated apps)
│   ├── accounts/                 # Custom User model, JWT, authentication, profiles
│   ├── students/                 # Student records, enrollment management
│   ├── academics/                # Academic years, classes, sections, subjects
│   ├── attendance/               # Session attendance records and bulk tracking
│   ├── marks/                    # Exams, grading criteria, mark sheets, GPA
│   ├── timetable/                # Schedules, period definitions, room allocations
│   ├── calendar/                 # Institutional calendar, academic events, holidays
│   ├── allocation/               # Student section allocation algorithms
│   ├── reports/                  # Aggregation queries, transcript generation
│   ├── notifications/            # Push alerts, WebSocket message dispatchers
│   ├── homework/                 # Homework domain, scope verification, communication
│   └── audit/                    # Immutable change telemetry and security logs
├── common/                       # Cross-cutting concerns & shared base classes
│   ├── models.py                 # TimeStampedModel, UUIDModel base classes
│   ├── permissions.py            # Reusable DRF RBAC permission classes
│   ├── pagination.py             # Standard pagination handlers
│   └── exceptions.py             # Global error response formatting
└── manage.py
```

---

## 2. Domain App Boundaries & Separation Rules

1. **No Circular Dependencies**: An app in `backend/apps/` may import models from another app only through explicit, unidirectional relationships.
2. **Fat Models / Thin Views / Dedicated Services**:
   - Complex business calculations (such as marks percentage derivation, student section allocation, or attendance percentage summaries) belong in dedicated service classes (`services.py` within each app), keeping DRF views lightweight.
3. **Common Utilities Isolation**: Any utility or base class used by two or more apps must reside in `backend/common/`.
4. **Phase 3 Staging Boundary**: Task 3.2 establishes app architecture, service layer scaffolding (`BaseService`), serializer contracts, and shared utilities. Concrete database models, relational schema constraints, and migrations belong strictly to Task 3.3.

---

## 3. Database Access & Persistence Strategy

- **ORM Usage**: All relational queries utilize Django's Object-Relational Mapper (ORM) with strict query optimization:
  - Mandatory use of `select_related()` for Foreign Key relationships (e.g. `attendance.student`, `section.class_teacher`) to avoid `N+1` query storms.
  - Mandatory use of `prefetch_related()` for Many-to-Many and reverse foreign key relationships (e.g. `classes.sections`, `subjects.faculty`).
- **Atomic Transactions**: Sensitive multi-table mutations (e.g., student enrollment with fee records and default attendance setup) are wrapped in `transaction.atomic()`.

---

## 4. Authentication, Authorization & RBAC

1. **Authentication**: Handled via `rest_framework_simplejwt`. 
   - Access tokens have short lifespans (15 minutes).
   - Refresh tokens (7 days) are rotated upon use and blacklisted on logout.
   - Authoritative login endpoint at `POST /api/v1/auth/login/` returning dual-compatibility envelope with safe user identity.
   - Current user profile context at `GET /api/v1/auth/me/` protected by `IsAuthenticated` and active account state.
2. **Authorization & RBAC Architecture**:
   - Canonical permission identifiers (`<domain>.<action>`) in `common.constants`.
   - Explicit 5-role matrix (`ROLE_PERMISSIONS_MATRIX`) in `common.authorization` with zero role inheritance.
   - Dynamic view and action dispatch via `HasRequiredPermission` and `view.permission_map`.
   - Database-level queryset scoping via `AuthorizationService.filter_queryset_for_user()` filtering list endpoints before DRF pagination and serialization.
   - Object-level ownership and assignment checks via `IsOwnerOrScopedAccess` and `check_object_permissions()` preventing horizontal privilege escalation across students, parents, and faculty assignments.
   - Mutation guardrails on POST/PATCH endpoints enforcing domain permissions, academic assignment checks, and administrative field protections.

---

## 5. Asynchronous Realtime Architecture (Channels & Redis)

When realtime alerts and instant updates are enabled:
1. **ASGI Entry Point**: `backend/config/asgi.py` routes incoming HTTP traffic to standard Django views, and WebSocket connections (`/ws/`) to `channels.routing.URLRouter`.
2. **Consumer Modules**: Reside in `apps/notifications/consumers.py`.
3. **Redis Channel Layer**: `channels_redis.core.RedisChannelLayer` is configured as the backing message broker. Broadcast messages from backend jobs or faculty triggers fan out to connected student and parent WebSocket groups with sub-10ms latency.

---

## 6. Audit Logging & Security Telemetry

Every mutating event (CREATE, UPDATE, DELETE) and significant security event (failed login, role change, grade modification) triggers an asynchronous signal captured by `apps/audit/`.
- **Recorded Payload**:
  - `user_id` / `actor`
  - `action_type`
  - `target_model` & `target_pk`
  - `old_values` (JSON snapshot prior to mutation)
  - `new_values` (JSON snapshot after mutation)
  - `ip_address` & `user_agent`
  - `timestamp`
- Audit tables are append-only. No application role (including Admin) has permission to delete or alter historical audit rows.

---

## 7. Teaching Scope, Assignment Invariants & Homework Domain (MOD_001)

1. **Faculty / Class Teacher Invariants**:
   - Faculty membership does **not** make someone a Class Teacher.
   - Cardinality: A Faculty member may be assigned as Class Teacher for **at most 1 section per Academic Year**.
   - Class Teacher assignment does **not** grant all-subject authority over that class.
2. **Authoritative Teaching Assignment (`TeachingAssignment`)**:
   - Model: `apps.academics.models.TeachingAssignment` enforces unique `(faculty, section, subject, academic_year)`.
   - Both Homework creation and Marks entry strictly derive faculty permissions from this authoritative relationship.
3. **Homework Domain Service (`HomeworkService`)**:
   - Resides in `apps/homework/services.py`.
   - Enforces teaching assignment verification prior to persistence.
   - Creator identity is derived server-side from `request.user.faculty_profile`, rejecting payload spoofing.
   - Scopes list queries before DRF pagination (drafts hidden from students and parents).
   - Enforces object-level mutation permissions (authors and admin only).
