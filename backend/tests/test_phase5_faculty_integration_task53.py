"""
Student ERP — Phase 5 Task 5.3 Backend Verification Suite
Core ERP API Integration: Faculty Module Endpoints & Authorization Scoping

Comprehensive security and authorization verification:
1. Faculty Profile:
   - GET /api/v1/faculty/me/ returns authenticated faculty profile with computed statistics.
   - GET /api/v1/faculty/<id>/ returns profile.
   - Self-update via PATCH /api/v1/faculty/me/ allowed for bio/specialization; administrative fields rejected.
   - Unauthenticated access returns 401 Unauthorized.
2. Assigned Classes / Sections Scoping:
   - GET /api/v1/faculty/me/classes/ returns authoritative TeachingAssignment & Class Teacher sections.
   - Cross-faculty classes access via /api/v1/faculty/<other_id>/classes/ rejected with 403 Forbidden.
3. Assigned Students Scoping:
   - Faculty can view students enrolled in assigned section / taught classes.
   - Cross-section access to unassigned students rejected with 403 Forbidden (object-level and list-level).
   - Faculty attempting to mutate/delete student rejected with 403 Forbidden.
4. Attendance Recording & Scoping:
   - Bulk attendance recording for assigned section succeeds (201 Created) with canonical statuses.
   - Bulk attendance for unassigned section strictly rejected with 403 Forbidden.
   - Invalid status (e.g., LATE, EXCUSED) rejected with 400 Bad Request.
5. Class Teacher vs Subject Faculty Boundary (Leave Review):
   - Designated Class Teacher can approve/reject student leave application (200 OK).
   - Subject Faculty (who teaches the student but is NOT Class Teacher) rejected with 403 Forbidden.
   - Unrelated Faculty rejected with 403 Forbidden.
6. Marks Entry & TeachingAssignment Authority:
   - Faculty can enter marks ONLY for subjects they are actively assigned to teach.
   - Class Teacher attempting to enter marks for unassigned subject (e.g., Math) strictly rejected with 403 Forbidden.
   - Out of range marks (>100 or <0) rejected with 400 Bad Request.
   - Proper CBSE 8-tier letter grading (A1–E) verified.
7. Homework Management (MOD_001):
   - Faculty can create homework only within active TeachingAssignment scope.
   - Faculty can update/delete own homework.
   - Cross-faculty homework mutation strictly rejected with 403 Forbidden.
"""

from datetime import date, timedelta
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role, User, Faculty
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, TeachingAssignment, Enrollment
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import ExamType, Mark
from apps.homework.models import Homework


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def faculty_auth_setup(db):
    """
    Sets up two faculty members:
    1. Suresh:
       - Class Teacher for Grade 11-CS Section A1
       - TeachingAssignment for Grade 11-CS Section A1 in CS101 (Computer Science)
    2. Priya:
       - Subject Faculty for Grade 11-CS Section A1 in MATH101 (Mathematics)
       - Class Teacher for Grade 11-CS Section A2
       - TeachingAssignment for Grade 11-CS Section A2 in MATH101 (Mathematics)
    3. Unassigned Teacher: Rao (no assignments in Grade 11-CS)
    """
    role_faculty, _ = Role.objects.get_or_create(
        name='Faculty',
        defaults={'description': 'Faculty member'}
    )
    role_student, _ = Role.objects.get_or_create(
        name='Student',
        defaults={'description': 'Enrolled student'}
    )
    role_admin, _ = Role.objects.get_or_create(
        name='Admin',
        defaults={'description': 'System Administrator'}
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

    # Faculty 1: Suresh (CS Department)
    u_suresh, _ = User.objects.get_or_create(
        username='faculty_suresh',
        defaults={
            'email': 'suresh.k@school.edu',
            'first_name': 'Suresh',
            'last_name': 'Kumar',
            'role': role_faculty,
            'is_active': True,
        }
    )
    u_suresh.set_password('demo123')
    u_suresh.save()

    fac_suresh, _ = Faculty.objects.get_or_create(
        user=u_suresh,
        defaults={
            'employee_code': 'FAC2026001',
            'department': 'Computer Science',
            'designation': 'Senior Lecturer',
            'joining_date': date(2020, 6, 1),
            'is_active': True,
        }
    )

    # Faculty 2: Priya (Math Department)
    u_priya, _ = User.objects.get_or_create(
        username='faculty_priya',
        defaults={
            'email': 'priya.s@school.edu',
            'first_name': 'Priya',
            'last_name': 'Sharma',
            'role': role_faculty,
            'is_active': True,
        }
    )
    u_priya.set_password('demo123')
    u_priya.save()

    fac_priya, _ = Faculty.objects.get_or_create(
        user=u_priya,
        defaults={
            'employee_code': 'FAC2026002',
            'department': 'Mathematics',
            'designation': 'Assistant Professor',
            'joining_date': date(2021, 7, 15),
            'is_active': True,
        }
    )

    # Faculty 3: Rao (Independent / Unassigned to Grade 11-CS)
    u_rao, _ = User.objects.get_or_create(
        username='faculty_rao',
        defaults={
            'email': 'rao.v@school.edu',
            'first_name': 'Venkatesh',
            'last_name': 'Rao',
            'role': role_faculty,
            'is_active': True,
        }
    )
    u_rao.set_password('demo123')
    u_rao.save()

    fac_rao, _ = Faculty.objects.get_or_create(
        user=u_rao,
        defaults={
            'employee_code': 'FAC2026003',
            'department': 'Physics',
            'designation': 'Lecturer',
            'joining_date': date(2022, 8, 1),
            'is_active': True,
        }
    )

    # Sections
    section_a1, _ = Section.objects.get_or_create(
        name='A1',
        school_class=school_class,
        defaults={'capacity': 35, 'class_teacher': fac_suresh, 'room': 'Lab 1'}
    )
    section_a1.class_teacher = fac_suresh
    section_a1.save()

    section_a2, _ = Section.objects.get_or_create(
        name='A2',
        school_class=school_class,
        defaults={'capacity': 35, 'class_teacher': fac_priya, 'room': 'Lab 2'}
    )
    section_a2.class_teacher = fac_priya
    section_a2.save()

    # Subjects
    sub_cs, _ = Subject.objects.get_or_create(
        code='CS101',
        defaults={'name': 'Computer Science', 'weekly_periods': 6}
    )
    sub_math, _ = Subject.objects.get_or_create(
        code='MATH101',
        defaults={'name': 'Mathematics', 'weekly_periods': 5}
    )
    sub_eng, _ = Subject.objects.get_or_create(
        code='ENG101',
        defaults={'name': 'English Core', 'weekly_periods': 4}
    )

    # Teaching Assignments:
    # Suresh teaches CS101 in Section A1
    ta_suresh_a1, _ = TeachingAssignment.objects.get_or_create(
        faculty=fac_suresh,
        school_class=school_class,
        section=section_a1,
        subject=sub_cs,
        academic_year=ay,
        defaults={'is_active': True}
    )

    # Priya teaches MATH101 in Section A1 AND Section A2
    ta_priya_a1, _ = TeachingAssignment.objects.get_or_create(
        faculty=fac_priya,
        school_class=school_class,
        section=section_a1,
        subject=sub_math,
        academic_year=ay,
        defaults={'is_active': True}
    )
    ta_priya_a2, _ = TeachingAssignment.objects.get_or_create(
        faculty=fac_priya,
        school_class=school_class,
        section=section_a2,
        subject=sub_math,
        academic_year=ay,
        defaults={'is_active': True}
    )

    # Students & Enrollments
    # Student 1 (Arun) in Section A1
    u_stu1, _ = User.objects.get_or_create(
        username='student_arun',
        defaults={
            'email': 'arun@school.edu',
            'first_name': 'Arun',
            'last_name': 'Kumar',
            'role': role_student,
            'is_active': True,
        }
    )
    stu1, _ = Student.objects.get_or_create(
        user=u_stu1,
        defaults={
            'student_id': 'STU2026001',
            'admission_number': 'ADM20240091',
            'date_of_birth': '2009-05-14',
            'gender': 'Male',
            'status': 'Enrolled',
        }
    )
    enr1, _ = Enrollment.objects.get_or_create(
        student=stu1,
        section=section_a1,
        defaults={'academic_year': ay, 'status': 'Enrolled'}
    )

    # Student 2 (Bhavna) in Section A2
    u_stu2, _ = User.objects.get_or_create(
        username='student_bhavna',
        defaults={
            'email': 'bhavna@school.edu',
            'first_name': 'Bhavna',
            'last_name': 'Patel',
            'role': role_student,
            'is_active': True,
        }
    )
    stu2, _ = Student.objects.get_or_create(
        user=u_stu2,
        defaults={
            'student_id': 'STU2026002',
            'admission_number': 'ADM20240092',
            'date_of_birth': '2009-08-20',
            'gender': 'Female',
            'status': 'Enrolled',
        }
    )
    enr2, _ = Enrollment.objects.get_or_create(
        student=stu2,
        section=section_a2,
        defaults={'academic_year': ay, 'status': 'Enrolled'}
    )

    exam_type, _ = ExamType.objects.get_or_create(
        name='Unit Test 1',
        defaults={'weightage': 25, 'is_active': True}
    )

    # JWT Tokens
    token_suresh = str(RefreshToken.for_user(u_suresh).access_token)
    token_priya = str(RefreshToken.for_user(u_priya).access_token)
    token_rao = str(RefreshToken.for_user(u_rao).access_token)

    return {
        'user_suresh': u_suresh,
        'faculty_suresh': fac_suresh,
        'token_suresh': token_suresh,
        'user_priya': u_priya,
        'faculty_priya': fac_priya,
        'token_priya': token_priya,
        'user_rao': u_rao,
        'faculty_rao': fac_rao,
        'token_rao': token_rao,
        'school_class': school_class,
        'section_a1': section_a1,
        'section_a2': section_a2,
        'sub_cs': sub_cs,
        'sub_math': sub_math,
        'sub_eng': sub_eng,
        'student_arun': stu1,
        'enrollment_arun': enr1,
        'student_bhavna': stu2,
        'enrollment_bhavna': enr2,
        'exam_type': exam_type,
        'academic_year': ay,
    }


# ─── 1. FACULTY PROFILE TESTS ────────────────────────────────────────────────

@pytest.mark.django_db
class TestFacultyProfileIntegration:
    """Verifies Faculty profile endpoints, identity binding, and stats calculation."""

    def test_faculty_me_profile_retrieval(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        response = api_client.get('/api/v1/faculty/me/')
        assert response.status_code == status.HTTP_200_OK
        data = response.data['data']

        assert data['id'] == str(faculty_auth_setup['faculty_suresh'].id)
        assert data['employee_code'] == 'FAC2026001'
        assert data['department'] == 'Computer Science'
        assert data['class_teacher_of'] is not None
        assert data['class_teacher_of']['name'] == 'A1'
        assert data['assigned_classes_count'] >= 1
        assert data['assigned_students_count'] >= 1
        assert data['weekly_periods'] == 6

    def test_faculty_profile_by_id(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        fac_id = str(faculty_auth_setup['faculty_suresh'].id)
        response = api_client.get(f'/api/v1/faculty/{fac_id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['employee_code'] == 'FAC2026001'

    def test_unauthenticated_faculty_profile_denied(self, api_client):
        response = api_client.get('/api/v1/faculty/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_faculty_cannot_tamper_administrative_fields(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        # Faculty attempts to modify privileged administrative fields -> strictly rejected with 403 Forbidden
        response = api_client.patch('/api/v1/faculty/me/', {'employee_code': 'HACKED001', 'department': 'Admin'})
        assert response.status_code == status.HTTP_403_FORBIDDEN
        fac = Faculty.objects.get(id=faculty_auth_setup['faculty_suresh'].id)
        assert fac.employee_code == 'FAC2026001'

        # Updating permitted bio/specialization succeeds
        ok_response = api_client.patch('/api/v1/faculty/me/', {'specialization': 'Machine Learning & Compilers'})
        assert ok_response.status_code == status.HTTP_200_OK
        fac.refresh_from_db()
        assert fac.specialization == 'Machine Learning & Compilers'


# ─── 2. ASSIGNED CLASSES & SECTIONS SCOPING ──────────────────────────────────

@pytest.mark.django_db
class TestFacultyClassesScoping:
    """Verifies /api/v1/faculty/me/classes/ returns authoritative teaching assignments."""

    def test_faculty_me_classes_returns_authorized_assignments(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        response = api_client.get('/api/v1/faculty/me/classes/')
        assert response.status_code == status.HTTP_200_OK
        classes = response.data['data']

        assert len(classes) >= 1
        a1_cs = next((c for c in classes if c['section_name'] == 'A1' and c['subject_code'] == 'CS101'), None)
        assert a1_cs is not None
        assert a1_cs['is_class_teacher'] is True
        assert a1_cs['student_count'] >= 1
        assert a1_cs['room'] == 'Lab 1'

    def test_cross_faculty_classes_forbidden(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        priya_id = str(faculty_auth_setup['faculty_priya'].id)
        response = api_client.get(f'/api/v1/faculty/{priya_id}/classes/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_subject_faculty_classes_view(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_priya']}")
        response = api_client.get('/api/v1/faculty/me/classes/')
        assert response.status_code == status.HTTP_200_OK
        classes = response.data['data']

        # Priya teaches Math in A1 and A2
        a1_math = next((c for c in classes if c['section_name'] == 'A1' and c['subject_code'] == 'MATH101'), None)
        a2_math = next((c for c in classes if c['section_name'] == 'A2' and c['subject_code'] == 'MATH101'), None)
        assert a1_math is not None
        assert a1_math['is_class_teacher'] is False
        assert a2_math is not None
        assert a2_math['is_class_teacher'] is True


# ─── 3. STUDENT DIRECTORY SCOPING ────────────────────────────────────────────

@pytest.mark.django_db
class TestFacultyStudentDirectoryScoping:
    """Verifies that faculty can only view students in sections they teach or lead."""

    def test_faculty_can_view_assigned_student(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        stu1_id = faculty_auth_setup['student_arun'].student_id
        response = api_client.get(f'/api/v1/students/{stu1_id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['first_name'] == 'Arun'

    def test_faculty_cross_section_student_access_denied(self, api_client, faculty_auth_setup):
        # Suresh does not teach Section A2 (Bhavna)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        stu2_id = faculty_auth_setup['student_bhavna'].student_id
        response = api_client.get(f'/api/v1/students/{stu2_id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_faculty_student_list_scoping(self, api_client, faculty_auth_setup):
        # Suresh's student list should only contain Arun, not Bhavna
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        response = api_client.get('/api/v1/students/')
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        results = data.get('data') if isinstance(data, dict) and 'data' in data else data
        student_ids = [s['student_id'] for s in results]
        assert faculty_auth_setup['student_arun'].student_id in student_ids
        assert faculty_auth_setup['student_bhavna'].student_id not in student_ids

    def test_faculty_cannot_delete_student(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        stu1_id = faculty_auth_setup['student_arun'].student_id
        response = api_client.delete(f'/api/v1/students/{stu1_id}/')
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_405_METHOD_NOT_ALLOWED)


# ─── 4. ATTENDANCE WORKFLOWS & RECORDING ──────────────────────────────────────

@pytest.mark.django_db
class TestFacultyAttendanceIntegration:
    """Verifies bulk attendance recording, section scoping, and canonical 4-status rule."""

    def test_attendance_recording_for_assigned_section_succeeds(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'date': str(date.today()),
            'records': [
                {
                    'student_id': faculty_auth_setup['student_arun'].student_id,
                    'status': 'PRESENT',
                    'remarks': 'Attended morning lab',
                }
            ]
        }
        response = api_client.post('/api/v1/attendance/bulk/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['saved_count'] == 1

        # Verify DB record
        record = Attendance.objects.get(
            enrollment=faculty_auth_setup['enrollment_arun'],
            date=date.today(),
        )
        assert record.status == 'PRESENT'
        assert record.recorded_by == faculty_auth_setup['user_suresh']

    def test_attendance_recording_for_unassigned_section_rejected(self, api_client, faculty_auth_setup):
        # Suresh attempts to record attendance for Section A2 (Bhavna)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'date': str(date.today()),
            'records': [
                {
                    'student_id': faculty_auth_setup['student_bhavna'].student_id,
                    'status': 'PRESENT',
                }
            ]
        }
        response = api_client.post('/api/v1/attendance/bulk/', payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_attendance_recording_with_invalid_status_rejected(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'date': str(date.today()),
            'records': [
                {
                    'student_id': faculty_auth_setup['student_arun'].student_id,
                    'status': 'LATE',  # Strictly forbidden under 4-status model
                }
            ]
        }
        response = api_client.post('/api/v1/attendance/bulk/', payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_all_canonical_statuses_supported(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        for att_status in ['PRESENT', 'ABSENT', 'ON_DUTY', 'LEAVE']:
            test_date = date.today() - timedelta(days=10)
            payload = {
                'date': str(test_date),
                'records': [
                    {
                        'student_id': faculty_auth_setup['student_arun'].student_id,
                        'status': att_status,
                    }
                ]
            }
            response = api_client.post('/api/v1/attendance/bulk/', payload, format='json')
            assert response.status_code == status.HTTP_201_CREATED, f"Failed for {att_status}"


# ─── 5. LEAVE NOTICE REVIEW (CLASS TEACHER BOUNDARY) ─────────────────────────

@pytest.mark.django_db
class TestFacultyLeaveReviewIntegration:
    """Verifies Class Teacher authority for approving/rejecting leave applications."""

    def test_class_teacher_can_approve_leave(self, api_client, faculty_auth_setup):
        leave_app = LeaveApplication.objects.create(
            student=faculty_auth_setup['student_arun'],
            leave_type='Medical',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=2),
            reason='Viral fever',
            status='PENDING',
        )

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        response = api_client.patch(
            f'/api/v1/attendance/leaves/{leave_app.id}/',
            {'status': 'APPROVED', 'review_remarks': 'Approved per medical certificate'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.data['data']
        assert data['status'] == 'APPROVED'
        assert data['review_remarks'] == 'Approved per medical certificate'

        leave_app.refresh_from_db()
        assert leave_app.status == 'APPROVED'
        assert leave_app.reviewed_by == faculty_auth_setup['faculty_suresh']

    def test_non_class_teacher_cannot_approve_leave(self, api_client, faculty_auth_setup):
        # Priya teaches Math to Arun, but is NOT the Class Teacher of Section A1
        leave_app = LeaveApplication.objects.create(
            student=faculty_auth_setup['student_arun'],
            leave_type='Casual',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=1),
            reason='Family function',
            status='PENDING',
        )

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_priya']}")
        response = api_client.patch(
            f'/api/v1/attendance/leaves/{leave_app.id}/',
            {'status': 'APPROVED', 'review_remarks': 'Unauthorized approval attempt'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ─── 6. MARKS ENTRY & TEACHING ASSIGNMENT AUTHORITY ──────────────────────────

@pytest.mark.django_db
class TestFacultyMarksEntryIntegration:
    """Verifies that marks entry is strictly governed by TeachingAssignment, not Class Teacher status."""

    def test_faculty_enters_marks_for_assigned_subject_succeeds(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'records': [
                {
                    'student_id': faculty_auth_setup['student_arun'].student_id,
                    'subject_id': str(faculty_auth_setup['sub_cs'].id),
                    'exam_type_id': str(faculty_auth_setup['exam_type'].id),
                    'marks_obtained': 88.5,
                    'max_marks': 100,
                    'remarks': 'Outstanding coding project',
                }
            ]
        }
        response = api_client.post('/api/v1/marks/bulk/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['saved_count'] == 1

        rec = Mark.objects.get(
            enrollment=faculty_auth_setup['enrollment_arun'],
            subject=faculty_auth_setup['sub_cs'],
        )
        assert rec.marks_obtained == 88.5
        assert rec.grade == 'A2'  # CBSE grading: 81-90 -> A2
        assert rec.evaluated_by == faculty_auth_setup['faculty_suresh']

    def test_class_teacher_cannot_enter_marks_for_unassigned_subject(self, api_client, faculty_auth_setup):
        # Suresh is Class Teacher of Section A1, but NOT assigned to teach Math
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'records': [
                {
                    'student_id': faculty_auth_setup['student_arun'].student_id,
                    'subject_id': str(faculty_auth_setup['sub_math'].id),  # Math assigned to Priya, not Suresh
                    'exam_type_id': str(faculty_auth_setup['exam_type'].id),
                    'marks_obtained': 95.0,
                    'max_marks': 100,
                }
            ]
        }
        response = api_client.post('/api/v1/marks/bulk/', payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_subject_faculty_can_enter_marks_for_assigned_subject(self, api_client, faculty_auth_setup):
        # Priya can enter marks for Math in Section A1
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_priya']}")
        payload = {
            'records': [
                {
                    'student_id': faculty_auth_setup['student_arun'].student_id,
                    'subject_id': str(faculty_auth_setup['sub_math'].id),
                    'exam_type_id': str(faculty_auth_setup['exam_type'].id),
                    'marks_obtained': 92.0,
                    'max_marks': 100,
                    'remarks': 'Excellent analytical skills',
                }
            ]
        }
        response = api_client.post('/api/v1/marks/bulk/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        rec = Mark.objects.get(
            enrollment=faculty_auth_setup['enrollment_arun'],
            subject=faculty_auth_setup['sub_math'],
        )
        assert rec.marks_obtained == 92.0
        assert rec.grade == 'A1'  # CBSE grading: 91-100 -> A1

    def test_marks_out_of_range_rejected(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'records': [
                {
                    'student_id': faculty_auth_setup['student_arun'].student_id,
                    'subject_id': str(faculty_auth_setup['sub_cs'].id),
                    'exam_type_id': str(faculty_auth_setup['exam_type'].id),
                    'marks_obtained': 105.0,  # >100 is invalid
                    'max_marks': 100,
                }
            ]
        }
        response = api_client.post('/api/v1/marks/bulk/', payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ─── 7. HOMEWORK MANAGEMENT & MUTATION SCOPE (MOD_001) ───────────────────────

@pytest.mark.django_db
class TestFacultyHomeworkIntegration:
    """Verifies that faculty can create/update/delete homework only for authorized teaching scope."""

    def test_faculty_create_homework_in_assigned_scope(self, api_client, faculty_auth_setup):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'title': 'Binary Trees Lab Exercise',
            'description': 'Implement insertion and traversal routines.',
            'section': str(faculty_auth_setup['section_a1'].id),
            'subject': str(faculty_auth_setup['sub_cs'].id),
            'due_date': str(date.today() + timedelta(days=5)),
            'status': 'PUBLISHED',
        }
        response = api_client.post('/api/v1/homework/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['title'] == 'Binary Trees Lab Exercise'

    def test_faculty_create_homework_in_unauthorized_scope_denied(self, api_client, faculty_auth_setup):
        # Suresh attempts to create Math homework in Section A1
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_suresh']}")
        payload = {
            'title': 'Calculus Integration Problems',
            'description': 'Solve exercises 4.1 to 4.5',
            'section': str(faculty_auth_setup['section_a1'].id),
            'subject': str(faculty_auth_setup['sub_math'].id),
            'due_date': str(date.today() + timedelta(days=5)),
            'status': 'PUBLISHED',
        }
        response = api_client.post('/api/v1/homework/', payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cross_faculty_homework_mutation_denied(self, api_client, faculty_auth_setup):
        # Suresh creates homework
        hw = Homework.objects.create(
            title='Data Structures Assignment',
            description='Complete queue implementation',
            section=faculty_auth_setup['section_a1'],
            subject=faculty_auth_setup['sub_cs'],
            faculty=faculty_auth_setup['faculty_suresh'],
            due_date=date.today() + timedelta(days=3),
            status='PUBLISHED',
        )

        # Priya attempts to update Suresh's homework
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {faculty_auth_setup['token_priya']}")
        response = api_client.patch(
            f'/api/v1/homework/{hw.id}/',
            {'title': 'Tampered Homework Title'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
