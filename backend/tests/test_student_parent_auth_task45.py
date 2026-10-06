"""
Student ERP — Student & Parent Special Authentication Test Suite (Task 4.5)
Verifies:
1. Student Login via Student ID (^STU\\d{4}\\d{5}$) with whitespace and case normalization.
2. Parent Login via linked child's Student ID with multi-child support.
3. Fallback standard login (Admin, Principal, Faculty, direct usernames).
4. Security controls (rejection of role/user_id tampering, generic 401, no enumeration leakage).
5. Regression coverage (token refresh, /api/v1/auth/me/).
"""

import uuid
from datetime import date
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
    ENROLLMENT_STATUS_ENROLLED,
    ENROLLMENT_STATUS_WITHDRAWN,
)
from apps.accounts.models import Role, User, Parent
from apps.students.models import Student
from apps.accounts.services import AuthService


@pytest.fixture
def auth_roles():
    """Ensures all 5 canonical roles exist in the database."""
    roles = {}
    for role_name in (ROLE_ADMIN, ROLE_PRINCIPAL, ROLE_FACULTY, ROLE_STUDENT, ROLE_PARENT):
        role_obj, _ = Role.objects.get_or_create(name=role_name)
        roles[role_name] = role_obj
    return roles


@pytest.fixture
def setup_auth_data(auth_roles):
    """
    Sets up a full hierarchy of test accounts:
    - Admin, Principal, Faculty accounts
    - Parent A with two linked children (Student A1, Student A2)
    - Parent B with one linked child (Student B1)
    - Orphan Student (no linked parent)
    - Inactive Student User
    - Withdrawn Student
    - Inactive Parent User with active child
    """
    # 1. Staff users
    admin_user = User.objects.create_user(
        username='admin_task45',
        email='admin_task45@erp.local',
        password='AdminPassword@123',
        role=auth_roles[ROLE_ADMIN],
        first_name='Admin',
        last_name='User',
    )
    principal_user = User.objects.create_user(
        username='principal_task45',
        email='principal_task45@erp.local',
        password='PrincipalPassword@123',
        role=auth_roles[ROLE_PRINCIPAL],
        first_name='Principal',
        last_name='User',
    )
    faculty_user = User.objects.create_user(
        username='faculty_task45',
        email='faculty_task45@erp.local',
        password='FacultyPassword@123',
        role=auth_roles[ROLE_FACULTY],
        first_name='Faculty',
        last_name='User',
    )

    # 2. Parent A (Ramesh)
    parent_user_a = User.objects.create_user(
        username='parent_ramesh_t45',
        email='ramesh_t45@erp.local',
        password='ParentRameshPass@123',
        role=auth_roles[ROLE_PARENT],
        first_name='Ramesh',
        last_name='Kumar',
    )
    parent_profile_a = Parent.objects.create(
        user=parent_user_a,
        relation='Father',
        occupation='Engineer',
    )

    # Student A1 (Arun Kumar - Child 1 of Parent A)
    stu_user_a1 = User.objects.create_user(
        username='student_arun_t45',
        email='arun_t45@erp.local',
        password='StudentArunPass@123',
        role=auth_roles[ROLE_STUDENT],
        first_name='Arun',
        last_name='Kumar',
    )
    student_a1 = Student.objects.create(
        user=stu_user_a1,
        parent=parent_profile_a,
        student_id='STU202611001',
        admission_number='ADM-T45-001',
        roll_number='11-A-01',
        date_of_birth=date(2009, 5, 14),
        gender='Male',
        emergency_contact='9840011111',
        address='123 Lake St',
        status=ENROLLMENT_STATUS_ENROLLED,
    )

    # Student A2 (Anita Kumar - Child 2 of Parent A)
    stu_user_a2 = User.objects.create_user(
        username='student_anita_t45',
        email='anita_t45@erp.local',
        password='StudentAnitaPass@123',
        role=auth_roles[ROLE_STUDENT],
        first_name='Anita',
        last_name='Kumar',
    )
    student_a2 = Student.objects.create(
        user=stu_user_a2,
        parent=parent_profile_a,
        student_id='STU202611002',
        admission_number='ADM-T45-002',
        roll_number='09-B-05',
        date_of_birth=date(2011, 8, 20),
        gender='Female',
        emergency_contact='9840011111',
        address='123 Lake St',
        status=ENROLLMENT_STATUS_ENROLLED,
    )

    # 3. Parent B (Priya) with Child B1
    parent_user_b = User.objects.create_user(
        username='parent_priya_t45',
        email='priya_t45@erp.local',
        password='ParentPriyaPass@123',
        role=auth_roles[ROLE_PARENT],
        first_name='Priya',
        last_name='Sharma',
    )
    parent_profile_b = Parent.objects.create(
        user=parent_user_b,
        relation='Mother',
        occupation='Doctor',
    )

    stu_user_b1 = User.objects.create_user(
        username='student_rohit_t45',
        email='rohit_t45@erp.local',
        password='StudentRohitPass@123',
        role=auth_roles[ROLE_STUDENT],
        first_name='Rohit',
        last_name='Sharma',
    )
    student_b1 = Student.objects.create(
        user=stu_user_b1,
        parent=parent_profile_b,
        student_id='STU202611003',
        admission_number='ADM-T45-003',
        roll_number='11-B-08',
        date_of_birth=date(2009, 2, 10),
        gender='Male',
        emergency_contact='9840022222',
        address='456 Hill Rd',
        status=ENROLLMENT_STATUS_ENROLLED,
    )

    # 4. Student with NO parent (Orphan)
    stu_user_orphan = User.objects.create_user(
        username='student_orphan_t45',
        email='orphan_t45@erp.local',
        password='StudentOrphanPass@123',
        role=auth_roles[ROLE_STUDENT],
        first_name='Orphan',
        last_name='Student',
    )
    student_orphan = Student.objects.create(
        user=stu_user_orphan,
        parent=None,
        student_id='STU202611004',
        admission_number='ADM-T45-004',
        roll_number='10-A-12',
        date_of_birth=date(2010, 3, 15),
        gender='Other',
        emergency_contact='9840033333',
        address='789 Ward Ave',
        status=ENROLLMENT_STATUS_ENROLLED,
    )

    # 5. Inactive Student User
    stu_user_inactive = User.objects.create_user(
        username='student_inactive_t45',
        email='inactive_stu_t45@erp.local',
        password='StudentInactivePass@123',
        role=auth_roles[ROLE_STUDENT],
        first_name='Inactive',
        last_name='User',
        is_active=False,
    )
    student_inactive = Student.objects.create(
        user=stu_user_inactive,
        parent=None,
        student_id='STU202611005',
        admission_number='ADM-T45-005',
        roll_number='12-C-01',
        date_of_birth=date(2008, 1, 1),
        gender='Male',
        emergency_contact='9840044444',
        address='No Address',
        status=ENROLLMENT_STATUS_ENROLLED,
    )

    # 6. Withdrawn Student (user active, but student.status == 'Withdrawn')
    stu_user_withdrawn = User.objects.create_user(
        username='student_withdrawn_t45',
        email='withdrawn_stu_t45@erp.local',
        password='StudentWithdrawnPass@123',
        role=auth_roles[ROLE_STUDENT],
        first_name='Withdrawn',
        last_name='Student',
        is_active=True,
    )
    student_withdrawn = Student.objects.create(
        user=stu_user_withdrawn,
        parent=None,
        student_id='STU202611006',
        admission_number='ADM-T45-006',
        roll_number='12-C-02',
        date_of_birth=date(2008, 6, 6),
        gender='Female',
        emergency_contact='9840055555',
        address='No Address',
        status=ENROLLMENT_STATUS_WITHDRAWN,
    )

    # 7. Inactive Parent User
    parent_user_inactive = User.objects.create_user(
        username='parent_inactive_t45',
        email='parent_inactive_t45@erp.local',
        password='ParentInactivePass@123',
        role=auth_roles[ROLE_PARENT],
        first_name='Inactive',
        last_name='Parent',
        is_active=False,
    )
    parent_profile_inactive = Parent.objects.create(
        user=parent_user_inactive,
        relation='Guardian',
    )
    stu_user_inactive_parent = User.objects.create_user(
        username='student_child_of_inactive_parent',
        email='child_inact_parent@erp.local',
        password='ChildPass@123',
        role=auth_roles[ROLE_STUDENT],
        first_name='Child',
        last_name='Active',
    )
    student_child_of_inactive_parent = Student.objects.create(
        user=stu_user_inactive_parent,
        parent=parent_profile_inactive,
        student_id='STU202611007',
        admission_number='ADM-T45-007',
        roll_number='08-A-01',
        date_of_birth=date(2012, 1, 1),
        gender='Male',
        emergency_contact='9840066666',
        address='No Address',
        status=ENROLLMENT_STATUS_ENROLLED,
    )

    return {
        'admin_user': admin_user,
        'principal_user': principal_user,
        'faculty_user': faculty_user,
        'parent_user_a': parent_user_a,
        'parent_profile_a': parent_profile_a,
        'student_a1': student_a1,
        'student_a2': student_a2,
        'parent_user_b': parent_user_b,
        'parent_profile_b': parent_profile_b,
        'student_b1': student_b1,
        'student_orphan': student_orphan,
        'student_inactive': student_inactive,
        'student_withdrawn': student_withdrawn,
        'parent_user_inactive': parent_user_inactive,
        'student_child_of_inactive_parent': student_child_of_inactive_parent,
    }


# ============================================================================
# 1. Student Login via Student ID
# ============================================================================
@pytest.mark.django_db
class TestStudentLoginWorkflow:
    """Verifies Student ID authentication workflows (Section 4)."""

    def test_valid_student_id_and_password(self, setup_auth_data):
        """Student authenticates with canonical Student ID and correct student password."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'StudentArunPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['success'] is True
        assert data['user']['role'] == ROLE_STUDENT
        assert data['user']['username'] == 'student_arun_t45'

        # Verify JWT claims
        access_token = AccessToken(data['access'])
        assert access_token['role'] == ROLE_STUDENT
        assert access_token['username'] == 'student_arun_t45'

        refresh_token = RefreshToken(data['refresh'])
        assert refresh_token['role'] == ROLE_STUDENT

    def test_lowercase_student_id_normalization(self, setup_auth_data):
        """Lowercase Student ID is normalized and successfully authenticates."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'stu202611001', 'password': 'StudentArunPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['role'] == ROLE_STUDENT
        assert data['user']['username'] == 'student_arun_t45'

    def test_whitespace_normalization(self, setup_auth_data):
        """Surrounding whitespace around Student ID is stripped and authenticates."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': '   STU202611001   ', 'password': 'StudentArunPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['role'] == ROLE_STUDENT
        assert data['user']['username'] == 'student_arun_t45'

    def test_wrong_password(self, setup_auth_data):
        """Correct Student ID with wrong password returns HTTP 401."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'WrongPassword@999'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert data['error']['status_code'] == 401
        assert 'access' not in data

    def test_nonexistent_student_id(self, setup_auth_data):
        """Non-existent Student ID matching pattern returns generic HTTP 401."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202699999', 'password': 'SomePassword@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert data['error']['status_code'] == 401

    def test_malformed_student_id(self, setup_auth_data):
        """Malformed Student ID falls back to standard auth and returns HTTP 401."""
        client = APIClient()
        for bad_id in ('STU123', 'STU2026ABCDE', 'NOT_AN_ID'):
            response = client.post(
                '/api/v1/auth/login/',
                {'username': bad_id, 'password': 'SomePassword@123'},
                format='json',
            )
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert response.json()['success'] is False

    def test_inactive_student_withdrawn(self, setup_auth_data):
        """Student with status 'Withdrawn' is rejected with HTTP 401."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611006', 'password': 'StudentWithdrawnPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert 'access' not in data

    def test_inactive_linked_user(self, setup_auth_data):
        """Student whose linked User has is_active=False is rejected with HTTP 401."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611005', 'password': 'StudentInactivePass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert 'access' not in data


# ============================================================================
# 2. Parent Login via Linked Child's Student ID
# ============================================================================
@pytest.mark.django_db
class TestParentLoginWorkflow:
    """Verifies Parent authentication via linked child's Student ID (Section 5)."""

    def test_valid_child_student_id_and_parent_password(self, setup_auth_data):
        """Parent authenticates using linked child's Student ID and Parent's password."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'ParentRameshPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['success'] is True
        assert data['user']['role'] == ROLE_PARENT
        assert data['user']['username'] == 'parent_ramesh_t45'

        # Verify JWT claims
        access_token = AccessToken(data['access'])
        assert access_token['role'] == ROLE_PARENT
        assert access_token['username'] == 'parent_ramesh_t45'

    def test_multiple_linked_children_resolve_to_same_parent(self, setup_auth_data):
        """Parent with multiple children can authenticate with any child's Student ID."""
        client = APIClient()

        # Child 1: Arun (STU202611001)
        res1 = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'ParentRameshPass@123'},
            format='json',
        )
        assert res1.status_code == status.HTTP_200_OK
        data1 = res1.json()
        assert data1['user']['role'] == ROLE_PARENT
        assert data1['user']['username'] == 'parent_ramesh_t45'

        # Child 2: Anita (STU202611002)
        res2 = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611002', 'password': 'ParentRameshPass@123'},
            format='json',
        )
        assert res2.status_code == status.HTTP_200_OK
        data2 = res2.json()
        assert data2['user']['role'] == ROLE_PARENT
        assert data2['user']['username'] == 'parent_ramesh_t45'

        # Both resolve to the identical user ID
        assert data1['user']['id'] == data2['user']['id']

    def test_wrong_parent_password(self, setup_auth_data):
        """Child Student ID with wrong parent password returns HTTP 401."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'WrongParentPassword@999'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False

    def test_another_parents_child_id(self, setup_auth_data):
        """Parent A cannot authenticate using Parent B's child's Student ID."""
        client = APIClient()
        # Parent A's password with Child B1's ID (STU202611003)
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611003', 'password': 'ParentRameshPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False

    def test_child_with_no_parent(self, setup_auth_data):
        """Student with no parent link cannot authenticate as Parent."""
        client = APIClient()
        # Orphan student ID (STU202611004) with an arbitrary password
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611004', 'password': 'ParentRameshPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False

    def test_inactive_parent_user(self, setup_auth_data):
        """Parent whose User has is_active=False cannot authenticate."""
        client = APIClient()
        # Child ID (STU202611007) of inactive parent
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611007', 'password': 'ParentInactivePass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert 'access' not in data


# ============================================================================
# 3. Security & Anti-Tampering Controls
# ============================================================================
@pytest.mark.django_db
class TestSecurityAndTamperingControls:
    """Verifies security controls, payload immutability, and enumeration protections."""

    def test_role_tampering_is_ignored(self, setup_auth_data):
        """Client supplying 'role': 'Admin' cannot elevate privileges."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {
                'username': 'STU202611001',
                'password': 'StudentArunPass@123',
                'role': ROLE_ADMIN,
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['role'] == ROLE_STUDENT
        access_token = AccessToken(data['access'])
        assert access_token['role'] == ROLE_STUDENT

    def test_user_id_tampering_is_ignored(self, setup_auth_data):
        """Client supplying fake 'user_id' cannot spoof identity."""
        client = APIClient()
        fake_id = str(uuid.uuid4())
        response = client.post(
            '/api/v1/auth/login/',
            {
                'username': 'STU202611001',
                'password': 'StudentArunPass@123',
                'user_id': fake_id,
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['id'] != fake_id
        assert data['user']['id'] == str(setup_auth_data['student_a1'].user.id)

    def test_cross_student_authentication_blocked(self, setup_auth_data):
        """Student A's password with Student B's Student ID is rejected."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611003', 'password': 'StudentArunPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False

    def test_cross_parent_authentication_blocked(self, setup_auth_data):
        """Parent B's password with Parent A's child ID is rejected."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'ParentPriyaPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False

    def test_generic_401_envelope_on_all_failures(self, setup_auth_data):
        """All failure scenarios produce the uniform generic 401 error envelope."""
        client = APIClient()
        scenarios = [
            {'username': 'STU202699999', 'password': 'Pass@123'},         # Nonexistent
            {'username': 'STU202611001', 'password': 'WrongPass@123'},    # Wrong student pass
            {'username': 'STU202611005', 'password': 'StudentInactivePass@123'},  # Inactive user
            {'username': 'STU202611006', 'password': 'StudentWithdrawnPass@123'}, # Withdrawn student
            {'username': 'STU202611007', 'password': 'ParentInactivePass@123'},   # Inactive parent
            {'username': 'unknown_user', 'password': 'Pass@123'},         # Unknown standard user
        ]

        for payload in scenarios:
            response = client.post('/api/v1/auth/login/', payload, format='json')
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            data = response.json()
            assert data['success'] is False
            assert 'error' in data
            assert data['error']['status_code'] == 401
            assert data['error']['code'] == 'NO_ACTIVE_ACCOUNT'

    def test_no_account_existence_leakage(self, setup_auth_data):
        """Error responses must never leak whether the Student ID exists or is linked."""
        client = APIClient()
        # Nonexistent student ID
        res_nonexistent = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202699999', 'password': 'DummyPassword@123'},
            format='json',
        )
        # Existing student ID with wrong password
        res_existing = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'DummyPassword@123'},
            format='json',
        )

        msg_nonexistent = res_nonexistent.json()['error']['message']
        msg_existing = res_existing.json()['error']['message']

        # Both messages must be identical generic authentication failure strings
        assert msg_nonexistent == msg_existing
        assert 'student' not in msg_nonexistent.lower()
        assert 'parent' not in msg_nonexistent.lower()
        assert 'exist' not in msg_nonexistent.lower()


# ============================================================================
# 4. Standard Login Regression & Backward Compatibility
# ============================================================================
@pytest.mark.django_db
class TestAuthenticationRegression:
    """Verifies that direct username logins, refresh, and profile endpoints are unbroken."""

    def test_admin_login(self, setup_auth_data):
        """Admin can log in using direct username credentials."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'admin_task45', 'password': 'AdminPassword@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['role'] == ROLE_ADMIN
        assert data['user']['username'] == 'admin_task45'

    def test_principal_login(self, setup_auth_data):
        """Principal can log in using direct username credentials."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'principal_task45', 'password': 'PrincipalPassword@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['role'] == ROLE_PRINCIPAL
        assert data['user']['username'] == 'principal_task45'

    def test_faculty_login(self, setup_auth_data):
        """Faculty can log in using direct username credentials."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'faculty_task45', 'password': 'FacultyPassword@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['role'] == ROLE_FACULTY
        assert data['user']['username'] == 'faculty_task45'

    def test_student_and_parent_direct_username_login(self, setup_auth_data):
        """Student and Parent can still log in using their direct usernames."""
        client = APIClient()

        # Student direct username
        res_stu = client.post(
            '/api/v1/auth/login/',
            {'username': 'student_arun_t45', 'password': 'StudentArunPass@123'},
            format='json',
        )
        assert res_stu.status_code == status.HTTP_200_OK
        assert res_stu.json()['user']['role'] == ROLE_STUDENT

        # Parent direct username
        res_par = client.post(
            '/api/v1/auth/login/',
            {'username': 'parent_ramesh_t45', 'password': 'ParentRameshPass@123'},
            format='json',
        )
        assert res_par.status_code == status.HTTP_200_OK
        assert res_par.json()['user']['role'] == ROLE_PARENT

    def test_token_refresh_endpoint(self, setup_auth_data):
        """Tokens obtained via Student ID login can be refreshed at /api/v1/auth/refresh/."""
        client = APIClient()
        login_res = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'StudentArunPass@123'},
            format='json',
        )
        refresh_token = login_res.json()['refresh']

        refresh_res = client.post(
            '/api/v1/auth/refresh/',
            {'refresh': refresh_token},
            format='json',
        )
        assert refresh_res.status_code == status.HTTP_200_OK
        data = refresh_res.json()
        assert 'access' in data
        assert data['token_type'] == 'Bearer'

    def test_me_endpoint_with_student_id_token(self, setup_auth_data):
        """Tokens obtained via Student ID work at /api/v1/auth/me/ for both Student and Parent."""
        client = APIClient()

        # 1. Student via Student ID
        res_stu = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'StudentArunPass@123'},
            format='json',
        )
        stu_token = res_stu.json()['access']

        client.credentials(HTTP_AUTHORIZATION=f'Bearer {stu_token}')
        me_stu = client.get('/api/v1/auth/me/')
        assert me_stu.status_code == status.HTTP_200_OK
        assert me_stu.json()['data']['role'] == ROLE_STUDENT
        assert me_stu.json()['data']['username'] == 'student_arun_t45'

        # 2. Parent via Child Student ID
        client.credentials()  # clear credentials
        res_par = client.post(
            '/api/v1/auth/login/',
            {'username': 'STU202611001', 'password': 'ParentRameshPass@123'},
            format='json',
        )
        par_token = res_par.json()['access']

        client.credentials(HTTP_AUTHORIZATION=f'Bearer {par_token}')
        me_par = client.get('/api/v1/auth/me/')
        assert me_par.status_code == status.HTTP_200_OK
        assert me_par.json()['data']['role'] == ROLE_PARENT
        assert me_par.json()['data']['username'] == 'parent_ramesh_t45'
