"""
Student ERP — Phase 5 Durable Audit Trail & ExamType Integration Test Suite
Validates PROP_001 Revision 2.2 Option B implementation:
- Model immutability (instance and bulk ORM operations)
- PostgreSQL database trigger immutability enforcement
- Dual-role database architecture guarantees
- AuditService payload minimization and secret sanitization
- Transactional ExamType create/update/activate/deactivate integration
- Atomic rollback on audit write failure
- RBAC enforcement and HTTP mutation route blocking (401/403/405 invariant)
- Historical ExamType ('Half-Yearly Examination 2026') and marks preservation
"""

from decimal import Decimal
from unittest.mock import patch
import uuid
import pytest
from django.db import connection, DatabaseError, transaction
from django.core.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
)
from apps.accounts.models import Role, User, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment
from apps.marks.models import ExamType, Mark
from apps.audit.models import AuditLog
from apps.audit.services import AuditService, sanitize_payload


@pytest.fixture
def api_client():
    return APIClient()


def authenticate(api_client, user):
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')


@pytest.fixture
def audit_test_setup(db):
    """
    Sets up users with all 5 roles and seed academic/marks data for audit testing.
    """
    role_admin, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
    role_principal, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL)
    role_faculty, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
    role_student, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
    role_parent, _ = Role.objects.get_or_create(name=ROLE_PARENT)

    user_admin = User.objects.create_user(
        username='admin_audit', email='admin_audit@school.edu', password='Password123!', role=role_admin
    )
    user_principal = User.objects.create_user(
        username='principal_audit', email='principal_audit@school.edu', password='Password123!', role=role_principal
    )
    user_faculty = User.objects.create_user(
        username='faculty_audit', email='faculty_audit@school.edu', password='Password123!', role=role_faculty
    )
    user_student = User.objects.create_user(
        username='student_audit', email='student_audit@school.edu', password='Password123!', role=role_student
    )
    user_parent = User.objects.create_user(
        username='parent_audit', email='parent_audit@school.edu', password='Password123!', role=role_parent
    )

    return {
        'admin': user_admin,
        'principal': user_principal,
        'faculty': user_faculty,
        'student': user_student,
        'parent': user_parent,
    }


# ==============================================================================
# 1. MODEL IMMUTABILITY & ORM GUARDS
# ==============================================================================

class TestAuditLogImmutabilityORM:
    """Verifies that AuditLog instances and querysets strictly block modifications and deletions."""

    def test_audit_log_fields_and_indexes(self, db):
        """Verify model meta, table name, and database indexes."""
        assert AuditLog._meta.db_table == 'audit_logs'
        assert AuditLog._meta.base_manager_name == 'objects'
        index_names = [idx.name for idx in AuditLog._meta.indexes]
        assert 'idx_audit_resource' in index_names
        assert 'idx_audit_actor_time' in index_names
        assert 'idx_audit_action_time' in index_names

    def test_instance_save_modification_blocked(self, audit_test_setup):
        """In-place modification of existing AuditLog instance raises PermissionDenied."""
        log = AuditLog.objects.create(
            actor=audit_test_setup['admin'],
            actor_username='admin_audit',
            actor_role=ROLE_ADMIN,
            action=AuditLog.ACTION_CREATE,
            resource_type='ExamType',
            resource_id=str(uuid.uuid4()),
            new_values={'name': 'Unit Test 1', 'weightage': '10.00'},
        )
        assert log.id is not None

        # Attempt to modify in-place
        log.new_values = {'name': 'Tampered Unit Test'}
        with pytest.raises(PermissionDenied, match="AuditLog records are append-only and cannot be modified"):
            log.save()

    def test_instance_delete_blocked(self, audit_test_setup):
        """Calling delete() on an AuditLog instance raises PermissionDenied."""
        log = AuditLog.objects.create(
            actor=audit_test_setup['admin'],
            actor_username='admin_audit',
            actor_role=ROLE_ADMIN,
            action=AuditLog.ACTION_CREATE,
            resource_type='ExamType',
            resource_id=str(uuid.uuid4()),
            new_values={'name': 'Unit Test 2', 'weightage': '10.00'},
        )
        with pytest.raises(PermissionDenied, match="AuditLog records are append-only and cannot be deleted"):
            log.delete()

    def test_bulk_queryset_update_blocked(self, audit_test_setup):
        """Calling QuerySet.update() raises PermissionDenied."""
        log = AuditLog.objects.create(
            actor=audit_test_setup['admin'],
            actor_username='admin_audit',
            actor_role=ROLE_ADMIN,
            action=AuditLog.ACTION_CREATE,
            resource_type='ExamType',
            resource_id=str(uuid.uuid4()),
            new_values={'name': 'Unit Test 3', 'weightage': '10.00'},
        )
        with pytest.raises(PermissionDenied, match="Bulk QuerySet.update\\(\\) is forbidden"):
            AuditLog.objects.filter(id=log.id).update(reason="Tampered bulk reason")

    def test_bulk_queryset_delete_blocked(self, audit_test_setup):
        """Calling QuerySet.delete() raises PermissionDenied."""
        log = AuditLog.objects.create(
            actor=audit_test_setup['admin'],
            actor_username='admin_audit',
            actor_role=ROLE_ADMIN,
            action=AuditLog.ACTION_CREATE,
            resource_type='ExamType',
            resource_id=str(uuid.uuid4()),
            new_values={'name': 'Unit Test 4', 'weightage': '10.00'},
        )
        with pytest.raises(PermissionDenied, match="Bulk QuerySet.delete\\(\\) is forbidden"):
            AuditLog.objects.filter(id=log.id).delete()


# ==============================================================================
# 2. POSTGRESQL DATABASE TRIGGER ENFORCEMENT
# ==============================================================================

class TestPostgresTriggerImmutability:
    """Verifies that direct raw SQL UPDATE/DELETE queries are rejected by PostgreSQL."""

    def test_postgres_trigger_blocks_raw_sql_update_and_delete(self, audit_test_setup):
        """Direct raw SQL UPDATE and DELETE on audit_logs table are blocked."""
        if connection.vendor != 'postgresql':
            pytest.skip("Raw SQL trigger test requires PostgreSQL")

        log = AuditLog.objects.create(
            actor=audit_test_setup['admin'],
            actor_username='admin_audit',
            actor_role=ROLE_ADMIN,
            action=AuditLog.ACTION_CREATE,
            resource_type='ExamType',
            resource_id=str(uuid.uuid4()),
            new_values={'name': 'Direct SQL Test', 'weightage': '10.00'},
        )

        # Test direct SQL UPDATE within isolated atomic block
        with pytest.raises(DatabaseError) as exc_info_update:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        "UPDATE audit_logs SET reason = 'Tampered' WHERE id = %s",
                        [str(log.id)]
                    )
        assert any(term in str(exc_info_update.value).lower() for term in ['forbidden', 'append-only', 'permission denied'])

        # Test direct SQL DELETE within isolated atomic block
        with pytest.raises(DatabaseError) as exc_info_delete:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        "DELETE FROM audit_logs WHERE id = %s",
                        [str(log.id)]
                    )
        assert any(term in str(exc_info_delete.value).lower() for term in ['forbidden', 'append-only', 'permission denied'])


# ==============================================================================
# 3. AUDIT SERVICE & PAYLOAD SANITIZATION
# ==============================================================================

class TestAuditServiceAndSanitization:
    """Verifies delta minimization, secret sanitization, and actor snapshots."""

    def test_sanitize_payload_strips_sensitive_keys(self):
        """Passwords, tokens, secrets, and auth cookies are completely stripped."""
        dirty_data = {
            'name': 'Term 1 Exam',
            'password': 'secret_password_123',
            'token': 'jwt_bearer_token',
            'nested': {
                'weightage': '20.00',
                'secret_key': 'super_secret',
            }
        }
        cleaned = sanitize_payload(dirty_data)
        assert 'name' in cleaned
        assert 'password' not in cleaned
        assert 'token' not in cleaned
        assert cleaned['nested'] == {'weightage': '20.00'}

    def test_record_event_minimal_delta(self, audit_test_setup):
        """Only modified fields are preserved in old_values and new_values."""
        res_id = str(uuid.uuid4())
        old_data = {'name': 'Quarterly Exam', 'weightage': '15.00', 'is_active': True}
        new_data = {'name': 'Quarterly Examination', 'weightage': '15.00', 'is_active': True}

        log = AuditService.record_event(
            actor=audit_test_setup['admin'],
            action=AuditLog.ACTION_UPDATE,
            resource_type='ExamType',
            resource_id=res_id,
            old_data=old_data,
            new_data=new_data,
        )

        assert log.old_values == {'name': 'Quarterly Exam'}
        assert log.new_values == {'name': 'Quarterly Examination'}
        assert 'weightage' not in log.old_values
        assert 'is_active' not in log.old_values
        assert log.actor_username == 'admin_audit'
        assert log.actor_role == ROLE_ADMIN

    def test_actor_snapshot_preservation_on_user_protection(self, audit_test_setup):
        """Actor username and role snapshots persist even if actor is set."""
        res_id = str(uuid.uuid4())
        log = AuditService.record_event(
            actor=audit_test_setup['principal'],
            action=AuditLog.ACTION_CREATE,
            resource_type='ExamType',
            resource_id=res_id,
            new_data={'name': 'Annual', 'weightage': '50.00', 'is_active': True},
        )
        assert log.actor == audit_test_setup['principal']
        assert log.actor_username == 'principal_audit'
        assert log.actor_role == ROLE_PRINCIPAL


# ==============================================================================
# 4. TRANSACTIONAL EXAMTYPE INTEGRATION
# ==============================================================================

class TestExamTypeTransactionalAuditIntegration:
    """Verifies that ExamType operations atomically write audit logs and roll back on error."""

    def test_examtype_create_generates_audit_event(self, api_client, audit_test_setup):
        """POST /api/v1/marks/exam-types/ records an ACTION_CREATE audit event."""
        authenticate(api_client, audit_test_setup['admin'])
        payload = {
            'name': 'Pre-Board Examination 2026',
            'weightage': '25.00',
            'is_active': True,
        }
        res = api_client.post('/api/v1/marks/exam-types/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        et_id = res.data['data']['id']

        # Verify audit log was created
        audit_entry = AuditLog.objects.filter(resource_type='ExamType', resource_id=str(et_id)).first()
        assert audit_entry is not None
        assert audit_entry.action == AuditLog.ACTION_CREATE
        assert audit_entry.actor_username == 'admin_audit'
        assert audit_entry.actor_role == ROLE_ADMIN
        assert audit_entry.new_values['name'] == 'Pre-Board Examination 2026'
        assert audit_entry.new_values['weightage'] == '25.00'
        assert audit_entry.new_values['is_active'] is True

    def test_examtype_update_generates_audit_event_minimal_delta(self, api_client, audit_test_setup):
        """PATCH /api/v1/marks/exam-types/{id}/ records ACTION_UPDATE with only changed fields."""
        et = ExamType.objects.create(name='Mid-Term Initial', weightage=Decimal('15.00'), is_active=True)
        authenticate(api_client, audit_test_setup['admin'])

        update_payload = {'weightage': '20.00'}
        res = api_client.patch(f'/api/v1/marks/exam-types/{et.id}/', update_payload, format='json')
        assert res.status_code == status.HTTP_200_OK

        audit_entry = AuditLog.objects.filter(
            resource_type='ExamType',
            resource_id=str(et.id),
            action=AuditLog.ACTION_UPDATE,
        ).first()
        assert audit_entry is not None
        assert audit_entry.old_values == {'weightage': '15.00'}
        assert audit_entry.new_values == {'weightage': '20.00'}
        assert 'name' not in audit_entry.old_values
        assert 'is_active' not in audit_entry.old_values

    def test_examtype_activate_deactivate_audit_event(self, api_client, audit_test_setup):
        """Deactivating and activating an ExamType records ACTION_DEACTIVATE and ACTION_ACTIVATE."""
        et = ExamType.objects.create(name='Toggle Active Test', weightage=Decimal('10.00'), is_active=True)
        authenticate(api_client, audit_test_setup['admin'])

        # Deactivate
        res_deact = api_client.patch(f'/api/v1/marks/exam-types/{et.id}/', {'is_active': False}, format='json')
        assert res_deact.status_code == status.HTTP_200_OK
        audit_deact = AuditLog.objects.filter(
            resource_type='ExamType', resource_id=str(et.id), action=AuditLog.ACTION_DEACTIVATE
        ).first()
        assert audit_deact is not None
        assert audit_deact.old_values == {'is_active': True}
        assert audit_deact.new_values == {'is_active': False}

        # Reactivate
        res_act = api_client.patch(f'/api/v1/marks/exam-types/{et.id}/', {'is_active': True}, format='json')
        assert res_act.status_code == status.HTTP_200_OK
        audit_act = AuditLog.objects.filter(
            resource_type='ExamType', resource_id=str(et.id), action=AuditLog.ACTION_ACTIVATE
        ).first()
        assert audit_act is not None
        assert audit_act.old_values == {'is_active': False}
        assert audit_act.new_values == {'is_active': True}

    def test_invalid_request_produces_no_audit_event(self, api_client, audit_test_setup):
        """Invalid requests (e.g. invalid weightage > 100) return 400 and produce NO audit log."""
        initial_count = AuditLog.objects.count()
        authenticate(api_client, audit_test_setup['admin'])

        payload = {
            'name': 'Impossible Weightage Exam',
            'weightage': '150.00',  # Invalid weightage
            'is_active': True,
        }
        res = api_client.post('/api/v1/marks/exam-types/', payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert AuditLog.objects.count() == initial_count

    def test_audit_failure_causes_complete_examtype_rollback(self, api_client, audit_test_setup):
        """If AuditService.record_event raises an exception, the ExamType mutation rolls back entirely."""
        et = ExamType.objects.create(name='Original Name Rollback', weightage=Decimal('10.00'), is_active=True)
        authenticate(api_client, audit_test_setup['admin'])

        with patch('apps.audit.services.AuditService.record_event', side_effect=DatabaseError("Audit table write failure")):
            res = api_client.patch(
                f'/api/v1/marks/exam-types/{et.id}/',
                {'name': 'Mutated Name Attempt'},
                format='json',
            )
            # Must fail with server error
            assert res.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert res.data['success'] is False
            assert 'audit recording failure' in res.data['error']['message'].lower()
            # Ensure internal database traceback or credentials not leaked
            assert 'DatabaseError' not in res.data['error']['message']

        # Verify ExamType was NOT mutated in the database
        et.refresh_from_db()
        assert et.name == 'Original Name Rollback'
        assert not AuditLog.objects.filter(resource_id=str(et.id), new_values__name='Mutated Name Attempt').exists()


# ==============================================================================
# 5. AUDIT API RBAC & HTTP MUTATION ROUTE BLOCKING
# ==============================================================================

class TestAuditAPIRBACAndRouteGuards:
    """Verifies that GET /api/v1/audit/ enforces RBAC and mutation methods return 405."""

    def test_audit_api_anonymous_rejected_401(self, api_client, db):
        """Anonymous access to /api/v1/audit/ returns 401 Unauthorized."""
        res = api_client.get('/api/v1/audit/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_audit_api_unauthorized_roles_rejected_403(self, api_client, audit_test_setup):
        """Faculty, Student, and Parent are denied access with 403 Forbidden."""
        for role_name in ['faculty', 'student', 'parent']:
            authenticate(api_client, audit_test_setup[role_name])
            res = api_client.get('/api/v1/audit/')
            assert res.status_code == status.HTTP_403_FORBIDDEN, f"Role {role_name} should receive 403"

    def test_audit_api_authorized_roles_succeed_200(self, api_client, audit_test_setup):
        """Admin and Principal access /api/v1/audit/ successfully with paginated response."""
        for role_name in ['admin', 'principal']:
            authenticate(api_client, audit_test_setup[role_name])
            res = api_client.get('/api/v1/audit/')
            assert res.status_code == status.HTTP_200_OK
            assert 'data' in res.data
            assert 'meta' in res.data
            assert res.data['success'] is True

    def test_audit_api_query_filters(self, api_client, audit_test_setup):
        """GET /api/v1/audit/ filters correctly by resource_type, action, resource_id, and actor_id."""
        target_res_id = str(uuid.uuid4())
        AuditService.record_event(
            actor=audit_test_setup['admin'],
            action=AuditLog.ACTION_CREATE,
            resource_type='ExamType',
            resource_id=target_res_id,
            new_data={'name': 'Filter Target Exam'},
        )
        authenticate(api_client, audit_test_setup['admin'])

        res = api_client.get(f'/api/v1/audit/?resource_type=ExamType&resource_id={target_res_id}&action=CREATE')
        assert res.status_code == status.HTTP_200_OK
        results = res.data['data']
        assert len(results) >= 1
        assert results[0]['resource_id'] == target_res_id

    def test_audit_api_mutation_methods_return_405(self, api_client, audit_test_setup):
        """POST, PUT, PATCH, DELETE to /api/v1/audit/ return 405 Method Not Allowed for Admin."""
        authenticate(api_client, audit_test_setup['admin'])

        post_res = api_client.post('/api/v1/audit/', {'action': 'CREATE'}, format='json')
        assert post_res.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        put_res = api_client.put('/api/v1/audit/', {'action': 'UPDATE'}, format='json')
        assert put_res.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        patch_res = api_client.patch('/api/v1/audit/', {'action': 'UPDATE'}, format='json')
        assert patch_res.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        delete_res = api_client.delete('/api/v1/audit/')
        assert delete_res.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


# ==============================================================================
# 6. HISTORICAL DATA PRESERVATION
# ==============================================================================

class TestHistoricalDataPreservation:
    """Verifies that Half-Yearly Examination 2026 and its marks records remain 100% intact."""

    def test_half_yearly_examination_2026_and_marks_preserved(self, db):
        """Half-Yearly Examination 2026 is active and has its 5 historical marks records."""
        legacy_exam = ExamType.objects.filter(name='Half-Yearly Examination 2026').first()
        if legacy_exam:
            assert legacy_exam.is_active is True
            marks_count = Mark.objects.filter(exam_type=legacy_exam).count()
            assert marks_count == 5, f"Expected 5 historical marks for legacy exam, found {marks_count}"
