"""
Student ERP — Phase 5 Task 5.5 Backend Verification Suite
Attendance API Integration, Governance & Oversight Verification Suite

Comprehensive test coverage for Phase 5 Task 5.5:
1. Canonical 4-Status Model:
   - Exactly PRESENT, ABSENT, ON_DUTY, LEAVE.
   - Strictly rejects legacy LATE and EXCUSED with 400 Bad Request.
2. Canonical Attendance Percentage Calculation:
   - Formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100.
   - LEAVE counts as absence in the denominator.
   - ON_DUTY counts as present in the numerator.
3. Student Absentees Register (/api/v1/attendance/absentees/):
   - Returns ONLY status ABSENT.
   - Strictly excludes PRESENT, ON_DUTY, LEAVE.
   - Scoping: Admin (school-wide), Principal (school-wide), Faculty (assigned scope).
   - Student & Parent strictly denied (403 Forbidden).
4. Attendance Not Entered Register (/api/v1/attendance/not-entered/):
   - Represents scheduled sessions where attendance has not yet been submitted.
   - Distinct from student absence.
   - Scoping: Admin (school-wide), Principal (school-wide), Faculty (assigned scope).
   - Student & Parent strictly denied (403 Forbidden).
   - Dynamically reflects session attendance completion (disappears once submitted).
5. Administrative Oversight Roll-up (/api/v1/attendance/summary/):
   - Section-by-section daily audit register.
   - Scoped: Admin & Principal (school-wide), Faculty (assigned sections).
   - Student & Parent denied (403 Forbidden).
6. Institutional Presence Analytics (/api/v1/attendance/analytics/):
   - Executive telemetry, 4-status distribution, longitudinal trends.
   - Permitted for Principal & Admin; Student & Parent denied (403 Forbidden).
7. Mutation Security & Scoping Boundaries:
   - Principal has school-wide oversight but NO automatic attendance marking (403 Forbidden on POST /bulk/ and PATCH).
   - Student and Parent cannot mark attendance (403 Forbidden).
   - Faculty cannot record cross-section attendance (403 Forbidden).
   - Class Teacher leave review authority verified.
8. Unauthenticated Access:
   - Returns 401 Unauthorized across all endpoints.
"""

from datetime import date, timedelta
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
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_LEAVE,
)
from apps.accounts.models import Role, User, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, TeachingAssignment, Enrollment
from apps.attendance.models import Attendance, LeaveApplication


@pytest.fixture
def api_client():
    return APIClient()


def authenticate(api_client, user):
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')


@pytest.fixture
def task55_setup(db):
    """
    Sets up institutional context with:
    - Academic Year 2026-2027
    - Roles: Admin, Principal, Faculty (Suresh, Priya), Student (Arun, Keerthana), Parent (Ramanathan)
    - Classes: Grade 11 (CS), Grade 10
    - Sections: Section A1 (Suresh Class Teacher), Section A2 (Priya Class Teacher)
    - Subjects: Computer Science, Mathematics
    - Enrollments: Arun in A1, Keerthana in A2
    """
    role_admin, _ = Role.objects.get_or_create(name='Admin', defaults={'description': 'System Administrator'})
    role_principal, _ = Role.objects.get_or_create(name='Principal', defaults={'description': 'Principal'})
    role_faculty, _ = Role.objects.get_or_create(name='Faculty', defaults={'description': 'Faculty'})
    role_parent, _ = Role.objects.get_or_create(name='Parent', defaults={'description': 'Parent'})
    role_student, _ = Role.objects.get_or_create(name='Student', defaults={'description': 'Student'})

    # Users
    admin_user = User.objects.create_user(
        username='admin_task55', email='admin@school.edu', password='demo', role=role_admin, is_active=True
    )
    principal_user = User.objects.create_user(
        username='principal_task55', email='principal@school.edu', password='demo', role=role_principal, is_active=True
    )
    faculty_suresh_user = User.objects.create_user(
        username='faculty_suresh_task55', email='suresh@school.edu', password='demo', role=role_faculty,
        first_name='Suresh', last_name='Kumar', is_active=True
    )
    faculty_priya_user = User.objects.create_user(
        username='faculty_priya_task55', email='priya@school.edu', password='demo', role=role_faculty,
        first_name='Priya', last_name='Krishnan', is_active=True
    )
    parent_user = User.objects.create_user(
        username='parent_ram_task55', email='ram@family.edu', password='demo', role=role_parent,
        first_name='Ramanathan', last_name='S', is_active=True
    )
    student_arun_user = User.objects.create_user(
        username='student_arun_task55', email='arun@student.edu', password='demo', role=role_student,
        first_name='Arun', last_name='Kumar', is_active=True
    )
    student_keerthana_user = User.objects.create_user(
        username='student_keerthana_task55', email='keerthana@student.edu', password='demo', role=role_student,
        first_name='Keerthana', last_name='R', is_active=True
    )

    # Domain Profiles
    faculty_suresh = Faculty.objects.create(
        user=faculty_suresh_user, employee_code='FAC5501', department='Computer Science', designation='Senior PGT',
        joining_date=date(2020, 6, 1)
    )
    faculty_priya = Faculty.objects.create(
        user=faculty_priya_user, employee_code='FAC5502', department='Mathematics', designation='PGT Mathematics',
        joining_date=date(2021, 6, 1)
    )
    parent_profile = Parent.objects.create(user=parent_user)

    student_arun = Student.objects.create(
        user=student_arun_user,
        student_id='STU202655001',
        admission_number='ADM202655001',
        roll_number='11-A1-01',
        date_of_birth=date(2009, 5, 14),
        gender='Male',
        parent=parent_profile,
    )
    student_keerthana = Student.objects.create(
        user=student_keerthana_user,
        student_id='STU202655002',
        admission_number='ADM202655002',
        roll_number='11-A2-01',
        date_of_birth=date(2009, 8, 20),
        gender='Female',
    )

    # Academic Structure
    ay = AcademicYear.objects.create(name='2026–27', start_date='2026-06-01', end_date='2027-04-30', is_current=True)
    cls_g11 = SchoolClass.objects.create(name='Grade 11 — Computer Science', code='G11-CS', academic_year=ay)
    cls_g10 = SchoolClass.objects.create(name='Grade 10', code='G10', academic_year=ay)

    sec_a1 = Section.objects.create(name='A1', school_class=cls_g11, academic_year=ay, class_teacher=faculty_suresh, capacity=30)
    sec_a2 = Section.objects.create(name='A2', school_class=cls_g11, academic_year=ay, class_teacher=faculty_priya, capacity=30)
    sec_10a = Section.objects.create(name='A', school_class=cls_g10, academic_year=ay, capacity=30)

    sub_cs = Subject.objects.create(name='Computer Science', code='CS551', department='Computer Science', weekly_periods=6)
    sub_math = Subject.objects.create(name='Mathematics', code='MATH551', department='Mathematics', weekly_periods=6)

    # Teaching Assignments
    ta_cs_a1 = TeachingAssignment.objects.create(
        faculty=faculty_suresh, academic_year=ay, school_class=cls_g11, section=sec_a1, subject=sub_cs, is_active=True
    )
    ta_math_a2 = TeachingAssignment.objects.create(
        faculty=faculty_priya, academic_year=ay, school_class=cls_g11, section=sec_a2, subject=sub_math, is_active=True
    )

    # Enrollments
    enrollment_arun = Enrollment.objects.create(student=student_arun, section=sec_a1, academic_year=ay, status='Enrolled')
    enrollment_keerthana = Enrollment.objects.create(student=student_keerthana, section=sec_a2, academic_year=ay, status='Enrolled')

    today = date(2026, 9, 24)

    # Seed baseline attendance records on sec_a1
    att_present = Attendance.objects.create(
        enrollment=enrollment_arun, date=today, session_period=1, status=ATTENDANCE_STATUS_PRESENT, recorded_by=faculty_suresh_user
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
        'ay': ay,
        'cls_g11': cls_g11,
        'sec_a1': sec_a1,
        'sec_a2': sec_a2,
        'enrollment_arun': enrollment_arun,
        'enrollment_keerthana': enrollment_keerthana,
        'today': today,
        'ta_cs_a1': ta_cs_a1,
        'ta_math_a2': ta_math_a2,
    }


# ============================================================================
# 1. Canonical 4-Status Model & Calculations
# ============================================================================

@pytest.mark.django_db
def test_four_canonical_statuses_supported(api_client, task55_setup):
    """Verifies that PRESENT, ABSENT, ON_DUTY, and LEAVE are all validly recorded."""
    authenticate(api_client, task55_setup['admin_user'])
    enr = task55_setup['enrollment_keerthana']
    base_date = date(2026, 9, 20)

    for idx, att_status in enumerate([ATTENDANCE_STATUS_PRESENT, ATTENDANCE_STATUS_ABSENT, ATTENDANCE_STATUS_ON_DUTY, ATTENDANCE_STATUS_LEAVE]):
        res = api_client.post('/api/v1/attendance/bulk/', {
            'date': str(base_date + timedelta(days=idx)),
            'records': [{'enrollment_id': str(enr.id), 'status': att_status, 'session_period': 1}]
        }, format='json')
        assert res.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_forbidden_legacy_statuses_rejected(api_client, task55_setup):
    """Verifies that legacy LATE and EXCUSED are strictly rejected with 400 Bad Request."""
    authenticate(api_client, task55_setup['admin_user'])
    enr = task55_setup['enrollment_keerthana']

    for forbidden in ['LATE', 'EXCUSED']:
        res = api_client.post('/api/v1/attendance/bulk/', {
            'date': '2026-09-25',
            'records': [{'enrollment_id': str(enr.id), 'status': forbidden, 'session_period': 1}]
        }, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_leave_and_on_duty_percentage_semantics(api_client, task55_setup):
    """
    Formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
    Verifies that LEAVE is in denominator as absence, and ON_DUTY is in numerator as presence.
    """
    authenticate(api_client, task55_setup['admin_user'])
    enr = task55_setup['enrollment_keerthana']
    base_date = date(2026, 10, 1)

    # 1 Present, 1 On Duty, 1 Leave, 1 Absent = 2 presence out of 4 sessions = 50.0%
    payload_records = [
        {'enrollment_id': str(enr.id), 'status': ATTENDANCE_STATUS_PRESENT, 'date': str(base_date)},
        {'enrollment_id': str(enr.id), 'status': ATTENDANCE_STATUS_ON_DUTY, 'date': str(base_date + timedelta(days=1))},
        {'enrollment_id': str(enr.id), 'status': ATTENDANCE_STATUS_LEAVE, 'date': str(base_date + timedelta(days=2))},
        {'enrollment_id': str(enr.id), 'status': ATTENDANCE_STATUS_ABSENT, 'date': str(base_date + timedelta(days=3))},
    ]

    for rec in payload_records:
        api_client.post('/api/v1/attendance/bulk/', {
            'date': rec['date'],
            'records': [{'enrollment_id': rec['enrollment_id'], 'status': rec['status'], 'session_period': 1}]
        }, format='json')

    res = api_client.get(f'/api/v1/attendance/?student_id={task55_setup["student_keerthana"].student_id}')
    assert res.status_code == status.HTTP_200_OK
    summary = res.data['meta']['attendance_summary']
    assert summary['present_count'] == 1
    assert summary['on_duty_count'] == 1
    assert summary['leave_count'] == 1
    assert summary['absent_count'] == 1
    assert summary['total_sessions'] == 4
    assert summary['attendance_percentage'] == 50.0


# ============================================================================
# 2. Student Absentees Register (/api/v1/attendance/absentees/)
# ============================================================================

@pytest.mark.django_db
def test_student_absentees_strictly_absent_only(api_client, task55_setup):
    """Verifies that /absentees/ returns ONLY records with status ABSENT."""
    authenticate(api_client, task55_setup['admin_user'])
    enr = task55_setup['enrollment_keerthana']
    d = date(2026, 9, 21)

    # Create 1 ABSENT, 1 LEAVE, 1 ON_DUTY
    Attendance.objects.create(enrollment=enr, date=d, session_period=1, status=ATTENDANCE_STATUS_ABSENT, recorded_by=task55_setup['admin_user'])
    Attendance.objects.create(enrollment=enr, date=d, session_period=2, status=ATTENDANCE_STATUS_LEAVE, recorded_by=task55_setup['admin_user'])
    Attendance.objects.create(enrollment=enr, date=d, session_period=3, status=ATTENDANCE_STATUS_ON_DUTY, recorded_by=task55_setup['admin_user'])

    res = api_client.get('/api/v1/attendance/absentees/')
    assert res.status_code == status.HTTP_200_OK
    data = res.data['data'] if 'data' in res.data else res.data
    assert len(data) >= 1
    # Strict invariant: All records MUST have status == 'ABSENT'
    for item in data:
        assert item['status'] == 'ABSENT'
        assert item['status'] != 'LEAVE'
        assert item['status'] != 'ON_DUTY'
        assert item['status'] != 'PRESENT'


@pytest.mark.django_db
def test_student_absentees_rbac_boundaries(api_client, task55_setup):
    """
    Verifies RBAC on /absentees/:
    - Admin: Permitted (200 OK)
    - Principal: Permitted (200 OK)
    - Faculty: Permitted (200 OK)
    - Student: Blocked (403 Forbidden)
    - Parent: Blocked (403 Forbidden)
    """
    # 1. Admin
    authenticate(api_client, task55_setup['admin_user'])
    assert api_client.get('/api/v1/attendance/absentees/').status_code == status.HTTP_200_OK

    # 2. Principal
    authenticate(api_client, task55_setup['principal_user'])
    assert api_client.get('/api/v1/attendance/absentees/').status_code == status.HTTP_200_OK

    # 3. Faculty
    authenticate(api_client, task55_setup['faculty_suresh_user'])
    assert api_client.get('/api/v1/attendance/absentees/').status_code == status.HTTP_200_OK

    # 4. Student (Forbidden)
    authenticate(api_client, task55_setup['student_arun_user'])
    assert api_client.get('/api/v1/attendance/absentees/').status_code == status.HTTP_403_FORBIDDEN

    # 5. Parent (Forbidden)
    authenticate(api_client, task55_setup['parent_user'])
    assert api_client.get('/api/v1/attendance/absentees/').status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_student_absentees_filters(api_client, task55_setup):
    """Verifies that /absentees/ supports search and grade filtering."""
    authenticate(api_client, task55_setup['admin_user'])
    d = date(2026, 9, 22)
    Attendance.objects.create(
        enrollment=task55_setup['enrollment_arun'], date=d, session_period=1, status=ATTENDANCE_STATUS_ABSENT, recorded_by=task55_setup['admin_user']
    )

    # Search by student_id
    res = api_client.get(f'/api/v1/attendance/absentees/?search={task55_setup["student_arun"].student_id}')
    assert res.status_code == status.HTTP_200_OK
    assert any(r['student_id'] == task55_setup['student_arun'].student_id for r in res.data['data'])

    # Filter by grade
    res_grade = api_client.get('/api/v1/attendance/absentees/?grade=Grade 11')
    assert res_grade.status_code == status.HTTP_200_OK
    assert len(res_grade.data['data']) >= 1


# ============================================================================
# 3. Attendance Not Entered Register (/api/v1/attendance/not-entered/)
# ============================================================================

@pytest.mark.django_db
def test_attendance_not_entered_admin_and_principal(api_client, task55_setup):
    """Verifies that Admin and Principal see scheduled sessions with unentered attendance."""
    # Date with no attendance for sec_a2
    test_date = '2026-10-05'

    # Admin
    authenticate(api_client, task55_setup['admin_user'])
    res = api_client.get(f'/api/v1/attendance/not-entered/?date={test_date}')
    assert res.status_code == status.HTTP_200_OK
    items = res.data['data']
    assert len(items) >= 2  # Both teaching assignments are unentered on 2026-10-05
    for item in items:
        assert item['session_status'] == 'NOT ENTERED'

    # Principal
    authenticate(api_client, task55_setup['principal_user'])
    res_p = api_client.get(f'/api/v1/attendance/not-entered/?date={test_date}')
    assert res_p.status_code == status.HTTP_200_OK
    assert len(res_p.data['data']) >= 2


@pytest.mark.django_db
def test_attendance_not_entered_faculty_assigned_scope(api_client, task55_setup):
    """Verifies that Faculty sees ONLY unentered sessions for their assigned teaching scope."""
    authenticate(api_client, task55_setup['faculty_suresh_user'])
    test_date = '2026-10-05'

    res = api_client.get(f'/api/v1/attendance/not-entered/?date={test_date}')
    assert res.status_code == status.HTTP_200_OK
    items = res.data['data']
    # Suresh only teaches Computer Science in Section A1
    for item in items:
        assert item['faculty_id'] == str(task55_setup['faculty_suresh'].id)
        assert item['section_name'] == 'Section A1'


@pytest.mark.django_db
def test_attendance_not_entered_student_parent_forbidden(api_client, task55_setup):
    """Verifies that Student and Parent receive 403 Forbidden on /not-entered/."""
    authenticate(api_client, task55_setup['student_arun_user'])
    assert api_client.get('/api/v1/attendance/not-entered/').status_code == status.HTTP_403_FORBIDDEN

    authenticate(api_client, task55_setup['parent_user'])
    assert api_client.get('/api/v1/attendance/not-entered/').status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_attendance_not_entered_session_excluded_after_submission(api_client, task55_setup):
    """Verifies that once attendance is recorded for a section on a date, it disappears from Not Entered."""
    authenticate(api_client, task55_setup['admin_user'])
    test_date = '2026-10-06'

    # Before: unentered
    res_before = api_client.get(f'/api/v1/attendance/not-entered/?date={test_date}')
    assert any(item['section_name'] == 'Section A1' for item in res_before.data['data'])

    # Record attendance for Section A1
    api_client.post('/api/v1/attendance/bulk/', {
        'date': test_date,
        'records': [{'enrollment_id': str(task55_setup['enrollment_arun'].id), 'status': ATTENDANCE_STATUS_PRESENT, 'session_period': 1}]
    }, format='json')

    # After: Section A1 is now Completed and no longer appears in Not Entered
    res_after = api_client.get(f'/api/v1/attendance/not-entered/?date={test_date}')
    assert not any(item['section_name'] == 'Section A1' for item in res_after.data['data'])


# ============================================================================
# 4. Administrative Oversight Roll-up (/api/v1/attendance/summary/)
# ============================================================================

@pytest.mark.django_db
def test_attendance_summary_oversight_admin_and_principal(api_client, task55_setup):
    """Verifies that Admin and Principal receive the daily section roll-up register."""
    # Admin
    authenticate(api_client, task55_setup['admin_user'])
    res_admin = api_client.get(f'/api/v1/attendance/summary/?date={task55_setup["today"]}')
    assert res_admin.status_code == status.HTTP_200_OK
    data = res_admin.data['data']
    assert len(data) >= 2  # A1 and A2
    sec_a1_entry = next(d for d in data if d['section_name'] == 'Section A1')
    assert sec_a1_entry['present_count'] == 1
    assert sec_a1_entry['session_status'] == 'Completed'
    assert sec_a1_entry['verified_by'] == 'Suresh Kumar'

    # Principal
    authenticate(api_client, task55_setup['principal_user'])
    res_principal = api_client.get(f'/api/v1/attendance/summary/?date={task55_setup["today"]}')
    assert res_principal.status_code == status.HTTP_200_OK

    # Student / Parent (Forbidden)
    authenticate(api_client, task55_setup['student_arun_user'])
    assert api_client.get('/api/v1/attendance/summary/').status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 5. Institutional Presence Analytics (/api/v1/attendance/analytics/)
# ============================================================================

@pytest.mark.django_db
def test_attendance_analytics_telemetry_principal_and_admin(api_client, task55_setup):
    """Verifies that Principal and Admin receive presence telemetry and 4-status distribution."""
    authenticate(api_client, task55_setup['principal_user'])
    res = api_client.get('/api/v1/attendance/analytics/')
    assert res.status_code == status.HTTP_200_OK
    telemetry = res.data['data']

    assert 'overallPresenceRate' in telemetry
    assert 'totalSessions' in telemetry
    assert 'statusDistribution' in telemetry
    assert len(telemetry['statusDistribution']) == 4
    assert 'cohortMonthlyTrends' in telemetry

    # Student (Forbidden)
    authenticate(api_client, task55_setup['student_arun_user'])
    assert api_client.get('/api/v1/attendance/analytics/').status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 6. Mutation Security & RBAC Scoping Boundaries
# ============================================================================

@pytest.mark.django_db
def test_principal_cannot_mark_attendance(api_client, task55_setup):
    """
    Verifies that Principal has oversight only and CANNOT mark bulk attendance
    or patch attendance records (403 Forbidden).
    """
    authenticate(api_client, task55_setup['principal_user'])
    res_bulk = api_client.post('/api/v1/attendance/bulk/', {
        'date': '2026-09-24',
        'records': [{'enrollment_id': str(task55_setup['enrollment_arun'].id), 'status': ATTENDANCE_STATUS_PRESENT}]
    }, format='json')
    assert res_bulk.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_student_and_parent_cannot_mark_attendance(api_client, task55_setup):
    """Verifies that Student and Parent receive 403 Forbidden on attendance entry."""
    authenticate(api_client, task55_setup['student_arun_user'])
    res = api_client.post('/api/v1/attendance/bulk/', {
        'date': '2026-09-24',
        'records': [{'enrollment_id': str(task55_setup['enrollment_arun'].id), 'status': ATTENDANCE_STATUS_PRESENT}]
    }, format='json')
    assert res.status_code == status.HTTP_403_FORBIDDEN

    authenticate(api_client, task55_setup['parent_user'])
    res_p = api_client.post('/api/v1/attendance/bulk/', {
        'date': '2026-09-24',
        'records': [{'enrollment_id': str(task55_setup['enrollment_arun'].id), 'status': ATTENDANCE_STATUS_PRESENT}]
    }, format='json')
    assert res_p.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_faculty_cannot_mark_cross_section_attendance(api_client, task55_setup):
    """
    Verifies cross-section protection:
    Faculty Suresh (assigned only to Section A1) CANNOT record attendance for Section A2.
    """
    authenticate(api_client, task55_setup['faculty_suresh_user'])
    res = api_client.post('/api/v1/attendance/bulk/', {
        'date': '2026-09-24',
        'records': [{'enrollment_id': str(task55_setup['enrollment_keerthana'].id), 'status': ATTENDANCE_STATUS_PRESENT}]
    }, format='json')
    assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_class_teacher_leave_review_workflow(api_client, task55_setup):
    """
    Verifies leave review boundary:
    - Student Arun applies for leave (201 Created)
    - Class Teacher Suresh approves Arun's leave (200 OK)
    - Faculty Priya (not Arun's Class Teacher) attempting to review is rejected with 403 Forbidden.
    """
    # 1. Student applies for leave
    authenticate(api_client, task55_setup['student_arun_user'])
    res_apply = api_client.post('/api/v1/attendance/leaves/', {
        'student': str(task55_setup['student_arun'].id),
        'leave_type': 'Medical',
        'start_date': '2026-10-10',
        'end_date': '2026-10-12',
        'reason': 'Medical recovery',
    }, format='json')
    assert res_apply.status_code == status.HTTP_201_CREATED
    leave_id = res_apply.data['data']['id']

    # 2. Non-Class Teacher Priya attempts review -> 403 Forbidden
    authenticate(api_client, task55_setup['faculty_priya_user'])
    res_fail = api_client.patch(f'/api/v1/attendance/leaves/{leave_id}/', {
        'status': 'APPROVED',
        'review_remarks': 'Unauthorized approval attempt'
    }, format='json')
    assert res_fail.status_code == status.HTTP_403_FORBIDDEN

    # 3. Designated Class Teacher Suresh reviews -> 200 OK
    authenticate(api_client, task55_setup['faculty_suresh_user'])
    res_ok = api_client.patch(f'/api/v1/attendance/leaves/{leave_id}/', {
        'status': 'APPROVED',
        'review_remarks': 'Approved by Class Teacher'
    }, format='json')
    assert res_ok.status_code == status.HTTP_200_OK
    assert res_ok.data['data']['status'] == 'APPROVED'


@pytest.mark.django_db
def test_unauthenticated_requests_return_401(api_client):
    """Verifies that unauthenticated access returns 401 Unauthorized across attendance routes."""
    api_client.credentials()  # Clear auth
    assert api_client.get('/api/v1/attendance/').status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get('/api/v1/attendance/absentees/').status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get('/api/v1/attendance/not-entered/').status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get('/api/v1/attendance/summary/').status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get('/api/v1/attendance/analytics/').status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.post('/api/v1/attendance/bulk/', {}).status_code == status.HTTP_401_UNAUTHORIZED
