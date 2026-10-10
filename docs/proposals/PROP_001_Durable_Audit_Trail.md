# Architecture Proposal: Durable Audit Trail (PROP_001)

> **Document ID**: PROP_001  
> **Title**: Durable Database-Backed Audit Trail for ExamType & Core ERP Mutations  
> **Governance Status**: **PROPOSAL ONLY — IMPLEMENTATION NOT AUTHORIZED**  
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
2. **Field-Level Diff Capture**: The record must capture exactly which fields changed, including the previous value (`old_values`) and the newly applied value (`new_values`).
3. **Actor Association**: The record must unambiguously link to the authenticated `User` who performed the mutation, while preserving historical readability even if that user account is later deactivated or deleted.
4. **Strict Atomic Consistency**: An administrative ExamType mutation must **never** commit if its corresponding audit record fails to insert. If audit creation raises an exception, the entire database transaction must rollback and return an HTTP error.
5. **Read-Only / Append-Only Audit Integrity**: Audit records must be immutable. No application role (including Admin and Principal) may edit, overwrite, or delete historical audit rows.
6. **Zero Regression Guarantee**: The implementation must preserve historical data, including the legacy `Half-Yearly Examination 2026` record and all existing student `Mark` rows, with zero breaking changes to existing Marks endpoints or tests.

### 2.2 Assumptions & Current System Truths
1. **Reason Field Optionality**: The existing React frontend marks-entry and admin surfaces do **not** prompt the user for a change reason when mutating ExamTypes. Therefore, `reason` must be an optional field (`null=True, blank=True`), populated only if provided in request context or automated jobs.
2. **Request Source Extraction**: Client IP address and User-Agent are best-effort values derived from standard Django request headers (`REMOTE_ADDR`, `HTTP_X_FORWARDED_FOR`, `HTTP_USER_AGENT`). They must allow null values for non-HTTP or background/test environments.
3. **Single Authoritative Database**: PostgreSQL 16+ is the sole persistence store per ADR 003. Audit logs reside in PostgreSQL table `audit_logs` using native `JSONB` columns.

---

## 3. Minimum Required Audit Events

The audit engine must monitor the following operations on `ExamType`:

| Event Action | Triggering Operation | HTTP Method & Endpoint | Scoped Fields Audited |
| :--- | :--- | :--- | :--- |
| **`CREATE`** | Creating a new assessment category | `POST /api/v1/marks/exam-types/` | `name`, `weightage`, `is_active` |
| **`UPDATE`** | Renaming or adjusting weightage | `PATCH` / `PUT /api/v1/marks/exam-types/{id}/` | Delta of (`name`, `weightage`, `is_active`) |
| **`ACTIVATE`** | Enabling an inactive ExamType | `PATCH /api/v1/marks/exam-types/{id}/` (`is_active: true`) | `is_active` (`false` $\to$ `true`) |
| **`DEACTIVATE`**| Retiring an ExamType from active use| `PATCH /api/v1/marks/exam-types/{id}/` (`is_active: false`)| `is_active` (`true` $\to$ `false`) |

### Mandatory vs. Optional Audit Fields

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
│   ├── old_values (JSONField: snapshot of previous values before save)
│   ├── new_values (JSONField: snapshot of applied values after save)
│   └── created_at (DateTimeField with timezone, auto_now_add=True)
└── Optional Contextual Fields (Populated Best-Effort When Available)
    ├── ip_address (GenericIPAddressField, null=True)
    ├── user_agent (TextField, blank=True, default='')
    ├── reason (TextField, blank=True, default='')
    └── request_id (CharField / UUID correlation ID, blank=True, default='')
```

---

## 4. Proposed Data Model & Schema

### 4.1 Concrete `AuditLog` Model Definition
The model will be placed in `backend/apps/audit/models.py`, inheriting from `UUIDModel` in `common.models`:

```python
import uuid
from django.db import models
from django.core.exceptions import PermissionDenied
from common.models import UUIDModel

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
        help_text="State snapshot of modified fields prior to change.",
    )
    new_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="State snapshot of modified fields after change.",
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

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['resource_type', 'resource_id'], name='idx_audit_resource'),
            models.Index(fields=['actor', 'created_at'], name='idx_audit_actor_time'),
            models.Index(fields=['action', 'created_at'], name='idx_audit_action_time'),
        ]

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M:%S}] {self.action} {self.resource_type}({self.resource_id}) by {self.actor_username or 'System'}"

    def save(self, *args, **kwargs):
        """Strict append-only constraint: disallow in-place updates."""
        if not self._state.adding:
            raise PermissionDenied("AuditLog records are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Strict append-only constraint: disallow deletion."""
        raise PermissionDenied("AuditLog records cannot be deleted.")
```

### 4.2 Database Indexes & Performance Characteristics
* **Compound Resource Index (`idx_audit_resource`)**: B-tree index on `(resource_type, resource_id)` allows sub-millisecond retrieval of the complete historical change ledger for any specific `ExamType` UUID.
* **Temporal Ordering Index (`created_at`)**: Facilitates reverse-chronological paginated inquiries without sequential table scans.
* **JSONB Storage**: In PostgreSQL, `models.JSONField` maps to `jsonb`. This enables deep key-level diff queries (e.g., finding all changes where weightage was modified) without schema alterations.

---

## 5. Transaction & Failure-Handling Strategy

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
  │      ├── c. Capture after-state snapshot (new_values) & compute delta
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

## 7. Security, Access Control & Integrity Protection

### 7.1 Role-Based Access Control (RBAC)
Audit log inspection is restricted by the authoritative `ROLE_PERMISSIONS_MATRIX` ([backend/common/authorization.py:115-180](file:///d:/student-erp/backend/common/authorization.py#L115-L180)):
* **Admin (`ROLE_ADMIN`)**: Granted `PERM_AUDIT_VIEW`. Authorized to inspect institutional audit trails for compliance and administrative oversight.
* **Principal (`ROLE_PRINCIPAL`)**: Granted `PERM_AUDIT_VIEW`. Authorized to view executive telemetry and academic administrative history.
* **Faculty (`ROLE_FACULTY`)**: Strictly **DENIED** (`PERM_AUDIT_VIEW` not granted; returns HTTP 403 Forbidden).
* **Student (`ROLE_STUDENT`)**: Strictly **DENIED** (returns HTTP 403 Forbidden).
* **Parent (`ROLE_PARENT`)**: Strictly **DENIED** (returns HTTP 403 Forbidden).
* **Unauthenticated**: Returns HTTP 401 Unauthorized.

### 7.2 Data Sanitization & Credential Exclusion
Although `ExamType` fields (`name`, `weightage`, `is_active`) do not contain secrets, the `AuditService` will include a centralized **Sanitization Filter** to safeguard future domain reuse:
* Blacklisted keys (`password`, `token`, `secret`, `access`, `refresh`, `authorization`, `credit_card`) are automatically stripped or masked as `"[REDACTED]"` before writing to `old_values` or `new_values`.

### 7.3 Immutability and Retention Guarantees
1. **Application-Level Immutability**:
   * Overridden `save()` and `delete()` methods on `AuditLog` raise `PermissionDenied` if invoked on existing records.
   * DRF `AuditLogListView` exposes only `GET`. There are **no POST, PUT, PATCH, or DELETE routes** in `apps.audit.urls`.
2. **Database-Level Protection**:
   * Production deployment documentation will include optional PostgreSQL DDL:
     `REVOKE UPDATE, DELETE ON audit_logs FROM app_user;`
3. **Honest Limitations**:
   * Application-level protections cannot prevent a PostgreSQL superuser / DBA with direct psql access from mutating raw disk records. Cryptographic tamper-proofing (such as Merkle trees or blockchain hash-chains) is **not** implemented and is not claimed.

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
1. Concrete `AuditLog` database model in `backend/apps/audit/models.py`.
2. Schema migration `backend/apps/audit/migrations/0001_initial.py`.
3. Updating `backend/tests/test_models_scaffolding.py` and `backend/tests/test_models_task33.py` boundary assertions to permit the new concrete `AuditLog` model.
4. Centralized `AuditService.record_event()` implementation in `backend/apps/audit/services.py`.
5. Atomic transaction integration in `backend/apps/marks/views.py` (`ExamTypeListView.post` and `ExamTypeDetailView.patch`/`put`).
6. Activation of `GET /api/v1/audit/` in `backend/apps/audit/views.py` with filtering and pagination.
7. Automated test suite in `backend/tests/test_phase5_marks_examtype_audit.py` proving persistence, consistency, rollback on failure, and RBAC enforcement.
8. Updating documentation and completion report to reflect verified durable auditability.

### Out of Scope (Requires Separate Future Approvals)
1. Tracking all other ERP tables (Students, Attendance, Homework, Enrollments) — deferred to their respective phase mandates.
2. Read access audit logging (`GET` requests are strictly untracked to avoid database write storms).
3. Redis Streams, Celery workers, or Kafka event-bus architectures.
4. Cryptographic ledger hashing or blockchain verification.
5. Frontend UI audit explorer dashboards or analytics screens.

---

## 10. Required Test Suite & Acceptance Plan

A dedicated test suite `backend/tests/test_phase5_marks_examtype_audit.py` will be created covering 10 explicit test criteria:

1. **`test_exam_type_create_creates_audit_record`**: Verify `POST /api/v1/marks/exam-types/` inserts an `AuditLog` with `action='CREATE'`, `new_values={'name': ..., 'weightage': ...}`, and `old_values={}`.
2. **`test_exam_type_patch_creates_audit_record_with_diff`**: Verify patching `weightage` from `10.00` to `15.00` records `old_values={'weightage': '10.00'}` and `new_values={'weightage': '15.00'}`.
3. **`test_single_field_diff_captures_only_changed_field`**: Verify modifying only `is_active` captures only `is_active` in diff, omitting unchanged `name` and `weightage`.
4. **`test_validation_failure_creates_zero_audit_records`**: Assert invalid PATCH (e.g. weightage `150.00`) creates zero audit logs.
5. **`test_audit_write_failure_rolls_back_exam_type_mutation`**: Mock `AuditService.record_event` to raise `DatabaseError` and assert that the ExamType in PostgreSQL remains unchanged and API returns 500.
6. **`test_unauthorized_role_cannot_access_audit_api`**: Assert Faculty, Student, and Parent receive 403 Forbidden on `GET /api/v1/audit/`.
7. **`test_audit_records_are_immutable`**: Attempting to call `.save()` or `.delete()` on an existing `AuditLog` instance raises `PermissionDenied`.
8. **`test_audit_records_survive_restarts`**: Verify records persist directly in PostgreSQL tables across request lifecycles.
9. **`test_legacy_records_and_historical_marks_unaffected`**: Verify `Half-Yearly Examination 2026` and its 5 marks records remain completely intact.
10. **`test_full_regression_zero_drift`**: Full regression runs verifying 498 backend tests and 265 frontend tests continue to pass with 0 schema drift.

---

## 11. Migration & Rollout Strategy

1. **Schema Migration**:
   * Command: `python manage.py makemigrations apps.audit`
   * Creates `0001_initial.py` defining the `audit_logs` table.
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
| **Task A** | Create `AuditLog` model in `backend/apps/audit/models.py` | None |
| **Task B** | Generate migration `apps/audit/migrations/0001_initial.py` & run migrate | Task A |
| **Task C** | Update deferred model assertions in `test_models_scaffolding.py` and `test_models_task33.py` | Task B |
| **Task D** | Implement `AuditService.record_event()` in `backend/apps/audit/services.py` | Task A |
| **Task E** | Integrate atomic transaction auditing in `backend/apps/marks/views.py` | Tasks B, D |
| **Task F** | Wire `AuditLogListView` in `backend/apps/audit/views.py` & update serializers | Tasks A, D |
| **Task G** | Author comprehensive test suite `test_phase5_marks_examtype_audit.py` | Tasks E, F |
| **Task H** | Run full backend regression (508+ tests) and Vitest suite (265 tests) | Task G |
| **Task I** | Update `API_CONTRACT.md`, `PHASE_05_STATUS.md`, and `Phase_5_Task_5.6_Completion_Report.md` | Task H |

---

## 13. Explicit Criteria for Final Task 5.6 Sign-off

Task 5.6 will achieve final sign-off only when the following criteria are met:
1. `AuditLog` table created in PostgreSQL with zero schema drift on other models.
2. Creating or patching an ExamType via DRF endpoints creates a corresponding `AuditLog` row in PostgreSQL with actor identity and before/after diffs.
3. Audit failure intentionally injected during tests causes atomic rollback of the ExamType modification.
4. Non-Admin/Principal roles receive HTTP 403 on `GET /api/v1/audit/`.
5. Direct `.save()` or `.delete()` calls on persisted `AuditLog` instances raise `PermissionDenied`.
6. Legacy `Half-Yearly Examination 2026` record and its 5 marks records remain preserved intact.
7. 100% test pass rate across backend pytest and frontend Vitest suites, with clean production build.
8. Updated completion report accurately signed off with verifiable evidence.
9. Task 5.7 remains strictly **NOT STARTED** until explicitly instructed.

---

## 14. Governance Status & Stop Condition

```text
PROPOSAL STATUS = SUBMITTED FOR REVIEW
AUDIT TRAIL IMPLEMENTATION = NOT STARTED (REQUIRES USER APPROVAL)
TASK 5.6 OVERALL ACCEPTANCE = PENDING AUDIT TRAIL IMPLEMENTATION
PHASE 5 = IN PROGRESS
TASK 5.7 = NOT STARTED
```
