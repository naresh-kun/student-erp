"""
Student ERP — Endpoint-Level RBAC Enforcement Test Suite
Phase 4 Task 4.4 Comprehensive Verification Suite

Verifies:
- All 5 canonical roles: Admin, Principal, Faculty, Student, Parent.
- HTTP semantics: 401 Unauthorized vs 403 Forbidden.
- Queryset-level scoping on list endpoints.
- Object-level authorization on detail endpoints.
- Direct URL / ID manipulation prevention (cross-student, cross-parent, cross-faculty).
- Mutation restrictions (POST, PATCH) per Task 4.3 matrix.
- Role tampering mitigation via request payload.
- Inactive user denial.
- Institutional directory behavior.
- Scaffolding endpoints (Allocation, Audit, Timetable, Calendar, Reports, Notifications).
"""

from decimal import Decimal
import uuid
import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
)
from apps.accounts.models import User, Role, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import Mark, ExamType


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def rbac_setup(db):
    """
    Sets up a full multi-tenant-like academic context with 2 sections, 2 faculties,
    2 students, 2 parents, and institutional executive users.
    """
    # 1. Roles
    role_admin, _ = Role.objects.get_or_create(name=ROLE_ADMIN, defaults={'description': 'Admin'})
    role_principal, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL, defaults={'description': 'Principal'})
    role_faculty, _ = Role.objects.get_or_create(name=ROLE_FACULTY, defaults={'description': 'Faculty'})
    role_student, _ = Role.objects.get_or_create(name=ROLE_STUDENT, defaults={'description': 'Student'})
    role_parent, _ = Role.objects.get_or_create(name=ROLE_PARENT, defaults={'description': 'Parent'})

    # 2. Executive Users
    admin_user = User.objects.create_user(
        username='admin_task44',
        email='admin_task44@erp.local',
        password='ValidPassword123!',
        role=role_admin,
        first_name='System',
        last_name='Admin',
    )
    principal_user = User.objects.create_user(
        username='principal_task44',
        email='principal_task44@erp.local',
        password='ValidPassword123!',
        role=role_principal,
        first_name='School',
        last_name='Principal',
    )

    now = timezone.now().date()

    # 3. Faculty Users & Profiles
    fac_user_a = User.objects.create_user(
        username='faculty_a_task44',
        email='faculty_a_task44@erp.local',
        password='ValidPassword123!',
        role=role_faculty,
        first_name='Faculty',
        last_name='Alpha',
    )
    faculty_a = Faculty.objects.create(
        user=fac_user_a,
        employee_code='EMP-T44-001',
        department='Science',
        designation='Senior Teacher',
        office_room='Room 101',
        joining_date=now,
        is_active=True,
    )

    fac_user_b = User.objects.create_user(
        username='faculty_b_task44',
        email='faculty_b_task44@erp.local',
        password='ValidPassword123!',
        role=role_faculty,
        first_name='Faculty',
        last_name='Beta',
    )
    faculty_b = Faculty.objects.create(
        user=fac_user_b,
        employee_code='EMP-T44-002',
        department='Commerce',
        designation='Lecturer',
        office_room='Room 102',
        joining_date=now,
        is_active=True,
    )

    inactive_fac_user = User.objects.create_user(
        username='faculty_inactive_task44',
        email='faculty_inactive_task44@erp.local',
        password='ValidPassword123!',
        role=role_faculty,
        first_name='Inactive',
        last_name='Teacher',
    )
    faculty_inactive = Faculty.objects.create(
        user=inactive_fac_user,
        employee_code='EMP-T44-003',
        department='Arts',
        designation='Trainee',
        office_room='Room 103',
        joining_date=now,
        is_active=False,
    )

    # 4. Parents & Users
    par_user_a = User.objects.create_user(
        username='parent_a_task44',
        email='parent_a_task44@erp.local',
        password='ValidPassword123!',
        role=role_parent,
        first_name='Parent',
        last_name='Alpha',
    )
    parent_a = Parent.objects.create(
        user=par_user_a,
        relation='Father',
        occupation='Engineer',
    )

    par_user_b = User.objects.create_user(
        username='parent_b_task44',
        email='parent_b_task44@erp.local',
        password='ValidPassword123!',
        role=role_parent,
        first_name='Parent',
        last_name='Beta',
    )
    parent_b = Parent.objects.create(
        user=par_user_b,
        relation='Mother',
        occupation='Doctor',
    )

    # 5. Students & Users
    dob = now - timezone.timedelta(days=365 * 16)
    stu_user_a = User.objects.create_user(
        username='student_a_task44',
        email='student_a_task44@erp.local',
        password='ValidPassword123!',
        role=role_student,
        first_name='Student',
        last_name='Alpha',
    )
    student_a = Student.objects.create(
        user=stu_user_a,
        parent=parent_a,
        student_id='STU202688001',
        admission_number='ADM-T44-001',
        roll_number='R-01',
        date_of_birth=dob,
        gender='Male',
        status='Active',
    )

    stu_user_b = User.objects.create_user(
        username='student_b_task44',
        email='student_b_task44@erp.local',
        password='ValidPassword123!',
        role=role_student,
        first_name='Student',
        last_name='Beta',
    )
    student_b = Student.objects.create(
        user=stu_user_b,
        parent=parent_b,
        student_id='STU202688002',
        admission_number='ADM-T44-002',
        roll_number='R-02',
        date_of_birth=dob,
        gender='Female',
        status='Active',
    )

    # 6. Academic Hierarchy
    now = timezone.now().date()
    ay = AcademicYear.objects.create(
        name='2026-2027-Task44',
        start_date=now,
        end_date=now + timezone.timedelta(days=365),
        is_current=True,
    )
    school_class = SchoolClass.objects.create(
        academic_year=ay,
        name='Grade 11 - Computer Science',
        code='G11-CS-T44',
    )
    section_a = Section.objects.create(
        school_class=school_class,
        name='A1',
        class_teacher=faculty_a,
        capacity=30,
    )
    section_b = Section.objects.create(
        school_class=school_class,
        name='A2',
        class_teacher=faculty_b,
        capacity=30,
    )

    enr_a = Enrollment.objects.create(
        student=student_a,
        section=section_a,
        academic_year=ay,
        status='Active',
    )
    enr_b = Enrollment.objects.create(
        student=student_b,
        section=section_b,
        academic_year=ay,
        status='Active',
    )

    subject = Subject.objects.create(
        name='Physics Task44',
        code='PHYS-T44',
        department='Science',
        weekly_periods=5,
    )
    exam_type = ExamType.objects.create(
        name='Midterm Exam T44',
        weightage=Decimal('30.00'),
    )

    # 7. Attendance Records
    att_a = Attendance.objects.create(
        enrollment=enr_a,
        date=now,
        status=ATTENDANCE_STATUS_PRESENT,
        recorded_by=fac_user_a,
        approved_by_faculty=faculty_a,
    )
    att_b_absent = Attendance.objects.create(
        enrollment=enr_b,
        date=now,
        status=ATTENDANCE_STATUS_ABSENT,
        recorded_by=fac_user_b,
        approved_by_faculty=faculty_b,
    )

    # 8. Mark Records
    mark_a = Mark.objects.create(
        enrollment=enr_a,
        subject=subject,
        exam_type=exam_type,
        marks_obtained=Decimal('88.50'),
        max_marks=Decimal('100.00'),
        grade='A2',
        evaluated_by=faculty_a,
    )
    mark_b = Mark.objects.create(
        enrollment=enr_b,
        subject=subject,
        exam_type=exam_type,
        marks_obtained=Decimal('92.00'),
        max_marks=Decimal('100.00'),
        grade='A1',
        evaluated_by=faculty_b,
    )

    # Inactive user
    inactive_user = User.objects.create_user(
        username='inactive_task44',
        email='inactive_task44@erp.local',
        password='ValidPassword123!',
        role=role_student,
        is_active=False,
    )

    return {
        'admin_user': admin_user,
        'principal_user': principal_user,
        'fac_user_a': fac_user_a,
        'fac_user_b': fac_user_b,
        'faculty_a': faculty_a,
        'faculty_b': faculty_b,
        'faculty_inactive': faculty_inactive,
        'par_user_a': par_user_a,
        'par_user_b': par_user_b,
        'parent_a': parent_a,
        'parent_b': parent_b,
        'stu_user_a': stu_user_a,
        'stu_user_b': stu_user_b,
        'student_a': student_a,
        'student_b': student_b,
        'ay': ay,
        'school_class': school_class,
        'section_a': section_a,
        'section_b': section_b,
        'enr_a': enr_a,
        'enr_b': enr_b,
        'subject': subject,
        'exam_type': exam_type,
        'att_a': att_a,
        'att_b_absent': att_b_absent,
        'mark_a': mark_a,
        'mark_b': mark_b,
        'inactive_user': inactive_user,
    }


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# ============================================================================
# 1. Public & Auth Foundation Endpoints Tests
# ============================================================================

@pytest.mark.django_db
class TestPublicAndAuthEndpoints:
    def test_health_publicly_accessible(self):
        client = APIClient()
        res = client.get('/api/health/')
        assert res.status_code == status.HTTP_200_OK

    def test_auth_me_unauthenticated_returns_401(self):
        client = APIClient()
        res = client.get('/api/v1/auth/me/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_auth_me_authenticated_all_roles(self, rbac_setup):
        for role_user in [
            rbac_setup['admin_user'],
            rbac_setup['principal_user'],
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(role_user)
            res = client.get('/api/v1/auth/me/')
            assert res.status_code == status.HTTP_200_OK
            assert res.data['success'] is True
            assert res.data['data']['username'] == role_user.username


# ============================================================================
# 2. Student Endpoints Tests (Section 5)
# ============================================================================

@pytest.mark.django_db
class TestStudentEndpointsRBAC:
    def test_student_list_unauthenticated_returns_401(self):
        client = APIClient()
        res = client.get('/api/v1/students/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_student_list_admin_and_principal_see_all(self, rbac_setup):
        # Admin global scope
        client_admin = auth_client(rbac_setup['admin_user'])
        res_admin = client_admin.get('/api/v1/students/')
        assert res_admin.status_code == status.HTTP_200_OK
        ids = [item['student_id'] for item in res_admin.data['data']]
        assert rbac_setup['student_a'].student_id in ids
        assert rbac_setup['student_b'].student_id in ids

        # Principal global scope
        client_prin = auth_client(rbac_setup['principal_user'])
        res_prin = client_prin.get('/api/v1/students/')
        assert res_prin.status_code == status.HTTP_200_OK
        prin_ids = [item['student_id'] for item in res_prin.data['data']]
        assert rbac_setup['student_a'].student_id in prin_ids
        assert rbac_setup['student_b'].student_id in prin_ids

    def test_student_list_faculty_assigned_scope(self, rbac_setup):
        # Faculty A is class teacher of Section A only
        client = auth_client(rbac_setup['fac_user_a'])
        res = client.get('/api/v1/students/')
        assert res.status_code == status.HTTP_200_OK
        ids = [item['student_id'] for item in res.data['data']]
        assert rbac_setup['student_a'].student_id in ids
        assert rbac_setup['student_b'].student_id not in ids

    def test_student_list_student_self_scope(self, rbac_setup):
        # Student A sees only Student A
        client = auth_client(rbac_setup['stu_user_a'])
        res = client.get('/api/v1/students/')
        assert res.status_code == status.HTTP_200_OK
        ids = [item['student_id'] for item in res.data['data']]
        assert ids == [rbac_setup['student_a'].student_id]

    def test_student_list_parent_linked_child_scope(self, rbac_setup):
        # Parent A sees only child Student A
        client = auth_client(rbac_setup['par_user_a'])
        res = client.get('/api/v1/students/')
        assert res.status_code == status.HTTP_200_OK
        ids = [item['student_id'] for item in res.data['data']]
        assert ids == [rbac_setup['student_a'].student_id]

    def test_student_create_mutations_restricted_to_admin(self, rbac_setup):
        new_stu_user = User.objects.create_user(
            username='new_stu_t44',
            email='new_stu_t44@erp.local',
            password='ValidPassword123!',
            role=Role.objects.get(name=ROLE_STUDENT),
        )
        payload = {
            'user_id': str(new_stu_user.id),
            'student_id': 'STU202688099',
            'admission_number': 'ADM-T44-099',
            'roll_number': 'R-99',
            'date_of_birth': '2010-05-15',
            'gender': 'Female',
            'emergency_contact': '+91-9999999999',
            'address': '123 Test Street, Academic Block',
            'status': 'Enrolled',
        }

        # Non-admins denied
        for user in [
            rbac_setup['principal_user'],
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(user)
            res = client.post('/api/v1/students/', data=payload, format='json')
            assert res.status_code == status.HTTP_403_FORBIDDEN

        # Admin allowed
        client_admin = auth_client(rbac_setup['admin_user'])
        res_admin = client_admin.post('/api/v1/students/', data=payload, format='json')
        assert res_admin.status_code == status.HTTP_201_CREATED
        assert res_admin.data['data']['student_id'] == 'STU202688099'

    def test_student_detail_cross_access_prevented(self, rbac_setup):
        student_b_id = str(rbac_setup['student_b'].id)
        student_b_code = rbac_setup['student_b'].student_id

        # Student A attempting to view Student B by UUID -> 403
        client_stu_a = auth_client(rbac_setup['stu_user_a'])
        res_uuid = client_stu_a.get(f'/api/v1/students/{student_b_id}/')
        assert res_uuid.status_code == status.HTTP_403_FORBIDDEN

        # Student A attempting to view Student B by Student ID -> 403
        res_code = client_stu_a.get(f'/api/v1/students/{student_b_code}/')
        assert res_code.status_code == status.HTTP_403_FORBIDDEN

        # Parent A attempting to view Student B -> 403
        client_par_a = auth_client(rbac_setup['par_user_a'])
        assert client_par_a.get(f'/api/v1/students/{student_b_id}/').status_code == status.HTTP_403_FORBIDDEN

        # Faculty A attempting to view Student B (in Section B) -> 403
        client_fac_a = auth_client(rbac_setup['fac_user_a'])
        assert client_fac_a.get(f'/api/v1/students/{student_b_id}/').status_code == status.HTTP_403_FORBIDDEN

        # Authorized accesses
        assert client_stu_a.get(f'/api/v1/students/{rbac_setup["student_a"].id}/').status_code == status.HTTP_200_OK
        assert client_par_a.get(f'/api/v1/students/{rbac_setup["student_a"].id}/').status_code == status.HTTP_200_OK
        assert client_fac_a.get(f'/api/v1/students/{rbac_setup["student_a"].id}/').status_code == status.HTTP_200_OK

    def test_student_patch_admin_only(self, rbac_setup):
        student_a_id = str(rbac_setup['student_a'].id)
        patch_data = {'roll_number': 'R-01-UPDATED'}

        # Non-admins forbidden
        for user in [
            rbac_setup['principal_user'],
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(user)
            res = client.patch(f'/api/v1/students/{student_a_id}/', data=patch_data, format='json')
            assert res.status_code == status.HTTP_403_FORBIDDEN

        # Admin allowed
        client_admin = auth_client(rbac_setup['admin_user'])
        res_admin = client_admin.patch(f'/api/v1/students/{student_a_id}/', data=patch_data, format='json')
        assert res_admin.status_code == status.HTTP_200_OK
        assert res_admin.data['data']['roll_number'] == 'R-01-UPDATED'


# ============================================================================
# 3. Parent Endpoints Tests (Section 6)
# ============================================================================

@pytest.mark.django_db
class TestParentEndpointsRBAC:
    def test_parents_list_unauthenticated_returns_401(self):
        client = APIClient()
        assert client.get('/api/v1/parents/').status_code == status.HTTP_401_UNAUTHORIZED

    def test_parents_list_scoping(self, rbac_setup):
        # Admin / Principal see all parents
        client_admin = auth_client(rbac_setup['admin_user'])
        res_admin = client_admin.get('/api/v1/parents/')
        assert res_admin.status_code == status.HTTP_200_OK
        p_ids = [item['id'] for item in res_admin.data['data']]
        assert str(rbac_setup['parent_a'].id) in p_ids
        assert str(rbac_setup['parent_b'].id) in p_ids

        # Faculty A sees only Parent A (child in assigned Section A)
        client_fac = auth_client(rbac_setup['fac_user_a'])
        res_fac = client_fac.get('/api/v1/parents/')
        assert res_fac.status_code == status.HTTP_200_OK
        fac_p_ids = [item['id'] for item in res_fac.data['data']]
        assert str(rbac_setup['parent_a'].id) in fac_p_ids
        assert str(rbac_setup['parent_b'].id) not in fac_p_ids

        # Parent A sees only self
        client_par_a = auth_client(rbac_setup['par_user_a'])
        res_par_a = client_par_a.get('/api/v1/parents/')
        assert res_par_a.status_code == status.HTTP_200_OK
        par_ids = [item['id'] for item in res_par_a.data['data']]
        assert par_ids == [str(rbac_setup['parent_a'].id)]

    def test_parents_detail_cross_access_prevented(self, rbac_setup):
        parent_b_id = str(rbac_setup['parent_b'].id)

        # Parent A accessing Parent B -> 403
        client_par_a = auth_client(rbac_setup['par_user_a'])
        res = client_par_a.get(f'/api/v1/parents/{parent_b_id}/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # Parent A accessing Parent A -> 200
        res_own = client_par_a.get(f'/api/v1/parents/{rbac_setup["parent_a"].id}/')
        assert res_own.status_code == status.HTTP_200_OK

    def test_parents_children_cross_access_prevented(self, rbac_setup):
        parent_b_id = str(rbac_setup['parent_b'].id)

        # Parent A requesting Parent B's children -> 403
        client_par_a = auth_client(rbac_setup['par_user_a'])
        res = client_par_a.get(f'/api/v1/parents/{parent_b_id}/children/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # Parent A requesting own children -> 200
        res_own = client_par_a.get(f'/api/v1/parents/{rbac_setup["parent_a"].id}/children/')
        assert res_own.status_code == status.HTTP_200_OK
        stu_ids = [item['student_id'] for item in res_own.data['data']]
        assert stu_ids == [rbac_setup['student_a'].student_id]


# ============================================================================
# 4. Faculty Endpoints Tests (Section 7)
# ============================================================================

@pytest.mark.django_db
class TestFacultyEndpointsRBAC:
    def test_faculty_directory_all_5_roles_active_only(self, rbac_setup):
        # All 5 authenticated roles can view directory
        for user in [
            rbac_setup['admin_user'],
            rbac_setup['principal_user'],
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(user)
            res = client.get('/api/v1/faculty/')
            assert res.status_code == status.HTTP_200_OK
            emp_codes = [f['employee_code'] for f in res.data['data']]
            assert 'EMP-T44-001' in emp_codes
            assert 'EMP-T44-002' in emp_codes

            # For non-admin/principal, inactive faculty must not be returned
            if user in [rbac_setup['fac_user_a'], rbac_setup['stu_user_a'], rbac_setup['par_user_a']]:
                assert 'EMP-T44-003' not in emp_codes

    def test_faculty_create_admin_only(self, rbac_setup):
        new_user = User.objects.create_user(
            username='new_faculty_user_t44',
            email='new_fac_t44@erp.local',
            password='ValidPassword123!',
            role=Role.objects.get(name=ROLE_FACULTY),
        )
        payload = {
            'user_id': str(new_user.id),
            'employee_code': 'EMP-T44-999',
            'department': 'Mathematics',
            'designation': 'Assistant Professor',
            'office_room': 'Room 303',
            'joining_date': str(timezone.now().date()),
        }

        # Non-admins forbidden
        for user in [
            rbac_setup['principal_user'],
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(user)
            assert client.post('/api/v1/faculty/', data=payload, format='json').status_code == status.HTTP_403_FORBIDDEN

        # Admin allowed
        client_admin = auth_client(rbac_setup['admin_user'])
        res_admin = client_admin.post('/api/v1/faculty/', data=payload, format='json')
        assert res_admin.status_code == status.HTTP_201_CREATED

    def test_faculty_patch_self_vs_cross_vs_privileged_fields(self, rbac_setup):
        fac_a_id = str(rbac_setup['faculty_a'].id)
        fac_b_id = str(rbac_setup['faculty_b'].id)

        # Faculty A attempting to edit Faculty B -> 403
        client_fac_a = auth_client(rbac_setup['fac_user_a'])
        res_cross = client_fac_a.patch(f'/api/v1/faculty/{fac_b_id}/', data={'office_room': 'Room 999'}, format='json')
        assert res_cross.status_code == status.HTTP_403_FORBIDDEN

        # Faculty A editing self bio/office -> 200
        res_self = client_fac_a.patch(f'/api/v1/faculty/{fac_a_id}/', data={'office_room': 'Room 101-B'}, format='json')
        assert res_self.status_code == status.HTTP_200_OK
        assert res_self.data['data']['office_room'] == 'Room 101-B'

        # Faculty A attempting to mutate administrative fields (employee_code, is_active) -> 403
        res_priv = client_fac_a.patch(f'/api/v1/faculty/{fac_a_id}/', data={'employee_code': 'HACKED'}, format='json')
        assert res_priv.status_code == status.HTTP_403_FORBIDDEN

        # Admin can update any faculty and administrative fields
        client_admin = auth_client(rbac_setup['admin_user'])
        res_admin = client_admin.patch(f'/api/v1/faculty/{fac_a_id}/', data={'department': 'Advanced Science'}, format='json')
        assert res_admin.status_code == status.HTTP_200_OK


# ============================================================================
# 5. Attendance Endpoints Tests (Section 9)
# ============================================================================

@pytest.mark.django_db
class TestAttendanceEndpointsRBAC:
    def test_attendance_list_scoping(self, rbac_setup):
        # Admin / Principal see all attendance
        client_admin = auth_client(rbac_setup['admin_user'])
        res_admin = client_admin.get('/api/v1/attendance/')
        assert res_admin.status_code == status.HTTP_200_OK
        att_ids = [item['id'] for item in res_admin.data['data']]
        assert str(rbac_setup['att_a'].id) in att_ids
        assert str(rbac_setup['att_b_absent'].id) in att_ids

        # Faculty A sees only Section A attendance
        client_fac_a = auth_client(rbac_setup['fac_user_a'])
        res_fac_a = client_fac_a.get('/api/v1/attendance/')
        assert res_fac_a.status_code == status.HTTP_200_OK
        fac_att_ids = [item['id'] for item in res_fac_a.data['data']]
        assert str(rbac_setup['att_a'].id) in fac_att_ids
        assert str(rbac_setup['att_b_absent'].id) not in fac_att_ids

        # Student A sees only self attendance
        client_stu_a = auth_client(rbac_setup['stu_user_a'])
        res_stu_a = client_stu_a.get('/api/v1/attendance/')
        assert res_stu_a.status_code == status.HTTP_200_OK
        stu_att_ids = [item['id'] for item in res_stu_a.data['data']]
        assert stu_att_ids == [str(rbac_setup['att_a'].id)]

        # Parent A sees only child A attendance
        client_par_a = auth_client(rbac_setup['par_user_a'])
        res_par_a = client_par_a.get('/api/v1/attendance/')
        assert res_par_a.status_code == status.HTTP_200_OK
        par_att_ids = [item['id'] for item in res_par_a.data['data']]
        assert par_att_ids == [str(rbac_setup['att_a'].id)]

    def test_attendance_bulk_mark_assignment_boundaries(self, rbac_setup):
        today = str(timezone.now().date())
        payload_student_b = {
            'date': today,
            'records': [
                {'student_id': rbac_setup['student_b'].student_id, 'status': 'PRESENT'},
            ],
        }

        # Faculty A attempting to record attendance for Student B (in Section B) -> 403
        client_fac_a = auth_client(rbac_setup['fac_user_a'])
        res_cross = client_fac_a.post('/api/v1/attendance/bulk/', data=payload_student_b, format='json')
        assert res_cross.status_code == status.HTTP_403_FORBIDDEN

        # Student & Parent forbidden from marking attendance -> 403
        client_stu = auth_client(rbac_setup['stu_user_a'])
        assert client_stu.post('/api/v1/attendance/bulk/', data=payload_student_b, format='json').status_code == status.HTTP_403_FORBIDDEN

        # Faculty A recording attendance for Student A (in assigned Section A) -> 201
        payload_student_a = {
            'date': today,
            'records': [
                {'student_id': rbac_setup['student_a'].student_id, 'status': 'PRESENT'},
            ],
        }
        res_assigned = client_fac_a.post('/api/v1/attendance/bulk/', data=payload_student_a, format='json')
        assert res_assigned.status_code == status.HTTP_201_CREATED

    def test_absentees_endpoint_rbac(self, rbac_setup):
        # Admin & Principal allowed
        assert auth_client(rbac_setup['admin_user']).get('/api/v1/attendance/absentees/').status_code == status.HTTP_200_OK
        assert auth_client(rbac_setup['principal_user']).get('/api/v1/attendance/absentees/').status_code == status.HTTP_200_OK

        # Faculty allowed but scoped
        client_fac_b = auth_client(rbac_setup['fac_user_b'])
        res_fac_b = client_fac_b.get('/api/v1/attendance/absentees/')
        assert res_fac_b.status_code == status.HTTP_200_OK
        absent_ids = [item['id'] for item in res_fac_b.data['data']]
        assert str(rbac_setup['att_b_absent'].id) in absent_ids

        # Students and Parents forbidden from school absentees endpoint -> 403
        assert auth_client(rbac_setup['stu_user_a']).get('/api/v1/attendance/absentees/').status_code == status.HTTP_403_FORBIDDEN
        assert auth_client(rbac_setup['par_user_a']).get('/api/v1/attendance/absentees/').status_code == status.HTTP_403_FORBIDDEN

    def test_leave_application_student_identity_enforced(self, rbac_setup):
        client_stu_a = auth_client(rbac_setup['stu_user_a'])
        today = timezone.now().date()

        # Student A attempting to submit leave for Student B by passing Student B ID -> 403
        tampered_payload = {
            'student': str(rbac_setup['student_b'].id),
            'leave_type': 'Medical',
            'start_date': str(today),
            'end_date': str(today + timezone.timedelta(days=1)),
            'reason': 'Impersonation attempt',
        }
        res_tampered = client_stu_a.post('/api/v1/attendance/leaves/', data=tampered_payload, format='json')
        assert res_tampered.status_code == status.HTTP_403_FORBIDDEN

        # Student A submitting for self -> 201
        valid_payload = {
            'leave_type': 'Medical',
            'start_date': str(today),
            'end_date': str(today + timezone.timedelta(days=1)),
            'reason': 'Fever',
        }
        res_valid = client_stu_a.post('/api/v1/attendance/leaves/', data=valid_payload, format='json')
        assert res_valid.status_code == status.HTTP_201_CREATED
        assert str(res_valid.data['data']['student']) == str(rbac_setup['student_a'].id)


# ============================================================================
# 6. Marks Endpoints Tests (Section 10)
# ============================================================================

@pytest.mark.django_db
class TestMarksEndpointsRBAC:
    def test_marks_list_scoping(self, rbac_setup):
        # Admin & Principal see all marks
        res_admin = auth_client(rbac_setup['admin_user']).get('/api/v1/marks/')
        assert res_admin.status_code == status.HTTP_200_OK
        m_ids = [m['id'] for m in res_admin.data['data']]
        assert str(rbac_setup['mark_a'].id) in m_ids
        assert str(rbac_setup['mark_b'].id) in m_ids

        # Faculty A sees only Mark A
        res_fac_a = auth_client(rbac_setup['fac_user_a']).get('/api/v1/marks/')
        assert res_fac_a.status_code == status.HTTP_200_OK
        fac_m_ids = [m['id'] for m in res_fac_a.data['data']]
        assert str(rbac_setup['mark_a'].id) in fac_m_ids
        assert str(rbac_setup['mark_b'].id) not in fac_m_ids

        # Student A sees only self mark
        res_stu_a = auth_client(rbac_setup['stu_user_a']).get('/api/v1/marks/')
        assert res_stu_a.status_code == status.HTTP_200_OK
        assert [m['id'] for m in res_stu_a.data['data']] == [str(rbac_setup['mark_a'].id)]

        # Parent A sees only child A mark
        res_par_a = auth_client(rbac_setup['par_user_a']).get('/api/v1/marks/')
        assert res_par_a.status_code == status.HTTP_200_OK
        assert [m['id'] for m in res_par_a.data['data']] == [str(rbac_setup['mark_a'].id)]

    def test_marks_bulk_enter_faculty_assignment_boundaries(self, rbac_setup):
        payload_student_b = {
            'records': [{
                'student_id': rbac_setup['student_b'].student_id,
                'subject_id': str(rbac_setup['subject'].id),
                'exam_type_id': str(rbac_setup['exam_type'].id),
                'marks_obtained': '75.00',
                'max_marks': '100.00',
            }]
        }

        # Faculty A attempting to enter marks for Student B (in Section B) -> 403
        client_fac_a = auth_client(rbac_setup['fac_user_a'])
        res_cross = client_fac_a.post('/api/v1/marks/bulk/', data=payload_student_b, format='json')
        assert res_cross.status_code == status.HTTP_403_FORBIDDEN

        # Students & Parents forbidden from entering marks -> 403
        assert auth_client(rbac_setup['stu_user_a']).post('/api/v1/marks/bulk/', data=payload_student_b, format='json').status_code == status.HTTP_403_FORBIDDEN
        assert auth_client(rbac_setup['par_user_a']).post('/api/v1/marks/bulk/', data=payload_student_b, format='json').status_code == status.HTTP_403_FORBIDDEN

        # Faculty A entering marks for Student A -> 201
        payload_student_a = {
            'records': [{
                'student_id': rbac_setup['student_a'].student_id,
                'subject_id': str(rbac_setup['subject'].id),
                'exam_type_id': str(rbac_setup['exam_type'].id),
                'marks_obtained': '85.00',
                'max_marks': '100.00',
            }]
        }
        res_valid = client_fac_a.post('/api/v1/marks/bulk/', data=payload_student_a, format='json')
        assert res_valid.status_code == status.HTTP_201_CREATED

    def test_report_card_cross_student_access_prevented(self, rbac_setup):
        stu_b_code = rbac_setup['student_b'].student_id

        # Student A requesting Student B's report card -> 403
        client_stu_a = auth_client(rbac_setup['stu_user_a'])
        res = client_stu_a.get(f'/api/v1/marks/report-card/{stu_b_code}/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # Student A requesting own report card -> 200
        res_own = client_stu_a.get(f'/api/v1/marks/report-card/{rbac_setup["student_a"].student_id}/')
        assert res_own.status_code == status.HTTP_200_OK

        # Parent A requesting Student B's report card -> 403
        client_par_a = auth_client(rbac_setup['par_user_a'])
        assert client_par_a.get(f'/api/v1/marks/report-card/{stu_b_code}/').status_code == status.HTTP_403_FORBIDDEN

        # Parent A requesting own child's report card -> 200
        assert client_par_a.get(f'/api/v1/marks/report-card/{rbac_setup["student_a"].student_id}/').status_code == status.HTTP_200_OK

    def test_exam_types_create_admin_only(self, rbac_setup):
        payload = {'name': 'Final Exam T44', 'weightage': '50.00'}

        # Non-admins forbidden
        for user in [
            rbac_setup['principal_user'],
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(user)
            assert client.post('/api/v1/marks/exam-types/', data=payload, format='json').status_code == status.HTTP_403_FORBIDDEN

        # Admin allowed
        client_admin = auth_client(rbac_setup['admin_user'])
        assert client_admin.post('/api/v1/marks/exam-types/', data=payload, format='json').status_code == status.HTTP_201_CREATED


# ============================================================================
# 7. Academics Endpoints Tests (Section 8)
# ============================================================================

@pytest.mark.django_db
class TestAcademicsEndpointsRBAC:
    def test_academics_views_read_permitted_for_all_roles(self, rbac_setup):
        for user in [
            rbac_setup['admin_user'],
            rbac_setup['principal_user'],
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(user)
            assert client.get('/api/v1/classes/').status_code == status.HTTP_200_OK
            assert client.get('/api/v1/subjects/').status_code == status.HTTP_200_OK
            assert client.get('/api/v1/academics/years/').status_code == status.HTTP_200_OK

    def test_academics_mutations_admin_and_principal_only(self, rbac_setup):
        class_payload = {
            'academic_year': str(rbac_setup['ay'].id),
            'name': 'Grade 12 - Commerce',
            'code': 'G12-COMM-T44',
        }

        # Faculty, Student, Parent forbidden -> 403
        for user in [
            rbac_setup['fac_user_a'],
            rbac_setup['stu_user_a'],
            rbac_setup['par_user_a'],
        ]:
            client = auth_client(user)
            assert client.post('/api/v1/classes/', data=class_payload, format='json').status_code == status.HTTP_403_FORBIDDEN

        # Admin and Principal allowed
        assert auth_client(rbac_setup['admin_user']).post('/api/v1/classes/', data=class_payload, format='json').status_code == status.HTTP_201_CREATED


# ============================================================================
# 8. Scaffolding Endpoints Tests (Sections 11–14)
# ============================================================================

@pytest.mark.django_db
class TestScaffoldingEndpointsRBAC:
    def test_allocation_view_rbac(self, rbac_setup):
        # Admin, Principal, Faculty allowed
        assert auth_client(rbac_setup['admin_user']).get('/api/v1/allocation/').status_code == status.HTTP_200_OK
        assert auth_client(rbac_setup['principal_user']).get('/api/v1/allocation/').status_code == status.HTTP_200_OK
        assert auth_client(rbac_setup['fac_user_a']).get('/api/v1/allocation/').status_code == status.HTTP_200_OK

        # Student & Parent forbidden -> 403
        assert auth_client(rbac_setup['stu_user_a']).get('/api/v1/allocation/').status_code == status.HTTP_403_FORBIDDEN
        assert auth_client(rbac_setup['par_user_a']).get('/api/v1/allocation/').status_code == status.HTTP_403_FORBIDDEN

    def test_audit_view_rbac(self, rbac_setup):
        # Admin and Principal allowed
        assert auth_client(rbac_setup['admin_user']).get('/api/v1/audit/').status_code == status.HTTP_200_OK
        assert auth_client(rbac_setup['principal_user']).get('/api/v1/audit/').status_code == status.HTTP_200_OK

        # Faculty, Student, Parent forbidden -> 403
        assert auth_client(rbac_setup['fac_user_a']).get('/api/v1/audit/').status_code == status.HTTP_403_FORBIDDEN
        assert auth_client(rbac_setup['stu_user_a']).get('/api/v1/audit/').status_code == status.HTTP_403_FORBIDDEN
        assert auth_client(rbac_setup['par_user_a']).get('/api/v1/audit/').status_code == status.HTTP_403_FORBIDDEN

    def test_scaffolding_read_endpoints_require_authentication(self):
        client = APIClient()
        endpoints = [
            '/api/v1/allocation/',
            '/api/v1/audit/',
            '/api/v1/timetable/',
            '/api/v1/calendar/events/',
            '/api/v1/reports/',
            '/api/v1/notifications/',
        ]
        for url in endpoints:
            assert client.get(url).status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# 9. Security & Role Tampering Tests
# ============================================================================

@pytest.mark.django_db
class TestSecurityAndRoleTampering:
    def test_role_tampering_in_payload_ignored(self, rbac_setup):
        # Student attempting to elevate to Admin in student update payload
        client_stu = auth_client(rbac_setup['stu_user_a'])
        res = client_stu.patch(
            f'/api/v1/students/{rbac_setup["student_a"].id}/',
            data={'role': 'Admin', 'roll_number': 'R-HACKED'},
            format='json',
        )
        assert res.status_code == status.HTTP_403_FORBIDDEN
        # Ensure role on database remains Student
        rbac_setup['stu_user_a'].refresh_from_db()
        assert rbac_setup['stu_user_a'].role.name == ROLE_STUDENT

    def test_inactive_user_denied(self, rbac_setup):
        client = auth_client(rbac_setup['inactive_user'])
        # Inactive user must be rejected with 401 or 403
        res = client.get('/api/v1/students/')
        assert res.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
