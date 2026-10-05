"""
Student ERP — Global System Constants & Canonical Enums
Authoritative single source of truth for backend domain invariants.
"""

from typing import Tuple

# ============================================================================
# 1. System Roles (5 Primary System Roles)
# ============================================================================
ROLE_ADMIN = 'Admin'
ROLE_PRINCIPAL = 'Principal'
ROLE_FACULTY = 'Faculty'
ROLE_STUDENT = 'Student'
ROLE_PARENT = 'Parent'

ALL_ROLES: Tuple[str, ...] = (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
)

ROLE_CHOICES = tuple((role, role) for role in ALL_ROLES)


# ============================================================================
# 2. Canonical Attendance Four-Status Model (Master Plan Amendment 2)
# ============================================================================
# Canonical 4 statuses: PRESENT, ABSENT, ON_DUTY, LEAVE
# Business Rules:
# - PRESENT: Student present in scheduled class.
# - ABSENT: Unapproved absence.
# - ON_DUTY: Authorized institutional representation (counts as present).
# - LEAVE: Faculty/school-approved absence (counts as absence).
# Formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
ATTENDANCE_STATUS_PRESENT = 'PRESENT'
ATTENDANCE_STATUS_ABSENT = 'ABSENT'
ATTENDANCE_STATUS_ON_DUTY = 'ON_DUTY'
ATTENDANCE_STATUS_LEAVE = 'LEAVE'

ATTENDANCE_STATUSES: Tuple[str, ...] = (
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_LEAVE,
)

ATTENDANCE_STATUS_CHOICES = tuple((s, s) for s in ATTENDANCE_STATUSES)

# Strictly prohibited legacy statuses per Master Plan Amendment 2
FORBIDDEN_ATTENDANCE_STATUSES: Tuple[str, ...] = (
    'LATE',
    'EXCUSED',
)


# ============================================================================
# 3. CBSE / ICSE Senior Secondary 8-Tier Grading Scale (ADR 008)
# ============================================================================
# Authoritative Grading Scale:
# A1 : 91 – 100 (Outstanding)
# A2 : 81 – <91 (Excellent)
# B1 : 71 – <81 (Very Good)
# B2 : 61 – <71 (Good)
# C1 : 51 – <61 (Fair)
# C2 : 41 – <51 (Average)
# D  : 33 – <41 (Passing Threshold)
# E  : <33      (Needs Improvement / Remedial)
GRADE_A1 = 'A1'
GRADE_A2 = 'A2'
GRADE_B1 = 'B1'
GRADE_B2 = 'B2'
GRADE_C1 = 'C1'
GRADE_C2 = 'C2'
GRADE_D = 'D'
GRADE_E = 'E'

ALL_GRADES: Tuple[str, ...] = (
    GRADE_A1,
    GRADE_A2,
    GRADE_B1,
    GRADE_B2,
    GRADE_C1,
    GRADE_C2,
    GRADE_D,
    GRADE_E,
)

GRADE_CHOICES = tuple((g, g) for g in ALL_GRADES)

PASSING_GRADE_THRESHOLD = 33.0
PASSING_GRADE = GRADE_D


# ============================================================================
# 4. Indian Senior Secondary Academic Streams (Grades 11–12)
# ============================================================================
STREAM_COMPUTER_SCIENCE = 'Computer Science A'
STREAM_BIO_MATHS = 'Bio-Maths B'
STREAM_COMMERCE = 'Commerce C'
STREAM_PURE_SCIENCE = 'Pure Science D'

APPROVED_STREAMS: Tuple[str, ...] = (
    STREAM_COMPUTER_SCIENCE,
    STREAM_BIO_MATHS,
    STREAM_COMMERCE,
    STREAM_PURE_SCIENCE,
)

STREAM_CHOICES = tuple((s, s) for s in APPROVED_STREAMS)


# ============================================================================
# 5. Operational Governance & Workflow Statuses
# ============================================================================
# Leave Application Workflow
LEAVE_STATUS_PENDING = 'PENDING'
LEAVE_STATUS_APPROVED = 'APPROVED'
LEAVE_STATUS_REJECTED = 'REJECTED'

LEAVE_STATUSES: Tuple[str, ...] = (
    LEAVE_STATUS_PENDING,
    LEAVE_STATUS_APPROVED,
    LEAVE_STATUS_REJECTED,
)

# Allocation Workflow
ALLOCATION_STATUS_DRAFT = 'Draft'
ALLOCATION_STATUS_APPROVED = 'Approved'
ALLOCATION_STATUS_ACTIVE = 'Active'

ALLOCATION_STATUSES: Tuple[str, ...] = (
    ALLOCATION_STATUS_DRAFT,
    ALLOCATION_STATUS_APPROVED,
    ALLOCATION_STATUS_ACTIVE,
)

# Student Enrollment Status
ENROLLMENT_STATUS_ENROLLED = 'Enrolled'
ENROLLMENT_STATUS_PROMOTED = 'Promoted'
ENROLLMENT_STATUS_TRANSFERRED = 'Transferred'
ENROLLMENT_STATUS_GRADUATED = 'Graduated'
ENROLLMENT_STATUS_WITHDRAWN = 'Withdrawn'


# ============================================================================
# 6. RBAC Scope Constants (Task 4.3)
# ============================================================================
SCOPE_GLOBAL = 'GLOBAL'
SCOPE_FACULTY_ASSIGNED = 'FACULTY_ASSIGNED'
SCOPE_SELF = 'SELF'
SCOPE_LINKED_CHILD = 'LINKED_CHILD'
SCOPE_NONE = 'NONE'

ALL_SCOPES: Tuple[str, ...] = (
    SCOPE_GLOBAL,
    SCOPE_FACULTY_ASSIGNED,
    SCOPE_SELF,
    SCOPE_LINKED_CHILD,
    SCOPE_NONE,
)


# ============================================================================
# 7. RBAC Canonical Permission Identifiers (Task 4.3)
# ============================================================================
# Format: <domain>.<action> per docs/RBAC_PERMISSIONS.md

# Users & Profile
PERM_USERS_VIEW = 'users.view'
PERM_USERS_CREATE = 'users.create'
PERM_USERS_UPDATE = 'users.update'
PERM_USERS_DELETE = 'users.delete'

# Student Directory & Records
PERM_STUDENTS_VIEW = 'students.view'
PERM_STUDENTS_CREATE = 'students.create'
PERM_STUDENTS_UPDATE = 'students.update'
PERM_STUDENTS_DELETE = 'students.delete'

# Academic Setup (Classes, Sections, Subjects)
PERM_ACADEMICS_VIEW = 'academics.view'
PERM_ACADEMICS_MANAGE = 'academics.manage'

# Attendance Management
PERM_ATTENDANCE_VIEW = 'attendance.view'
PERM_ATTENDANCE_MARK = 'attendance.mark'
PERM_ATTENDANCE_APPROVE_LEAVE = 'attendance.approve_leave'
PERM_ATTENDANCE_VIEW_ABSENTEES = 'attendance.view_absentees'
PERM_ATTENDANCE_VIEW_NOT_ENTERED = 'attendance.view_not_entered'
PERM_ATTENDANCE_OVERRIDE = 'attendance.override'

# Marks & Grading
PERM_MARKS_VIEW = 'marks.view'
PERM_MARKS_ENTER = 'marks.enter'
PERM_MARKS_OVERRIDE = 'marks.override'
PERM_MARKS_APPROVE = 'marks.approve'

# Timetable Management
PERM_TIMETABLE_VIEW = 'timetable.view'
PERM_TIMETABLE_MANAGE = 'timetable.manage'

# Institutional Calendar
PERM_CALENDAR_VIEW = 'calendar.view'
PERM_CALENDAR_CREATE = 'calendar.create'
PERM_CALENDAR_PUBLISH = 'calendar.publish'

# Allocation Engine (Task 2.7 Approved Functional Amendment)
PERM_ALLOCATION_VIEW = 'allocation.view'
PERM_ALLOCATION_UPDATE_STUDENT_SECTION = 'allocation.update_student_section'
PERM_ALLOCATION_DELETE_STUDENT_SECTION = 'allocation.delete_student_section'
PERM_ALLOCATION_UPDATE_CLASS_TEACHER = 'allocation.update_class_teacher'
PERM_ALLOCATION_DELETE_CLASS_TEACHER = 'allocation.delete_class_teacher'

# Reports & Analytics
PERM_REPORTS_VIEW = 'reports.view'
PERM_REPORTS_EXPORT = 'reports.export'
PERM_REPORTS_APPROVE = 'reports.approve'

# Audit Logs
PERM_AUDIT_VIEW = 'audit.view'

