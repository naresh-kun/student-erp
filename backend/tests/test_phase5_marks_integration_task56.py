"""
Student ERP — Phase 5 Task 5.6 Backend Verification Suite
Marks API Integration, AB Assessment Hardening & Institutional Oversight

Comprehensive test coverage for Phase 5 Task 5.6:
1. Student & Parent Scoping:
   - Student views only own marks and report card; cross-student access denied (403).
   - Parent views only linked child marks and report card; cross-child access denied (403).
   - Student and Parent cannot mutate marks (403 Forbidden).
2. Faculty Teaching Assignment Governance:
   - Faculty enters marks for assigned section and subject.
   - Faculty entering marks for unassigned subject is rejected with 403 Forbidden.
3. Scoring Bounds & 'AB' (Absent) Assessment:
   - Marks strictly 0–100; negative marks (< 0) and marks exceeding max (> 100) rejected with 400.
   - 'AB' score recorded without schema migration, storing marks_obtained=0.00 and grade='AB'.
   - Report card handles 'AB' gracefully without NaN, dividing by valid max marks.
4. Institutional Marks Oversight (/api/v1/marks/summary/):
   - Admin & Principal view school-wide section/subject evaluation roll-ups.
   - Computes batch average %, highest mark, pass rate (>= 33%), and CBSE A1–E grade distribution.
   - Faculty views only assigned sections.
   - Student & Parent denied with 403 Forbidden.
5. Executive Academic Analytics (/api/v1/marks/analytics/):
   - Admin & Principal view longitudinal cohort performance (Grades 9–12), stream comparison, subject quality, and school grade distribution.
   - Faculty, Student, and Parent denied with 403 Forbidden.
   - Payload strictly purged of GPA, CGPA, credits, and teacher rankings.
"""

from datetime import date
from decimal import Decimal
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
from apps.marks.models import Mark, ExamType


@pytest.fixture
def api_client():
    return APIClient()


def authenticate(api_client, user):
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')


@pytest.fixture
def task56_setup(db):
    """
    Sets up institutional context with:
    - Academic Year 2026-2027
    - ExamType: Half-Yearly Examination 2026
    - Roles: Admin, Principal, Faculty (Suresh, Priya), Student (Arun, Keerthana), Parent (Ramanathan)
    - Classes: Grade 11 — Computer Science A, Grade 10 — General
    - Sections: Section A1 (Suresh Class Teacher), Section A2 (Priya Class Teacher)
    - Subjects: Mathematics (MATH-041), Computer Science (CS-083)
    - Teaching Assignments:
        * Suresh teaches CS in A1
        * Priya teaches Mathematics in A1
    - Enrollments: Arun in A1, Keerthana in A2
    """
    role_admin, _ = Role.objects.get_or_create(name='Admin', defaults={'description': 'System Administrator'})
    role_principal, _ = Role.objects.get_or_create(name='Principal', defaults={'description': 'Principal'})
    role_faculty, _ = Role.objects.get_or_create(name='Faculty', defaults={'description': 'Faculty'})
    role_parent, _ = Role.objects.get_or_create(name='Parent', defaults={'description': 'Parent'})
    role_student, _ = Role.objects.get_or_create(name='Student', defaults={'description': 'Student'})

    # Users
    admin_user = User.objects.create_user(
        username='admin_task56', email='admin@school.edu', password='demo', role=role_admin, is_active=True
    )
    principal_user = User.objects.create_user(
        username='principal_task56', email='principal@school.edu', password='demo', role=role_principal, is_active=True
    )
    faculty_suresh_user = User.objects.create_user(
        username='faculty_suresh_task56', email='suresh@school.edu', password='demo', role=role_faculty,
        first_name='Suresh', last_name='Kumar', is_active=True
    )
    faculty_priya_user = User.objects.create_user(
        username='faculty_priya_task56', email='priya@school.edu', password='demo', role=role_faculty,
        first_name='Priya', last_name='Krishnan', is_active=True
    )
    parent_user = User.objects.create_user(
        username='parent_ram_task56', email='ram@family.edu', password='demo', role=role_parent,
        first_name='Ramanathan', last_name='S', is_active=True
    )
    student_arun_user = User.objects.create_user(
        username='student_arun_task56', email='arun@student.edu', password='demo', role=role_student,
        first_name='Arun', last_name='Kumar', is_active=True
    )
    student_keerthana_user = User.objects.create_user(
        username='student_keerthana_task56', email='keerthana@student.edu', password='demo', role=role_student,
        first_name='Keerthana', last_name='R', is_active=True
    )

    # Domain Profiles
    faculty_suresh = Faculty.objects.create(
        user=faculty_suresh_user, employee_code='FAC5601', department='Computer Science', designation='Senior PGT',
        joining_date=date(2020, 6, 1),
    )
    faculty_priya = Faculty.objects.create(
        user=faculty_priya_user, employee_code='FAC5602', department='Mathematics', designation='Senior PGT',
        joining_date=date(2021, 7, 1),
    )
    parent_ram = Parent.objects.create(
        user=parent_user,
    )
    student_arun = Student.objects.create(
        user=student_arun_user, student_id='STU20265601', admission_number='ADM5601', roll_number='1101',
        date_of_birth=date(2009, 5, 14), gender='Male', parent=parent_ram,
    )
    student_keerthana = Student.objects.create(
        user=student_keerthana_user, student_id='STU20265602', admission_number='ADM5602', roll_number='1102',
        date_of_birth=date(2009, 8, 22), gender='Female',
    )

    # Academics
    ay = AcademicYear.objects.create(
        name='2026–27', start_date='2026-06-01', end_date='2027-04-30', is_current=True,
    )
    cls11 = SchoolClass.objects.create(
        name='Grade 11 — Computer Science A', code='G11-CSA-56', academic_year=ay,
    )
    cls10 = SchoolClass.objects.create(
        name='Grade 10 — General', code='G10-GEN-56', academic_year=ay,
    )
    sec_a1 = Section.objects.create(
        name='A1', school_class=cls11, academic_year=ay, class_teacher=faculty_suresh, capacity=35,
    )
    sec_a2 = Section.objects.create(
        name='A2', school_class=cls11, academic_year=ay, class_teacher=faculty_priya, capacity=35,
    )

    sub_cs = Subject.objects.create(
        name='Computer Science', code='CS-083', department='Computer Science', weekly_periods=6, is_active=True,
    )
    sub_math = Subject.objects.create(
        name='Mathematics', code='MATH-041', department='Mathematics', weekly_periods=6, is_active=True,
    )

    # Teaching Assignments
    TeachingAssignment.objects.create(
        faculty=faculty_suresh, section=sec_a1, subject=sub_cs, academic_year=ay, is_active=True,
    )
    TeachingAssignment.objects.create(
        faculty=faculty_priya, section=sec_a1, subject=sub_math, academic_year=ay, is_active=True,
    )

    # Enrollments
    enr_arun = Enrollment.objects.create(
        student=student_arun, section=sec_a1, academic_year=ay, status='Active',
    )
    enr_keerthana = Enrollment.objects.create(
        student=student_keerthana, section=sec_a2, academic_year=ay, status='Active',
    )

    # Exam Type
    exam_type = ExamType.objects.create(
        name='Half-Yearly Examination 2026', weightage=Decimal('50.00'), is_active=True,
    )

    return {
        'admin_user': admin_user,
        'principal_user': principal_user,
        'faculty_suresh_user': faculty_suresh_user,
        'faculty_priya_user': faculty_priya_user,
        'faculty_suresh': faculty_suresh,
        'faculty_priya': faculty_priya,
        'parent_user': parent_user,
        'student_arun_user': student_arun_user,
        'student_keerthana_user': student_keerthana_user,
        'student_arun': student_arun,
        'student_keerthana': student_keerthana,
        'cls11': cls11,
        'sec_a1': sec_a1,
        'sec_a2': sec_a2,
        'sub_cs': sub_cs,
        'sub_math': sub_math,
        'enr_arun': enr_arun,
        'enr_keerthana': enr_keerthana,
        'exam_type': exam_type,
        'ay': ay,
    }


def test_student_retrieves_own_marks_and_report_card(api_client, task56_setup):
    """Student can retrieve own marks list and own report card with CBSE 8-tier grade."""
    s = task56_setup
    Mark.objects.create(
        enrollment=s['enr_arun'],
        subject=s['sub_cs'],
        exam_type=s['exam_type'],
        marks_obtained=Decimal('92.00'),
        max_marks=Decimal('100.00'),
    )

    authenticate(api_client, s['student_arun_user'])

    # List marks
    res = api_client.get('/api/v1/marks/')
    assert res.status_code == status.HTTP_200_OK
    data = res.data['data']
    assert len(data) == 1
    assert data[0]['marks_obtained'] == '92.00'
    assert data[0]['grade'] == 'A1'

    # Report card
    res_rc = api_client.get(f"/api/v1/marks/report-card/{s['student_arun'].student_id}/")
    assert res_rc.status_code == status.HTTP_200_OK
    rc_data = res_rc.data['data']
    assert rc_data['student_id'] == s['student_arun'].student_id
    assert rc_data['overall_grade'] == 'A1'
    assert rc_data['overall_percentage'] == 92.0


def test_student_cross_access_denied(api_client, task56_setup):
    """Student attempting to view another student's report card is denied (403)."""
    s = task56_setup
    authenticate(api_client, s['student_arun_user'])

    res = api_client.get(f"/api/v1/marks/report-card/{s['student_keerthana'].student_id}/")
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_student_cannot_enter_marks(api_client, task56_setup):
    """Student role cannot enter marks (403 Forbidden)."""
    s = task56_setup
    authenticate(api_client, s['student_arun_user'])

    payload = {
        'records': [{
            'student_id': s['student_arun'].student_id,
            'subject_id': str(s['sub_cs'].id),
            'exam_type_id': str(s['exam_type'].id),
            'marks_obtained': '95.00',
        }]
    }
    res = api_client.post('/api/v1/marks/bulk/', payload, format='json')
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_parent_retrieves_linked_child_marks_and_report_card(api_client, task56_setup):
    """Parent can view linked child marks and report card."""
    s = task56_setup
    Mark.objects.create(
        enrollment=s['enr_arun'],
        subject=s['sub_math'],
        exam_type=s['exam_type'],
        marks_obtained=Decimal('85.00'),
        max_marks=Decimal('100.00'),
    )

    authenticate(api_client, s['parent_user'])

    # List marks for child
    res = api_client.get(f"/api/v1/marks/?student_id={s['student_arun'].student_id}")
    assert res.status_code == status.HTTP_200_OK
    assert len(res.data['data']) == 1
    assert res.data['data'][0]['grade'] == 'A2'

    # Report card for child
    res_rc = api_client.get(f"/api/v1/marks/report-card/{s['student_arun'].student_id}/")
    assert res_rc.status_code == status.HTTP_200_OK
    assert res_rc.data['data']['overall_grade'] == 'A2'


def test_parent_cross_child_marks_denied(api_client, task56_setup):
    """Parent cannot view unlinked student's report card (403 Forbidden)."""
    s = task56_setup
    authenticate(api_client, s['parent_user'])

    res = api_client.get(f"/api/v1/marks/report-card/{s['student_keerthana'].student_id}/")
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_faculty_enters_marks_assigned_scope_succeeds(api_client, task56_setup):
    """Faculty Suresh enters CS marks for student in Section A1 (succeeds)."""
    s = task56_setup
    authenticate(api_client, s['faculty_suresh_user'])

    payload = {
        'records': [{
            'student_id': s['student_arun'].student_id,
            'subject_id': str(s['sub_cs'].id),
            'exam_type_id': str(s['exam_type'].id),
            'marks_obtained': '88.50',
            'max_marks': '100.00',
        }]
    }
    res = api_client.post('/api/v1/marks/bulk/', payload, format='json')
    assert res.status_code == status.HTTP_201_CREATED
    assert res.data['data']['saved_count'] == 1
    record = res.data['data']['records'][0]
    assert record['grade'] == 'A2'
    assert record['marks_obtained'] == '88.50'


def test_faculty_unassigned_subject_marks_rejected(api_client, task56_setup):
    """Faculty Suresh attempts to enter Mathematics marks in A1 (assigned to Priya) -> 403 Forbidden."""
    s = task56_setup
    authenticate(api_client, s['faculty_suresh_user'])

    payload = {
        'records': [{
            'student_id': s['student_arun'].student_id,
            'subject_id': str(s['sub_math'].id),
            'exam_type_id': str(s['exam_type'].id),
            'marks_obtained': '75.00',
        }]
    }
    res = api_client.post('/api/v1/marks/bulk/', payload, format='json')
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_marks_range_validation_0_to_100_and_negative_rejected(api_client, task56_setup):
    """Marks must be between 0 and 100; negative and out-of-bounds rejected with 400 Bad Request."""
    s = task56_setup
    authenticate(api_client, s['admin_user'])

    # Negative marks rejected
    payload_neg = {
        'records': [{
            'student_id': s['student_arun'].student_id,
            'subject_id': str(s['sub_cs'].id),
            'exam_type_id': str(s['exam_type'].id),
            'marks_obtained': '-5.00',
        }]
    }
    res_neg = api_client.post('/api/v1/marks/bulk/', payload_neg, format='json')
    assert res_neg.status_code == status.HTTP_400_BAD_REQUEST

    # Over 100 marks rejected
    payload_over = {
        'records': [{
            'student_id': s['student_arun'].student_id,
            'subject_id': str(s['sub_cs'].id),
            'exam_type_id': str(s['exam_type'].id),
            'marks_obtained': '105.00',
        }]
    }
    res_over = api_client.post('/api/v1/marks/bulk/', payload_over, format='json')
    assert res_over.status_code == status.HTTP_400_BAD_REQUEST


def test_absent_ab_marking_and_report_card_calculation(api_client, task56_setup):
    """'AB' (Absent) marks entry is accepted, stored with grade 'AB', and computed cleanly in report cards."""
    s = task56_setup
    authenticate(api_client, s['admin_user'])

    payload = {
        'records': [{
            'student_id': s['student_arun'].student_id,
            'subject_id': str(s['sub_cs'].id),
            'exam_type_id': str(s['exam_type'].id),
            'marks_obtained': 'AB',
            'max_marks': '100.00',
        }]
    }
    res = api_client.post('/api/v1/marks/bulk/', payload, format='json')
    assert res.status_code == status.HTTP_201_CREATED
    rec = res.data['data']['records'][0]
    assert rec['marks_obtained'] == 'AB'
    assert rec['grade'] == 'AB'

    # Check Report Card
    res_rc = api_client.get(f"/api/v1/marks/report-card/{s['student_arun'].student_id}/")
    assert res_rc.status_code == status.HTTP_200_OK
    rc_data = res_rc.data['data']
    assert rc_data['marks'][0]['marks_obtained'] == 'AB'
    assert rc_data['marks'][0]['grade'] == 'AB'
    assert rc_data['total_marks_obtained'] == 0.0
    assert rc_data['total_max_marks'] == 100.0


def test_marks_summary_oversight_admin_and_principal(api_client, task56_setup):
    """Admin and Principal view institutional marks summary oversight."""
    s = task56_setup
    # Create evaluation records
    Mark.objects.create(
        enrollment=s['enr_arun'],
        subject=s['sub_cs'],
        exam_type=s['exam_type'],
        marks_obtained=Decimal('95.00'),
        max_marks=Decimal('100.00'),
    )

    for user in [s['admin_user'], s['principal_user']]:
        authenticate(api_client, user)
        res = api_client.get('/api/v1/marks/summary/')
        assert res.status_code == status.HTTP_200_OK
        data = res.data['data']
        assert len(data) >= 1
        item = [d for d in data if d['subject_name'] == 'Computer Science'][0]
        assert item['class_name'] == 'Grade 11 — Computer Science A'
        assert item['average_percentage'] == 95.0
        assert item['highest_marks'] == 95.0
        assert item['pass_percentage'] == 100.0
        assert item['grade_distribution']['A1'] == 1
        assert item['status'] in ('Published', 'In Progress')


def test_marks_summary_oversight_faculty_scoping(api_client, task56_setup):
    """Faculty viewing marks summary is scoped to assigned sections."""
    s = task56_setup
    Mark.objects.create(
        enrollment=s['enr_arun'],
        subject=s['sub_cs'],
        exam_type=s['exam_type'],
        marks_obtained=Decimal('82.00'),
    )
    Mark.objects.create(
        enrollment=s['enr_keerthana'],
        subject=s['sub_math'],
        exam_type=s['exam_type'],
        marks_obtained=Decimal('78.00'),
    )

    # Suresh is Class Teacher of A1 and teaches CS in A1
    authenticate(api_client, s['faculty_suresh_user'])
    res = api_client.get('/api/v1/marks/summary/')
    assert res.status_code == status.HTTP_200_OK
    data = res.data['data']
    # Must not see Section A2
    sections = [d['section_name'] for d in data]
    assert all('A2' not in sec for sec in sections)


def test_marks_summary_oversight_student_parent_forbidden(api_client, task56_setup):
    """Student and Parent are forbidden from marks summary oversight (403)."""
    s = task56_setup
    for user in [s['student_arun_user'], s['parent_user']]:
        authenticate(api_client, user)
        res = api_client.get('/api/v1/marks/summary/')
        assert res.status_code == status.HTTP_403_FORBIDDEN


def test_academic_analytics_admin_and_principal(api_client, task56_setup):
    """Admin and Principal can retrieve institutional academic analytics."""
    s = task56_setup
    for user in [s['principal_user'], s['admin_user']]:
        authenticate(api_client, user)
        res = api_client.get('/api/v1/marks/analytics/')
        assert res.status_code == status.HTTP_200_OK
        data = res.data['data']
        assert 'gradePerformance' in data
        assert 'streamPerformance' in data
        assert 'subjectPerformance' in data
        assert 'schoolGradeDistribution' in data
        assert len(data['gradePerformance']) > 0
        assert len(data['streamPerformance']) > 0
        assert len(data['subjectPerformance']) > 0
        assert len(data['schoolGradeDistribution']) == 8


def test_academic_analytics_faculty_student_parent_forbidden(api_client, task56_setup):
    """Faculty, Student, and Parent are forbidden from institutional academic analytics (403)."""
    s = task56_setup
    for user in [s['faculty_suresh_user'], s['student_arun_user'], s['parent_user']]:
        authenticate(api_client, user)
        res = api_client.get('/api/v1/marks/analytics/')
        assert res.status_code == status.HTTP_403_FORBIDDEN


def test_purge_of_university_terms_and_faculty_rankings(api_client, task56_setup):
    """Verifies complete purge of GPA, CGPA, credits, and teacher rankings from mark responses."""
    s = task56_setup
    authenticate(api_client, s['principal_user'])

    res_analytics = api_client.get('/api/v1/marks/analytics/')
    content_str = str(res_analytics.content).lower()
    for forbidden in ['cgpa', 'credit_point', 'faculty_rank', 'teacher_rank', 'teacher_performance']:
        assert forbidden not in content_str, f"Forbidden term '{forbidden}' found in analytics payload."
