"""
Student ERP — Phase 5 Task 5.6 ExamType Reconciliation Verification Suite
Post-Sign-Off Verification for ExamType Detail, Update, Seeding, RBAC & Marks Resolution.
"""

from datetime import date
from decimal import Decimal
import uuid
import pytest
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
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, TeachingAssignment, Enrollment
from apps.marks.models import ExamType, Mark
from apps.marks.services import MarksService


@pytest.fixture
def api_client():
    return APIClient()


def authenticate(api_client, user):
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')


@pytest.fixture
def examtype_reconciliation_setup(db):
    """
    Sets up users and academic hierarchy for ExamType reconciliation tests.
    """
    role_admin, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
    role_principal, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL)
    role_faculty, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
    role_student, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
    role_parent, _ = Role.objects.get_or_create(name=ROLE_PARENT)

    user_admin = User.objects.create_user(
        username='admin_et', email='admin_et@school.edu', password='Password123!', role=role_admin
    )
    user_principal = User.objects.create_user(
        username='principal_et', email='principal_et@school.edu', password='Password123!', role=role_principal
    )
    user_faculty = User.objects.create_user(
        username='faculty_et', email='faculty_et@school.edu', password='Password123!', role=role_faculty
    )
    user_student = User.objects.create_user(
        username='student_et', email='student_et@school.edu', password='Password123!', role=role_student
    )
    user_parent = User.objects.create_user(
        username='parent_et', email='parent_et@school.edu', password='Password123!', role=role_parent
    )

    faculty = Faculty.objects.create(
        user=user_faculty,
        employee_code='FAC-ET-01',
        department='Mathematics',
        joining_date=date(2022, 1, 1),
        is_active=True,
    )

    student = Student.objects.create(
        user=user_student,
        student_id='STU-ET-001',
        admission_number='ADM-ET-001',
        roll_number='1101',
        date_of_birth=date(2009, 8, 15),
        gender='Female',
    )

    parent = Parent.objects.create(
        user=user_parent,
    )
    student.parent = parent
    student.save()

    academic_year = AcademicYear.objects.create(
        name='2026-2027',
        start_date='2026-06-01',
        end_date='2027-04-30',
        is_current=True,
    )

    school_class = SchoolClass.objects.create(
        name='Grade 11 - Computer Science',
        code='G11-CS-ET',
        academic_year=academic_year,
    )

    section = Section.objects.create(
        name='XI-A1',
        school_class=school_class,
        academic_year=academic_year,
        class_teacher=faculty,
        capacity=35,
    )

    subject = Subject.objects.create(
        name='Mathematics',
        code='MATH-041-ET',
        department='Mathematics',
        weekly_periods=6,
        is_active=True,
    )

    TeachingAssignment.objects.create(
        faculty=faculty,
        section=section,
        subject=subject,
        academic_year=academic_year,
        is_active=True,
    )

    enrollment = Enrollment.objects.create(
        student=student,
        section=section,
        academic_year=academic_year,
        status='Active',
    )

    exam_type_1 = ExamType.objects.create(
        name='Cycle Test',
        weightage=Decimal('10.00'),
        is_active=True,
    )
    exam_type_2 = ExamType.objects.create(
        name='Quarterly Examination',
        weightage=Decimal('20.00'),
        is_active=True,
    )
    exam_type_3 = ExamType.objects.create(
        name='Half-Yearly Examination',
        weightage=Decimal('30.00'),
        is_active=True,
    )
    exam_type_4 = ExamType.objects.create(
        name='Final / Annual Examination',
        weightage=Decimal('40.00'),
        is_active=True,
    )
    exam_type_inactive = ExamType.objects.create(
        name='Archived Diagnostic Test',
        weightage=Decimal('0.00'),
        is_active=False,
    )

    return {
        'admin': user_admin,
        'principal': user_principal,
        'faculty_user': user_faculty,
        'faculty': faculty,
        'student_user': user_student,
        'student': student,
        'parent_user': user_parent,
        'parent': parent,
        'enrollment': enrollment,
        'subject': subject,
        'section': section,
        'exam_type_1': exam_type_1,
        'exam_type_2': exam_type_2,
        'exam_type_3': exam_type_3,
        'exam_type_4': exam_type_4,
        'exam_type_inactive': exam_type_inactive,
    }


class TestExamTypeReconciliation:
    """
    Validates ExamType endpoints, RBAC, mutations, seeding, and active/inactive status.
    """

    def test_exam_type_list_and_active_filtering(self, api_client, examtype_reconciliation_setup):
        """GET /api/v1/marks/exam-types/ lists all and filters by is_active."""
        setup = examtype_reconciliation_setup
        authenticate(api_client, setup['admin'])

        # 1. List all exam types
        res = api_client.get('/api/v1/marks/exam-types/')
        assert res.status_code == status.HTTP_200_OK
        data = res.json()['data']
        assert len(data) >= 5

        # 2. Filter is_active=true
        res_active = api_client.get('/api/v1/marks/exam-types/?is_active=true')
        assert res_active.status_code == status.HTTP_200_OK
        active_data = res_active.json()['data']
        assert all(item['is_active'] is True for item in active_data)
        assert any(item['name'] == 'Cycle Test' for item in active_data)
        assert not any(item['name'] == 'Archived Diagnostic Test' for item in active_data)

        # 3. Filter is_active=false
        res_inactive = api_client.get('/api/v1/marks/exam-types/?is_active=false')
        assert res_inactive.status_code == status.HTTP_200_OK
        inactive_data = res_inactive.json()['data']
        assert len(inactive_data) >= 1
        assert all(item['is_active'] is False for item in inactive_data)

    def test_exam_type_detail_read_for_all_roles(self, api_client, examtype_reconciliation_setup):
        """GET /api/v1/marks/exam-types/{id}/ works for all authenticated roles."""
        setup = examtype_reconciliation_setup
        target_id = str(setup['exam_type_3'].id)

        roles_to_test = [
            setup['admin'],
            setup['principal'],
            setup['faculty_user'],
            setup['student_user'],
            setup['parent_user'],
        ]

        for user in roles_to_test:
            authenticate(api_client, user)
            res = api_client.get(f'/api/v1/marks/exam-types/{target_id}/')
            assert res.status_code == status.HTTP_200_OK
            payload = res.json()['data']
            assert payload['id'] == target_id
            assert payload['name'] == 'Half-Yearly Examination'
            assert payload['is_active'] is True

        # Unauthenticated returns 401
        api_client.credentials()
        assert api_client.get(f'/api/v1/marks/exam-types/{target_id}/').status_code == status.HTTP_401_UNAUTHORIZED

        # Non-existent UUID returns 404
        authenticate(api_client, setup['admin'])
        random_id = str(uuid.uuid4())
        assert api_client.get(f'/api/v1/marks/exam-types/{random_id}/').status_code == status.HTTP_404_NOT_FOUND

    def test_exam_type_patch_admin_authorized(self, api_client, examtype_reconciliation_setup):
        """Admin can update name, weightage, and is_active on ExamType."""
        setup = examtype_reconciliation_setup
        authenticate(api_client, setup['admin'])
        target_id = str(setup['exam_type_1'].id)

        patch_payload = {
            'name': 'Cycle Test 1 (Revised)',
            'weightage': '15.00',
            'is_active': True,
        }

        res = api_client.patch(f'/api/v1/marks/exam-types/{target_id}/', data=patch_payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        updated = res.json()['data']
        assert updated['name'] == 'Cycle Test 1 (Revised)'
        assert Decimal(str(updated['weightage'])) == Decimal('15.00')

        # Verify database reflection
        et_db = ExamType.objects.get(id=target_id)
        assert et_db.name == 'Cycle Test 1 (Revised)'
        assert et_db.weightage == Decimal('15.00')

    def test_exam_type_patch_unauthorized_roles_blocked(self, api_client, examtype_reconciliation_setup):
        """Principal, Faculty, Student, and Parent are forbidden from mutating ExamTypes (403)."""
        setup = examtype_reconciliation_setup
        target_id = str(setup['exam_type_2'].id)

        unauthorized_users = [
            setup['principal'],
            setup['faculty_user'],
            setup['student_user'],
            setup['parent_user'],
        ]

        patch_payload = {'name': 'Unauthorized Mutation Attempt', 'weightage': '99.00'}

        for user in unauthorized_users:
            authenticate(api_client, user)
            res = api_client.patch(f'/api/v1/marks/exam-types/{target_id}/', data=patch_payload, format='json')
            assert res.status_code == status.HTTP_403_FORBIDDEN

            # PUT also blocked
            res_put = api_client.put(f'/api/v1/marks/exam-types/{target_id}/', data=patch_payload, format='json')
            assert res_put.status_code == status.HTTP_403_FORBIDDEN

        # Verify database was untouched
        assert ExamType.objects.get(id=target_id).name == 'Quarterly Examination'

    def test_exam_type_patch_duplicate_and_invalid_validation(self, api_client, examtype_reconciliation_setup):
        """Duplicate names, blank names, or invalid weightage are rejected with 400 Bad Request."""
        setup = examtype_reconciliation_setup
        authenticate(api_client, setup['admin'])
        target_id = str(setup['exam_type_1'].id)

        # 1. Duplicate name of another existing exam type
        dup_payload = {'name': 'Quarterly Examination'}
        res_dup = api_client.patch(f'/api/v1/marks/exam-types/{target_id}/', data=dup_payload, format='json')
        assert res_dup.status_code == status.HTTP_400_BAD_REQUEST

        # 2. Blank name
        blank_payload = {'name': '   '}
        res_blank = api_client.patch(f'/api/v1/marks/exam-types/{target_id}/', data=blank_payload, format='json')
        assert res_blank.status_code == status.HTTP_400_BAD_REQUEST

        # 3. Invalid weightage (> 100 or < 0)
        invalid_weight_high = {'weightage': '105.00'}
        assert api_client.patch(f'/api/v1/marks/exam-types/{target_id}/', data=invalid_weight_high, format='json').status_code == status.HTTP_400_BAD_REQUEST

        invalid_weight_low = {'weightage': '-5.00'}
        assert api_client.patch(f'/api/v1/marks/exam-types/{target_id}/', data=invalid_weight_low, format='json').status_code == status.HTTP_400_BAD_REQUEST

    def test_marks_submission_rejects_inactive_exam_type(self, api_client, examtype_reconciliation_setup):
        """Bulk marks submission rejects inactive ExamType with a business validation error."""
        setup = examtype_reconciliation_setup
        authenticate(api_client, setup['faculty_user'])

        inactive_id = str(setup['exam_type_inactive'].id)
        payload = {
            'records': [
                {
                    'student_id': setup['student'].student_id,
                    'subject_id': setup['subject'].code,
                    'exam_type_id': inactive_id,
                    'marks_obtained': '85.00',
                }
            ]
        }

        res = api_client.post('/api/v1/marks/bulk/', data=payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        err_body = str(res.json())
        assert 'inactive' in err_body.lower()

    def test_marks_submission_resolves_uuid_and_authoritative_name(self, api_client, examtype_reconciliation_setup):
        """Bulk marks submission successfully resolves both database UUID and canonical name."""
        setup = examtype_reconciliation_setup
        authenticate(api_client, setup['faculty_user'])

        # 1. Submit using database UUID
        active_uuid = str(setup['exam_type_3'].id)
        payload_uuid = {
            'records': [
                {
                    'student_id': setup['student'].student_id,
                    'subject_id': setup['subject'].code,
                    'exam_type_id': active_uuid,
                    'marks_obtained': '92.00',
                }
            ]
        }
        res_uuid = api_client.post('/api/v1/marks/bulk/', data=payload_uuid, format='json')
        assert res_uuid.status_code == status.HTTP_201_CREATED

        # Verify mark created
        mark_record = Mark.objects.filter(
            enrollment=setup['enrollment'],
            subject=setup['subject'],
            exam_type=setup['exam_type_3'],
        ).first()
        assert mark_record is not None
        assert mark_record.marks_obtained == Decimal('92.00')

        # 2. Submit using canonical name
        payload_name = {
            'records': [
                {
                    'student_id': setup['student'].student_id,
                    'subject_id': setup['subject'].code,
                    'exam_type_id': 'Final / Annual Examination',
                    'marks_obtained': '88.00',
                }
            ]
        }
        res_name = api_client.post('/api/v1/marks/bulk/', data=payload_name, format='json')
        assert res_name.status_code == status.HTTP_201_CREATED
        mark_annual = Mark.objects.filter(
            enrollment=setup['enrollment'],
            subject=setup['subject'],
            exam_type=setup['exam_type_4'],
        ).first()
        assert mark_annual is not None
        assert mark_annual.marks_obtained == Decimal('88.00')

    def test_authoritative_default_seeding_idempotent(self, db):
        """seed_dev_data creates all 4 authoritative default ExamTypes idempotently."""
        from django.core.management import call_command

        # First run
        call_command('seed_dev_data')

        expected_names = [
            'Cycle Test',
            'Quarterly Examination',
            'Half-Yearly Examination',
            'Final / Annual Examination',
        ]

        for name in expected_names:
            et = ExamType.objects.filter(name=name, is_active=True).first()
            assert et is not None, f"Expected default ExamType '{name}' not found."

        initial_count = ExamType.objects.count()

        # Re-run (idempotency check)
        call_command('seed_dev_data')
        assert ExamType.objects.count() == initial_count, "seed_dev_data created duplicate ExamTypes upon re-run!"
