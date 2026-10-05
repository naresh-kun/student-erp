"""
Student ERP — RBAC Architecture & Authoritative Permission Model Tests
Phase 4 Task 4.3 Test Suite

Covers:
- Five canonical roles explicit permissions (no automatic hierarchy/inheritance).
- Scope resolution (GLOBAL, FACULTY_ASSIGNED, SELF, LINKED_CHILD).
- Faculty assignment-aware access (Class Teacher scoping).
- Student self-ownership enforcement.
- Parent linked-child relationship enforcement.
- Admin / Principal authority & oversight (Task 2.7 allocation rules).
- Queryset scoping (list & search endpoints).
- DRF permission classes (HasRequiredPermission, IsAdminRole, IsPrincipalRole,
  IsFacultyRole, IsStudentRole, IsParentRole, IsAdminOrPrincipal, IsStaffOrExecutive, IsOwnerOrScopedAccess).
- Denial semantics: 401 unauthenticated vs 403 forbidden.
- Role tampering & token freshness mitigation.
"""

from decimal import Decimal
import pytest
from unittest.mock import MagicMock
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
    ALL_ROLES,
    SCOPE_GLOBAL,
    SCOPE_FACULTY_ASSIGNED,
    SCOPE_SELF,
    SCOPE_LINKED_CHILD,
    SCOPE_NONE,
    PERM_USERS_VIEW,
    PERM_USERS_CREATE,
    PERM_USERS_UPDATE,
    PERM_USERS_DELETE,
    PERM_STUDENTS_VIEW,
    PERM_STUDENTS_CREATE,
    PERM_STUDENTS_UPDATE,
    PERM_STUDENTS_DELETE,
    PERM_ACADEMICS_VIEW,
    PERM_ACADEMICS_MANAGE,
    PERM_ATTENDANCE_VIEW,
    PERM_ATTENDANCE_MARK,
    PERM_ATTENDANCE_APPROVE_LEAVE,
    PERM_ATTENDANCE_VIEW_ABSENTEES,
    PERM_ATTENDANCE_VIEW_NOT_ENTERED,
    PERM_ATTENDANCE_OVERRIDE,
    PERM_MARKS_VIEW,
    PERM_MARKS_ENTER,
    PERM_MARKS_OVERRIDE,
    PERM_MARKS_APPROVE,
    PERM_TIMETABLE_VIEW,
    PERM_TIMETABLE_MANAGE,
    PERM_CALENDAR_VIEW,
    PERM_CALENDAR_CREATE,
    PERM_CALENDAR_PUBLISH,
    PERM_ALLOCATION_VIEW,
    PERM_ALLOCATION_UPDATE_STUDENT_SECTION,
    PERM_ALLOCATION_DELETE_STUDENT_SECTION,
    PERM_ALLOCATION_UPDATE_CLASS_TEACHER,
    PERM_ALLOCATION_DELETE_CLASS_TEACHER,
    PERM_REPORTS_VIEW,
    PERM_REPORTS_EXPORT,
    PERM_REPORTS_APPROVE,
    PERM_AUDIT_VIEW,
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
)
from common.authorization import (
    AuthorizationService,
    ROLE_PERMISSIONS_MATRIX,
    ROLE_DOMAIN_SCOPES,
)
from common.permissions import (
    HasRequiredPermission,
    require_permission,
    IsAdminRole,
    IsPrincipalRole,
    IsFacultyRole,
    IsStudentRole,
    IsParentRole,
    IsAdminOrPrincipal,
    IsStaffOrExecutive,
    IsOwnerOrScopedAccess,
)
from apps.accounts.models import User, Role, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import Mark, ExamType


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def rbac_roles(db):
    """Ensures all 5 canonical roles exist in the database."""
    roles = {}
    for role_name in ALL_ROLES:
        role, _ = Role.objects.get_or_create(
            name=role_name,
            defaults={'description': f'System role: {role_name}'}
        )
        roles[role_name] = role
    return roles


@pytest.fixture
def rbac_users(db, rbac_roles):
    """Creates one active user for each of the 5 roles."""
    users = {}
    for role_name in ALL_ROLES:
        username = f"user_{role_name.lower()}_task43"
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f"{username}@school.test",
                'role': rbac_roles[role_name],
                'is_active': True,
                'is_staff': (role_name == ROLE_ADMIN),
                'is_superuser': False,  # Note: Zero superuser shortcuts!
            }
        )
        if user.role != rbac_roles[role_name]:
            user.role = rbac_roles[role_name]
            user.save()
        user.set_password("pass123456")
        user.save()
        users[role_name] = user
    return users


@pytest.fixture
def academic_setup(db, rbac_users):
    """Sets up an academic year, class, two sections, two faculty, two students, parent."""
    # Academic Year
    ay, _ = AcademicYear.objects.get_or_create(
        name="2026-2027",
        defaults={
            'start_date': "2026-06-01",
            'end_date': "2027-04-30",
            'is_current': True,
        }
    )

    # Class
    school_class, _ = SchoolClass.objects.get_or_create(
        academic_year=ay,
        code="G11-CS",
        defaults={'name': "Grade 11 - Computer Science"}
    )

    # Faculty 1 (Class teacher of Section A)
    user_fac1 = rbac_users[ROLE_FACULTY]
    fac1, _ = Faculty.objects.get_or_create(
        user=user_fac1,
        defaults={
            'employee_code': "FAC43001",
            'department': "Computer Science",
            'designation': "PGT CS",
            'joining_date': "2024-06-01",
        }
    )

    # Faculty 2 (Class teacher of Section B)
    user_fac2, _ = User.objects.get_or_create(
        username="faculty2_task43",
        defaults={
            'email': "faculty2@school.test",
            'role': rbac_users[ROLE_FACULTY].role,
            'is_active': True,
        }
    )
    user_fac2.set_password("pass123456")
    user_fac2.save()
    fac2, _ = Faculty.objects.get_or_create(
        user=user_fac2,
        defaults={
            'employee_code': "FAC43002",
            'department': "Mathematics",
            'designation': "PGT Maths",
            'joining_date': "2024-06-01",
        }
    )

    # Section A (fac1 is class teacher)
    section_a, _ = Section.objects.get_or_create(
        school_class=school_class,
        name="A1",
        defaults={'room': "101", 'class_teacher': fac1}
    )
    if section_a.class_teacher != fac1:
        section_a.class_teacher = fac1
        section_a.save()

    # Section B (fac2 is class teacher)
    section_b, _ = Section.objects.get_or_create(
        school_class=school_class,
        name="A2",
        defaults={'room': "102", 'class_teacher': fac2}
    )
    if section_b.class_teacher != fac2:
        section_b.class_teacher = fac2
        section_b.save()

    # Parent
    user_parent = rbac_users[ROLE_PARENT]
    parent, _ = Parent.objects.get_or_create(
        user=user_parent,
        defaults={'relation': Parent.RELATION_FATHER, 'occupation': "Engineer"}
    )

    # Student 1 (Enrolled in Section A, linked to parent)
    user_stu1 = rbac_users[ROLE_STUDENT]
    stu1, _ = Student.objects.get_or_create(
        user=user_stu1,
        defaults={
            'student_id': "STU202643001",
            'admission_number': "ADM202643001",
            'parent': parent,
            'roll_number': "11-A1-01",
            'gender': "Male",
            'date_of_birth': "2009-05-14",
        }
    )

    enrollment1, _ = Enrollment.objects.get_or_create(
        student=stu1,
        academic_year=ay,
        defaults={'section': section_a}
    )

    # Student 2 (Enrolled in Section B, unrelated to parent)
    user_stu2, _ = User.objects.get_or_create(
        username="student2_task43",
        defaults={
            'email': "student2@school.test",
            'role': rbac_users[ROLE_STUDENT].role,
            'is_active': True,
        }
    )
    user_stu2.set_password("pass123456")
    user_stu2.save()
    stu2, _ = Student.objects.get_or_create(
        user=user_stu2,
        defaults={
            'student_id': "STU202643002",
            'admission_number': "ADM202643002",
            'parent': None,
            'roll_number': "11-A2-01",
            'gender': "Female",
            'date_of_birth': "2009-08-20",
        }
    )

    enrollment2, _ = Enrollment.objects.get_or_create(
        student=stu2,
        academic_year=ay,
        defaults={'section': section_b}
    )

    # Subject & Exam Type
    subject, _ = Subject.objects.get_or_create(
        code="CS11",
        defaults={'name': "Computer Science", 'department': "Computer Science"}
    )
    exam_type, _ = ExamType.objects.get_or_create(
        name="Midterm Exam 4.3",
        defaults={'weightage': Decimal('100.00')}
    )

    # Attendance Record for Student 1
    att1, _ = Attendance.objects.get_or_create(
        enrollment=enrollment1,
        date="2026-10-05",
        session_period=1,
        defaults={
            'status': ATTENDANCE_STATUS_PRESENT,
            'recorded_by': user_fac1,
        }
    )

    # Attendance Record for Student 2
    att2, _ = Attendance.objects.get_or_create(
        enrollment=enrollment2,
        date="2026-10-05",
        session_period=1,
        defaults={
            'status': ATTENDANCE_STATUS_ABSENT,
            'recorded_by': user_fac2,
        }
    )

    # Mark for Student 1
    mark1, _ = Mark.objects.get_or_create(
        enrollment=enrollment1,
        subject=subject,
        exam_type=exam_type,
        defaults={
            'marks_obtained': Decimal('95.00'),
            'max_marks': Decimal('100.00'),
            'evaluated_by': fac1,
        }
    )

    # Mark for Student 2
    mark2, _ = Mark.objects.get_or_create(
        enrollment=enrollment2,
        subject=subject,
        exam_type=exam_type,
        defaults={
            'marks_obtained': Decimal('78.00'),
            'max_marks': Decimal('100.00'),
            'evaluated_by': fac2,
        }
    )

    # Leave Application for Student 1
    leave1, _ = LeaveApplication.objects.get_or_create(
        student=stu1,
        start_date="2026-10-10",
        end_date="2026-10-12",
        defaults={
            'reason': "Family function",
            'status': "PENDING",
        }
    )

    return {
        'ay': ay,
        'school_class': school_class,
        'fac1': fac1,
        'fac2': fac2,
        'user_fac1': user_fac1,
        'user_fac2': user_fac2,
        'section_a': section_a,
        'section_b': section_b,
        'parent': parent,
        'stu1': stu1,
        'stu2': stu2,
        'enrollment1': enrollment1,
        'enrollment2': enrollment2,
        'subject': subject,
        'exam_type': exam_type,
        'att1': att1,
        'att2': att2,
        'mark1': mark1,
        'mark2': mark2,
        'leave1': leave1,
    }


# ============================================================================
# 1. Authoritative Role-Permission Matrix & Non-Inheritance Tests
# ============================================================================

class TestRBACMatrixAndNonInheritance:
    """Verifies that all 5 roles have explicit permission sets with zero automatic inheritance."""

    def test_all_five_roles_have_explicit_matrix(self):
        for role in ALL_ROLES:
            assert role in ROLE_PERMISSIONS_MATRIX
            assert len(ROLE_PERMISSIONS_MATRIX[role]) > 0

    def test_admin_has_full_management_permissions(self):
        admin_perms = ROLE_PERMISSIONS_MATRIX[ROLE_ADMIN]
        assert PERM_USERS_DELETE in admin_perms
        assert PERM_STUDENTS_DELETE in admin_perms
        assert PERM_ATTENDANCE_OVERRIDE in admin_perms
        assert PERM_MARKS_OVERRIDE in admin_perms
        assert PERM_ALLOCATION_UPDATE_STUDENT_SECTION in admin_perms
        assert PERM_ALLOCATION_DELETE_STUDENT_SECTION in admin_perms
        assert PERM_ALLOCATION_UPDATE_CLASS_TEACHER in admin_perms
        assert PERM_ALLOCATION_DELETE_CLASS_TEACHER in admin_perms
        assert PERM_AUDIT_VIEW in admin_perms

    def test_principal_has_oversight_and_allocation_but_not_admin_crud(self):
        principal_perms = ROLE_PERMISSIONS_MATRIX[ROLE_PRINCIPAL]
        # Principal has allocation authority per Task 2.7
        assert PERM_ALLOCATION_UPDATE_STUDENT_SECTION in principal_perms
        assert PERM_ALLOCATION_DELETE_STUDENT_SECTION in principal_perms
        assert PERM_ALLOCATION_UPDATE_CLASS_TEACHER in principal_perms
        assert PERM_ALLOCATION_DELETE_CLASS_TEACHER in principal_perms
        # Principal has marks and reports approval
        assert PERM_MARKS_APPROVE in principal_perms
        assert PERM_REPORTS_APPROVE in principal_perms
        # Principal does NOT have destructive user/student deletion or direct marks entry
        assert PERM_USERS_DELETE not in principal_perms
        assert PERM_STUDENTS_DELETE not in principal_perms
        assert PERM_ATTENDANCE_OVERRIDE not in principal_perms
        assert PERM_MARKS_ENTER not in principal_perms

    def test_faculty_has_scoped_operations_but_no_allocation_modifications(self):
        fac_perms = ROLE_PERMISSIONS_MATRIX[ROLE_FACULTY]
        assert PERM_ATTENDANCE_MARK in fac_perms
        assert PERM_ATTENDANCE_APPROVE_LEAVE in fac_perms
        assert PERM_MARKS_ENTER in fac_perms
        assert PERM_ALLOCATION_VIEW in fac_perms  # View-only per Task 2.7
        # Faculty strictly excluded from allocation update/delete
        assert PERM_ALLOCATION_UPDATE_STUDENT_SECTION not in fac_perms
        assert PERM_ALLOCATION_DELETE_STUDENT_SECTION not in fac_perms
        assert PERM_ALLOCATION_UPDATE_CLASS_TEACHER not in fac_perms
        assert PERM_ALLOCATION_DELETE_CLASS_TEACHER not in fac_perms
        assert PERM_STUDENTS_CREATE not in fac_perms
        assert PERM_STUDENTS_DELETE not in fac_perms
        assert PERM_AUDIT_VIEW not in fac_perms

    def test_student_and_parent_have_strictly_read_only_access(self):
        for role in (ROLE_STUDENT, ROLE_PARENT):
            perms = ROLE_PERMISSIONS_MATRIX[role]
            assert PERM_STUDENTS_VIEW in perms
            assert PERM_ATTENDANCE_VIEW in perms
            assert PERM_MARKS_VIEW in perms
            # No write access to marks, attendance, allocation, or audit
            assert PERM_ATTENDANCE_MARK not in perms
            assert PERM_ATTENDANCE_APPROVE_LEAVE not in perms
            assert PERM_MARKS_ENTER not in perms
            assert PERM_ALLOCATION_VIEW not in perms
            assert PERM_AUDIT_VIEW not in perms


# ============================================================================
# 2. Scope Model Tests
# ============================================================================

class TestScopeModel:
    """Verifies resolve_scope returns correct scope enum per role and domain."""

    def test_admin_and_principal_have_global_scope(self, rbac_users):
        admin = rbac_users[ROLE_ADMIN]
        principal = rbac_users[ROLE_PRINCIPAL]

        for domain in ('students', 'attendance', 'marks', 'allocation', 'reports'):
            assert AuthorizationService.resolve_scope(admin, domain) == SCOPE_GLOBAL
            assert AuthorizationService.resolve_scope(principal, domain) == SCOPE_GLOBAL

    def test_faculty_has_assigned_scope_for_academics(self, rbac_users):
        faculty = rbac_users[ROLE_FACULTY]
        for domain in ('students', 'attendance', 'marks', 'allocation', 'reports'):
            assert AuthorizationService.resolve_scope(faculty, domain) == SCOPE_FACULTY_ASSIGNED
        assert AuthorizationService.resolve_scope(faculty, 'users') == SCOPE_SELF

    def test_student_has_self_scope(self, rbac_users):
        student = rbac_users[ROLE_STUDENT]
        for domain in ('students', 'attendance', 'marks', 'reports'):
            assert AuthorizationService.resolve_scope(student, domain) == SCOPE_SELF

    def test_parent_has_linked_child_scope(self, rbac_users):
        parent = rbac_users[ROLE_PARENT]
        for domain in ('students', 'attendance', 'marks', 'reports'):
            assert AuthorizationService.resolve_scope(parent, domain) == SCOPE_LINKED_CHILD
        assert AuthorizationService.resolve_scope(parent, 'users') == SCOPE_SELF

    def test_unauthenticated_or_inactive_user_has_none_scope(self):
        assert AuthorizationService.resolve_scope(None, 'students') == SCOPE_NONE
        mock_inactive = MagicMock(is_authenticated=True, is_active=False)
        assert AuthorizationService.resolve_scope(mock_inactive, 'students') == SCOPE_NONE


# ============================================================================
# 3. Object-Level Ownership & Scoping Tests
# ============================================================================

class TestObjectLevelAuthorization:
    """Verifies can_access_object enforces strict ownership and faculty scoping."""

    def test_faculty_assignment_scoping_positive_and_negative(self, rbac_users, academic_setup):
        user_fac1 = academic_setup['user_fac1']
        stu1 = academic_setup['stu1']  # in Section A (assigned to fac1)
        stu2 = academic_setup['stu2']  # in Section B (not assigned to fac1)

        # Faculty 1 can access student in their assigned section
        assert AuthorizationService.can_access_object(user_fac1, stu1, action='view') is True
        # Faculty 1 CANNOT access student in another section
        assert AuthorizationService.can_access_object(user_fac1, stu2, action='view') is False

        # Attendance scoping
        att1 = academic_setup['att1']  # for stu1
        att2 = academic_setup['att2']  # for stu2
        assert AuthorizationService.can_access_object(user_fac1, att1, action='view') is True
        assert AuthorizationService.can_access_object(user_fac1, att2, action='view') is False

        # Marks scoping
        mark1 = academic_setup['mark1']  # for stu1
        mark2 = academic_setup['mark2']  # for stu2
        assert AuthorizationService.can_access_object(user_fac1, mark1, action='view') is True
        assert AuthorizationService.can_access_object(user_fac1, mark2, action='view') is False

    def test_student_ownership_positive_and_negative(self, rbac_users, academic_setup):
        user_stu1 = rbac_users[ROLE_STUDENT]
        stu1 = academic_setup['stu1']
        stu2 = academic_setup['stu2']
        att1 = academic_setup['att1']
        att2 = academic_setup['att2']
        mark1 = academic_setup['mark1']
        mark2 = academic_setup['mark2']

        # Student 1 can access own records
        assert AuthorizationService.can_access_object(user_stu1, stu1, action='view') is True
        assert AuthorizationService.can_access_object(user_stu1, att1, action='view') is True
        assert AuthorizationService.can_access_object(user_stu1, mark1, action='view') is True

        # Student 1 CANNOT access another student's records
        assert AuthorizationService.can_access_object(user_stu1, stu2, action='view') is False
        assert AuthorizationService.can_access_object(user_stu1, att2, action='view') is False
        assert AuthorizationService.can_access_object(user_stu1, mark2, action='view') is False

        # Student CANNOT perform mutation actions
        assert AuthorizationService.can_access_object(user_stu1, mark1, action='enter') is False
        assert AuthorizationService.can_access_object(user_stu1, att1, action='mark') is False

    def test_parent_linked_child_positive_and_negative(self, rbac_users, academic_setup):
        user_parent = rbac_users[ROLE_PARENT]
        stu1 = academic_setup['stu1']  # linked child
        stu2 = academic_setup['stu2']  # unrelated student
        att1 = academic_setup['att1']
        att2 = academic_setup['att2']
        mark1 = academic_setup['mark1']
        mark2 = academic_setup['mark2']

        # Parent can access linked child's records
        assert AuthorizationService.can_access_object(user_parent, stu1, action='view') is True
        assert AuthorizationService.can_access_object(user_parent, att1, action='view') is True
        assert AuthorizationService.can_access_object(user_parent, mark1, action='view') is True

        # Parent CANNOT access unrelated student's records
        assert AuthorizationService.can_access_object(user_parent, stu2, action='view') is False
        assert AuthorizationService.can_access_object(user_parent, att2, action='view') is False
        assert AuthorizationService.can_access_object(user_parent, mark2, action='view') is False

        # Parent CANNOT mutate marks or mark attendance
        assert AuthorizationService.can_access_object(user_parent, mark1, action='enter') is False
        assert AuthorizationService.can_access_object(user_parent, att1, action='mark') is False

    def test_admin_and_principal_global_access(self, rbac_users, academic_setup):
        admin = rbac_users[ROLE_ADMIN]
        principal = rbac_users[ROLE_PRINCIPAL]
        stu1 = academic_setup['stu1']
        stu2 = academic_setup['stu2']

        # Admin has full access to any student
        assert AuthorizationService.can_access_object(admin, stu1, action='view') is True
        assert AuthorizationService.can_access_object(admin, stu2, action='view') is True
        assert AuthorizationService.can_access_object(admin, stu1, action='delete') is True

        # Principal has oversight access to any student
        assert AuthorizationService.can_access_object(principal, stu1, action='view') is True
        assert AuthorizationService.can_access_object(principal, stu2, action='view') is True
        # But Principal cannot delete students
        assert AuthorizationService.can_access_object(principal, stu1, action='delete') is False


# ============================================================================
# 4. Queryset Scoping Tests (List & Search Endpoints)
# ============================================================================

class TestQuerysetScoping:
    """Verifies filter_queryset_for_user scopes rows strictly per role and assignment."""

    def test_student_queryset_scoping(self, rbac_users, academic_setup):
        qs = Student.objects.all()

        # Admin gets all students
        admin_qs = AuthorizationService.filter_queryset_for_user(qs, rbac_users[ROLE_ADMIN])
        assert admin_qs.count() == 2

        # Principal gets all students
        principal_qs = AuthorizationService.filter_queryset_for_user(qs, rbac_users[ROLE_PRINCIPAL])
        assert principal_qs.count() == 2

        # Faculty 1 gets ONLY students in Section A
        fac1_qs = AuthorizationService.filter_queryset_for_user(qs, academic_setup['user_fac1'])
        assert fac1_qs.count() == 1
        assert fac1_qs.first().id == academic_setup['stu1'].id

        # Student gets ONLY self
        stu_qs = AuthorizationService.filter_queryset_for_user(qs, rbac_users[ROLE_STUDENT])
        assert stu_qs.count() == 1
        assert stu_qs.first().id == academic_setup['stu1'].id

        # Parent gets ONLY linked child
        parent_qs = AuthorizationService.filter_queryset_for_user(qs, rbac_users[ROLE_PARENT])
        assert parent_qs.count() == 1
        assert parent_qs.first().id == academic_setup['stu1'].id

    def test_attendance_and_marks_queryset_scoping(self, rbac_users, academic_setup):
        att_qs = Attendance.objects.all()
        mark_qs = Mark.objects.all()

        # Faculty 1 gets only Section A attendance/marks
        fac_att = AuthorizationService.filter_queryset_for_user(att_qs, academic_setup['user_fac1'])
        assert fac_att.count() == 1
        assert fac_att.first().id == academic_setup['att1'].id

        fac_marks = AuthorizationService.filter_queryset_for_user(mark_qs, academic_setup['user_fac1'])
        assert fac_marks.count() == 1
        assert fac_marks.first().id == academic_setup['mark1'].id

        # Student 1 gets only own attendance/marks
        stu_att = AuthorizationService.filter_queryset_for_user(att_qs, rbac_users[ROLE_STUDENT])
        assert stu_att.count() == 1
        assert stu_att.first().id == academic_setup['att1'].id

        # Parent gets only child's attendance/marks
        parent_att = AuthorizationService.filter_queryset_for_user(att_qs, rbac_users[ROLE_PARENT])
        assert parent_att.count() == 1
        assert parent_att.first().id == academic_setup['att1'].id

    def test_scoped_search_never_escapes_scope(self, rbac_users, academic_setup):
        """Even if search query matches multiple students, scope constrains results."""
        # Search for "STU2026" matches both students
        search_qs = Student.objects.filter(student_id__startswith="STU2026")
        assert search_qs.count() == 2

        # Faculty search remains scoped to assigned students
        scoped_fac = AuthorizationService.filter_queryset_for_user(search_qs, academic_setup['user_fac1'])
        assert scoped_fac.count() == 1
        assert scoped_fac.first().student_id == "STU202643001"

        # Parent search remains scoped to linked children
        scoped_parent = AuthorizationService.filter_queryset_for_user(search_qs, rbac_users[ROLE_PARENT])
        assert scoped_parent.count() == 1
        assert scoped_parent.first().student_id == "STU202643001"

    def test_unauthenticated_user_queryset_is_empty(self):
        qs = Student.objects.all()
        assert AuthorizationService.filter_queryset_for_user(qs, None).count() == 0


# ============================================================================
# 5. DRF Permission Classes Integration Tests
# ============================================================================

class TestDRFPermissionClasses:
    """Verifies DRF permission classes with HTTP request simulation."""

    def setup_method(self):
        self.factory = APIRequestFactory()

    def test_has_required_permission_unauthenticated_returns_false(self):
        perm_class = HasRequiredPermission(PERM_STUDENTS_VIEW)
        request = self.factory.get('/api/v1/students/')
        request.user = MagicMock(is_authenticated=False)
        assert perm_class.has_permission(request, None) is False

    def test_has_required_permission_authorized_returns_true(self, rbac_users):
        perm_class = HasRequiredPermission(PERM_STUDENTS_VIEW)
        request = self.factory.get('/api/v1/students/')
        request.user = rbac_users[ROLE_ADMIN]
        assert perm_class.has_permission(request, None) is True

    def test_has_required_permission_unauthorized_returns_false(self, rbac_users):
        # Student cannot delete students
        perm_class = HasRequiredPermission(PERM_STUDENTS_DELETE)
        request = self.factory.delete('/api/v1/students/123/')
        request.user = rbac_users[ROLE_STUDENT]
        assert perm_class.has_permission(request, None) is False

    def test_role_specific_classes(self, rbac_users):
        admin = rbac_users[ROLE_ADMIN]
        fac = rbac_users[ROLE_FACULTY]
        stu = rbac_users[ROLE_STUDENT]
        parent = rbac_users[ROLE_PARENT]
        principal = rbac_users[ROLE_PRINCIPAL]

        req = self.factory.get('/')

        req.user = admin
        assert IsAdminRole().has_permission(req, None) is True
        assert IsFacultyRole().has_permission(req, None) is False

        req.user = principal
        assert IsPrincipalRole().has_permission(req, None) is True
        assert IsAdminRole().has_permission(req, None) is False

        req.user = fac
        assert IsFacultyRole().has_permission(req, None) is True
        assert IsStaffOrExecutive().has_permission(req, None) is True
        assert IsAdminOrPrincipal().has_permission(req, None) is False

        req.user = stu
        assert IsStudentRole().has_permission(req, None) is True
        assert IsStaffOrExecutive().has_permission(req, None) is False

        req.user = parent
        assert IsParentRole().has_permission(req, None) is True
        assert IsStaffOrExecutive().has_permission(req, None) is False

    def test_dummy_view_denial_semantics_401_vs_403(self, rbac_users):
        """Tests that unauthenticated returns 401/False and unauthorized returns 403."""
        class ProtectedView(APIView):
            permission_classes = [require_permission(PERM_ALLOCATION_UPDATE_STUDENT_SECTION)]

            def post(self, request):
                return Response({'success': True})

        view = ProtectedView.as_view()

        # 1. Unauthenticated request -> 401
        req_unauth = self.factory.post('/api/v1/allocation/section/')
        resp_unauth = view(req_unauth)
        assert resp_unauth.status_code == status.HTTP_401_UNAUTHORIZED

        # 2. Authenticated but unauthorized (Faculty) -> 403
        req_forbidden = self.factory.post('/api/v1/allocation/section/')
        req_forbidden.user = rbac_users[ROLE_FACULTY]
        resp_forbidden = view(req_forbidden)
        assert resp_forbidden.status_code == status.HTTP_403_FORBIDDEN

        # 3. Authenticated and authorized (Admin) -> 200
        req_allowed = self.factory.post('/api/v1/allocation/section/')
        req_allowed.user = rbac_users[ROLE_ADMIN]
        resp_allowed = view(req_allowed)
        assert resp_allowed.status_code == status.HTTP_200_OK


# ============================================================================
# 6. Role Tampering & Freshness Mitigation Tests
# ============================================================================

class TestSecurityHardeningAndFreshness:
    """Verifies tamper resistance, token freshness, and account deactivation handling."""

    def test_client_payload_cannot_change_or_spoof_role(self, rbac_users):
        """Passing 'role': 'Admin' in request body does NOT grant permissions to student."""
        factory = APIRequestFactory()
        student_user = rbac_users[ROLE_STUDENT]

        req = factory.post('/api/v1/students/', {'role': 'Admin', 'name': 'Spoof Attempt'}, format='json')
        req.user = student_user

        # Permission check must rely on user.role, completely ignoring request.data['role']
        assert AuthorizationService.has_permission(req.user, PERM_STUDENTS_CREATE) is False
        assert AuthorizationService.get_user_role(req.user) == ROLE_STUDENT

    def test_database_role_change_immediately_reflects_without_stale_token_privilege_escalation(
        self, rbac_users, rbac_roles
    ):
        """Changing role in database immediately revokes/changes permissions."""
        user = rbac_users[ROLE_FACULTY]
        assert AuthorizationService.has_permission(user, PERM_ATTENDANCE_MARK) is True

        # Demote user to Student in database
        user.role = rbac_roles[ROLE_STUDENT]
        user.save()

        # Authorization decision reflects live DB state immediately
        assert AuthorizationService.get_user_role(user) == ROLE_STUDENT
        assert AuthorizationService.has_permission(user, PERM_ATTENDANCE_MARK) is False

    def test_user_deactivation_immediately_denies_all_permissions(self, rbac_users):
        """Deactivating an account immediately revokes all permissions."""
        admin = rbac_users[ROLE_ADMIN]
        assert AuthorizationService.has_permission(admin, PERM_STUDENTS_DELETE) is True

        # Deactivate user
        admin.is_active = False
        admin.save()

        assert AuthorizationService.get_user_role(admin) == ""
        assert AuthorizationService.has_permission(admin, PERM_STUDENTS_DELETE) is False

    def test_no_superuser_shortcut_required(self, rbac_users):
        """Admin and Principal work strictly via ERP role without is_superuser."""
        admin = rbac_users[ROLE_ADMIN]
        principal = rbac_users[ROLE_PRINCIPAL]

        assert admin.is_superuser is False
        assert principal.is_superuser is False

        assert AuthorizationService.has_permission(admin, PERM_USERS_DELETE) is True
        assert AuthorizationService.has_permission(principal, PERM_ALLOCATION_UPDATE_STUDENT_SECTION) is True
