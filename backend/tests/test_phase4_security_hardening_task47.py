"""
Student ERP — Phase 4 Task 4.7 Security Hardening & Regression Verification
Authoritative verification suite covering:
1. Five-Role Complete Authentication Lifecycle (Admin, Principal, Faculty, Student, Parent)
2. Student ID Normalization & Format Enforcement
3. Parent Authentication via Linked Child
4. JWT Lifecycle, Claims, and Tampering Rejection
5. HTTP 401 Unauthorized vs 403 Forbidden Semantics
6. Authoritative RBAC Matrix Verification
7. Object-Level Authorization & Queryset Scoping
8. Privilege Escalation & Payload Tampering Mitigation
9. Cross-Role Access Denial
10. Security Regression Invariants (no password leakage, inactive users, brute force note)
"""

from datetime import date, timedelta
from decimal import Decimal
import uuid
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

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
from apps.academics.models import (
    AcademicYear,
    SchoolClass,
    Section,
    Subject,
    Enrollment,
    TeachingAssignment,
)
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import ExamType, Mark
from apps.homework.models import Homework


# ============================================================================
# Test Fixtures & Utilities
# ============================================================================

def make_client(user=None):
    """Helper to return an APIClient, optionally pre-authenticated with user's JWT."""
    client = APIClient()
    if user:
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role.name if user.role else 'Unknown'
        refresh['username'] = user.username
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.fixture
def t47_data(db):
    """Full academic & RBAC fixture setup for Task 4.7 verification."""
    # 1. Canonical Roles
    r_admin, _ = Role.objects.get_or_create(name=ROLE_ADMIN, defaults={'description': 'Admin'})
    r_principal, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL, defaults={'description': 'Principal'})
    r_faculty, _ = Role.objects.get_or_create(name=ROLE_FACULTY, defaults={'description': 'Faculty'})
    r_student, _ = Role.objects.get_or_create(name=ROLE_STUDENT, defaults={'description': 'Student'})
    r_parent, _ = Role.objects.get_or_create(name=ROLE_PARENT, defaults={'description': 'Parent'})

    pw = 'SecurePass123!'
    today = date(2026, 10, 6)

    # 2. Institutional Staff
    u_admin = User.objects.create_user(
        username='t47_admin', email='t47_admin@erp.local', password=pw,
        role=r_admin, first_name='T47', last_name='Admin'
    )
    u_principal = User.objects.create_user(
        username='t47_principal', email='t47_principal@erp.local', password=pw,
        role=r_principal, first_name='T47', last_name='Principal'
    )

    # 3. Faculty Users & Profiles
    u_fac_a = User.objects.create_user(
        username='t47_fac_a', email='t47_fac_a@erp.local', password=pw,
        role=r_faculty, first_name='Faculty', last_name='Alpha'
    )
    fac_a = Faculty.objects.create(
        user=u_fac_a, employee_code='T47-EMP-001', department='Science',
        designation='Senior Teacher', joining_date=today, is_active=True
    )

    u_fac_b = User.objects.create_user(
        username='t47_fac_b', email='t47_fac_b@erp.local', password=pw,
        role=r_faculty, first_name='Faculty', last_name='Beta'
    )
    fac_b = Faculty.objects.create(
        user=u_fac_b, employee_code='T47-EMP-002', department='Commerce',
        designation='Lecturer', joining_date=today, is_active=True
    )

    u_fac_inact = User.objects.create_user(
        username='t47_fac_inact', email='t47_fac_inact@erp.local', password=pw,
        role=r_faculty, first_name='Inactive', last_name='Faculty', is_active=False
    )
    fac_inact = Faculty.objects.create(
        user=u_fac_inact, employee_code='T47-EMP-003', department='Arts',
        designation='Trainee', joining_date=today, is_active=False
    )

    # 4. Parents & Users
    u_par_a = User.objects.create_user(
        username='t47_par_a', email='t47_par_a@erp.local', password=pw,
        role=r_parent, first_name='Parent', last_name='Alpha'
    )
    par_a = Parent.objects.create(user=u_par_a, relation='Father', occupation='Engineer')

    u_par_b = User.objects.create_user(
        username='t47_par_b', email='t47_par_b@erp.local', password=pw,
        role=r_parent, first_name='Parent', last_name='Beta'
    )
    par_b = Parent.objects.create(user=u_par_b, relation='Mother', occupation='Doctor')

    u_par_inact = User.objects.create_user(
        username='t47_par_inact', email='t47_par_inact@erp.local', password=pw,
        role=r_parent, first_name='Inactive', last_name='Parent', is_active=False
    )
    par_inact = Parent.objects.create(user=u_par_inact, relation='Guardian', occupation='Self')

    # 5. Students & Users
    dob = today - timedelta(days=365 * 15)

    u_stu_a1 = User.objects.create_user(
        username='t47_stu_a1', email='t47_stu_a1@erp.local', password=pw,
        role=r_student, first_name='Student', last_name='Alpha1'
    )
    stu_a1 = Student.objects.create(
        user=u_stu_a1, parent=par_a, student_id='STU202647001',
        admission_number='ADM-T47-001', roll_number='R-01',
        date_of_birth=dob, gender='Male', status='Active'
    )

    u_stu_a2 = User.objects.create_user(
        username='t47_stu_a2', email='t47_stu_a2@erp.local', password=pw,
        role=r_student, first_name='Student', last_name='Alpha2'
    )
    stu_a2 = Student.objects.create(
        user=u_stu_a2, parent=par_a, student_id='STU202647002',
        admission_number='ADM-T47-002', roll_number='R-02',
        date_of_birth=dob, gender='Female', status='Active'
    )

    u_stu_b1 = User.objects.create_user(
        username='t47_stu_b1', email='t47_stu_b1@erp.local', password=pw,
        role=r_student, first_name='Student', last_name='Beta1'
    )
    stu_b1 = Student.objects.create(
        user=u_stu_b1, parent=par_b, student_id='STU202647003',
        admission_number='ADM-T47-003', roll_number='R-03',
        date_of_birth=dob, gender='Male', status='Active'
    )

    u_stu_inact = User.objects.create_user(
        username='t47_stu_inact', email='t47_stu_inact@erp.local', password=pw,
        role=r_student, first_name='Inactive', last_name='Student', is_active=False
    )
    stu_inact = Student.objects.create(
        user=u_stu_inact, parent=par_inact, student_id='STU202647004',
        admission_number='ADM-T47-004', roll_number='R-04',
        date_of_birth=dob, gender='Female', status='Active'
    )

    u_stu_wthd = User.objects.create_user(
        username='t47_stu_wthd', email='t47_stu_wthd@erp.local', password=pw,
        role=r_student, first_name='Withdrawn', last_name='Student'
    )
    stu_wthd = Student.objects.create(
        user=u_stu_wthd, parent=par_b, student_id='STU202647005',
        admission_number='ADM-T47-005', roll_number='R-05',
        date_of_birth=dob, gender='Male', status='Withdrawn'
    )

    # 6. Academic Hierarchy
    ay = AcademicYear.objects.create(
        name='2026-2027-T47', start_date=today,
        end_date=today + timedelta(days=365), is_current=True
    )
    sc = SchoolClass.objects.create(academic_year=ay, name='Class 10 T47', code='C10-T47')
    sec_a = Section.objects.create(school_class=sc, name='10-A-T47', class_teacher=fac_a, capacity=30)
    sec_b = Section.objects.create(school_class=sc, name='10-B-T47', class_teacher=fac_b, capacity=30)

    enr_a1 = Enrollment.objects.create(student=stu_a1, section=sec_a, academic_year=ay, status='Active')
    enr_a2 = Enrollment.objects.create(student=stu_a2, section=sec_b, academic_year=ay, status='Active')
    enr_b1 = Enrollment.objects.create(student=stu_b1, section=sec_b, academic_year=ay, status='Active')

    subj_phys = Subject.objects.create(name='Physics T47', code='PHYS-T47', department='Science', weekly_periods=4)
    subj_math = Subject.objects.create(name='Math T47', code='MATH-T47', department='Mathematics', weekly_periods=4)

    ta_a = TeachingAssignment.objects.create(
        academic_year=ay, section=sec_a, subject=subj_phys, faculty=fac_a, is_active=True
    )
    ta_b = TeachingAssignment.objects.create(
        academic_year=ay, section=sec_b, subject=subj_phys, faculty=fac_b, is_active=True
    )

    exam = ExamType.objects.create(name='Midterm T47', weightage=Decimal('25.00'))

    att_a1 = Attendance.objects.create(
        enrollment=enr_a1, date=today, status=ATTENDANCE_STATUS_PRESENT,
        recorded_by=u_fac_a, approved_by_faculty=fac_a
    )
    att_b1 = Attendance.objects.create(
        enrollment=enr_b1, date=today, status=ATTENDANCE_STATUS_ABSENT,
        recorded_by=u_fac_b, approved_by_faculty=fac_b
    )

    hw_pub_a = Homework.objects.create(
        academic_year=ay,
        school_class=sc,
        section=sec_a,
        subject=subj_phys,
        faculty=fac_a,
        title='Physics HW A Published',
        description='HW A details',
        assigned_date=today,
        due_date=today + timedelta(days=3),
        status='PUBLISHED',
    )
    hw_draft_a = Homework.objects.create(
        academic_year=ay,
        school_class=sc,
        section=sec_a,
        subject=subj_phys,
        faculty=fac_a,
        title='Physics HW A Draft',
        description='HW A draft details',
        assigned_date=today,
        due_date=today + timedelta(days=3),
        status='DRAFT',
    )
    hw_pub_b = Homework.objects.create(
        academic_year=ay,
        school_class=sc,
        section=sec_b,
        subject=subj_phys,
        faculty=fac_b,
        title='Physics HW B Published',
        description='HW B details',
        assigned_date=today,
        due_date=today + timedelta(days=4),
        status='PUBLISHED',
    )

    return {
        'pw': pw,
        'today': today,
        'roles': {ROLE_ADMIN: r_admin, ROLE_PRINCIPAL: r_principal, ROLE_FACULTY: r_faculty, ROLE_STUDENT: r_student, ROLE_PARENT: r_parent},
        'u_admin': u_admin,
        'u_principal': u_principal,
        'u_fac_a': u_fac_a,
        'fac_a': fac_a,
        'u_fac_b': u_fac_b,
        'fac_b': fac_b,
        'u_fac_inact': u_fac_inact,
        'u_par_a': u_par_a,
        'par_a': par_a,
        'u_par_b': u_par_b,
        'par_b': par_b,
        'u_par_inact': u_par_inact,
        'u_stu_a1': u_stu_a1,
        'stu_a1': stu_a1,
        'u_stu_a2': u_stu_a2,
        'stu_a2': stu_a2,
        'u_stu_b1': u_stu_b1,
        'stu_b1': stu_b1,
        'u_stu_inact': u_stu_inact,
        'u_stu_wthd': u_stu_wthd,
        'ay': ay,
        'sc': sc,
        'sec_a': sec_a,
        'sec_b': sec_b,
        'enr_a1': enr_a1,
        'enr_a2': enr_a2,
        'enr_b1': enr_b1,
        'subj_phys': subj_phys,
        'subj_math': subj_math,
        'ta_a': ta_a,
        'ta_b': ta_b,
        'exam': exam,
        'att_a1': att_a1,
        'att_b1': att_b1,
        'hw_pub_a': hw_pub_a,
        'hw_draft_a': hw_draft_a,
        'hw_pub_b': hw_pub_b,
    }


# ============================================================================
# 1. Five-Role Authentication Lifecycle
# ============================================================================

@pytest.mark.django_db
class TestFiveRoleAuthentication:
    """Verifies complete authentication lifecycle for all 5 canonical roles."""

    def test_admin_successful_login(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_admin', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert 'access' in data and 'refresh' in data
        assert data['user']['role'] == ROLE_ADMIN

    def test_principal_successful_login(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_principal', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['role'] == ROLE_PRINCIPAL

    def test_faculty_successful_login(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_fac_a', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['role'] == ROLE_FACULTY

    def test_student_successful_login_direct_username(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_stu_a1', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['role'] == ROLE_STUDENT

    def test_parent_successful_login_direct_username(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_par_a', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['role'] == ROLE_PARENT

    def test_invalid_password_returns_generic_401(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_admin', 'password': 'WrongPassword999!'})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_nonexistent_user_returns_generic_401(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'nonexistent_user_xyz', 'password': 'SomePassword123!'})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_inactive_account_rejected(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_fac_inact', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_empty_credentials_rejected(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': '', 'password': ''})
        assert resp.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED)


# ============================================================================
# 2. Student ID Authentication & Normalization
# ============================================================================

@pytest.mark.django_db
class TestStudentIDAuthentication:
    """Verifies Student ID login pattern, case-folding, and lifecycle state."""

    def test_student_login_via_valid_student_id(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647001', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['username'] == 't47_stu_a1'
        assert data['user']['role'] == ROLE_STUDENT

    def test_student_login_case_insensitivity(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'stu202647001', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()['data']['user']['username'] == 't47_stu_a1'

    def test_student_login_whitespace_trimming(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': '  STU202647001  ', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()['data']['user']['username'] == 't47_stu_a1'

    def test_inactive_student_user_rejected(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647004', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_withdrawn_student_rejected(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647005', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_malformed_student_id_rejected_generically(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU999', 'password': 'AnyPassword123!'})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# 3. Parent Authentication via Linked Child
# ============================================================================

@pytest.mark.django_db
class TestParentAuthentication:
    """Verifies Parent login resolution via child Student ID."""

    def test_parent_login_via_first_linked_child(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647001', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        # When child password matches parent password, parent can log in with their own password if distinct,
        # but here both have pw. Parent login via child ID with parent's password:
        # Note: In AuthService, student user check happens first if student password matches.
        # Let's test with a parent having a distinct password!

    def test_parent_login_with_distinct_parent_password(self, t47_data):
        t47_data['u_par_a'].set_password('ParentSecretPass456!')
        t47_data['u_par_a'].save()
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647001', 'password': 'ParentSecretPass456!'})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['username'] == 't47_par_a'
        assert data['user']['role'] == ROLE_PARENT

    def test_parent_multi_child_login_via_second_child(self, t47_data):
        t47_data['u_par_a'].set_password('ParentSecretPass456!')
        t47_data['u_par_a'].save()
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647002', 'password': 'ParentSecretPass456!'})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['username'] == 't47_par_a'
        assert data['user']['role'] == ROLE_PARENT

    def test_parent_login_via_unrelated_child_rejected(self, t47_data):
        t47_data['u_par_a'].set_password('ParentSecretPass456!')
        t47_data['u_par_a'].save()
        client = APIClient()
        # Student B1 belongs to Parent B, not Parent A
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647003', 'password': 'ParentSecretPass456!'})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_inactive_parent_with_active_child_rejected(self, t47_data):
        t47_data['u_par_inact'].set_password('InactParentPass123!')
        t47_data['u_par_inact'].save()
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 'STU202647004', 'password': 'InactParentPass123!'})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# 4. JWT Lifecycle & Claim Verification
# ============================================================================

@pytest.mark.django_db
class TestJWTLifecycle:
    """Verifies JWT issuance, token claims, refresh, and signature tampering."""

    def test_jwt_claims_present_on_login(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_admin', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        access_token_str = data['access']

        token = AccessToken(access_token_str)
        assert token['role'] == ROLE_ADMIN
        assert token['username'] == 't47_admin'
        assert token['user_id'] == str(t47_data['u_admin'].id)

    def test_jwt_refresh_flow(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/login/', {'username': 't47_fac_a', 'password': t47_data['pw']})
        refresh_token = resp.json()['data']['refresh']

        ref_resp = client.post('/api/v1/auth/refresh/', {'refresh': refresh_token})
        assert ref_resp.status_code == status.HTTP_200_OK
        data = ref_resp.json()['data']
        assert 'access' in data

    def test_invalid_refresh_token_rejected(self, t47_data):
        client = APIClient()
        resp = client.post('/api/v1/auth/refresh/', {'refresh': 'invalid.token.value'})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_tampered_access_token_rejected(self, t47_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer fake.tampered.token")
        resp = client.get('/api/v1/auth/me/')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_auth_me_all_five_roles(self, t47_data):
        for user, expected_role in [
            (t47_data['u_admin'], ROLE_ADMIN),
            (t47_data['u_principal'], ROLE_PRINCIPAL),
            (t47_data['u_fac_a'], ROLE_FACULTY),
            (t47_data['u_stu_a1'], ROLE_STUDENT),
            (t47_data['u_par_a'], ROLE_PARENT),
        ]:
            c = make_client(user)
            resp = c.get('/api/v1/auth/me/')
            assert resp.status_code == status.HTTP_200_OK
            profile = resp.json()['data']
            assert profile['role'] == expected_role
            assert 'password' not in profile
            assert 'password_hash' not in profile


# ============================================================================
# 5. HTTP 401 Unauthorized vs 403 Forbidden Semantics
# ============================================================================

@pytest.mark.django_db
class TestHTTPSemantics:
    """Confirms strict distinction between unauthenticated (401) and unauthorized (403)."""

    def test_unauthenticated_request_returns_401(self, t47_data):
        c = APIClient()
        resp = c.get('/api/v1/homework/')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_malformed_bearer_returns_401(self, t47_data):
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION="Bearer invalid_token_xyz")
        resp = c.get('/api/v1/students/')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_insufficient_permission_returns_403(self, t47_data):
        # Student attempting to create homework
        c = make_client(t47_data['u_stu_a1'])
        payload = {
            'school_class': str(t47_data['sc'].id),
            'section': str(t47_data['sec_a'].id),
            'subject': str(t47_data['subj_phys'].id),
            'academic_year': str(t47_data['ay'].id),
            'title': 'Unauthorized HW',
            'description': 'Test',
            'due_date': str(t47_data['today'] + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        resp = c.post('/api/v1/homework/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_authenticated_and_authorized_returns_201(self, t47_data):
        # Faculty A creating homework for assigned Section A
        c = make_client(t47_data['u_fac_a'])
        payload = {
            'school_class': str(t47_data['sc'].id),
            'section': str(t47_data['sec_a'].id),
            'subject': str(t47_data['subj_phys'].id),
            'academic_year': str(t47_data['ay'].id),
            'title': 'Valid HW',
            'description': 'Test',
            'due_date': str(t47_data['today'] + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        resp = c.post('/api/v1/homework/', data=payload, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    def test_generic_401_on_failed_login(self, t47_data):
        c = APIClient()
        resp1 = c.post('/api/v1/auth/login/', {'username': 't47_admin', 'password': 'wrong'})
        resp2 = c.post('/api/v1/auth/login/', {'username': 'nonexistent', 'password': 'wrong'})
        assert resp1.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp2.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp1.json().get('error', {}).get('message') == resp2.json().get('error', {}).get('message')


# ============================================================================
# 6. Authoritative RBAC Matrix Verification
# ============================================================================

@pytest.mark.django_db
class TestRBACMatrix:
    """Verifies RBAC permission matrix for all 5 roles."""

    def test_admin_has_broad_list_access(self, t47_data):
        c = make_client(t47_data['u_admin'])
        for endpoint in ['/api/v1/students/', '/api/v1/faculty/', '/api/v1/parents/', '/api/v1/homework/']:
            resp = c.get(endpoint)
            assert resp.status_code == status.HTTP_200_OK

    def test_principal_has_schoolwide_read_access(self, t47_data):
        c = make_client(t47_data['u_principal'])
        for endpoint in ['/api/v1/students/', '/api/v1/homework/']:
            resp = c.get(endpoint)
            assert resp.status_code == status.HTTP_200_OK

    def test_principal_homework_mutation_denied(self, t47_data):
        c = make_client(t47_data['u_principal'])
        payload = {
            'school_class': str(t47_data['sc'].id),
            'section': str(t47_data['sec_a'].id),
            'subject': str(t47_data['subj_phys'].id),
            'academic_year': str(t47_data['ay'].id),
            'title': 'Principal HW Attempt',
            'description': 'Denied',
            'due_date': str(t47_data['today'] + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        resp = c.post('/api/v1/homework/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_faculty_unassigned_section_homework_denied(self, t47_data):
        # Faculty A is assigned to Section A, not Section B
        c = make_client(t47_data['u_fac_a'])
        payload = {
            'school_class': str(t47_data['sc'].id),
            'section': str(t47_data['sec_b'].id),
            'subject': str(t47_data['subj_phys'].id),
            'academic_year': str(t47_data['ay'].id),
            'title': 'Faculty A in Section B',
            'description': 'Denied',
            'due_date': str(t47_data['today'] + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        resp = c.post('/api/v1/homework/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_access_staff_endpoints(self, t47_data):
        c = make_client(t47_data['u_stu_a1'])
        # Student is forbidden from administrative audit logs and schoolwide absentees list
        assert c.get('/api/v1/audit/').status_code == status.HTTP_403_FORBIDDEN
        assert c.get('/api/v1/attendance/absentees/').status_code == status.HTTP_403_FORBIDDEN

    def test_parent_cannot_access_staff_endpoints(self, t47_data):
        c = make_client(t47_data['u_par_a'])
        # Parent is forbidden from administrative audit logs and schoolwide absentees list
        assert c.get('/api/v1/audit/').status_code == status.HTTP_403_FORBIDDEN
        assert c.get('/api/v1/attendance/absentees/').status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 7. Object-Level Authorization
# ============================================================================

@pytest.mark.django_db
class TestObjectLevelAuthorization:
    """Verifies object-level boundaries preventing cross-user record access."""

    def test_student_cannot_access_other_student_detail(self, t47_data):
        c = make_client(t47_data['u_stu_a1'])
        resp = c.get(f"/api/v1/students/{t47_data['stu_b1'].id}/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_student_can_access_own_detail(self, t47_data):
        c = make_client(t47_data['u_stu_a1'])
        resp = c.get(f"/api/v1/students/{t47_data['stu_a1'].id}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()['data']['student_id'] == 'STU202647001'

    def test_parent_cannot_access_unrelated_student_detail(self, t47_data):
        c = make_client(t47_data['u_par_a'])
        resp = c.get(f"/api/v1/students/{t47_data['stu_b1'].id}/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_parent_can_access_linked_child_detail(self, t47_data):
        c = make_client(t47_data['u_par_a'])
        resp = c.get(f"/api/v1/students/{t47_data['stu_a1'].id}/")
        assert resp.status_code == status.HTTP_200_OK

    def test_faculty_b_cannot_modify_faculty_a_homework(self, t47_data):
        c = make_client(t47_data['u_fac_b'])
        resp = c.patch(
            f"/api/v1/homework/{t47_data['hw_pub_a'].id}/",
            data={'title': 'Hijacked Homework Title'},
            format='json'
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 8. Queryset-Level Scoping
# ============================================================================

@pytest.mark.django_db
class TestQuerysetLevelScoping:
    """Verifies server-side database queryset scoping across roles."""

    def test_student_list_scoped_to_self(self, t47_data):
        c = make_client(t47_data['u_stu_a1'])
        resp = c.get('/api/v1/students/')
        assert resp.status_code == status.HTTP_200_OK
        ids = [item['student_id'] for item in resp.json()['data']]
        assert ids == ['STU202647001']

    def test_parent_list_scoped_to_linked_children(self, t47_data):
        c = make_client(t47_data['u_par_a'])
        resp = c.get('/api/v1/students/')
        assert resp.status_code == status.HTTP_200_OK
        ids = [item['student_id'] for item in resp.json()['data']]
        assert set(ids) == {'STU202647001', 'STU202647002'}
        assert 'STU202647003' not in ids

    def test_admin_list_sees_all_students(self, t47_data):
        c = make_client(t47_data['u_admin'])
        resp = c.get('/api/v1/students/')
        assert resp.status_code == status.HTTP_200_OK
        ids = [item['student_id'] for item in resp.json()['data']]
        assert 'STU202647001' in ids
        assert 'STU202647003' in ids

    def test_student_homework_scoping_hides_drafts_and_other_sections(self, t47_data):
        c = make_client(t47_data['u_stu_a1'])
        resp = c.get('/api/v1/homework/')
        assert resp.status_code == status.HTTP_200_OK
        items = resp.json()['data']
        titles = [i['title'] for i in items]
        assert 'Physics HW A Published' in titles
        assert 'Physics HW A Draft' not in titles
        assert 'Physics HW B Published' not in titles


# ============================================================================
# 9. Privilege Escalation & Payload Tampering Mitigation
# ============================================================================

@pytest.mark.django_db
class TestPrivilegeEscalation:
    """Explicitly verifies rejection of role spoofing and payload injection."""

    def test_login_payload_role_injection_ignored(self, t47_data):
        c = APIClient()
        resp = c.post('/api/v1/auth/login/', {
            'username': 't47_stu_a1',
            'password': t47_data['pw'],
            'role': ROLE_ADMIN,
        })
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()['data']
        assert data['user']['role'] == ROLE_STUDENT
        token = AccessToken(data['access'])
        assert token['role'] == ROLE_STUDENT

    def test_forged_secret_token_rejected(self, t47_data):
        import jwt
        forged_payload = {
            'user_id': str(t47_data['u_stu_a1'].id),
            'username': 't47_stu_a1',
            'role': ROLE_ADMIN,
            'token_type': 'access',
        }
        forged_token = jwt.encode(forged_payload, 'wrong-secret-key-123456789012345678901234567890', algorithm='HS256')
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {forged_token}")
        resp = c.get('/api/v1/students/')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_faculty_cannot_patch_other_faculty_profile(self, t47_data):
        c = make_client(t47_data['u_fac_a'])
        resp = c.patch(
            f"/api/v1/faculty/{t47_data['fac_b'].id}/",
            data={'designation': 'Hacked Designation'},
            format='json'
        )
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


# ============================================================================
# 10. Cross-Role Access Denial
# ============================================================================

@pytest.mark.django_db
class TestCrossRoleAccessDenial:
    """Explicitly verifies negative authorization boundaries across roles."""

    def test_student_cannot_enter_attendance(self, t47_data):
        c = make_client(t47_data['u_stu_a1'])
        payload = {
            'date': str(t47_data['today']),
            'records': [
                {'student_id': t47_data['stu_a1'].student_id, 'status': 'PRESENT'},
            ],
        }
        resp = c.post('/api/v1/attendance/bulk/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_parent_cannot_enter_attendance(self, t47_data):
        c = make_client(t47_data['u_par_a'])
        payload = {
            'date': str(t47_data['today']),
            'records': [
                {'student_id': t47_data['stu_a1'].student_id, 'status': 'PRESENT'},
            ],
        }
        resp = c.post('/api/v1/attendance/bulk/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_enter_marks(self, t47_data):
        c = make_client(t47_data['u_stu_a1'])
        payload = {
            'records': [{
                'student_id': t47_data['stu_a1'].student_id,
                'subject_id': str(t47_data['subj_phys'].id),
                'exam_type_id': str(t47_data['exam'].id),
                'marks_obtained': '95.00',
                'max_marks': '100.00',
            }]
        }
        resp = c.post('/api/v1/marks/bulk/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_parent_cannot_enter_marks(self, t47_data):
        c = make_client(t47_data['u_par_a'])
        payload = {
            'records': [{
                'student_id': t47_data['stu_a1'].student_id,
                'subject_id': str(t47_data['subj_phys'].id),
                'exam_type_id': str(t47_data['exam'].id),
                'marks_obtained': '95.00',
                'max_marks': '100.00',
            }]
        }
        resp = c.post('/api/v1/marks/bulk/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_faculty_b_cannot_enter_marks_for_unassigned_section_a(self, t47_data):
        c = make_client(t47_data['u_fac_b'])
        payload = {
            'records': [{
                'student_id': t47_data['stu_a1'].student_id,
                'subject_id': str(t47_data['subj_phys'].id),
                'exam_type_id': str(t47_data['exam'].id),
                'marks_obtained': '88.00',
                'max_marks': '100.00',
            }]
        }
        resp = c.post('/api/v1/marks/bulk/', data=payload, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 11. Security Regression Invariants
# ============================================================================

@pytest.mark.django_db
class TestSecurityRegression:
    """Verifies critical security invariants across Phase 4."""

    def test_no_password_or_hash_in_login_response(self, t47_data):
        c = APIClient()
        resp = c.post('/api/v1/auth/login/', {'username': 't47_admin', 'password': t47_data['pw']})
        assert resp.status_code == status.HTTP_200_OK
        text = resp.content.decode('utf-8').lower()
        assert 'pbkdf2' not in text
        assert t47_data['pw'].lower() not in text

    def test_no_password_or_hash_in_me_response(self, t47_data):
        c = make_client(t47_data['u_admin'])
        resp = c.get('/api/v1/auth/me/')
        assert resp.status_code == status.HTTP_200_OK
        text = resp.content.decode('utf-8').lower()
        assert 'pbkdf2' not in text
        assert 'password' not in resp.json()['data']

    def test_health_check_remains_public(self):
        c = APIClient()
        resp = c.get('/api/health/')
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json().get('status') == 'ok'

    def test_deactivated_user_token_rejected_on_protected_endpoints(self, t47_data):
        # Generate token for active user, then deactivate user
        c = make_client(t47_data['u_stu_a1'])
        t47_data['u_stu_a1'].is_active = False
        t47_data['u_stu_a1'].save()

        resp = c.get('/api/v1/auth/me/')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_brute_force_generic_responses_documented(self, t47_data):
        c = APIClient()
        for attempt in range(5):
            resp = c.post('/api/v1/auth/login/', {
                'username': 't47_admin',
                'password': f'WrongAttempt_{attempt}!',
            })
            assert resp.status_code == status.HTTP_401_UNAUTHORIZED




