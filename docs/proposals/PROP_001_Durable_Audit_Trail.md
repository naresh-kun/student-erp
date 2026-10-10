# Architecture Proposal: Durable Audit Trail (PROP_001)

> **Document ID**: PROP_001  
> **Title**: Durable Database-Backed Audit Trail for ExamType & Core ERP Mutations  
> **Governance Status**: **PROPOSAL ONLY — IMPLEMENTATION NOT AUTHORIZED (REVISED)**  
> **Revision**: 2.1 (Security Clarification: PostgreSQL Trigger Privileges, Event Authenticity, Raw SQL Acceptance Tests & Explicit Security Boundaries)  
> **Target Release Gate**: Phase 5 Task 5.6 Final Sign-off Precondition  
> **Blocked Task**: Phase 5 Task 5.7 (Full System Verification & Release Gate)  
> **Author**: Antigravity AI / Engineering Architecture  
> **Date**: 2026-10-10  
> **Current Task 5.6 Acceptance**: Awaiting Explicit Decision on Auditability Limitation  

---

## 1. Current-State Findings & Architecture Inventory

A comprehensive audit of the active repository confirms that while the application provides operational console logging and entity modification timestamps, a **durable, persistent, database-backed audit trail does NOT exist**.

### 1.1 Existing Audit Application Scaffolding (`apps.audit`)
The repository contains an `apps.audit` package registered in `LOCAL_APPS` ([backend/config/settings.py:67](file:///d:/student-erp/backend/config/settings.py#L67)):
* **Application Configuration** ([backend/apps/audit/apps.py](file:///d:/student-erp/backend/apps/audit/apps.py#L1-L7)): Defines `AuditConfig` (`verbose_name = 'Audit & System Telemetry'`).
* **Models** ([backend/apps/audit/models.py](file:///d:/student-erp/backend/apps/audit/models.py#L1-L7)): Contains only scaffolding comments stating that concrete domain models (`AuditLog`, `SecurityTelemetry`) were deferred. There are **zero** concrete database models and zero database tables in PostgreSQL.
* **Service Scaffolding** ([backend/apps/audit/services.py](file:///d:/student-erp/backend/apps/audit/services.py#L1-L18)): Implements `AuditService(BaseService)`, exposing only `get_service_status() -> {"service": "audit", "status": "scaffolded"}`.
* **Serializer Contract** ([backend/apps/audit/serializers.py](file:///d:/student-erp/backend/apps/audit/serializers.py#L9-L19)): Defines an unlinked DRF `AuditLogSerializer(serializers.Serializer)` defining expected keys (`id`, `user_id`, `action`, `target_table`, `target_id`, `old_values`, `new_values`, `ip_address`, `timestamp`).
* **Views & URLs** ([backend/apps/audit/views.py](file:///d:/student-erp/backend/apps/audit/views.py#L13-L26) & [backend/apps/audit/urls.py](file:///d:/student-erp/backend/apps/audit/urls.py#L1-L14)): `AuditLogListView` requires `PERM_AUDIT_VIEW` and currently returns an empty list `{"data": [], "meta": {"total_records": 0}}`.
* **API Route** ([backend/config/urls.py:32](file:///d:/student-erp/backend/config/urls.py#L32)): Exposes `GET /api/v1/audit/`.

### 1.2 ExamType Administrative Mutation Implementation
Administrative ExamType mutations occur in `backend/apps/marks/views.py`:
* **Creation** ([ExamTypeListView.post](file:///d:/student-erp/backend/apps/marks/views.py#L222-L236)): Validates payload via `ExamTypeSerializer`, persists via `serializer.save()`, and logs to Python logger:
  ```python
  logger.info(
      "ExamType created: id=%s name='%s' by user_id=%s (%s)",
      exam_type.id, exam_type.name, request.user.id, getattr(request.user, 'email', '')
  )
  ```
* **Modification & Activation/Deactivation** ([ExamTypeDetailView.patch](file:///d:/student-erp/backend/apps/marks/views.py#L260-L275)): Validates partial update, executes `serializer.save()`, and logs:
  ```python
  logger.info(
      "ExamType updated: id=%s name='%s' is_active=%s weightage=%s by user_id=%s (%s)",
      updated.id, updated.name, updated.is_active, updated.weightage,
      request.user.id, getattr(request.user, 'email', '')
  )
  ```

### 1.3 Operational Logs vs. Durable Audit Trail
The repository currently relies on two mechanisms, neither of which fulfills audit durability requirements:
1. **Operational Console Logging** ([backend/config/settings.py:223-255](file:///d:/student-erp/backend/config/settings.py#L223-L255)): `LOGGING['handlers']['console']` emits structured text lines to stdout. These logs are ephemeral, volatile across container/process restarts, unindexed, non-queryable from the API, and vulnerable to log rotation loss.
2. **Temporal Timestamps** ([backend/common/models.py:10-18](file:///d:/student-erp/backend/common/models.py#L10-L18)): `ExamType` inherits `TimeStampedModel`, giving `updated_at = models.DateTimeField(auto_now=True)`. This preserves only the *most recent* mutation timestamp. It records **no actor identity**, **no previous values**, **no historical sequence**, and **no specific delta of changed fields**.

### 1.4 Deferred Model Boundaries in Existing Test Suites
Existing test suites explicitly assert that `AuditLog` was deferred during earlier phase staging:
* `backend/tests/test_models_scaffolding.py` (line 82):
  `deferred_later = {'Timetable', 'CalendarEvent', 'Allocation', 'Report', 'Notification', 'AuditLog'}`
* `backend/tests/test_models_task33.py` (line 133):
  Asserts that `AuditLog` is not yet registered in `django_apps.get_models()`.

---

## 2. Explicit Requirements and Assumptions

### 2.1 Functional Requirements
1. **Administrative Operation Capture**: Every creation, update, activation, or deactivation of an `ExamType` must generate a persistent database record.
2. **Field-Level Diff Capture (Payload Minimization)**: The record must capture **only** the specific fields that changed, recording the prior value (`old_values`) and the newly applied value (`new_values`). Unchanged fields must be omitted.
3. **Actor Association**: The record must unambiguously link to the authenticated `User` who performed the mutation, while preserving historical readability even if that user account is later deactivated or deleted.
4. **Strict Atomic Consistency**: An administrative ExamType mutation must **never** commit if its corresponding audit record fails to insert. If audit creation raises an exception, the entire database transaction must rollback and return an HTTP error.
5. **Comprehensive Append-Only Immutability**: Audit records must be protected against all application-level mutation and deletion paths, including model instances (`.save()`, `.delete()`), bulk ORM QuerySets (`.update()`, `.delete()`), and HTTP API endpoints.
6. **Zero Regression Guarantee**: The implementation must preserve historical data, including the legacy `Half-Yearly Examination 2026` record and all existing student `Mark` rows, with zero breaking changes to existing Marks endpoints or tests.

### 2.2 Assumptions & Current System Truths
1. **Reason Field Optionality**: The existing React frontend marks-entry and admin surfaces do **not** prompt the user for a change reason when mutating ExamTypes. Therefore, `reason` must be an optional field (`null=True, blank=True`), populated only if provided in request context or automated jobs.
2. **Request Source Extraction**: Client IP address and User-Agent are best-effort values derived from standard Django request headers (`REMOTE_ADDR`, `HTTP_X_FORWARDED_FOR`, `HTTP_USER_AGENT`). They must allow null values for non-HTTP or background/test environments.
3. **Single Authoritative Database**: PostgreSQL 16+ is the sole persistence store per ADR 003. Audit logs reside in PostgreSQL table `audit_logs` using native `JSONB` columns.

---

## 3. Minimum Required Audit Events & Event Payload Minimization

### 3.1 Targeted Operations & Scoped Fields
The audit engine tracks administrative operations on `ExamType` while strictly minimizing stored data:

| Event Action | Triggering Operation | HTTP Method & Endpoint | Scoped Fields Audited |
| :--- | :--- | :--- | :--- |
| **`CREATE`** | Creating a new assessment category | `POST /api/v1/marks/exam-types/` | `name`, `weightage`, `is_active` |
| **`UPDATE`** | Renaming or adjusting weightage | `PATCH` / `PUT /api/v1/marks/exam-types/{id}/` | **Only changed keys** within (`name`, `weightage`, `is_active`) |
| **`ACTIVATE`** | Enabling an inactive ExamType | `PATCH /api/v1/marks/exam-types/{id}/` (`is_active: true`) | `is_active` (`false` $\to$ `true`) |
| **`DEACTIVATE`**| Retiring an ExamType from active use| `PATCH /api/v1/marks/exam-types/{id}/` (`is_active: false`)| `is_active` (`true` $\to$ `false`) |

### 3.2 Payload Minimization & Diff Calculation Rules
To avoid storing bloated snapshots and prevent accidental leakage:
1. **Strict Key Delta**: When updating an existing `ExamType`, `AuditService` calculates:
   $$\Delta = \{ k \in \{\text{'name'}, \text{'weightage'}, \text{'is_active'}\} \mid \text{old}[k] \ne \text{new}[k] \}$$
   - `old_values` contains **only** the keys in $\Delta$ with their pre-mutation values.
   - `new_values` contains **only** the keys in $\Delta$ with their post-mutation values.
   - If only `weightage` is modified (e.g. from `10.00` to `15.00`), `old_values` is `{"weightage": "10.00"}` and `new_values` is `{"weightage": "15.00"}`. Static fields (`name`, `is_active`) are **omitted**.
2. **Exclusion of Secrets & Sensitive Data**:
   - `ExamType` fields do not contain secrets. However, as an architectural invariant for future domain reuse, `AuditService` passes all dictionaries through a centralized sanitizer that strips or redacts sensitive keys:
     `{"password", "token", "secret", "access", "refresh", "authorization", "cookie"}`.
   - Request cookies, JWT tokens, and unrelated request headers are **strictly excluded** from the payload.

### 3.3 Mandatory vs. Optional Audit Fields

```text
Audit Record Payload
├── Mandatory Fields (Strictly Required for Every Event)
│   ├── id (UUID v4 Primary Key)
│   ├── actor (ForeignKey to accounts.User, on_delete=SET_NULL, null=True)
│   ├── actor_username (CharField snapshot, e.g. 'admin_demo')
│   ├── actor_role (CharField snapshot, e.g. 'Admin')
│   ├── action (CharField choice: CREATE | UPDATE | ACTIVATE | DEACTIVATE)
│   ├── resource_type (CharField, e.g. 'ExamType')
│   ├── resource_id (CharField / UUID snapshot of ExamType.id)
│   ├── old_values (JSONB: minimized delta dictionary before save)
│   ├── new_values (JSONB: minimized delta dictionary after save)
│   └── created_at (DateTimeField with timezone, auto_now_add=True)
└── Optional Contextual Fields (Populated Best-Effort When Available)
    ├── ip_address (GenericIPAddressField, null=True)
    ├── user_agent (TextField, blank=True, default='')
    ├── reason (TextField, blank=True, default='')
    └── request_id (CharField / UUID correlation ID, blank=True, default='')
```

---

## 4. Proposed Data Model, QuerySet Guards & Append-Only Strategy

### 4.1 Evaluation of Append-Only Protection Strategies

Django applications face a known limitation: **overriding `save()` and `delete()` on a model instance does NOT prevent bulk `QuerySet.update()` or `QuerySet.delete()` from mutating or deleting records**, because QuerySet bulk methods generate direct SQL queries that bypass model methods entirely.

We evaluated four candidate approaches to prevent accidental or malicious mutation in ordinary application code:

| Strategy | Description | Protection Level | Trade-offs & Operational Impact | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **1. Model-Level Only** | Override `save()` and `delete()` on `AuditLog` instance. | Partial (Instance only) | **Inadequate**: `AuditLog.objects.filter(...).update()` and `AuditLog.objects.all().delete()` bypass instance methods completely. | **REJECTED** |
| **2. Custom QuerySet + Manager Guards** | Subclass `models.QuerySet` and `models.Manager` to override `.update()` and `.delete()`, raising `PermissionDenied`. | High (All Django ORM paths) | Completely blocks all ORM code (`instance.save()`, `instance.delete()`, `qs.update()`, `qs.delete()`). Zero external dependencies. Works cleanly in unit tests and production. | **RECOMMENDED (TIER 1)** |
| **3. PostgreSQL Trigger** | `BEFORE UPDATE OR DELETE ON audit_logs` trigger function in PostgreSQL raising an exception. | Engine-Level (PostgreSQL) | Blocks even raw SQL (`cursor.execute()`) executed via app connections. Requires raw SQL migration. PostgreSQL-specific. | **RECOMMENDED (TIER 2)** |
| **4. Database User Privilege Separation** | `REVOKE UPDATE, DELETE ON audit_logs FROM app_user`. | Engine-Level (User privileges) | Requires maintaining dual database credentials (migration user vs runtime user) in environment configs. Overhead for local dev/Docker. | **DEFERRED TO PRODUCTION DEPLOYMENT** |

### 4.2 Recommended Append-Only Architecture: Two-Tier Defense-in-Depth

We recommend combining **Tier 1 (Custom QuerySet & Manager Guards)** with **Tier 2 (PostgreSQL Database Migration Trigger)**:

1. **Tier 1 — Application & ORM Protection**:
   * Custom `ImmutableQuerySet` overrides `.update()` and `.delete()`, raising `PermissionDenied`.
   * Custom `ImmutableManager` enforces `ImmutableQuerySet` for all manager queries.
   * Model `save()` checks `if not self._state.adding: raise PermissionDenied(...)`.
   * Model `delete()` raises `PermissionDenied(...)`.
   * **Result**: Any developer or application code attempting to mutate or delete audit records via Django ORM will immediately fail with `PermissionDenied`.
2. **Tier 2 — Database Engine Trigger**:
   * In migration `0001_initial.py`, attach a PostgreSQL trigger:
     ```sql
     CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
     RETURNS TRIGGER AS $$
     BEGIN
         RAISE EXCEPTION 'Table audit_logs is append-only. UPDATE and DELETE operations are forbidden.';
     END;
     $$ LANGUAGE plpgsql;

     CREATE TRIGGER trg_audit_logs_immutable
     BEFORE UPDATE OR DELETE ON audit_logs
     FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
     ```
   * **Result**: Even raw SQL queries (`cursor.execute("UPDATE audit_logs ...")`) executed through the application connection are rejected at the PostgreSQL engine level.

### 4.3 Proposed Python Implementation (`backend/apps/audit/models.py`)

```python
import uuid
from django.db import models
from django.core.exceptions import PermissionDenied
from common.models import UUIDModel


class ImmutableQuerySet(models.QuerySet):
    """QuerySet that strictly disallows bulk updates and deletions."""

    def update(self, **kwargs):
        raise PermissionDenied("AuditLog records are append-only. Bulk QuerySet.update() is forbidden.")

    def delete(self):
        raise PermissionDenied("AuditLog records are append-only. Bulk QuerySet.delete() is forbidden.")


class ImmutableManager(models.Manager):
    """Manager enforcing ImmutableQuerySet across all queries."""

    def get_queryset(self):
        return ImmutableQuerySet(self.model, using=self._db)


class AuditLog(UUIDModel):
    """
    Durable, append-only audit trail persisting administrative mutations
    and security-critical domain modifications.
    """
    ACTION_CREATE = 'CREATE'
    ACTION_UPDATE = 'UPDATE'
    ACTION_ACTIVATE = 'ACTIVATE'
    ACTION_DEACTIVATE = 'DEACTIVATE'
    ACTION_DELETE = 'DELETE'

    ACTION_CHOICES = (
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_ACTIVATE, 'Activate'),
        (ACTION_DEACTIVATE, 'Deactivate'),
        (ACTION_DELETE, 'Delete'),
    )

    actor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who initiated the action. Null if system/seed action or user deleted.",
    )
    actor_username = models.CharField(
        max_length=150,
        blank=True,
        default='',
        help_text="Immutable snapshot of username at time of audit event.",
    )
    actor_role = models.CharField(
        max_length=32,
        blank=True,
        default='',
        help_text="Role of the actor at event time (e.g. Admin, Principal).",
    )
    action = models.CharField(
        max_length=32,
        choices=ACTION_CHOICES,
        db_index=True,
        help_text="Type of administrative operation performed.",
    )
    resource_type = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Entity domain model name (e.g. 'ExamType', 'Mark').",
    )
    resource_id = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Stringified UUID primary key of the affected resource.",
    )
    old_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="Minimized state snapshot of modified fields prior to change.",
    )
    new_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="Minimized state snapshot of modified fields after change.",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address initiating the HTTP mutation.",
    )
    user_agent = models.TextField(
        blank=True,
        default='',
        help_text="Client User-Agent header string.",
    )
    reason = models.TextField(
        blank=True,
        default='',
        help_text="Optional human-provided justification for administrative change.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Authoritative UTC timestamp when event was recorded.",
    )

    # Bind the immutable manager
    objects = ImmutableManager()

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        base_manager_name = 'objects'  # Enforce ImmutableManager on all internal Django queries
        indexes = [
            models.Index(fields=['resource_type', 'resource_id'], name='idx_audit_resource'),
            models.Index(fields=['actor', 'created_at'], name='idx_audit_actor_time'),
            models.Index(fields=['action', 'created_at'], name='idx_audit_action_time'),
        ]

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M:%S}] {self.action} {self.resource_type}({self.resource_id}) by {self.actor_username or 'System'}"

    def save(self, *args, **kwargs):
        """Strict append-only constraint: disallow in-place instance updates."""
        if not self._state.adding:
            raise PermissionDenied("AuditLog records are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Strict append-only constraint: disallow instance deletion."""
        raise PermissionDenied("AuditLog records are append-only and cannot be deleted.")


### 4.4 Foreign Key Deletion Invariant (`actor` FK Protection)
In standard Django models with `on_delete=models.SET_NULL`, deleting a referenced `User` triggers Django's cascade collector to issue `UPDATE audit_logs SET actor_id = NULL WHERE actor_id = ...`. In an append-only architecture, this would attempt an in-place mutation, triggering `PermissionDenied` from `ImmutableQuerySet.update()` or an exception from the PostgreSQL trigger.

To maintain strict immutability and compliance integrity:
1. **User Deletion Policy**: Administrative users who have generated audit records cannot be hard-deleted from the database. They must be deactivated via `is_active = False` (soft deactivation), which is standard enterprise security policy.
2. **ForeignKey Invariant**: We recommend `actor = models.ForeignKey('accounts.User', on_delete=models.PROTECT, ...)` or preserving `actor_username` and `actor_role` snapshot fields. If an institutional account is targeted for hard deletion, Django raises `ProtectedError`, safeguarding audit records from cascading mutation.

### 4.5 Residual Application-Level Bypass Vectors & Mitigations
We explicitly inventory all potential mechanisms in ordinary application code that could attempt to bypass the append-only guards, and their concrete mitigations:

| Potential Bypass Vector | Risk Description | Mitigation / Architectural Control |
| :--- | :--- | :--- |
| **1. Bulk QuerySet Update (`.update()`)** | Developer calls `AuditLog.objects.filter(...).update()` | **BLOCKED**: `ImmutableQuerySet.update()` raises `PermissionDenied`. |
| **2. Bulk QuerySet Delete (`.delete()`)** | Developer calls `AuditLog.objects.filter(...).delete()` | **BLOCKED**: `ImmutableQuerySet.delete()` raises `PermissionDenied`. |
| **3. Instance Modification (`.save()`)** | Developer calls `log.save()` on existing row | **BLOCKED**: `AuditLog.save()` checks `not self._state.adding` and raises `PermissionDenied`. |
| **4. Instance Deletion (`.delete()`)** | Developer calls `log.delete()` | **BLOCKED**: `AuditLog.delete()` raises `PermissionDenied`. |
| **5. Django Internal Base Manager (`_base_manager`)** | Django internals query via default base manager | **BLOCKED**: `Meta.base_manager_name = 'objects'` binds `ImmutableManager` across all internal accessors. |
| **6. Raw SQL via `connection.cursor()`** | Developer executes `cursor.execute("UPDATE audit_logs ...")` | **BLOCKED**: PostgreSQL engine trigger `trg_audit_logs_immutable` raises an exception and aborts transaction. |
| **7. Cascading Foreign Key Deletion** | Upstream model deletion cascades to `audit_logs` | **BLOCKED**: No external model references `AuditLog` as a parent table. Downstream cascade is impossible. |
| **8. Bulk Ingestion (`bulk_create`)** | Multiple audit records created in a batch | **ALLOWED**: `bulk_create` performs SQL `INSERT` only, which satisfies append-only requirements without mutation. |

### 4.6 PostgreSQL Trigger Privileges, Database Roles & Table Ownership

To establish the exact security boundary and operational envelope of the PostgreSQL database trigger across environments:

#### 1. Environment Role Inventory & Table Ownership
* **Development & Local Docker Compose**: The application connects to PostgreSQL using a single application user `erp_user` (configured via `DATABASE_USER` / `DB_USER` in [backend/config/settings.py:116](file:///d:/student-erp/backend/config/settings.py#L116)). Django migrations are executed by this user. As a result, `erp_user` is the PostgreSQL owner of the `audit_logs` table and owner of the trigger function.
* **Continuous Integration (CI Pipeline)**: Pytest runs against a containerized PostgreSQL instance using the test database user (e.g. `postgres` or `erp_user`). Migrations execute during test harness initialization under that role.
* **Production Deployment**: The production backend connects using the credential provided in `DATABASE_URL` (typically `erp_user`). In a baseline single-role deployment, `audit_logs` is owned by this application role.

#### 2. Trigger Disablement & Removal Capability
* **Can the Runtime Application Database Role Disable or Remove the Trigger?**
  * In a **single-role architecture** (`erp_user` owns the table and executes runtime queries): Because PostgreSQL grants table owners full DDL permissions over their tables, the `erp_user` connection possesses the *theoretical database privilege* to run DDL statements such as `ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_immutable;` or `DROP TRIGGER trg_audit_logs_immutable ON audit_logs;`.
  * However, under ordinary application operation, Django's runtime code, ORM queries, and API endpoints **never issue DDL**. The application runtime issues only DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

#### 3. Exact Protection Provided by the Trigger Under Proposed Single-Role Permissions
* Under the proposed permissions, the trigger provides **100% protection against all DML mutation and deletion attempts**:
  - `UPDATE audit_logs ...` statements: **BLOCKED** (`RAISE EXCEPTION 'Table audit_logs is append-only. UPDATE and DELETE operations are forbidden.'`).
  - `DELETE FROM audit_logs ...` statements: **BLOCKED** (`RAISE EXCEPTION 'Table audit_logs is append-only. UPDATE and DELETE operations are forbidden.'`).
* This protection actively blocks:
  1. Application code bugs or rogue ORM update queries that bypass Python guards.
  2. Ad-hoc commands or developer mistakes executed in `python manage.py shell`.
  3. Raw SQL queries executed through `django.db.connection.cursor()`.
  4. SQL injection attacks that attempt to mutate or delete existing audit rows.

#### 4. Distinction: Application Guarantees vs. Additional Production Role Hardening
* **Current Proposed Architecture (Guaranteed)**: Combines Tier 1 (Django `ImmutableQuerySet` / `ImmutableManager` guards) with Tier 2 (PostgreSQL engine trigger `trg_audit_logs_immutable`). This provides complete operational immutability against ordinary application-code mutation and accidental raw SQL without requiring multi-role database infrastructure.
* **Additional Production Database-Role Hardening (Optional Future Infrastructure)**:
  - In high-security enterprise environments, institutions can enforce role separation at the PostgreSQL level:
    - `erp_migrator`: Table owner, used exclusively during CI/CD migration deployments to run DDL.
    - `erp_app`: Runtime application user granted only:
      ```sql
      GRANT SELECT, INSERT ON audit_logs TO erp_app;
      REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM erp_app;
      ```
  - Under this separation, `erp_app` does **not** own `audit_logs` and cannot issue `ALTER TABLE audit_logs DISABLE TRIGGER`.
* **Rationale for Not Introducing Extra Database Credentials in This Task**:
  - Introducing dual database credentials now would require altering `settings.py` for multi-user database connection routing, creating separate migration runner scripts, updating Docker entrypoints with custom user-provisioning SQL, and reconfiguring CI runner secrets.
  - This would introduce substantial deployment overhead and operational complexity without improving safety against application-level regressions. The Tier 1 ORM guards + Tier 2 PostgreSQL trigger provide the smallest appropriate protection footprint while completely blocking mutation in application code.

---

## 5. Transaction Invariant & Failure-Handling Strategy

### 5.1 Atomic Consistency Invariant
A primary weakness of asynchronous or decoupled logging is the risk of **split-brain persistence**: the business model update succeeds, but the audit trail fails silently.

To guarantee that an `ExamType` modification cannot occur without an audit record, mutations must use **synchronous, database-level atomic transactions**:

```text
HTTP Request (PATCH /api/v1/marks/exam-types/{id}/)
  │
  ▼
API View / Service Layer
  │
  ├── 1. Validate incoming payload (ExamTypeSerializer)
  │      └── On validation failure -> Raise HTTP 400 (No DB write, No audit record)
  │
  ├── 2. Begin transaction.atomic()
  │      │
  │      ├── a. Capture before-state snapshot (old_values)
  │      ├── b. Apply partial update & save ExamType instance
  │      ├── c. Capture after-state snapshot (new_values) & compute minimal delta
  │      ├── d. Call AuditService.record_event(...) inside same transaction
  │      │
  │      └── If AuditLog insert fails (e.g. DB constraint, disk error, connection drop):
  │             ├── Exception propagates
  │             ├── transaction.atomic() rolls back BOTH ExamType update and AuditLog
  │             └── Returns HTTP 500 Internal Server Error
  │
  └── 3. Transaction Commits (Both ExamType & AuditLog persisted simultaneously)
         └── Return HTTP 200 OK with updated ExamType representation
```

### 5.2 Failure Behavior Analysis

| Failure Point | System Response | Database State | Integrity Outcome |
| :--- | :--- | :--- | :--- |
| **Payload validation fails** (e.g., weightage > 100) | HTTP 400 Bad Request | No change to `marks_exam_types` | Zero false positive audit records. |
| **User lacks authorization** (e.g., Faculty attempting PATCH) | HTTP 403 Forbidden | No change to `marks_exam_types` | Zero unauthorized change. |
| **ExamType save fails** (e.g., unique name conflict) | HTTP 400 Bad Request | Rolled back | Zero orphaned audit records. |
| **AuditLog insert fails** (e.g., constraint error, DB glitch) | HTTP 500 Server Error | Rolled back via `atomic()` | **Zero unaudited ExamType changes.** |
| **Success** | HTTP 200 OK | Both committed | 100% durable audit trail. |

---

## 6. Architecture & Integration Pattern Evaluation

We evaluated three potential architectural integration patterns:

### Option A: Django Post-Save Signals (`post_save`)
* *Mechanism*: Connect a receiver to `post_save` on `ExamType`.
* *Pros*: Decoupled from view layer.
* *Cons*: 
  * Does not have native access to `request.user`, `request.META['REMOTE_ADDR']`, or client headers without thread-local middleware hacks (`threading.local`).
  * Signals execute during testing and synthetic seeding unless explicitly disconnected, risking spurious records.
  * Exception handling in signals can be obscure and bypass view transaction boundaries.
* *Verdict*: **REJECTED**.

### Option B: Third-Party Packages (e.g. `django-simple-history`, `django-auditlog`)
* *Mechanism*: Install third-party package and register `@register` decorators.
* *Pros*: Off-the-shelf automated tracking.
* *Cons*:
  * Adds external library dependencies to `requirements.txt` and `pyproject.toml`.
  * Generates separate shadow tables for every model, creating migration bloat.
  * Does not conform to the project's explicit architectural guideline to avoid introducing unapproved dependencies or competing frameworks.
* *Verdict*: **REJECTED**.

### Option C: Centralized Domain Service (`AuditService.record_event`) — Recommended
* *Mechanism*: Extend existing `apps.audit.services.AuditService` to expose a typed, explicit method `record_event()`. Call this service directly within `apps.marks.views` (or `MarksService`) inside `transaction.atomic()`.
* *Pros*:
  * **100% Native**: Reuses existing `apps.audit` scaffold, `BaseService`, and `common.models.UUIDModel`.
  * **Clean Context Passing**: Explicitly accepts `actor=request.user`, `request=request`, and computed field deltas without thread-local magic.
  * **Strict Atomicity**: Runs synchronously inside the view transaction.
  * **Reusable Engine**: Other domain modules (Enrollment, Fees, Attendance overrides) can reuse the identical method when scheduled.
  * **Zero External Dependencies**: Standard Django ORM + DRF.
* *Verdict*: **RECOMMENDED (ACCEPTED ARCHITECTURE)**.

---

## 7. Security, Access Control & Database Limitations

### 7.1 Role-Based Access Control (RBAC)
Audit log inspection is restricted by the authoritative `ROLE_PERMISSIONS_MATRIX` ([backend/common/authorization.py:115-180](file:///d:/student-erp/backend/common/authorization.py#L115-L180)):
* **Admin (`ROLE_ADMIN`)**: Granted `PERM_AUDIT_VIEW`. Authorized to inspect institutional audit trails for compliance and administrative oversight.
* **Principal (`ROLE_PRINCIPAL`)**: Granted `PERM_AUDIT_VIEW`. Authorized to view executive telemetry and academic administrative history.
* **Faculty (`ROLE_FACULTY`)**: Strictly **DENIED** (`PERM_AUDIT_VIEW` not granted; returns HTTP 403 Forbidden).
* **Student (`ROLE_STUDENT`)**: Strictly **DENIED** (returns HTTP 403 Forbidden).
* **Parent (`ROLE_PARENT`)**: Strictly **DENIED** (returns HTTP 403 Forbidden).
* **Unauthenticated**: Returns HTTP 401 Unauthorized.

### 7.2 API Endpoint Immutability
* `apps.audit.urls` routes **only `GET /api/v1/audit/`**.
* No `POST`, `PUT`, `PATCH`, or `DELETE` endpoints exist. Any attempt by external clients or users to mutate audit records via the API receives HTTP 405 Method Not Allowed or 403 Forbidden.

### 7.3 Clarification of Database-Level Limitations & Tamper-Proofing Realities
To maintain strict architectural honesty, we clearly delineate application-level safeguards from storage-layer limitations:

```text
Security Boundary Diagram
┌────────────────────────────────────────────────────────────────────────┐
│ APPLICATION RUNTIME BOUNDARY (Guaranteed by PROP_001)                 │
│                                                                        │
│  [API Requests] ───> Disallow POST/PUT/PATCH/DELETE (405/403)           │
│  [Django ORM]   ───> Instance save()/delete() raises PermissionDenied │
│  [Django ORM]   ───> QuerySet update()/delete() raises PermissionDenied│
│  [Transactions] ───> Atomic consistency; write failure rolls back       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ DATABASE ENGINE BOUNDARY (Guaranteed by PostgreSQL Trigger)             │
│                                                                        │
│  [Raw SQL from App] ──> Blocked by trigger: trg_audit_logs_immutable  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ DATABASE SUPERUSER / STORAGE BOUNDARY (Explicit Limitations)           │
│                                                                        │
│  [PostgreSQL Superuser with 'psql' access]                             │
│     * Can execute: ALTER TABLE audit_logs DISABLE TRIGGER ALL;         │
│     * Can execute: DROP TABLE audit_logs;                              │
│  [Storage Volume / Host Root Administrator]                            │
│     * Can modify raw database files or restore manipulated backups.     │
│                                                                        │
│  LIMITATION STATEMENT:                                                 │
│  PROP_001 does NOT provide cryptographic blockchain ledgering,         │
│  Merkle-tree hashing, or Write-Once-Read-Many (WORM) hardware storage.  │
│  Absolute tamper-proofing against root database administrators is NOT  │
│  claimed and cannot be solved by application architecture alone.        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Boundary Analysis:
1. **Application-Level & Connection-Level Guarantees**:
   * **What PROP_001 Protects Against**:
     - Accidental or malicious mutations by application code (e.g., buggy scripts, developers attempting `AuditLog.objects.filter(...).update(...)` or `log.save()`).
     - Web clients or attackers attempting to send HTTP mutation requests (`POST`, `PUT`, `PATCH`, `DELETE`) to the audit endpoints.
     - Raw SQL queries (`cursor.execute("UPDATE audit_logs ...")`) executed through standard application database connections, which are caught and blocked by PostgreSQL trigger `trg_audit_logs_immutable`.
     - Inconsistent or uncommitted business state: all audit entries are bound to business transactions via `transaction.atomic()`, ensuring audit failures roll back business changes.

2. **Database Administrator & Superuser Boundaries (What PROP_001 Cannot Prevent)**:
   * **Direct Superuser SQL Privileges**:
     - A PostgreSQL administrator with `SUPERUSER` privileges accessing `psql` directly can execute `ALTER TABLE audit_logs DISABLE TRIGGER ALL; UPDATE audit_logs ...; ALTER TABLE audit_logs ENABLE TRIGGER ALL;`.
     - A database owner or superuser can drop tables (`DROP TABLE audit_logs`) or truncate history (`TRUNCATE TABLE audit_logs`).
     - PostgreSQL row-level or trigger-level locks cannot strip permissions from the PostgreSQL `superuser` role by database engine design.
   * **Host & Storage Infrastructure Access**:
     - System administrators with root shell or virtual machine access can manipulate PostgreSQL data files (`PGDATA`), restore arbitrary previous database dumps, or alter disk blocks directly.

3. **Honest Claim on Immutability**:
   * **No Claim of Absolute Tamper-Proofing**: PROP_001 guarantees **application-level and engine-level operational immutability** for all transactions executed through the Django application and ordinary database connections. It does **not** claim cryptographic tamper-evidence (such as Merkle trees, digital signature chains, or immutable ledger blockchains) nor hardware immutability (such as Write-Once-Read-Many / WORM cloud storage appliances like AWS S3 Object Lock in compliance mode).
   * For the scope of Student ERP Task 5.6 and general ERP institutional compliance, application-level two-tier protection meets enterprise auditing standards without introducing unnecessary infrastructure complexity.

### 7.4 Audit-Event Authenticity, Creation Controls & Residual Risks

#### 1. Distinction: Immutability vs. Authenticity
* **Immutability (Append-Only Protection)**: Ensures that once an audit record has been inserted into PostgreSQL, it cannot be modified (`UPDATE`) or deleted (`DELETE`) by application code, ORM queries, or direct SQL commands over application connections.
* **Authenticity (Provenance & Non-Fabrication)**: Ensures that newly inserted audit records (`INSERT`) correspond to genuine, authorized business operations initiated by real, authenticated users, and prevents unauthorized actors from injecting fabricated or counterfeit audit history.

#### 2. Controls Governing Audit-Event Creation
To safeguard against the fabrication or illegitimate injection of audit records:
1. **Zero External API Ingestion Routes**: The HTTP API exposes **no endpoints** for creating, submitting, or editing audit events. Any HTTP `POST`, `PUT`, `PATCH`, or `DELETE` directed to `/api/v1/audit/` is unconditionally rejected with HTTP 405 Method Not Allowed. External clients cannot submit synthetic audit events.
2. **Centralized Service-Layer Ingestion**: Audit record instantiation is restricted exclusively to `AuditService.record_event()` in backend domain logic.
3. **Synchronous Actor Verification**: `AuditService.record_event()` requires an authenticated Django `User` instance (`actor = request.user`). The actor's primary key UUID, immutable username snapshot (`actor_username`), and active role (`actor_role`) are captured synchronously from the authenticated request context. Unauthenticated or spoofed requests cannot create audit events.
4. **Automated State Delta Derivation**: Field values (`old_values` and `new_values`) are computed directly by the service from the domain model pre-save and post-save instances, rather than being accepted from untrusted client payloads.
5. **Atomic Transaction Binding**: An audit event is persisted within the same `transaction.atomic()` block as the underlying domain model mutation. If the business mutation is invalid or aborted, no audit event can be created.

#### 3. Residual Risks from Privileged Code and Database Administrators
To maintain complete architectural integrity without claiming unachievable guarantees:
1. **Privileged Application Code (Internal Backend Scripts)**:
   - Any code execution vulnerability (e.g. arbitrary code execution via compromised dependencies, unauthorized administrative shell sessions `python manage.py shell`) has access to the database connection and could execute `AuditLog.objects.create(...)` or `AuditService.record_event(...)` to insert synthetic events. Because the database trigger permits `INSERT` statements to support valid auditing, the database engine cannot distinguish a legitimate event from a fabricated `INSERT` originating from privileged backend code.
2. **Direct Database Administrator Access (`psql`)**:
   - A database administrator connecting directly via `psql` can execute arbitrary `INSERT INTO audit_logs ...` statements. The PostgreSQL trigger permits `INSERT` operations and cannot verify whether a database-level `INSERT` originated from the Django application or a manual SQL command.
3. **Honest Claim on Authenticity**:
   - PROP_001 establishes rigorous **application-level provenance and authorization barriers**. However, it does **not** implement asymmetric digital cryptographic signatures (e.g. per-event public/private key signing), hardware security module (HSM) attestation, or decentralized consensus. Absolute non-repudiation against internal privileged actors with administrative access is explicitly disclaimed.

---

## 8. Proposed API Contract for Audit Trail Inquiries

### 8.1 Upgrade `GET /api/v1/audit/`
The existing scaffolding endpoint `GET /api/v1/audit/` will be activated to return real, paginated audit records:

* **Endpoint**: `GET /api/v1/audit/`
* **Permission**: `PERM_AUDIT_VIEW` (`audit.view`)
* **Authorized Roles**: Admin, Principal
* **Query Parameters**:
  * `resource_type` (string, optional, e.g. `?resource_type=ExamType`)
  * `resource_id` (UUID string, optional, e.g. `?resource_id=0f504569-2334-473c-b2e6-9e586f6c4bbf`)
  * `action` (string, optional, e.g. `?action=UPDATE`)
  * `actor_id` (UUID string, optional)
  * `start_date` (ISO date, optional)
  * `end_date` (ISO date, optional)
  * `page` (integer, default 1)
  * `page_size` (integer, default 20)

* **Response Envelope**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e4b37012-78d1-4cb5-b44e-a10c2834b6e1",
        "actor": {
          "id": "5bc074b0-be27-43e2-84b2-445b72f19bb9",
          "username": "admin_demo",
          "role": "Admin"
        },
        "action": "UPDATE",
        "resource_type": "ExamType",
        "resource_id": "0f504569-2334-473c-b2e6-9e586f6c4bbf",
        "old_values": {
          "weightage": "10.00"
        },
        "new_values": {
          "weightage": "15.00"
        },
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0 ...",
        "reason": "",
        "created_at": "2026-10-10T12:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "page_size": 20,
      "total_records": 1
    }
  }
  ```

---

## 9. Scope Boundaries

### In Scope for Initial Implementation
1. Concrete `AuditLog` database model in `backend/apps/audit/models.py` with `ImmutableManager` and `ImmutableQuerySet`.
2. Schema migration `backend/apps/audit/migrations/0001_initial.py` including the PostgreSQL trigger `trg_audit_logs_immutable`.
3. Updating `backend/tests/test_models_scaffolding.py` and `backend/tests/test_models_task33.py` boundary assertions to permit the new concrete `AuditLog` model.
4. Centralized `AuditService.record_event()` implementation in `backend/apps/audit/services.py` with payload delta minimization and secret sanitization.
5. Atomic transaction integration in `backend/apps/marks/views.py` (`ExamTypeListView.post` and `ExamTypeDetailView.patch`/`put`).
6. Activation of `GET /api/v1/audit/` in `backend/apps/audit/views.py` with filtering and pagination.
7. Automated test suite in `backend/tests/test_phase5_marks_examtype_audit.py` proving persistence, consistency, rollback on failure, immutability, and RBAC enforcement.
8. Updating documentation and completion report to reflect verified durable auditability.

### Out of Scope (Requires Separate Future Approvals)
1. Tracking all other ERP tables (Students, Attendance, Homework, Enrollments) — deferred to their respective phase mandates.
2. Read access audit logging (`GET` requests are strictly untracked to avoid database write storms).
3. Redis Streams, Celery workers, or Kafka event-bus architectures.
4. Cryptographic ledger hashing or blockchain verification.
5. Frontend UI audit explorer dashboards or analytics screens.

---

## 10. Required Test Suite & Acceptance Plan

A dedicated test suite `backend/tests/test_phase5_marks_examtype_audit.py` will be created covering 14 explicit test criteria across engine, ORM, API, and transaction layers.

> **CRITICAL ACCEPTANCE STATUS NOTICE**:  
> The acceptance tests enumerated below represent **proposed design criteria and test specifications**.  
> **None of these tests have been executed or passed yet**, because audit implementation is strictly unauthorized and has not been started.

### 10.1 Engine-Level Direct SQL Trigger Tests (PostgreSQL Required)
These tests execute raw SQL via Django's connection cursor directly against the PostgreSQL engine to prove that the database trigger blocks mutations even when Django ORM guards are entirely bypassed:

1. **`test_psql_trigger_blocks_raw_sql_update`** *(PostgreSQL Engine Required)*:
   * Action: Uses `connection.cursor()` to execute `UPDATE audit_logs SET action = 'TAMPERED' WHERE id = %s`.
   * Assertion: Asserts that PostgreSQL raises `django.db.utils.InternalError` or `django.db.DatabaseError` containing the trigger exception text: `"Table audit_logs is append-only. UPDATE and DELETE operations are forbidden."`
   * Engine Enforcement: Decorated with `@pytest.mark.skipif(connection.vendor != 'postgresql', reason="PostgreSQL trigger tests require PostgreSQL engine")` to prevent relying on or passing on SQLite fallback.
2. **`test_psql_trigger_blocks_raw_sql_delete`** *(PostgreSQL Engine Required)*:
   * Action: Uses `connection.cursor()` to execute `DELETE FROM audit_logs WHERE id = %s`.
   * Assertion: Asserts that PostgreSQL raises `django.db.utils.InternalError` or `django.db.DatabaseError` containing the trigger exception text: `"Table audit_logs is append-only. UPDATE and DELETE operations are forbidden."`
   * Engine Enforcement: Same PostgreSQL engine check enforced.

### 10.2 Application & ORM Immutability Tests
3. **`test_audit_instance_save_modification_blocked`**: Assert that taking an existing persisted `AuditLog` instance and calling `log.action = 'TAMPERED'; log.save()` raises `django.core.exceptions.PermissionDenied`.
4. **`test_audit_instance_delete_blocked`**: Assert that calling `log.delete()` on a persisted `AuditLog` raises `django.core.exceptions.PermissionDenied`.
5. **`test_audit_queryset_bulk_update_blocked`**: Assert that executing `AuditLog.objects.filter(id=log.id).update(action='TAMPERED')` raises `django.core.exceptions.PermissionDenied`.
6. **`test_audit_queryset_bulk_delete_blocked`**: Assert that executing `AuditLog.objects.filter(id=log.id).delete()` raises `django.core.exceptions.PermissionDenied`.

### 10.3 API Route Immutability & RBAC Tests
7. **`test_audit_api_has_no_mutation_routes`**: Assert that external HTTP `POST`, `PUT`, `PATCH`, and `DELETE` requests to `/api/v1/audit/` return HTTP 405 Method Not Allowed across all roles (Admin, Faculty, Student, Anonymous).
8. **`test_unauthorized_role_cannot_access_audit_api`**: Assert Faculty, Student, and Parent receive HTTP 403 Forbidden on `GET /api/v1/audit/`, while Admin and Principal receive HTTP 200 OK.

### 10.4 Persistence, Accuracy & Payload Minimization Tests
9. **`test_exam_type_create_creates_audit_record`**: Verify `POST /api/v1/marks/exam-types/` inserts an `AuditLog` with `action='CREATE'`, `new_values={'name': ..., 'weightage': ..., 'is_active': ...}`, and `old_values={}`.
10. **`test_exam_type_patch_creates_audit_record_with_diff`**: Verify patching `weightage` from `10.00` to `15.00` records `old_values={'weightage': '10.00'}` and `new_values={'weightage': '15.00'}` while omitting `name` and `is_active`.
11. **`test_single_field_diff_captures_only_changed_field`**: Verify modifying only `is_active` captures only `is_active` in diff (`old_values={'is_active': true}`, `new_values={'is_active': false}`).
12. **`test_validation_failure_creates_zero_audit_records`**: Assert invalid PATCH (e.g. weightage `150.00`) creates zero audit logs.

### 10.5 Atomic Consistency & Failure Rollback Tests
13. **`test_audit_write_failure_rolls_back_exam_type_mutation`**: Mock `AuditService.record_event` to raise `DatabaseError` during an ExamType PATCH. Assert that the ExamType in PostgreSQL remains unchanged (reverted) and API returns HTTP 500.

### 10.6 Regression & Historical Integrity Tests
14. **`test_legacy_records_and_historical_marks_unaffected`**: Verify `Half-Yearly Examination 2026` and its 5 marks records remain completely intact, and full regression runs verify 498 backend tests and 265 frontend tests pass with 0 schema drift.

---

## 11. Migration & Rollout Strategy

1. **Schema Migration**:
   * Command: `python manage.py makemigrations apps.audit`
   * Creates `0001_initial.py` defining the `audit_logs` table and triggers.
   * `makemigrations --check` ensures zero unintended drift across other apps.
2. **Historical Data Honesty**:
   * Historical ExamType mutations prior to deployment **cannot** be reconstructed from thin air.
   * Logging begins strictly from deployment forward. Existing seed records remain untouched.
3. **Seed Data Idempotency**:
   * `seed_dev_data.py` does not need to invoke `AuditService` (or may record an explicit `actor=None, action='SEED'` entry).
4. **Rollback Plan**:
   * If rolled back, `python manage.py migrate apps.audit zero` safely drops `audit_logs` without impacting `marks_exam_types` or any academic records.

---

## 12. Implementation Task Breakdown

| Sub-task | Action & File | Dependency |
| :--- | :--- | :--- |
| **Task A** | Create `ImmutableQuerySet`, `ImmutableManager`, and `AuditLog` model in `backend/apps/audit/models.py` | None |
| **Task B** | Generate migration `apps/audit/migrations/0001_initial.py` with DB trigger & run migrate | Task A |
| **Task C** | Update deferred model assertions in `test_models_scaffolding.py` and `test_models_task33.py` | Task B |
| **Task D** | Implement `AuditService.record_event()` with delta minimization in `backend/apps/audit/services.py` | Task A |
| **Task E** | Integrate atomic transaction auditing in `backend/apps/marks/views.py` | Tasks B, D |
| **Task F** | Wire `AuditLogListView` in `backend/apps/audit/views.py` & update serializers | Tasks A, D |
| **Task G** | Author comprehensive test suite `test_phase5_marks_examtype_audit.py` (14 tests) | Tasks E, F |
| **Task H** | Run full backend regression (512+ tests) and Vitest suite (265 tests) | Task G |
| **Task I** | Update `API_CONTRACT.md`, `PHASE_05_STATUS.md`, and author final Task 5.6 completion report | Task H |

---

## 13. Explicit Criteria for Final Task 5.6 Sign-off

Task 5.6 will achieve final sign-off only when the following criteria are met:
1. `AuditLog` table created in PostgreSQL with zero schema drift on other models.
2. Direct raw SQL `UPDATE` and `DELETE` queries on persisted `audit_logs` rows are rejected by the PostgreSQL engine trigger `trg_audit_logs_immutable`.
3. Creating or patching an ExamType via DRF endpoints creates a corresponding `AuditLog` row in PostgreSQL with actor identity and minimized before/after diffs.
4. Audit failure intentionally injected during tests causes atomic rollback of the ExamType modification.
5. Non-Admin/Principal roles receive HTTP 403 on `GET /api/v1/audit/`.
6. Direct `.save()` or `.delete()` calls on persisted `AuditLog` instances raise `PermissionDenied`.
7. Bulk `.update()` or `.delete()` on `AuditLog.objects` QuerySets raise `PermissionDenied`.
8. Legacy `Half-Yearly Examination 2026` record and its 5 marks records remain preserved intact.
9. 100% test pass rate across backend pytest and frontend Vitest suites, with clean production build.
10. Updated completion report accurately signed off with verifiable evidence.
11. Task 5.7 remains strictly **NOT STARTED** until explicitly instructed.

---

## 14. Governance Status & Stop Condition

```text
PROPOSAL STATUS = REVISED & SUBMITTED FOR REVIEW
AUDIT TRAIL IMPLEMENTATION = NOT STARTED (REQUIRES USER APPROVAL)
TASK 5.6 OVERALL ACCEPTANCE = PENDING AUDIT TRAIL IMPLEMENTATION
PHASE 5 = IN PROGRESS
TASK 5.7 = NOT STARTED
```
