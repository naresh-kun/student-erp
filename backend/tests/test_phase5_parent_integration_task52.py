"""
Student ERP — Phase 5 Task 5.2 Backend Verification Suite
Core ERP API Integration: Parent Module Endpoints & Authorization Scoping

Tests:
1. Parent Profile:
   - Authenticated parent retrieves own profile via /api/v1/parents/me/
   - Authenticated parent retrieves own profile via /api/v1/parents/<id>/
   - Authenticated parent cannot retrieve another parent's profile (403 Forbidden)
   - Unauthenticated parent endpoints return 401 Unauthorized
2. Linked Children:
   - Authenticated parent retrieves linked children via /api/v1/parents/me/children/
   - Authenticated parent retrieves linked children via /api/v1/parents/<id>/children/
   - Authenticated parent cannot retrieve another parent's children (403 Forbidden)
   - Authenticated parent can inspect linked child profile via /api/v1/students/<student_id>/
   - Authenticated parent cannot inspect unlinked student profile (403 Forbidden)
3. Ward Attendance & Leaves:
   - Authenticated parent retrieves ward attendance records & canonical summary via /api/v1/attendance/?student_id=<id>
   - Authenticated parent cannot view attendance for unlinked student (scoped to empty/filtered)
   - Authenticated parent retrieves ward leave applications via /api/v1/attendance/leaves/?student_id=<id>
   - Authenticated parent submits absence notice / leave application for linked ward; status is strictly PENDING (201 Created)
   - Authenticated parent cannot submit leave application for unlinked student (403 Forbidden)
4. Ward Marks & Report Card:
   - Authenticated parent retrieves ward marks via /api/v1/marks/?student_id=<id>
   - Authenticated parent retrieves ward report card via /api/v1/marks/report-card/<student_id>/
   - Authenticated parent cannot retrieve unlinked student's report card (403 Forbidden)
   - Authenticated parent cannot enter marks (403 Forbidden)
"""

from datetime import date, timedelta
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role, User, Parent, Faculty
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import ExamType, Mark
from apps.homework.models import Homework


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def parent_auth_setup(db):
    """Sets up two parents with distinct linked children, enrollments, attendance, marks, and leaves."""
    role_parent, _ = Role.objects.get_or_create(
        name='Parent',
        defaults={'description': 'Guardian / Parent of student'}
    )
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

    # 1. Parent 1 & Student 1 (Family A)
    u_par1, _ = User.objects.get_or_create(
        username='parent_ramanathan',
        defaults={
            'email': 'ramanathan@gmail.com',
            'first_name': 'S.',
            'last_name': 'Ramanathan',
            'role': role_parent,
            'is_active': True,
        }
    )
    u_par1.set_password('demo123')
    u_par1.save()

    parent1, _ = Parent.objects.get_or_create(
        user=u_par1,
        defaults={
            'relation': 'Father',
            'occupation': 'Senior Technical Director',
            'address': 'No. 42, Temple View Avenue, New Delhi',
        }
    )

    u_stu1, _ = User.objects.get_or_create(
        username='STU202600001',
        defaults={
            'email': 'student1@school.edu.in',
            'first_name': 'Arun',
            'last_name': 'Kumar',
            'role': role_student,
            'is_active': True,
        }
    )
    u_stu1.set_password('demo123')
    u_stu1.save()

    student1, _ = Student.objects.get_or_create(
        user=u_stu1,
        defaults={
            'student_id': 'STU202600001',
            'admission_number': 'ADM20240091',
            'roll_number': '11-A1-01',
            'status': 'Enrolled',
            'parent': parent1,
            'date_of_birth': '2009-05-14',
            'gender': 'Male',
        }
    )
    if student1.parent != parent1:
        student1.parent = parent1
        student1.save()

    enr1, _ = Enrollment.objects.get_or_create(
        student=student1,
        academic_year=ay,
        defaults={'section': section1, 'status': 'Enrolled'}
    )

    # 2. Parent 2 & Student 2 (Family B)
    u_par2, _ = User.objects.get_or_create(
        username='parent_selvam',
        defaults={
            'email': 'selvam@gmail.com',
            'first_name': 'M.',
            'last_name': 'Selvam',
            'role': role_parent,
            'is_active': True,
        }
    )
    u_par2.set_password('demo123')
    u_par2.save()

    parent2, _ = Parent.objects.get_or_create(
        user=u_par2,
        defaults={
            'relation': 'Father',
            'occupation': 'Chief Medical Officer',
            'address': 'Flat 3B, Shanti Enclave, New Delhi',
        }
    )

    u_stu2, _ = User.objects.get_or_create(
        username='STU202600002',
        defaults={
            'email': 'student2@school.edu.in',
            'first_name': 'Bala',
            'last_name': 'Murugan',
            'role': role_student,
            'is_active': True,
        }
    )
    u_stu2.set_password('demo123')
    u_stu2.save()

    student2, _ = Student.objects.get_or_create(
        user=u_stu2,
        defaults={
            'student_id': 'STU202600002',
            'admission_number': 'ADM20240092',
            'roll_number': '11-A2-02',
            'status': 'Enrolled',
            'parent': parent2,
            'date_of_birth': '2009-08-20',
            'gender': 'Male',
        }
    )
    if student2.parent != parent2:
        student2.parent = parent2
        student2.save()

    enr2, _ = Enrollment.objects.get_or_create(
        student=student2,
        academic_year=ay,
        defaults={'section': section2, 'status': 'Enrolled'}
    )

    # Attendance Records
    Attendance.objects.get_or_create(
        enrollment=enr1,
        date='2026-10-01',
        defaults={'status': 'PRESENT', 'recorded_by': u_par1}
    )
    Attendance.objects.get_or_create(
        enrollment=enr1,
        date='2026-10-02',
        defaults={'status': 'ABSENT', 'recorded_by': u_par1}
    )
    Attendance.objects.get_or_create(
        enrollment=enr2,
        date='2026-10-01',
        defaults={'status': 'PRESENT', 'recorded_by': u_par2}
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

    # Leave Applications
    LeaveApplication.objects.get_or_create(
        student=student1,
        start_date='2026-09-22',
        end_date='2026-09-22',
        defaults={'leave_type': 'Medical', 'reason': 'Viral fever', 'status': 'APPROVED'}
    )
    LeaveApplication.objects.get_or_create(
        student=student2,
        start_date='2026-09-25',
        end_date='2026-09-25',
        defaults={'leave_type': 'Casual', 'reason': 'Family event', 'status': 'PENDING'}
    )

    # Faculty for authoring assignments
    u_fac, _ = User.objects.get_or_create(
        username='FAC2026001',
        defaults={
            'email': 'faculty1@school.edu.in',
            'first_name': 'Suresh',
            'last_name': 'Srinivasan',
            'role': role_faculty,
            'is_active': True,
        }
    )
    u_fac.set_password('demo123')
    u_fac.save()
    faculty, _ = Faculty.objects.get_or_create(
        user=u_fac,
        defaults={'employee_code': 'FAC001', 'joining_date': '2020-01-01'}
    )

    def auth_client_fn(user):
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        return client

    return {
        'parent_user1': u_par1,
        'parent1': parent1,
        'student_user1': u_stu1,
        'student1': student1,
        'parent_user2': u_par2,
        'parent2': parent2,
        'student_user2': u_stu2,
        'student2': student2,
        'academic_year': ay,
        'school_class': school_class,
        'section1': section1,
        'section2': section2,
        'subject': subject,
        'faculty': faculty,
        'auth_client': auth_client_fn,
    }


class TestParentProfileIntegration:
    """Verifies Parent Profile endpoints and boundaries."""

    def test_parent_retrieves_own_profile_via_me(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        res = client.get('/api/v1/parents/me/')

        assert res.status_code == status.HTTP_200_OK
        data = res.data['data']
        assert data['id'] == str(parent_auth_setup['parent1'].id)
        assert data['relation'] == 'Father'
        assert data['occupation'] == 'Senior Technical Director'
        assert data['email'] == 'ramanathan@gmail.com'

    def test_parent_retrieves_own_profile_via_id(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        parent_id = parent_auth_setup['parent1'].id
        res = client.get(f'/api/v1/parents/{parent_id}/')

        assert res.status_code == status.HTTP_200_OK
        data = res.data['data']
        assert data['id'] == str(parent_id)

    def test_parent_cross_profile_access_denied(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        other_parent_id = parent_auth_setup['parent2'].id
        res = client.get(f'/api/v1/parents/{other_parent_id}/')

        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_parent_access_denied(self, api_client, parent_auth_setup):
        res = api_client.get('/api/v1/parents/me/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED


class TestParentChildrenIntegration:
    """Verifies Parent Children inspection and linked child scoping."""

    def test_parent_retrieves_linked_children_via_me_children(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        res = client.get('/api/v1/parents/me/children/')

        assert res.status_code == status.HTTP_200_OK
        children = res.data['data']
        assert len(children) == 1
        assert children[0]['student_id'] == 'STU202600001'
        assert children[0]['first_name'] == 'Arun'
        assert children[0]['current_class'] == 'Grade 11 - Computer Science'
        assert children[0]['current_section'] == 'A1'

    def test_parent_retrieves_linked_children_via_id_children(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        parent_id = parent_auth_setup['parent1'].id
        res = client.get(f'/api/v1/parents/{parent_id}/children/')

        assert res.status_code == status.HTTP_200_OK
        children = res.data['data']
        assert len(children) == 1
        assert children[0]['student_id'] == 'STU202600001'

    def test_parent_cross_children_access_denied(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        other_parent_id = parent_auth_setup['parent2'].id
        res = client.get(f'/api/v1/parents/{other_parent_id}/children/')

        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_parent_retrieves_linked_child_profile(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu1_id = parent_auth_setup['student1'].student_id
        res = client.get(f'/api/v1/students/{stu1_id}/')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['data']['student_id'] == stu1_id

    def test_parent_cross_child_profile_denied(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu2_id = parent_auth_setup['student2'].student_id
        res = client.get(f'/api/v1/students/{stu2_id}/')

        assert res.status_code == status.HTTP_403_FORBIDDEN


class TestParentAttendanceIntegration:
    """Verifies Parent access to ward attendance and absence notice submissions."""

    def test_parent_retrieves_child_attendance_and_summary(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu1_id = parent_auth_setup['student1'].student_id
        res = client.get(f'/api/v1/attendance/?student_id={stu1_id}')

        assert res.status_code == status.HTTP_200_OK
        records = res.data['data']
        assert len(records) == 2
        for r in records:
            assert r['student_id'] == stu1_id

        summary = res.data['meta']['attendance_summary']
        assert summary['total_sessions'] == 2
        assert summary['present_count'] == 1
        assert summary['absent_count'] == 1
        assert summary['attendance_percentage'] == 50.0

    def test_parent_cross_child_attendance_filtered(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu2_id = parent_auth_setup['student2'].student_id
        res = client.get(f'/api/v1/attendance/?student_id={stu2_id}')

        assert res.status_code == status.HTTP_200_OK
        records = res.data['data']
        assert len(records) == 0

    def test_parent_retrieves_child_leaves(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu1_id = parent_auth_setup['student1'].student_id
        res = client.get(f'/api/v1/attendance/leaves/?student_id={stu1_id}')

        assert res.status_code == status.HTTP_200_OK
        leaves = res.data['data']
        assert len(leaves) == 1
        assert leaves[0]['student_id'] == stu1_id
        assert leaves[0]['leave_type'] == 'Medical'

    def test_parent_submits_leave_application_for_linked_child_pending_status(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu1 = parent_auth_setup['student1']

        payload = {
            'student_id': stu1.student_id,
            'leave_type': 'Medical',
            'start_date': '2026-10-15',
            'end_date': '2026-10-16',
            'reason': 'Family doctor advised complete rest for viral fever symptoms.',
            'status': 'APPROVED',  # Attempt to self-approve
        }
        res = client.post('/api/v1/attendance/leaves/', data=payload)

        assert res.status_code == status.HTTP_201_CREATED
        data = res.data['data']
        assert data['student_id'] == stu1.student_id
        assert data['leave_type'] == 'Medical'
        assert data['status'] == 'PENDING'  # Overridden strictly to PENDING

    def test_parent_cannot_submit_leave_for_unlinked_child(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu2 = parent_auth_setup['student2']

        payload = {
            'student_id': stu2.student_id,
            'leave_type': 'Medical',
            'start_date': '2026-10-15',
            'end_date': '2026-10-16',
            'reason': 'Attempting unauthorized submission.',
        }
        res = client.post('/api/v1/attendance/leaves/', data=payload)
        assert res.status_code == status.HTTP_403_FORBIDDEN


class TestParentMarksIntegration:
    """Verifies Parent access to ward marks register and report card."""

    def test_parent_retrieves_child_marks(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu1_id = parent_auth_setup['student1'].student_id
        res = client.get(f'/api/v1/marks/?student_id={stu1_id}')

        assert res.status_code == status.HTTP_200_OK
        marks = res.data['data']
        assert len(marks) == 1
        assert float(marks[0]['marks_obtained']) == 92.0
        assert marks[0]['grade'] == 'A1'

    def test_parent_retrieves_child_report_card(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu1_id = parent_auth_setup['student1'].student_id
        res = client.get(f'/api/v1/marks/report-card/{stu1_id}/')

        assert res.status_code == status.HTTP_200_OK
        rc = res.data['data']
        assert rc['student_id'] == stu1_id
        assert rc['total_marks_obtained'] == 92.0
        assert rc['overall_percentage'] == 92.0
        assert rc['overall_grade'] == 'A1'

    def test_parent_cross_child_report_card_denied(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        stu2_id = parent_auth_setup['student2'].student_id
        res = client.get(f'/api/v1/marks/report-card/{stu2_id}/')

        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_parent_cannot_enter_marks(self, parent_auth_setup):
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        payload = {
            'records': [
                {
                    'student_id': parent_auth_setup['student1'].student_id,
                    'subject_id': 'CS101',
                    'marks_obtained': 100,
                }
            ]
        }
        res = client.post('/api/v1/marks/bulk/', data=payload)
        assert res.status_code == status.HTTP_403_FORBIDDEN


class TestParentHomeworkIntegration:
    """Verifies Parent access to ward homework and strict view-only scoping (MOD_001)."""

    def test_parent_sees_linked_child_published_homework(self, parent_auth_setup):
        faculty = parent_auth_setup['faculty']
        hw1 = Homework.objects.create(
            faculty=faculty,
            academic_year=parent_auth_setup['academic_year'],
            school_class=parent_auth_setup['school_class'],
            section=parent_auth_setup['section1'],
            subject=parent_auth_setup['subject'],
            title='CS Programming Task 1',
            description='Write binary search algorithm.',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=3),
            status='PUBLISHED'
        )

        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        res = client.get('/api/v1/homework/?status=PUBLISHED')
        assert res.status_code == status.HTTP_200_OK
        items = res.data['data'] if 'data' in res.data else res.data['results']
        item_ids = [item['id'] for item in items]
        assert str(hw1.id) in item_ids
        # Child matching: homework is for Section A1, matching student1
        hw_item = next(item for item in items if item['id'] == str(hw1.id))
        assert hw_item['section_name'] == 'A1'
        assert hw_item['description'] == 'Write binary search algorithm.'

    def test_parent_does_not_see_draft_homework(self, parent_auth_setup):
        faculty = parent_auth_setup['faculty']
        hw_draft = Homework.objects.create(
            faculty=faculty,
            academic_year=parent_auth_setup['academic_year'],
            school_class=parent_auth_setup['school_class'],
            section=parent_auth_setup['section1'],
            subject=parent_auth_setup['subject'],
            title='Draft CS Task',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=5),
            status='DRAFT'
        )

        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        res = client.get('/api/v1/homework/')
        assert res.status_code == status.HTTP_200_OK
        items = res.data['data'] if 'data' in res.data else res.data['results']
        item_ids = [item['id'] for item in items]
        assert str(hw_draft.id) not in item_ids

    def test_parent_does_not_see_unrelated_child_homework(self, parent_auth_setup):
        faculty = parent_auth_setup['faculty']
        # HW for section2 (Student 2's section, Family B)
        hw_other = Homework.objects.create(
            faculty=faculty,
            academic_year=parent_auth_setup['academic_year'],
            school_class=parent_auth_setup['school_class'],
            section=parent_auth_setup['section2'],
            subject=parent_auth_setup['subject'],
            title='Section A2 Independent Task',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=4),
            status='PUBLISHED'
        )

        # Parent 1 (Parent of Student 1 in Section A1) should NOT see Section A2 homework
        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])
        res = client.get('/api/v1/homework/')
        assert res.status_code == status.HTTP_200_OK
        items = res.data['data'] if 'data' in res.data else res.data['results']
        item_ids = [item['id'] for item in items]
        assert str(hw_other.id) not in item_ids

    def test_parent_homework_view_only_mutations_blocked(self, parent_auth_setup):
        faculty = parent_auth_setup['faculty']
        hw = Homework.objects.create(
            faculty=faculty,
            academic_year=parent_auth_setup['academic_year'],
            school_class=parent_auth_setup['school_class'],
            section=parent_auth_setup['section1'],
            subject=parent_auth_setup['subject'],
            title='Immutable Homework',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )

        client = parent_auth_setup['auth_client'](parent_auth_setup['parent_user1'])

        # POST attempt blocked (403)
        res_post = client.post('/api/v1/homework/', data={
            'title': 'Parent Created Homework',
            'section_id': str(parent_auth_setup['section1'].id),
            'subject_id': str(parent_auth_setup['subject'].id),
            'due_date': str(date.today() + timedelta(days=1)),
        })
        assert res_post.status_code == status.HTTP_403_FORBIDDEN

        # PATCH attempt blocked (403)
        res_patch = client.patch(f'/api/v1/homework/{hw.id}/', data={'title': 'Parent Mutated Title'})
        assert res_patch.status_code == status.HTTP_403_FORBIDDEN

        # DELETE attempt blocked (403)
        res_del = client.delete(f'/api/v1/homework/{hw.id}/')
        assert res_del.status_code == status.HTTP_403_FORBIDDEN

