"""
Student ERP — Phase 5 Task 5.1 Backend Verification Suite
Core ERP API Integration: Student Module Endpoints & Scoping Verification

Tests:
1. Student Profile:
   - Authenticated student retrieves own profile via /api/v1/students/me/
   - Authenticated student retrieves own profile via /api/v1/students/STU202600001/
   - Authenticated student cannot access another student's profile (403)
   - Unauthenticated student profile request rejected (401)
2. Attendance & Leaves:
   - Authenticated student retrieves own attendance records and attendance summary via /api/v1/attendance/
   - Authenticated student retrieves own leave applications via /api/v1/attendance/leaves/
   - Authenticated student submits leave application; status is strictly PENDING (201)
   - Student cannot submit leave application on behalf of another student (403)
3. Marks & Report Cards:
   - Authenticated student retrieves own marks via /api/v1/marks/
   - Authenticated student retrieves own report card via /api/v1/marks/report-card/<student_id>/
   - Authenticated student cannot retrieve another student's report card (403)
4. Mutation Protection:
   - Student cannot update profile via PATCH /api/v1/students/<id>/ (403 Forbidden)
   - Student cannot mark attendance or enter marks (403 Forbidden)
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role, User
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import ExamType, Mark


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_auth_setup(db):
    """Sets up two students with distinct enrollments, attendance, marks, and leaves."""
    role_student, _ = Role.objects.get_or_create(
        name='Student',
        defaults={'description': 'Enrolled student'}
    )
    role_faculty, _ = Role.objects.get_or_create(
        name='Faculty',
        defaults={'description': 'Faculty member'}
    )

    # Academic Structure
    ay, _ = AcademicYear.objects.get_or_create(
        name='2026-2027',
        defaults={'start_date': '2026-06-01', 'end_date': '2027-04-30', 'is_current': True}
    )
    school_class, _ = SchoolClass.objects.get_or_create(
        code='G11-CS',
        academic_year=ay,
        defaults={'name': 'Grade 11 - Computer Science'}
    )
    section1, _ = Section.objects.get_or_create(
        name='A1',
        school_class=school_class,
        defaults={'capacity': 35}
    )
    section2, _ = Section.objects.get_or_create(
        name='A2',
        school_class=school_class,
        defaults={'capacity': 35}
    )
    subject, _ = Subject.objects.get_or_create(
        code='CS101',
        defaults={'name': 'Computer Science', 'weekly_periods': 6}
    )
    exam_type, _ = ExamType.objects.get_or_create(
        name='Half-Yearly Examination',
        defaults={'weightage': 100, 'is_active': True}
    )

    # Student 1 (Target Student)
    u1, _ = User.objects.get_or_create(
        username='STU202600001',
        defaults={
            'email': 'student1@school.edu.in',
            'first_name': 'Arun',
            'last_name': 'Kumar',
            'role': role_student,
            'is_active': True,
        }
    )
    u1.set_password('demo123')
    u1.save()

    s1, _ = Student.objects.get_or_create(
        user=u1,
        defaults={
            'student_id': 'STU202600001',
            'admission_number': 'ADM20240091',
            'roll_number': '11-A1-01',
            'status': 'Enrolled',
            'date_of_birth': '2009-05-14',
            'gender': 'Male',
        }
    )
    enr1, _ = Enrollment.objects.get_or_create(
        student=s1,
        academic_year=ay,
        defaults={'section': section1, 'status': 'Enrolled'}
    )

    # Student 2 (Other Student)
    u2, _ = User.objects.get_or_create(
        username='STU202600002',
        defaults={
            'email': 'student2@school.edu.in',
            'first_name': 'Bala',
            'last_name': 'Murugan',
            'role': role_student,
            'is_active': True,
        }
    )
    u2.set_password('demo123')
    u2.save()

    s2, _ = Student.objects.get_or_create(
        user=u2,
        defaults={
            'student_id': 'STU202600002',
            'admission_number': 'ADM20240092',
            'roll_number': '11-A2-02',
            'status': 'Enrolled',
            'date_of_birth': '2009-08-20',
            'gender': 'Male',
        }
    )
    enr2, _ = Enrollment.objects.get_or_create(
        student=s2,
        academic_year=ay,
        defaults={'section': section2, 'status': 'Enrolled'}
    )

    # Attendance Records
    Attendance.objects.get_or_create(
        enrollment=enr1,
        date='2026-10-01',
        defaults={'status': 'PRESENT', 'recorded_by': u1}
    )
    Attendance.objects.get_or_create(
        enrollment=enr1,
        date='2026-10-02',
        defaults={'status': 'ABSENT', 'recorded_by': u1}
    )
    Attendance.objects.get_or_create(
        enrollment=enr2,
        date='2026-10-01',
        defaults={'status': 'PRESENT', 'recorded_by': u2}
    )

    # Marks Records
    Mark.objects.get_or_create(
        enrollment=enr1,
        subject=subject,
        exam_type=exam_type,
        defaults={'marks_obtained': 92, 'max_marks': 100, 'grade': 'A1'}
    )
    Mark.objects.get_or_create(
        enrollment=enr2,
        subject=subject,
        exam_type=exam_type,
        defaults={'marks_obtained': 75, 'max_marks': 100, 'grade': 'B1'}
    )

    # Leave Records
    LeaveApplication.objects.get_or_create(
        student=s1,
        start_date='2026-10-05',
        end_date='2026-10-05',
        defaults={'leave_type': 'Medical', 'reason': 'Fever', 'status': 'APPROVED'}
    )
    LeaveApplication.objects.get_or_create(
        student=s2,
        start_date='2026-10-06',
        end_date='2026-10-06',
        defaults={'leave_type': 'Medical', 'reason': 'Dental appointment', 'status': 'APPROVED'}
    )

    return {
        'student1_user': u1,
        'student1': s1,
        'student2_user': u2,
        'student2': s2,
    }


def authenticate_user(api_client, user):
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


@pytest.mark.django_db
class TestStudentProfileIntegration:
    def test_student_retrieves_own_profile_via_me(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        res = api_client.get('/api/v1/students/me/')
        assert res.status_code == status.HTTP_200_OK
        data = res.json().get('data', res.json())
        assert data['student_id'] == 'STU202600001'
        assert data['first_name'] == 'Arun'
        assert data['last_name'] == 'Kumar'
        assert data['admission_number'] == 'ADM20240091'
        assert data['roll_number'] == '11-A1-01'
        assert 'current_class' in data
        assert 'current_section' in data

    def test_student_retrieves_own_profile_via_student_id(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        res = api_client.get('/api/v1/students/STU202600001/')
        assert res.status_code == status.HTTP_200_OK
        data = res.json().get('data', res.json())
        assert data['student_id'] == 'STU202600001'

    def test_student_cross_profile_access_denied(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        # Student 1 attempts to read Student 2's profile
        res = api_client.get('/api/v1/students/STU202600002/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_profile_access_denied(self, api_client):
        res = api_client.get('/api/v1/students/me/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_student_cannot_mutate_profile_via_patch(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        # Student attempts to patch own profile (students.update is Admin-only)
        res = api_client.patch('/api/v1/students/STU202600001/', {'roll_number': '99-ZZ-99'})
        assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestStudentAttendanceIntegration:
    def test_student_retrieves_own_attendance_and_summary(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        res = api_client.get('/api/v1/attendance/')
        assert res.status_code == status.HTTP_200_OK
        body = res.json()
        data = body.get('data', [])
        meta = body.get('meta', {})

        # Scoped strictly to student 1
        for rec in data:
            assert rec['student_id'] == 'STU202600001'

        assert 'attendance_summary' in meta
        summary = meta['attendance_summary']
        assert summary['total_sessions'] >= 1
        assert 'attendance_percentage' in summary

    def test_student_retrieves_own_leave_applications(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        res = api_client.get('/api/v1/attendance/leaves/')
        assert res.status_code == status.HTTP_200_OK
        data = res.json().get('data', [])

        # Scoped strictly to student 1
        for rec in data:
            assert rec['student_id'] == 'STU202600001'

    def test_student_submits_leave_application_pending_status(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        payload = {
            'leave_type': 'Medical',
            'start_date': '2026-10-10',
            'end_date': '2026-10-11',
            'reason': 'Viral fever recovery.',
        }
        res = api_client.post('/api/v1/attendance/leaves/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json().get('data', res.json())
        assert data['status'] == 'PENDING'
        assert data['student_id'] == 'STU202600001'
        assert data['reason'] == 'Viral fever recovery.'

    def test_student_cannot_submit_leave_for_another_student(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        s2 = student_auth_setup['student2']
        authenticate_user(api_client, u1)

        payload = {
            'student': str(s2.id),
            'leave_type': 'Medical',
            'start_date': '2026-10-10',
            'end_date': '2026-10-11',
            'reason': 'Impersonation attempt.',
        }
        res = api_client.post('/api/v1/attendance/leaves/', payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestStudentMarksIntegration:
    def test_student_retrieves_own_marks(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        res = api_client.get('/api/v1/marks/')
        assert res.status_code == status.HTTP_200_OK
        data = res.json().get('data', [])

        # Scoped strictly to student 1
        for rec in data:
            assert rec['student_id'] == 'STU202600001'

    def test_student_retrieves_own_report_card(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        res = api_client.get('/api/v1/marks/report-card/STU202600001/')
        assert res.status_code == status.HTTP_200_OK
        data = res.json().get('data', res.json())
        assert data['student_id'] == 'STU202600001'
        assert data['student_name'] == 'Arun Kumar'
        assert data['total_max_marks'] == 100.0
        assert data['total_marks_obtained'] == 92.0
        assert data['overall_grade'] == 'A1'
        assert len(data['marks']) == 1

    def test_student_cross_report_card_access_denied(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        # Student 1 attempts to read Student 2's report card
        res = api_client.get('/api/v1/marks/report-card/STU202600002/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_enter_marks(self, api_client, student_auth_setup):
        u1 = student_auth_setup['student1_user']
        authenticate_user(api_client, u1)

        res = api_client.post('/api/v1/marks/bulk/', {'records': []}, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN
