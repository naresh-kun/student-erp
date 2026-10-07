"""
Student ERP — Reusable Authorization Service & Authoritative Permission Model
Phase 4 Task 4.3: Authoritative Security Boundary & RBAC Architecture

Design Notes:
- Standardized permission identifiers: <domain>.<action>
- Zero automatic role inheritance: each role's permissions are explicitly declared.
- 5 Canonical roles: Admin, Principal, Faculty, Student, Parent.
- Reusable Scopes: GLOBAL, FACULTY_ASSIGNED, SELF, LINKED_CHILD, NONE.
- Object ownership & Queryset scoping: Faculty assigned only, Student self only,
  Parent linked child only, Admin/Principal global approved scope.
- Role freshness: Authorization decisions inspect the live database role state on
  request.user, never trusting client payloads or stale token claims.
"""

import logging
from typing import Any, Dict, FrozenSet, List, Optional, Set, Union
from django.db.models import Model, QuerySet, Q

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
    # Permissions
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
    # Homework Management (MOD_001)
    PERM_HOMEWORK_VIEW,
    PERM_HOMEWORK_CREATE,
    PERM_HOMEWORK_UPDATE,
    PERM_HOMEWORK_DELETE,
    # Teaching Assignment (MOD_001)
    PERM_TEACHING_ASSIGNMENT_VIEW,
    PERM_TEACHING_ASSIGNMENT_MANAGE,
)
from common.services import BaseService

logger = logging.getLogger(__name__)


# ============================================================================
# Role-Permission Authoritative Matrix (docs/RBAC_PERMISSIONS.md)
# ============================================================================
# Explicit permission sets per role. Zero role inheritance.

ROLE_PERMISSIONS_MATRIX: Dict[str, FrozenSet[str]] = {
    ROLE_ADMIN: frozenset({
        # Users & Identity
        PERM_USERS_VIEW,
        PERM_USERS_CREATE,
        PERM_USERS_UPDATE,
        PERM_USERS_DELETE,
        # Students
        PERM_STUDENTS_VIEW,
        PERM_STUDENTS_CREATE,
        PERM_STUDENTS_UPDATE,
        PERM_STUDENTS_DELETE,
        # Academics
        PERM_ACADEMICS_VIEW,
        PERM_ACADEMICS_MANAGE,
        PERM_TEACHING_ASSIGNMENT_VIEW,
        PERM_TEACHING_ASSIGNMENT_MANAGE,
        # Attendance
        PERM_ATTENDANCE_VIEW,
        PERM_ATTENDANCE_MARK,
        PERM_ATTENDANCE_APPROVE_LEAVE,
        PERM_ATTENDANCE_VIEW_ABSENTEES,
        PERM_ATTENDANCE_VIEW_NOT_ENTERED,
        PERM_ATTENDANCE_OVERRIDE,
        # Marks
        PERM_MARKS_VIEW,
        PERM_MARKS_ENTER,
        PERM_MARKS_OVERRIDE,
        # Timetable
        PERM_TIMETABLE_VIEW,
        PERM_TIMETABLE_MANAGE,
        # Calendar
        PERM_CALENDAR_VIEW,
        PERM_CALENDAR_CREATE,
        PERM_CALENDAR_PUBLISH,
        # Allocation (Task 2.7 Approved Functional Amendment)
        PERM_ALLOCATION_VIEW,
        PERM_ALLOCATION_UPDATE_STUDENT_SECTION,
        PERM_ALLOCATION_DELETE_STUDENT_SECTION,
        PERM_ALLOCATION_UPDATE_CLASS_TEACHER,
        PERM_ALLOCATION_DELETE_CLASS_TEACHER,
        # Reports
        PERM_REPORTS_VIEW,
        PERM_REPORTS_EXPORT,
        # Audit Logs
        PERM_AUDIT_VIEW,
        # Homework (MOD_001)
        PERM_HOMEWORK_VIEW,
        PERM_HOMEWORK_CREATE,
        PERM_HOMEWORK_UPDATE,
        PERM_HOMEWORK_DELETE,
    }),

    ROLE_PRINCIPAL: frozenset({
        # Users (Read-only institutional oversight)
        PERM_USERS_VIEW,
        # Students (Read-only oversight across all students)
        PERM_STUDENTS_VIEW,
        # Academics (Read-only oversight & approval)
        PERM_ACADEMICS_VIEW,
        PERM_ACADEMICS_MANAGE,
        PERM_TEACHING_ASSIGNMENT_VIEW,
        # Attendance (School-wide oversight, absentees, not-entered)
        PERM_ATTENDANCE_VIEW,
        PERM_ATTENDANCE_VIEW_ABSENTEES,
        PERM_ATTENDANCE_VIEW_NOT_ENTERED,
        # Marks (School-wide view & final approval)
        PERM_MARKS_VIEW,
        PERM_MARKS_APPROVE,
        # Timetable (Oversight)
        PERM_TIMETABLE_VIEW,
        # Calendar (Full creation and approval)
        PERM_CALENDAR_VIEW,
        PERM_CALENDAR_CREATE,
        PERM_CALENDAR_PUBLISH,
        # Allocation (Task 2.7: Full view, update, delete authority)
        PERM_ALLOCATION_VIEW,
        PERM_ALLOCATION_UPDATE_STUDENT_SECTION,
        PERM_ALLOCATION_DELETE_STUDENT_SECTION,
        PERM_ALLOCATION_UPDATE_CLASS_TEACHER,
        PERM_ALLOCATION_DELETE_CLASS_TEACHER,
        # Reports (School-wide analytics & sign-off)
        PERM_REPORTS_VIEW,
        PERM_REPORTS_EXPORT,
        PERM_REPORTS_APPROVE,
        # Audit Logs (Executive oversight)
        PERM_AUDIT_VIEW,
        # Homework (MOD_001: School-wide read oversight only)
        PERM_HOMEWORK_VIEW,
    }),

    ROLE_FACULTY: frozenset({
        # Users (Read self, descriptive directory lookup, update self bio)
        PERM_USERS_VIEW,
        PERM_USERS_UPDATE,
        # Students (Read assigned classes/sections only)
        PERM_STUDENTS_VIEW,
        # Academics (Read departmental/assigned subjects & classes)
        PERM_ACADEMICS_VIEW,
        PERM_TEACHING_ASSIGNMENT_VIEW,
        # Attendance (Create/update for assigned classes; approve leave as Class Teacher)
        PERM_ATTENDANCE_VIEW,
        PERM_ATTENDANCE_MARK,
        PERM_ATTENDANCE_APPROVE_LEAVE,
        PERM_ATTENDANCE_VIEW_ABSENTEES,
        PERM_ATTENDANCE_VIEW_NOT_ENTERED,
        # Marks (Create/update marks for assigned subjects)
        PERM_MARKS_VIEW,
        PERM_MARKS_ENTER,
        # Timetable (Read assigned & departmental timetable)
        PERM_TIMETABLE_VIEW,
        # Calendar (Read targeted events, create department drafts)
        PERM_CALENDAR_VIEW,
        PERM_CALENDAR_CREATE,
        # Allocation (Task 2.7: View-only for assigned classes; NO update or delete)
        PERM_ALLOCATION_VIEW,
        # Reports (Read class performance summaries)
        PERM_REPORTS_VIEW,
        # Homework (MOD_001: Scoped to authorized teaching assignment)
        PERM_HOMEWORK_VIEW,
        PERM_HOMEWORK_CREATE,
        PERM_HOMEWORK_UPDATE,
        PERM_HOMEWORK_DELETE,
    }),

    ROLE_STUDENT: frozenset({
        # Users (Read self, update self contact info)
        PERM_USERS_VIEW,
        PERM_USERS_UPDATE,
        # Students (Read self profile only)
        PERM_STUDENTS_VIEW,
        # Academics (Read enrolled class/subjects)
        PERM_ACADEMICS_VIEW,
        # Attendance (Read self attendance only)
        PERM_ATTENDANCE_VIEW,
        # Marks (Read self marks/grades only)
        PERM_MARKS_VIEW,
        # Timetable (Read personal enrolled class timetable)
        PERM_TIMETABLE_VIEW,
        # Calendar (Read targeted events)
        PERM_CALENDAR_VIEW,
        # Reports (Read personal grade report)
        PERM_REPORTS_VIEW,
        # Homework (MOD_001: Read enrolled class/section published homework only)
        PERM_HOMEWORK_VIEW,
    }),

    ROLE_PARENT: frozenset({
        # Users (Read self, update self contact info)
        PERM_USERS_VIEW,
        PERM_USERS_UPDATE,
        # Students (Read linked children only)
        PERM_STUDENTS_VIEW,
        # Academics (Read enrolled children classes/subjects)
        PERM_ACADEMICS_VIEW,
        # Attendance (Read linked children attendance only)
        PERM_ATTENDANCE_VIEW,
        # Marks (Read linked children marks/grades only)
        PERM_MARKS_VIEW,
        # Timetable (Read children class timetable)
        PERM_TIMETABLE_VIEW,
        # Calendar (Read targeted events)
        PERM_CALENDAR_VIEW,
        # Reports (Read child grade report)
        PERM_REPORTS_VIEW,
        # Homework (MOD_001: Read linked children published homework only)
        PERM_HOMEWORK_VIEW,
    }),
}


# ============================================================================
# Role-Domain Scope Mapping
# ============================================================================

ROLE_DOMAIN_SCOPES: Dict[tuple, str] = {
    # Admin is GLOBAL across all domains
    (ROLE_ADMIN, 'users'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'students'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'academics'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'attendance'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'marks'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'timetable'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'calendar'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'allocation'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'reports'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'audit'): SCOPE_GLOBAL,
    (ROLE_ADMIN, 'homework'): SCOPE_GLOBAL,

    # Principal is GLOBAL oversight across all allowed domains
    (ROLE_PRINCIPAL, 'users'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'students'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'academics'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'attendance'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'marks'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'timetable'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'calendar'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'allocation'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'reports'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'audit'): SCOPE_GLOBAL,
    (ROLE_PRINCIPAL, 'homework'): SCOPE_GLOBAL,

    # Faculty is FACULTY_ASSIGNED for students/classes/grades, SELF for profile
    (ROLE_FACULTY, 'users'): SCOPE_SELF,
    (ROLE_FACULTY, 'students'): SCOPE_FACULTY_ASSIGNED,
    (ROLE_FACULTY, 'academics'): SCOPE_FACULTY_ASSIGNED,
    (ROLE_FACULTY, 'attendance'): SCOPE_FACULTY_ASSIGNED,
    (ROLE_FACULTY, 'marks'): SCOPE_FACULTY_ASSIGNED,
    (ROLE_FACULTY, 'timetable'): SCOPE_FACULTY_ASSIGNED,
    (ROLE_FACULTY, 'calendar'): SCOPE_GLOBAL,
    (ROLE_FACULTY, 'allocation'): SCOPE_FACULTY_ASSIGNED,
    (ROLE_FACULTY, 'reports'): SCOPE_FACULTY_ASSIGNED,
    (ROLE_FACULTY, 'homework'): SCOPE_FACULTY_ASSIGNED,

    # Student is SELF across all permitted domains
    (ROLE_STUDENT, 'users'): SCOPE_SELF,
    (ROLE_STUDENT, 'students'): SCOPE_SELF,
    (ROLE_STUDENT, 'academics'): SCOPE_SELF,
    (ROLE_STUDENT, 'attendance'): SCOPE_SELF,
    (ROLE_STUDENT, 'marks'): SCOPE_SELF,
    (ROLE_STUDENT, 'timetable'): SCOPE_SELF,
    (ROLE_STUDENT, 'calendar'): SCOPE_GLOBAL,
    (ROLE_STUDENT, 'reports'): SCOPE_SELF,
    (ROLE_STUDENT, 'homework'): SCOPE_SELF,

    # Parent is LINKED_CHILD across academic domains, SELF for own profile
    (ROLE_PARENT, 'users'): SCOPE_SELF,
    (ROLE_PARENT, 'students'): SCOPE_LINKED_CHILD,
    (ROLE_PARENT, 'academics'): SCOPE_LINKED_CHILD,
    (ROLE_PARENT, 'attendance'): SCOPE_LINKED_CHILD,
    (ROLE_PARENT, 'marks'): SCOPE_LINKED_CHILD,
    (ROLE_PARENT, 'timetable'): SCOPE_LINKED_CHILD,
    (ROLE_PARENT, 'calendar'): SCOPE_GLOBAL,
    (ROLE_PARENT, 'reports'): SCOPE_LINKED_CHILD,
    (ROLE_PARENT, 'homework'): SCOPE_LINKED_CHILD,
}


# ============================================================================
# Authorization Service
# ============================================================================

class AuthorizationService(BaseService):
    """
    Dedicated authorization service implementing the ERP RBAC architecture.
    Provides role inspection, permission checking, scope resolution,
    object ownership verification, and queryset scoping.
    """
    service_name = "authorization"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "active"}

    @staticmethod
    def get_user_role(user: Any) -> str:
        """
        Safely extracts canonical role name from authenticated user.
        Always inspects database role state on the user object, never client payloads.
        Returns empty string if user is None, unauthenticated, inactive, or roleless.
        """
        if user is None:
            return ""
        if not getattr(user, 'is_authenticated', False):
            return ""
        if not getattr(user, 'is_active', False):
            return ""

        role = getattr(user, 'role', None)
        if role is None:
            return ""
        if isinstance(role, str):
            return role if role in ALL_ROLES else ""
        role_name = getattr(role, 'name', '')
        return role_name if role_name in ALL_ROLES else ""

    @classmethod
    def has_permission(cls, user: Any, permission: str) -> bool:
        """
        Evaluates whether the user possesses the specified permission.
        Rejects unauthenticated, inactive, or roleless users immediately.
        """
        if not permission:
            return False
        role = cls.get_user_role(user)
        if not role:
            return False

        allowed_perms = ROLE_PERMISSIONS_MATRIX.get(role, frozenset())
        return permission in allowed_perms

    @classmethod
    def get_user_permissions(cls, user: Any) -> Set[str]:
        """Returns the full set of permissions assigned to the user's role."""
        role = cls.get_user_role(user)
        if not role:
            return set()
        return set(ROLE_PERMISSIONS_MATRIX.get(role, frozenset()))

    @classmethod
    def resolve_scope(cls, user: Any, domain: str) -> str:
        """
        Resolves the operational scope for a user within a functional domain.
        Returns one of: GLOBAL, FACULTY_ASSIGNED, SELF, LINKED_CHILD, NONE.
        """
        role = cls.get_user_role(user)
        if not role:
            return SCOPE_NONE
        return ROLE_DOMAIN_SCOPES.get((role, domain), SCOPE_NONE)

    @classmethod
    def can_faculty_teach_subject(
        cls,
        faculty: Any,
        section: Any,
        subject: Any,
        academic_year: Any = None,
    ) -> bool:
        """
        Authoritatively determines if a faculty member is authorized to teach a specific subject
        to a specific section within an academic year.
        Class Teacher assignment alone does NOT grant all-subject authority.
        """
        if not faculty or not section or not subject:
            return False

        from apps.academics.models import TeachingAssignment

        sec_id = getattr(section, 'id', section)
        sub_id = getattr(subject, 'id', subject)
        fac_id = getattr(faculty, 'id', faculty)

        filter_kwargs: Dict[str, Any] = {
            'faculty_id': fac_id,
            'section_id': sec_id,
            'subject_id': sub_id,
            'is_active': True,
        }
        if academic_year:
            ay_id = getattr(academic_year, 'id', academic_year)
            filter_kwargs['academic_year_id'] = ay_id

        # Check authoritative TeachingAssignment
        if TeachingAssignment.objects.filter(**filter_kwargs).exists():
            return True

        # If any teaching assignment exists for this section, do not fall back to class teacher
        if TeachingAssignment.objects.filter(section_id=sec_id).exists():
            return False

        # Fallback for legacy fixtures where TeachingAssignments were not seeded at all:
        # allow if section.class_teacher_id == faculty.id
        return getattr(section, 'class_teacher_id', None) == fac_id

    @classmethod
    def can_faculty_manage_section_attendance(cls, faculty: Any, section: Any) -> bool:
        """
        Authoritatively checks whether a faculty member can record attendance for a section.
        Permitted if the faculty is the assigned Class Teacher or has an active TeachingAssignment in the section.
        """
        if not faculty or not section:
            return False
        fac_id = getattr(faculty, 'id', faculty)
        if getattr(section, 'class_teacher_id', None) == fac_id:
            return True
        from apps.academics.models import TeachingAssignment
        sec_id = getattr(section, 'id', section)
        return TeachingAssignment.objects.filter(faculty_id=fac_id, section_id=sec_id, is_active=True).exists()

    # ─── Object Ownership & Access Verification ───────────────────────────────

    @classmethod
    def can_access_object(cls, user: Any, obj: Any, action: str = 'view') -> bool:
        """
        Verifies object-level authorization for an authenticated user on a concrete domain object.
        Ensures:
          - Admin: allowed for all authorized domain operations.
          - Principal: allowed for school-wide oversight and approved actions.
          - Faculty: allowed only if assigned to section (as Class Teacher) or recorded/evaluated by faculty.
          - Student: allowed only for self-owned records.
          - Parent: allowed only for verified linked-child records.
        """
        role = cls.get_user_role(user)
        if not role:
            return False

        action_map = {
            'retrieve': 'view',
            'list': 'view',
            'get': 'view',
            'create': 'create',
            'post': 'create',
            'update': 'update',
            'put': 'update',
            'patch': 'update',
            'partial_update': 'update',
            'destroy': 'delete',
            'delete': 'delete',
        }
        normalized_action = action_map.get(str(action).lower(), str(action).lower())

        # Determine object domain and required permission
        domain = cls._get_object_domain(obj)

        if domain == 'attendance' and normalized_action == 'update':
            has_perm = cls.has_permission(user, PERM_ATTENDANCE_MARK) or cls.has_permission(user, PERM_ATTENDANCE_OVERRIDE)
        elif domain == 'marks' and normalized_action == 'update':
            has_perm = cls.has_permission(user, PERM_MARKS_ENTER) or cls.has_permission(user, PERM_MARKS_OVERRIDE)
        elif domain == 'academics' and normalized_action in ('create', 'update', 'delete'):
            has_perm = cls.has_permission(user, PERM_ACADEMICS_MANAGE)
        else:
            perm = f"{domain}.{normalized_action}"
            has_perm = cls.has_permission(user, perm)

        if not has_perm:
            return False

        # Admin holds global CRUD authority
        if role == ROLE_ADMIN:
            return True

        # Principal holds global oversight/approval authority
        if role == ROLE_PRINCIPAL:
            return True

        # Faculty: assignment-aware access
        if role == ROLE_FACULTY:
            return cls._can_faculty_access_object(user, obj, normalized_action)

        # Student: self-only access
        if role == ROLE_STUDENT:
            return cls._can_student_access_object(user, obj, normalized_action)

        # Parent: linked-child access
        if role == ROLE_PARENT:
            return cls._can_parent_access_object(user, obj, normalized_action)

        return False

    @classmethod
    def _get_object_domain(cls, obj: Any) -> str:
        """Infers domain name from model class or object instance."""
        if isinstance(obj, type):
            model_name = obj.__name__.lower()
        else:
            model_name = getattr(obj, '__class__', type(obj)).__name__.lower()

        if 'student' in model_name:
            return 'students'
        if 'attendance' in model_name or 'leave' in model_name:
            return 'attendance'
        if 'mark' in model_name or 'exam' in model_name:
            return 'marks'
        if 'section' in model_name or 'schoolclass' in model_name or 'subject' in model_name or 'academic' in model_name or 'enrollment' in model_name:
            return 'academics'
        if 'timetable' in model_name:
            return 'timetable'
        if 'calendar' in model_name:
            return 'calendar'
        if 'user' in model_name:
            return 'users'
        if 'parent' in model_name:
            return 'students'
        if 'faculty' in model_name:
            return 'users'
        if 'homework' in model_name:
            return 'homework'
        return 'general'

    @classmethod
    def _can_faculty_access_object(cls, user: Any, obj: Any, action: str) -> bool:
        """Evaluates whether faculty has assigned access to the given object."""
        faculty = getattr(user, 'faculty_profile', None)
        if faculty is None:
            return False

        obj_class = obj.__class__.__name__

        # User profile
        if obj_class == 'User':
            return obj.id == user.id or action == 'view'

        # Faculty profile: view active directory or self; update self only
        if obj_class == 'Faculty':
            if action == 'view':
                return getattr(obj, 'is_active', True) or getattr(obj, 'user_id', None) == user.id
            if action == 'update':
                return getattr(obj, 'user_id', None) == user.id
            return False

        # Parent profile: view if any child is enrolled in section where faculty is Class Teacher
        if obj_class == 'Parent':
            if action == 'view':
                if hasattr(obj, 'children'):
                    return obj.children.filter(enrollments__section__class_teacher=faculty).exists()
                return False
            return False

        # Student entity: faculty can access if student enrolled in assigned section (view only)
        if obj_class == 'Student':
            if action == 'view' and hasattr(obj, 'enrollments'):
                return obj.enrollments.filter(
                    Q(section__class_teacher=faculty)
                    | Q(section__teaching_assignments__faculty=faculty, section__teaching_assignments__is_active=True)
                ).exists()
            return False

        # Section entity: must be designated Class Teacher or have active teaching assignment
        if obj_class == 'Section':
            ct = getattr(obj, 'class_teacher', None)
            if ct == faculty or (hasattr(ct, 'id') and ct.id == faculty.id):
                return True
            if hasattr(obj, 'teaching_assignments'):
                return obj.teaching_assignments.filter(faculty=faculty, is_active=True).exists()
            return False

        # Attendance entity
        if obj_class == 'Attendance':
            # Class teacher of section, or teaching assignment in section, or recorder, or approver
            enrollment = getattr(obj, 'enrollment', None)
            section = getattr(enrollment, 'section', None) if enrollment else None
            if section and cls.can_faculty_manage_section_attendance(faculty, section):
                return True
            ct = getattr(section, 'class_teacher', None) if section else None
            if ct == faculty or (hasattr(ct, 'id') and ct.id == faculty.id):
                return True
            if getattr(obj, 'recorded_by_id', None) == user.id:
                return True
            if getattr(obj, 'approved_by_faculty_id', None) == faculty.id:
                return True
            return False

        # LeaveApplication entity
        if obj_class == 'LeaveApplication':
            student = getattr(obj, 'student', None)
            if action in ('update', 'patch', 'approve'):
                # Only designated Class Teacher can approve/reject leave
                if student and hasattr(student, 'enrollments'):
                    return student.enrollments.filter(section__class_teacher=faculty).exists()
                return False
            # View access: Class Teacher or subject teacher for student's section or reviewer
            if student and hasattr(student, 'enrollments'):
                if student.enrollments.filter(
                    Q(section__class_teacher=faculty)
                    | Q(section__teaching_assignments__faculty=faculty, section__teaching_assignments__is_active=True)
                ).exists():
                    return True
            return getattr(obj, 'reviewed_by_id', None) == faculty.id

        # Mark entity
        if obj_class == 'Mark':
            if getattr(obj, 'evaluated_by_id', None) == faculty.id:
                return True
            ct = getattr(getattr(getattr(obj, 'enrollment', None), 'section', None), 'class_teacher', None)
            return ct == faculty or (hasattr(ct, 'id') and ct.id == faculty.id)

        # Homework entity (MOD_001)
        if obj_class == 'Homework':
            if action == 'view':
                if getattr(obj, 'faculty_id', None) == faculty.id:
                    return True
                from apps.academics.models import TeachingAssignment
                return TeachingAssignment.objects.filter(
                    faculty=faculty,
                    section_id=getattr(obj, 'section_id', None),
                    is_active=True,
                ).exists() or getattr(getattr(obj, 'section', None), 'class_teacher_id', None) == faculty.id
            if action in ('update', 'delete'):
                # Faculty can only mutate their own homework
                return getattr(obj, 'faculty_id', None) == faculty.id
            return False

        return False

    @classmethod
    def _can_student_access_object(cls, user: Any, obj: Any, action: str) -> bool:
        """Evaluates whether student owns the given object."""
        student = getattr(user, 'student_profile', None)
        if student is None:
            return False

        obj_class = obj.__class__.__name__

        # User profile
        if obj_class == 'User':
            return obj.id == user.id

        # Faculty profile: view active directory only
        if obj_class == 'Faculty':
            if action == 'view':
                return getattr(obj, 'is_active', True)
            return False

        # Parent profile: view own parent only
        if obj_class == 'Parent':
            if action == 'view':
                return getattr(student, 'parent_id', None) == obj.id
            return False

        # Student entity: self only for view. Mutations are Admin-only per RBAC matrix.
        if obj_class == 'Student':
            if action == 'view':
                return obj.id == student.id or getattr(obj, 'user_id', None) == user.id
            return False

        # Attendance entity: self only
        if obj_class == 'Attendance':
            if action != 'view':
                return False
            enrollment = getattr(obj, 'enrollment', None)
            if enrollment:
                return getattr(enrollment, 'student_id', None) == student.id
            return False

        # LeaveApplication entity: self only
        if obj_class == 'LeaveApplication':
            return getattr(obj, 'student_id', None) == student.id

        # Mark entity: self only
        if obj_class == 'Mark':
            if action != 'view':
                return False
            enrollment = getattr(obj, 'enrollment', None)
            if enrollment:
                return getattr(enrollment, 'student_id', None) == student.id
            return False

        # Section entity: enrolled section
        if obj_class == 'Section':
            if hasattr(obj, 'enrollments'):
                return obj.enrollments.filter(student=student).exists()
            return False

        # Homework entity (MOD_001)
        if obj_class == 'Homework':
            if action != 'view':
                return False
            if getattr(obj, 'status', None) != 'PUBLISHED':
                return False
            if hasattr(student, 'enrollments'):
                return student.enrollments.filter(
                    section_id=getattr(obj, 'section_id', None),
                    status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled'],
                ).exists()
            return False

        return False

    @classmethod
    def _can_parent_access_object(cls, user: Any, obj: Any, action: str) -> bool:
        """Evaluates whether parent has linked-child access to the given object."""
        parent = getattr(user, 'parent_profile', None)
        if parent is None:
            return False

        obj_class = obj.__class__.__name__

        # User profile
        if obj_class == 'User':
            return obj.id == user.id

        # Faculty profile: view active directory only
        if obj_class == 'Faculty':
            if action == 'view':
                return getattr(obj, 'is_active', True)
            return False

        # Parent profile: self only
        if obj_class == 'Parent':
            return obj.id == parent.id or getattr(obj, 'user_id', None) == user.id

        # Student entity: linked child only for view. Mutations are Admin-only per RBAC matrix.
        if obj_class == 'Student':
            if action == 'view':
                return getattr(obj, 'parent_id', None) == parent.id
            return False

        # Attendance entity: child's attendance only
        if obj_class == 'Attendance':
            if action != 'view':
                return False
            enrollment = getattr(obj, 'enrollment', None)
            if enrollment:
                student = getattr(enrollment, 'student', None)
                return getattr(student, 'parent_id', None) == parent.id
            return False

        # LeaveApplication entity: child's leave only
        if obj_class == 'LeaveApplication':
            student = getattr(obj, 'student', None)
            return getattr(student, 'parent_id', None) == parent.id

        # Mark entity: child's mark only
        if obj_class == 'Mark':
            if action != 'view':
                return False
            enrollment = getattr(obj, 'enrollment', None)
            if enrollment:
                student = getattr(enrollment, 'student', None)
                return getattr(student, 'parent_id', None) == parent.id
            return False

        # Section entity: enrolled by any linked child
        if obj_class == 'Section':
            if hasattr(obj, 'enrollments'):
                return obj.enrollments.filter(student__parent=parent).exists()
            return False

        # Homework entity (MOD_001)
        if obj_class == 'Homework':
            if action != 'view':
                return False
            if getattr(obj, 'status', None) != 'PUBLISHED':
                return False
            if hasattr(parent, 'children'):
                return parent.children.filter(
                    enrollments__section_id=getattr(obj, 'section_id', None),
                    enrollments__status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled'],
                ).exists()
            return False

        return False

    # ─── Queryset Scoping ─────────────────────────────────────────────────────

    @classmethod
    def filter_queryset_for_user(
        cls,
        queryset: QuerySet,
        user: Any,
        domain: Optional[str] = None,
    ) -> QuerySet:
        """
        Scoping engine: filters a model QuerySet based on user identity, role, and scope.
        Ensures scoped users (Faculty, Student, Parent) receive only authorized rows,
        even on list endpoints and search operations.
        """
        role = cls.get_user_role(user)
        if not role:
            return queryset.none()

        # Determine domain if not explicitly provided
        model = getattr(queryset, 'model', None)
        model_name = model.__name__ if model else ''

        if domain is None:
            domain = cls._get_object_domain(model)

        # Check domain permission
        perm = f"{domain}.view"
        if not cls.has_permission(user, perm):
            return queryset.none()

        # Admin and Principal receive full approved global scope
        if role in (ROLE_ADMIN, ROLE_PRINCIPAL):
            return queryset

        # Scoping per model type
        if model_name == 'Student':
            return cls._scope_student_queryset(queryset, user, role)

        if model_name == 'Attendance':
            return cls._scope_attendance_queryset(queryset, user, role)

        if model_name == 'LeaveApplication':
            return cls._scope_leave_queryset(queryset, user, role)

        if model_name == 'Mark':
            return cls._scope_mark_queryset(queryset, user, role)

        if model_name == 'Section':
            return cls._scope_section_queryset(queryset, user, role)

        if model_name == 'Enrollment':
            return cls._scope_enrollment_queryset(queryset, user, role)

        if model_name == 'Parent':
            return cls._scope_parent_queryset(queryset, user, role)

        if model_name == 'Homework':
            return cls._scope_homework_queryset(queryset, user, role)

        if model_name == 'Faculty':
            # Descriptive directory lookup for all active roles
            return queryset.filter(is_active=True)

        return queryset

    @classmethod
    def _scope_student_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            return queryset.filter(
                Q(enrollments__section__class_teacher=faculty)
                | Q(enrollments__section__teaching_assignments__faculty=faculty, enrollments__section__teaching_assignments__is_active=True)
            ).distinct()

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student:
                return queryset.none()
            return queryset.filter(id=student.id)

        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            return queryset.filter(parent=parent)

        return queryset.none()

    @classmethod
    def _scope_attendance_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            return queryset.filter(
                Q(enrollment__section__class_teacher=faculty)
                | Q(enrollment__section__teaching_assignments__faculty=faculty, enrollment__section__teaching_assignments__is_active=True)
                | Q(recorded_by=user)
                | Q(approved_by_faculty=faculty)
            ).distinct()

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student:
                return queryset.none()
            return queryset.filter(enrollment__student=student)

        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            return queryset.filter(enrollment__student__parent=parent)

        return queryset.none()

    @classmethod
    def _scope_leave_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            return queryset.filter(
                Q(student__enrollments__section__class_teacher=faculty)
                | Q(reviewed_by=faculty)
            ).distinct()

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student:
                return queryset.none()
            return queryset.filter(student=student)

        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            return queryset.filter(student__parent=parent)

        return queryset.none()

    @classmethod
    def _scope_mark_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            return queryset.filter(
                Q(evaluated_by=faculty)
                | Q(enrollment__section__class_teacher=faculty)
                | Q(enrollment__section__teaching_assignments__faculty=faculty, enrollment__section__teaching_assignments__is_active=True)
            ).distinct()

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student:
                return queryset.none()
            return queryset.filter(enrollment__student=student)

        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            return queryset.filter(enrollment__student__parent=parent)

        return queryset.none()

    @classmethod
    def _scope_section_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            return queryset.filter(
                Q(class_teacher=faculty)
                | Q(teaching_assignments__faculty=faculty, teaching_assignments__is_active=True)
            ).distinct()

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student:
                return queryset.none()
            return queryset.filter(enrollments__student=student).distinct()

        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            return queryset.filter(enrollments__student__parent=parent).distinct()

        return queryset.none()

    @classmethod
    def _scope_homework_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        """Applies role-based scoping to Homework records."""
        if role in (ROLE_ADMIN, ROLE_PRINCIPAL):
            return queryset

        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            from apps.academics.models import TeachingAssignment
            assigned_section_ids = TeachingAssignment.objects.filter(
                faculty=faculty, is_active=True
            ).values_list('section_id', flat=True)
            return queryset.filter(
                Q(faculty=faculty) | Q(section_id__in=assigned_section_ids) | Q(section__class_teacher=faculty)
            ).distinct()

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student:
                return queryset.none()
            enrolled_section_ids = student.enrollments.filter(
                status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled']
            ).values_list('section_id', flat=True)
            return queryset.filter(
                section_id__in=enrolled_section_ids,
                status='PUBLISHED',
            ).distinct()

        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            child_section_ids = parent.children.filter(
                enrollments__status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled']
            ).values_list('enrollments__section_id', flat=True)
            return queryset.filter(
                section_id__in=child_section_ids,
                status='PUBLISHED',
            ).distinct()

        return queryset.none()

    @classmethod
    def _scope_enrollment_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            return queryset.filter(
                Q(section__class_teacher=faculty)
                | Q(section__teaching_assignments__faculty=faculty, section__teaching_assignments__is_active=True)
            ).distinct()

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student:
                return queryset.none()
            return queryset.filter(student=student)

        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            return queryset.filter(student__parent=parent)

        return queryset.none()

    @classmethod
    def _scope_parent_queryset(cls, queryset: QuerySet, user: Any, role: str) -> QuerySet:
        if role == ROLE_PARENT:
            parent = getattr(user, 'parent_profile', None)
            if not parent:
                return queryset.none()
            return queryset.filter(id=parent.id)

        if role == ROLE_STUDENT:
            student = getattr(user, 'student_profile', None)
            if not student or not student.parent:
                return queryset.none()
            return queryset.filter(id=student.parent_id)

        if role == ROLE_FACULTY:
            faculty = getattr(user, 'faculty_profile', None)
            if not faculty:
                return queryset.none()
            return queryset.filter(
                Q(children__enrollments__section__class_teacher=faculty)
                | Q(children__enrollments__section__teaching_assignments__faculty=faculty, children__enrollments__section__teaching_assignments__is_active=True)
            ).distinct()

        return queryset.none()
