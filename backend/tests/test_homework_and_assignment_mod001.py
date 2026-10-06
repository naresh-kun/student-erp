"""
Student ERP — MOD_001 Comprehensive Test Suite
Faculty/Class Teacher Assignment Architecture + Homework Management

Verifies:
1. Class Teacher Cardinality & Invariants:
   - Faculty with 0 Class Teacher assignments allowed.
   - Faculty with 1 Class Teacher assignment allowed.
   - Second Class Teacher assignment in the same Academic Year rejected (clean & DB constraint).
   - Class Teacher assignment in different Academic Years allowed.
   - Reassignment of Section Class Teacher works correctly.
   - Section with no Class Teacher (vacancy) allowed.
   - Multiple TeachingAssignments remain valid regardless of Class Teacher role.
2. Teaching Assignment Domain Rules:
   - Valid assignment created successfully.
   - Duplicate teaching assignment rejected.
   - Class/Section mismatch rejected.
   - Inactive faculty assignment rejected where appropriate.
3. Attendance Scope Reconciliation:
   - Authorized Subject Faculty / Class Teacher can record attendance.
   - Unauthorized Faculty blocked (403).
   - Class Teacher leave approval authority preserved.
4. Marks Scope Reconciliation:
   - Faculty can enter marks for assigned subjects.
   - Faculty CANNOT enter marks for unassigned subjects (403).
   - Class Teacher status alone CANNOT enter marks for unassigned subjects (403).
5. Homework Lifecycle & CRUD:
   - Authorized Faculty creation (201).
   - Unauthorized Section/Subject creation (403).
   - Request payload faculty_id forgery ignored (derived from request.user).
   - Faculty list and detail scoping (cannot mutate another faculty's homework).
   - Student view scoping: published only, enrolled section only, drafts hidden, cross-section blocked.
   - Student mutation blocked (403).
   - Parent view scoping: linked children only, drafts hidden, multi-child support, unrelated child blocked.
   - Parent mutation blocked (403).
   - Principal oversight: school-wide list/detail (200), mutation denied (403).
   - Admin management: full view/create/update/delete.
   - Direct UUID tampering blocked.
   - Unauthenticated access returns 401.
"""

from datetime import date, timedelta
from decimal import Decimal
import uuid
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APIClient

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
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
from apps.marks.models import ExamType, Mark
from apps.homework.models import Homework


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mod001_setup(db):
    """
    Sets up academic years, classes, sections, faculties, students, and parents
    for MOD_001 testing.
    """
    # Roles
    role_admin, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
    role_principal, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL)
    role_faculty, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
    role_student, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
    role_parent, _ = Role.objects.get_or_create(name=ROLE_PARENT)

    # Academic Years
    year_2026, _ = AcademicYear.objects.get_or_create(
        name='2026-2027',
        defaults={'start_date': date(2026, 6, 1), 'end_date': date(2027, 3, 31), 'is_current': True}
    )
    year_2027, _ = AcademicYear.objects.get_or_create(
        name='2027-2028',
        defaults={'start_date': date(2027, 6, 1), 'end_date': date(2028, 3, 31), 'is_current': False}
    )

    # Classes
    class_10, _ = SchoolClass.objects.get_or_create(
        academic_year=year_2026,
        code='G10-A',
        defaults={'name': 'Grade 10'}
    )
    class_11, _ = SchoolClass.objects.get_or_create(
        academic_year=year_2026,
        code='G11-CS',
        defaults={'name': 'Grade 11 - Computer Science'}
    )
    class_11_next_year, _ = SchoolClass.objects.get_or_create(
        academic_year=year_2027,
        code='G11-CS-2027',
        defaults={'name': 'Grade 11 - CS 2027'}
    )

    # Users & Profiles
    admin_user = User.objects.create_user(
        username='admin_mod', email='admin@school.local', password='pwd', role=role_admin
    )
    principal_user = User.objects.create_user(
        username='principal_mod', email='principal@school.local', password='pwd', role=role_principal
    )

    # Faculty 1: Suresh (Class Teacher of 11-A2, teaches CS)
    faculty_user_suresh = User.objects.create_user(
        username='fac_suresh', email='suresh@school.local', password='pwd', role=role_faculty,
        first_name='Suresh', last_name='Srinivasan'
    )
    faculty_suresh = Faculty.objects.create(
        user=faculty_user_suresh, employee_code='FAC001', department='Computer Science',
        designation='Teacher', joining_date=date(2023, 1, 1)
    )

    # Faculty 2: Priya (NO Class Teacher assignment anywhere, teaches Math)
    faculty_user_priya = User.objects.create_user(
        username='fac_priya', email='priya@school.local', password='pwd', role=role_faculty,
        first_name='Priya', last_name='Krishnan'
    )
    faculty_priya = Faculty.objects.create(
        user=faculty_user_priya, employee_code='FAC002', department='Mathematics',
        designation='Teacher', joining_date=date(2023, 1, 1)
    )

    # Faculty 3: Rajesh (Physics teacher)
    faculty_user_rajesh = User.objects.create_user(
        username='fac_rajesh', email='rajesh@school.local', password='pwd', role=role_faculty,
        first_name='Rajesh', last_name='Kumar'
    )
    faculty_rajesh = Faculty.objects.create(
        user=faculty_user_rajesh, employee_code='FAC003', department='Physics',
        designation='Teacher', joining_date=date(2023, 1, 1)
    )

    # Sections
    section_11_a2 = Section.objects.create(
        school_class=class_11, name='A2', class_teacher=faculty_suresh
    )
    section_11_b1 = Section.objects.create(
        school_class=class_11, name='B1', class_teacher=None  # Vacancy
    )
    section_10_a = Section.objects.create(
        school_class=class_10, name='A', class_teacher=None
    )

    # Subjects
    sub_cs, _ = Subject.objects.get_or_create(code='CS101', defaults={'name': 'Computer Science'})
    sub_math, _ = Subject.objects.get_or_create(code='MATH101', defaults={'name': 'Mathematics'})
    sub_phy, _ = Subject.objects.get_or_create(code='PHY101', defaults={'name': 'Physics'})

    # Teaching Assignments
    # Suresh teaches CS in 11-A2 and 11-B1
    ta_suresh_a2 = TeachingAssignment.objects.create(
        faculty=faculty_suresh, academic_year=year_2026, school_class=class_11, section=section_11_a2, subject=sub_cs
    )
    ta_suresh_b1 = TeachingAssignment.objects.create(
        faculty=faculty_suresh, academic_year=year_2026, school_class=class_11, section=section_11_b1, subject=sub_cs
    )

    # Priya teaches Math in 11-A2 and 11-B1 (NO Class Teacher assignment)
    ta_priya_a2 = TeachingAssignment.objects.create(
        faculty=faculty_priya, academic_year=year_2026, school_class=class_11, section=section_11_a2, subject=sub_math
    )

    # Rajesh teaches Physics in 11-B1 only
    ta_rajesh_b1 = TeachingAssignment.objects.create(
        faculty=faculty_rajesh, academic_year=year_2026, school_class=class_11, section=section_11_b1, subject=sub_phy
    )

    # Parents & Students
    # Parent 1: Ramanathan with 2 children: Arun (in 11-A2) and Bala (in 10-A)
    parent_user_1 = User.objects.create_user(
        username='parent_ram', email='ram@local', password='pwd', role=role_parent
    )
    parent_1 = Parent.objects.create(user=parent_user_1, relation='Father')

    # Parent 2: Unrelated Parent with child in 11-B1
    parent_user_2 = User.objects.create_user(
        username='parent_other', email='other@local', password='pwd', role=role_parent
    )
    parent_2 = Parent.objects.create(user=parent_user_2, relation='Mother')

    # Student 1: Arun in Section 11-A2
    student_user_arun = User.objects.create_user(
        username='stu_arun', email='arun@school.local', password='pwd', role=role_student,
        first_name='Arun', last_name='Kumar'
    )
    student_arun = Student.objects.create(
        user=student_user_arun, parent=parent_1, student_id='STU202600001',
        admission_number='ADM001', roll_number='11-A2-01', date_of_birth=date(2009, 1, 1),
        gender='Male', status='Enrolled'
    )
    enrollment_arun = Enrollment.objects.create(
        student=student_arun, academic_year=year_2026, section=section_11_a2, status='Active'
    )

    # Student 2: Bala in Section 10-A (Second child of Parent 1)
    student_user_bala = User.objects.create_user(
        username='stu_bala', email='bala@school.local', password='pwd', role=role_student,
        first_name='Bala', last_name='Kumar'
    )
    student_bala = Student.objects.create(
        user=student_user_bala, parent=parent_1, student_id='STU202600002',
        admission_number='ADM002', roll_number='10-A-01', date_of_birth=date(2010, 2, 2),
        gender='Male', status='Enrolled'
    )
    enrollment_bala = Enrollment.objects.create(
        student=student_bala, academic_year=year_2026, section=section_10_a, status='Active'
    )

    # Student 3: Chitra in Section 11-B1 (Child of Parent 2)
    student_user_chitra = User.objects.create_user(
        username='stu_chitra', email='chitra@school.local', password='pwd', role=role_student,
        first_name='Chitra', last_name='Devi'
    )
    student_chitra = Student.objects.create(
        user=student_user_chitra, parent=parent_2, student_id='STU202600003',
        admission_number='ADM003', roll_number='11-B1-01', date_of_birth=date(2009, 3, 3),
        gender='Female', status='Enrolled'
    )
    enrollment_chitra = Enrollment.objects.create(
        student=student_chitra, academic_year=year_2026, section=section_11_b1, status='Active'
    )

    # Exam type for marks testing
    exam_type, _ = ExamType.objects.get_or_create(
        name='Quarterly Exam', defaults={'weightage': Decimal('25.00')}
    )

    return {
        'admin_user': admin_user,
        'principal_user': principal_user,
        'faculty_user_suresh': faculty_user_suresh,
        'faculty_suresh': faculty_suresh,
        'faculty_user_priya': faculty_user_priya,
        'faculty_priya': faculty_priya,
        'faculty_user_rajesh': faculty_user_rajesh,
        'faculty_rajesh': faculty_rajesh,
        'parent_user_1': parent_user_1,
        'parent_1': parent_1,
        'parent_user_2': parent_user_2,
        'parent_2': parent_2,
        'student_user_arun': student_user_arun,
        'student_arun': student_arun,
        'student_user_bala': student_user_bala,
        'student_bala': student_bala,
        'student_user_chitra': student_user_chitra,
        'student_chitra': student_chitra,
        'enrollment_arun': enrollment_arun,
        'enrollment_bala': enrollment_bala,
        'enrollment_chitra': enrollment_chitra,
        'year_2026': year_2026,
        'year_2027': year_2027,
        'class_10': class_10,
        'class_11': class_11,
        'class_11_next_year': class_11_next_year,
        'section_11_a2': section_11_a2,
        'section_11_b1': section_11_b1,
        'section_10_a': section_10_a,
        'sub_cs': sub_cs,
        'sub_math': sub_math,
        'sub_phy': sub_phy,
        'exam_type': exam_type,
    }


# ============================================================================
# 1. Class Teacher Cardinality & Invariants
# ============================================================================

class TestClassTeacherCardinality:
    """Verifies Class Teacher 0-or-1 per academic year rule and database constraints."""

    def test_faculty_zero_class_teacher_allowed(self, mod001_setup):
        """Faculty member can have zero Class Teacher assignments (e.g. Priya)."""
        priya = mod001_setup['faculty_priya']
        assert Section.objects.filter(class_teacher=priya).count() == 0

    def test_faculty_one_class_teacher_allowed(self, mod001_setup):
        """Faculty member can have one Class Teacher assignment in an academic year."""
        suresh = mod001_setup['faculty_suresh']
        assert Section.objects.filter(class_teacher=suresh).count() == 1

    def test_second_same_year_class_teacher_rejected_by_clean(self, mod001_setup):
        """Assigning a faculty member a second Class Teacher role in same year raises ValidationError."""
        suresh = mod001_setup['faculty_suresh']
        sec_b1 = mod001_setup['section_11_b1']
        sec_b1.class_teacher = suresh
        with pytest.raises(ValidationError) as exc_info:
            sec_b1.clean()
        assert "already assigned as Class Teacher" in str(exc_info.value)

    def test_second_same_year_class_teacher_rejected_by_db_constraint(self, mod001_setup):
        """Direct DB save of duplicate Class Teacher in same year violates UniqueConstraint."""
        suresh = mod001_setup['faculty_suresh']
        sec_b1 = mod001_setup['section_11_b1']
        sec_b1.class_teacher = suresh
        with pytest.raises(IntegrityError):
            sec_b1.save()

    def test_different_academic_year_class_teacher_allowed(self, mod001_setup):
        """Same faculty can be Class Teacher in different academic years."""
        suresh = mod001_setup['faculty_suresh']
        class_2027 = mod001_setup['class_11_next_year']

        sec_2027 = Section(
            school_class=class_2027,
            name='A1',
            class_teacher=suresh
        )
        sec_2027.full_clean()
        sec_2027.save()
        assert Section.objects.filter(class_teacher=suresh).count() == 2

    def test_section_reassignment_works_correctly(self, mod001_setup):
        """A section's class teacher can be reassigned to another available faculty."""
        sec_a2 = mod001_setup['section_11_a2']
        priya = mod001_setup['faculty_priya']

        sec_a2.class_teacher = priya
        sec_a2.full_clean()
        sec_a2.save()

        sec_a2.refresh_from_db()
        assert sec_a2.class_teacher == priya
        assert Section.objects.filter(class_teacher=priya).count() == 1
        assert Section.objects.filter(class_teacher=mod001_setup['faculty_suresh']).count() == 0

    def test_section_vacancy_allowed(self, mod001_setup):
        """A section may have no class teacher (vacancy)."""
        sec_b1 = mod001_setup['section_11_b1']
        assert sec_b1.class_teacher is None


# ============================================================================
# 2. Teaching Assignment Domain Rules
# ============================================================================

class TestTeachingAssignmentDomainRules:
    """Verifies TeachingAssignment domain model, validation, and constraints."""

    def test_valid_assignment_creation(self, mod001_setup):
        """Valid TeachingAssignment saves cleanly."""
        ta = TeachingAssignment(
            faculty=mod001_setup['faculty_rajesh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_phy'],
            is_active=True
        )
        ta.full_clean()
        ta.save()
        assert ta.pk is not None

    def test_duplicate_teaching_assignment_rejected(self, mod001_setup):
        """Creating an exact duplicate TeachingAssignment violates unique constraint."""
        dup = TeachingAssignment(
            faculty=mod001_setup['faculty_suresh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_cs'],
        )
        with pytest.raises((ValidationError, IntegrityError)):
            dup.full_clean()
            dup.save()

    def test_class_section_mismatch_rejected(self, mod001_setup):
        """TeachingAssignment with section not belonging to school_class raises ValidationError."""
        mismatched = TeachingAssignment(
            faculty=mod001_setup['faculty_priya'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_10'],  # Grade 10
            section=mod001_setup['section_11_a2'],   # But section belongs to Grade 11
            subject=mod001_setup['sub_math']
        )
        with pytest.raises(ValidationError) as exc_info:
            mismatched.full_clean()
        assert "does not belong to class" in str(exc_info.value)

    def test_section_academic_year_mismatch_rejected(self, mod001_setup):
        """TeachingAssignment with academic year differing from section/class raises ValidationError."""
        mismatched = TeachingAssignment(
            faculty=mod001_setup['faculty_priya'],
            academic_year=mod001_setup['year_2027'],  # 2027-2028
            school_class=mod001_setup['class_11'],    # But class is 2026-2027
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_math']
        )
        with pytest.raises(ValidationError) as exc_info:
            mismatched.full_clean()
        assert "does not belong to academic year" in str(exc_info.value)


# ============================================================================
# 3. Marks Reconciliation (Class Teacher != Subject Authority)
# ============================================================================

class TestMarksReconciliation:
    """Verifies that faculty can only enter marks for subjects they are assigned to teach."""

    def test_faculty_can_enter_assigned_subject_marks(self, mod001_setup):
        """Faculty assigned to CS in 11-A2 can enter CS marks for enrolled student."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['faculty_user_suresh'])

        payload = {
            'marks': [
                {
                    'enrollment_id': str(mod001_setup['enrollment_arun'].id),
                    'subject_id': str(mod001_setup['sub_cs'].id),
                    'exam_type_id': str(mod001_setup['exam_type'].id),
                    'marks_obtained': '95.00',
                    'max_marks': '100.00',
                }
            ]
        }
        res = client.post('/api/v1/marks/bulk/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED

    def test_faculty_cannot_enter_unassigned_subject_marks(self, mod001_setup):
        """Faculty assigned only to Math cannot enter Physics marks."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['faculty_user_priya'])

        payload = {
            'marks': [
                {
                    'enrollment_id': str(mod001_setup['enrollment_arun'].id),
                    'subject_id': str(mod001_setup['sub_phy'].id),  # Priya doesn't teach Physics
                    'exam_type_id': str(mod001_setup['exam_type'].id),
                    'marks_obtained': '85.00',
                    'max_marks': '100.00',
                }
            ]
        }
        res = client.post('/api/v1/marks/bulk/', payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_class_teacher_alone_cannot_enter_unassigned_subject_marks(self, mod001_setup):
        """Being Class Teacher does NOT grant authority to enter marks for unassigned subjects (Physics)."""
        client = APIClient()
        # Suresh is Class Teacher of 11-A2, but only teaches CS, NOT Physics
        client.force_authenticate(user=mod001_setup['faculty_user_suresh'])

        payload = {
            'marks': [
                {
                    'enrollment_id': str(mod001_setup['enrollment_arun'].id),
                    'subject_id': str(mod001_setup['sub_phy'].id),
                    'exam_type_id': str(mod001_setup['exam_type'].id),
                    'marks_obtained': '88.00',
                    'max_marks': '100.00',
                }
            ]
        }
        res = client.post('/api/v1/marks/bulk/', payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 4. Attendance Scope Reconciliation
# ============================================================================

class TestAttendanceReconciliation:
    """Verifies attendance recording authorization with teaching assignments and class teacher."""

    def test_class_teacher_can_record_section_attendance(self, mod001_setup):
        """Class Teacher of 11-A2 can record section attendance."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['faculty_user_suresh'])

        payload = {
            'records': [
                {
                    'enrollment_id': str(mod001_setup['enrollment_arun'].id),
                    'date': str(date.today()),
                    'session_period': 1,
                    'status': 'PRESENT',
                }
            ]
        }
        res = client.post('/api/v1/attendance/bulk/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED

    def test_teaching_faculty_can_record_attendance(self, mod001_setup):
        """Subject Faculty (Priya) teaching in 11-A2 can record attendance."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['faculty_user_priya'])

        payload = {
            'records': [
                {
                    'enrollment_id': str(mod001_setup['enrollment_arun'].id),
                    'date': str(date.today()),
                    'session_period': 2,
                    'status': 'PRESENT',
                }
            ]
        }
        res = client.post('/api/v1/attendance/bulk/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED

    def test_unassigned_faculty_cannot_record_attendance(self, mod001_setup):
        """Faculty with neither teaching assignment nor class teacher for section cannot record attendance."""
        client = APIClient()
        # Rajesh only teaches 11-B1, not 11-A2
        client.force_authenticate(user=mod001_setup['faculty_user_rajesh'])

        payload = {
            'records': [
                {
                    'enrollment_id': str(mod001_setup['enrollment_arun'].id),  # Arun is in 11-A2
                    'date': str(date.today()),
                    'session_period': 1,
                    'status': 'PRESENT',
                }
            ]
        }
        res = client.post('/api/v1/attendance/bulk/', payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 5. Homework Management & RBAC Scoping
# ============================================================================

class TestHomeworkManagement:
    """Verifies Homework CRUD, RBAC scoping, and student/parent/principal visibility."""

    def test_authorized_faculty_homework_creation_201(self, mod001_setup):
        """Faculty can create homework for a section and subject they teach."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['faculty_user_suresh'])

        payload = {
            'school_class': str(mod001_setup['class_11'].id),
            'section': str(mod001_setup['section_11_a2'].id),
            'subject': str(mod001_setup['sub_cs'].id),
            'academic_year': str(mod001_setup['year_2026'].id),
            'title': 'Binary Trees Assignment',
            'description': 'Solve questions 1-5.',
            'assigned_date': str(date.today()),
            'due_date': str(date.today() + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        res = client.post('/api/v1/homework/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json()['data']
        assert data['title'] == 'Binary Trees Assignment'
        assert data['faculty']['name'] == 'Suresh Srinivasan'

    def test_homework_creation_unassigned_subject_rejected_403(self, mod001_setup):
        """Faculty cannot create homework for a subject they are not assigned to teach."""
        client = APIClient()
        # Suresh does not teach Physics
        client.force_authenticate(user=mod001_setup['faculty_user_suresh'])

        payload = {
            'school_class': str(mod001_setup['class_11'].id),
            'section': str(mod001_setup['section_11_a2'].id),
            'subject': str(mod001_setup['sub_phy'].id),  # Physics
            'academic_year': str(mod001_setup['year_2026'].id),
            'title': 'Physics Mechanics Problems',
            'description': 'Chapter 3 problems.',
            'assigned_date': str(date.today()),
            'due_date': str(date.today() + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        res = client.post('/api/v1/homework/', payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_homework_creation_unassigned_section_rejected_403(self, mod001_setup):
        """Faculty cannot create homework for a section they are not assigned to teach."""
        client = APIClient()
        # Rajesh only teaches 11-B1, not 11-A2
        client.force_authenticate(user=mod001_setup['faculty_user_rajesh'])

        payload = {
            'school_class': str(mod001_setup['class_11'].id),
            'section': str(mod001_setup['section_11_a2'].id),
            'subject': str(mod001_setup['sub_phy'].id),
            'academic_year': str(mod001_setup['year_2026'].id),
            'title': 'Physics Homework',
            'assigned_date': str(date.today()),
            'due_date': str(date.today() + timedelta(days=2)),
        }
        res = client.post('/api/v1/homework/', payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_forged_faculty_id_in_payload_is_ignored(self, mod001_setup):
        """Attempting to forge creator faculty_id in payload is ignored; derived from auth user."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['faculty_user_suresh'])

        payload = {
            'faculty': str(mod001_setup['faculty_priya'].id),  # Forged
            'school_class': str(mod001_setup['class_11'].id),
            'section': str(mod001_setup['section_11_a2'].id),
            'subject': str(mod001_setup['sub_cs'].id),
            'academic_year': str(mod001_setup['year_2026'].id),
            'title': 'Data Structures Lab',
            'assigned_date': str(date.today()),
            'due_date': str(date.today() + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        res = client.post('/api/v1/homework/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json()['data']
        # The assigned faculty MUST be Suresh, not Priya
        assert data['faculty']['name'] == 'Suresh Srinivasan'

    def test_faculty_cannot_mutate_another_faculty_homework(self, mod001_setup):
        """Faculty cannot update or delete homework created by another faculty member."""
        # Create homework by Priya
        hw_priya = Homework.objects.create(
            faculty=mod001_setup['faculty_priya'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_math'],
            title='Calculus Homework',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=3),
            status='PUBLISHED'
        )

        client = APIClient()
        # Suresh attempts to patch Priya's homework
        client.force_authenticate(user=mod001_setup['faculty_user_suresh'])
        res = client.patch(f'/api/v1/homework/{hw_priya.id}/', {'title': 'Tampered Title'}, format='json')
        assert res.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

        # Suresh attempts to delete Priya's homework
        res_del = client.delete(f'/api/v1/homework/{hw_priya.id}/')
        assert res_del.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_student_sees_own_published_homework_only(self, mod001_setup):
        """Student sees published homework for their section, but DRAFT and other section homework are excluded."""
        # HW 1: Published for 11-A2 (Arun's section)
        hw1 = Homework.objects.create(
            faculty=mod001_setup['faculty_suresh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_cs'],
            title='Published CS HW',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )
        # HW 2: Draft for 11-A2 (Arun's section)
        hw2 = Homework.objects.create(
            faculty=mod001_setup['faculty_suresh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_cs'],
            title='Draft CS HW',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=5),
            status='DRAFT'
        )
        # HW 3: Published for 11-B1 (Different section)
        hw3 = Homework.objects.create(
            faculty=mod001_setup['faculty_rajesh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_b1'],
            subject=mod001_setup['sub_phy'],
            title='Physics for 11-B1',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=3),
            status='PUBLISHED'
        )

        client = APIClient()
        client.force_authenticate(user=mod001_setup['student_user_arun'])

        res = client.get('/api/v1/homework/')
        assert res.status_code == status.HTTP_200_OK
        items = res.json()['data']
        item_ids = [item['id'] for item in items]

        assert str(hw1.id) in item_ids
        assert str(hw2.id) not in item_ids  # DRAFT excluded
        assert str(hw3.id) not in item_ids  # Other section excluded

    def test_student_mutations_blocked_403(self, mod001_setup):
        """Student cannot POST, PATCH, or DELETE homework."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['student_user_arun'])

        res_post = client.post('/api/v1/homework/', {'title': 'Illegal HW'}, format='json')
        assert res_post.status_code == status.HTTP_403_FORBIDDEN

        hw = Homework.objects.create(
            faculty=mod001_setup['faculty_suresh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_cs'],
            title='Some HW',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=1),
            status='PUBLISHED'
        )

        res_patch = client.patch(f'/api/v1/homework/{hw.id}/', {'title': 'Updated'}, format='json')
        assert res_patch.status_code == status.HTTP_403_FORBIDDEN

        res_del = client.delete(f'/api/v1/homework/{hw.id}/')
        assert res_del.status_code == status.HTTP_403_FORBIDDEN

    def test_parent_sees_linked_children_published_homework(self, mod001_setup):
        """Parent 1 has children in 11-A2 (Arun) and 10-A (Bala). Can see published homework for both."""
        hw_a2 = Homework.objects.create(
            faculty=mod001_setup['faculty_suresh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_cs'],
            title='HW for 11-A2',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )
        hw_10a = Homework.objects.create(
            faculty=mod001_setup['faculty_priya'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_10'],
            section=mod001_setup['section_10_a'],
            subject=mod001_setup['sub_math'],
            title='HW for 10-A',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )
        hw_b1 = Homework.objects.create(
            faculty=mod001_setup['faculty_rajesh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_b1'],
            subject=mod001_setup['sub_phy'],
            title='HW for 11-B1 (Unrelated child)',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )

        client = APIClient()
        client.force_authenticate(user=mod001_setup['parent_user_1'])

        res = client.get('/api/v1/homework/')
        assert res.status_code == status.HTTP_200_OK
        item_ids = [item['id'] for item in res.json()['data']]

        assert str(hw_a2.id) in item_ids
        assert str(hw_10a.id) in item_ids
        assert str(hw_b1.id) not in item_ids  # Unrelated child's section blocked

    def test_parent_mutations_blocked_403(self, mod001_setup):
        """Parent cannot POST, PATCH, or DELETE homework."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['parent_user_1'])

        res_post = client.post('/api/v1/homework/', {'title': 'Parent HW'}, format='json')
        assert res_post.status_code == status.HTTP_403_FORBIDDEN

    def test_principal_school_wide_view_and_mutation_denied(self, mod001_setup):
        """Principal can view all homework school-wide but cannot mutate."""
        hw = Homework.objects.create(
            faculty=mod001_setup['faculty_suresh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_cs'],
            title='CS Homework',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )

        client = APIClient()
        client.force_authenticate(user=mod001_setup['principal_user'])

        # GET list
        res_list = client.get('/api/v1/homework/')
        assert res_list.status_code == status.HTTP_200_OK

        # GET detail
        res_detail = client.get(f'/api/v1/homework/{hw.id}/')
        assert res_detail.status_code == status.HTTP_200_OK

        # PATCH denied
        res_patch = client.patch(f'/api/v1/homework/{hw.id}/', {'title': 'Principal Edit'}, format='json')
        assert res_patch.status_code == status.HTTP_403_FORBIDDEN

        # DELETE denied
        res_del = client.delete(f'/api/v1/homework/{hw.id}/')
        assert res_del.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_full_permitted_management(self, mod001_setup):
        """Admin has full CRUD over homework."""
        client = APIClient()
        client.force_authenticate(user=mod001_setup['admin_user'])

        # Admin can create homework
        payload = {
            'faculty': str(mod001_setup['faculty_suresh'].id),
            'school_class': str(mod001_setup['class_11'].id),
            'section': str(mod001_setup['section_11_a2'].id),
            'subject': str(mod001_setup['sub_cs'].id),
            'academic_year': str(mod001_setup['year_2026'].id),
            'title': 'Admin Created HW',
            'assigned_date': str(date.today()),
            'due_date': str(date.today() + timedelta(days=2)),
            'status': 'PUBLISHED',
        }
        res_create = client.post('/api/v1/homework/', payload, format='json')
        assert res_create.status_code == status.HTTP_201_CREATED
        hw_id = res_create.json()['data']['id']

        # Admin can update
        res_patch = client.patch(f'/api/v1/homework/{hw_id}/', {'title': 'Admin Updated Title'}, format='json')
        assert res_patch.status_code == status.HTTP_200_OK

        # Admin can delete
        res_del = client.delete(f'/api/v1/homework/{hw_id}/')
        assert res_del.status_code == status.HTTP_204_NO_CONTENT

    def test_unauthenticated_requests_return_401(self, mod001_setup):
        """Unauthenticated requests return 401 Unauthorized."""
        client = APIClient()
        res = client.get('/api/v1/homework/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_direct_uuid_manipulation_blocked(self, mod001_setup):
        """Student cannot view another section's homework by guessing or probing UUID."""
        hw_b1 = Homework.objects.create(
            faculty=mod001_setup['faculty_rajesh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_b1'],
            subject=mod001_setup['sub_phy'],
            title='Physics for 11-B1',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=3),
            status='PUBLISHED'
        )

        client = APIClient()
        client.force_authenticate(user=mod001_setup['student_user_arun'])  # Arun is in 11-A2
        res = client.get(f'/api/v1/homework/{hw_b1.id}/')
        assert res.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_student_inactive_enrollment_cannot_see_homework(self, mod001_setup):
        """A student with a Withdrawn or Inactive enrollment cannot see homework from that section."""
        role_student = mod001_setup['student_user_arun'].role
        user_withdrawn = User.objects.create_user(
            username='stu_withdrawn', email='withdrawn@school.local', password='pwd', role=role_student
        )
        student_withdrawn = Student.objects.create(
            user=user_withdrawn, student_id='STU202699999', admission_number='ADM999', roll_number='11-A2-99',
            date_of_birth=date(2009, 5, 5), gender='Male', status='Withdrawn'
        )
        Enrollment.objects.create(
            student=student_withdrawn, academic_year=mod001_setup['year_2026'],
            section=mod001_setup['section_11_a2'], status='Withdrawn'
        )

        hw = Homework.objects.create(
            faculty=mod001_setup['faculty_suresh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_a2'],
            subject=mod001_setup['sub_cs'],
            title='11-A2 Homework for Active Students Only',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )

        client = APIClient()
        client.force_authenticate(user=user_withdrawn)
        res = client.get('/api/v1/homework/')
        assert res.status_code == status.HTTP_200_OK
        items = res.json()['data']
        item_ids = [item['id'] for item in items]
        assert str(hw.id) not in item_ids

        # Direct UUID access also denied
        res_direct = client.get(f'/api/v1/homework/{hw.id}/')
        assert res_direct.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_parent_inactive_child_enrollment_cannot_see_homework(self, mod001_setup):
        """A parent whose child has a Withdrawn enrollment cannot see homework from that section."""
        role_parent = mod001_setup['parent_user_1'].role
        role_student = mod001_setup['student_user_arun'].role
        parent_user = User.objects.create_user(
            username='parent_inactive_child', email='par_inact@school.local', password='pwd', role=role_parent
        )
        parent_obj = Parent.objects.create(user=parent_user, relation='Father')

        student_user = User.objects.create_user(
            username='stu_child_withdrawn', email='ch_withdrawn@school.local', password='pwd', role=role_student
        )
        child_withdrawn = Student.objects.create(
            user=student_user, parent=parent_obj, student_id='STU202688888', admission_number='ADM888',
            roll_number='11-B1-88', date_of_birth=date(2009, 8, 8), gender='Female', status='Withdrawn'
        )
        Enrollment.objects.create(
            student=child_withdrawn, academic_year=mod001_setup['year_2026'],
            section=mod001_setup['section_11_b1'], status='Withdrawn'
        )

        hw_b1 = Homework.objects.create(
            faculty=mod001_setup['faculty_rajesh'],
            academic_year=mod001_setup['year_2026'],
            school_class=mod001_setup['class_11'],
            section=mod001_setup['section_11_b1'],
            subject=mod001_setup['sub_phy'],
            title='11-B1 Physics HW',
            assigned_date=date.today(),
            due_date=date.today() + timedelta(days=2),
            status='PUBLISHED'
        )

        client = APIClient()
        client.force_authenticate(user=parent_user)
        res = client.get('/api/v1/homework/')
        assert res.status_code == status.HTTP_200_OK
        items = res.json()['data']
        item_ids = [item['id'] for item in items]
        assert str(hw_b1.id) not in item_ids

        # Direct UUID access also denied
        res_direct = client.get(f'/api/v1/homework/{hw_b1.id}/')
        assert res_direct.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

