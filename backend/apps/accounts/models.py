"""
Student ERP — Accounts & Identity Domain Models (Task 3.3)
Concrete models: Role, User (AbstractUser extension), Parent, Faculty

Design Notes:
- User extends Django's AbstractUser with UUID primary key and ERP role FK.
- AUTH_USER_MODEL = 'accounts.User' must be set in settings.py (Task 3.3).
- Role FK uses RESTRICT to prevent deletion of a role while users are assigned.
- Parent/Faculty are OneToOne profiles CASCADE-linked to their User identity.
- Faculty profile is strictly descriptive — zero evaluative fields (ADR 008).
- All concrete models inherit BaseModel (UUID PK + timestamps via common.models).
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from common.models import BaseModel, TimeStampedModel, UUIDModel
from common.constants import ALL_ROLES, ROLE_CHOICES


# ============================================================================
# Role
# ============================================================================
class Role(BaseModel):
    """
    ERP system role definition.
    Exactly 5 approved roles: Admin, Principal, Faculty, Student, Parent.
    Role names are unique and controlled by ROLE_CHOICES from common.constants.
    """
    name = models.CharField(
        max_length=32,
        unique=True,
        choices=ROLE_CHOICES,
        help_text="ERP system role. One of: Admin, Principal, Faculty, Student, Parent.",
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text="Human-readable description of role responsibilities.",
    )

    class Meta:
        db_table = 'roles'
        ordering = ['name']
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self) -> str:
        return self.name


# ============================================================================
# User (Custom Django User)
# ============================================================================
class User(AbstractUser):
    """
    Custom ERP User extending Django's AbstractUser.

    UUID primary key overrides Django's default BigAutoField id.
    Inherits: username, password, email, first_name, last_name,
              is_active, is_staff, is_superuser, date_joined, last_login,
              groups, user_permissions.
    Adds: UUID id, role FK, phone, avatar_url, updated_at.

    AUTH_USER_MODEL = 'accounts.User' must be configured in settings.py.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="UUID v4 primary key — database identity, separate from business identifiers.",
    )
    role = models.ForeignKey(
        'Role',
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name='users',
        help_text="ERP role assignment. RESTRICT: prevents deleting a role while users are assigned.",
    )
    phone = models.CharField(
        max_length=32,
        blank=True,
        default='',
        help_text="Contact phone number.",
    )
    avatar_url = models.TextField(
        blank=True,
        default='',
        help_text="Profile avatar image URL.",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Auto-updated timestamp on every save.",
    )
    # Note: AbstractUser.date_joined serves as created_at for User records.

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['role'], name='idx_users_role'),
        ]

    def __str__(self) -> str:
        role_name = self.role.name if self.role_id else 'No Role'
        return f"{self.username} ({role_name})"


# ============================================================================
# Parent
# ============================================================================
class Parent(BaseModel):
    """
    Parent/Guardian profile, linked one-to-one with a User identity.
    CASCADE: removing the user removes the parent profile automatically.
    The parent-child (Student) relationship is established on the Student side.
    """
    RELATION_FATHER = 'Father'
    RELATION_MOTHER = 'Mother'
    RELATION_GUARDIAN = 'Legal Guardian'
    RELATION_CHOICES = [
        (RELATION_FATHER, 'Father'),
        (RELATION_MOTHER, 'Mother'),
        (RELATION_GUARDIAN, 'Legal Guardian'),
    ]

    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='parent_profile',
        help_text="CASCADE: Deleting the user record removes this parent profile.",
    )
    relation = models.CharField(
        max_length=32,
        choices=RELATION_CHOICES,
        help_text="Guardian's relationship to the student.",
    )
    occupation = models.CharField(
        max_length=100,
        blank=True,
        default='',
    )
    address = models.TextField(
        blank=True,
        default='',
    )

    class Meta:
        db_table = 'parents'
        verbose_name = 'Parent'
        verbose_name_plural = 'Parents'

    def __str__(self) -> str:
        return f"Parent: {self.user.get_full_name()} ({self.relation})"


# ============================================================================
# Faculty
# ============================================================================
class Faculty(BaseModel):
    """
    Faculty/Teacher profile, linked one-to-one with a User identity.
    Strictly descriptive per ADR 008: no performance ratings, rankings, or appraisal scores.
    CASCADE: removing the user removes the faculty profile.
    """
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='faculty_profile',
        help_text="CASCADE: Deleting the user record removes this faculty profile.",
    )
    employee_code = models.CharField(
        max_length=64,
        unique=True,
        help_text="Unique institutional staff code (e.g. FAC001). Immutable after assignment.",
    )
    department = models.CharField(
        max_length=100,
        help_text="Academic department (e.g. Mathematics, Physics, Computer Science).",
    )
    designation = models.CharField(
        max_length=100,
        help_text="Official designation (e.g. PGT Mathematics, TGT Science, HOD Physics).",
    )
    qualification = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Highest academic qualification (e.g. M.Sc, B.Ed, M.Phil).",
    )
    specialization = models.TextField(
        blank=True,
        default='',
        help_text="Subject specialization details.",
    )
    office_room = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text="Faculty office or staff room location.",
    )
    joining_date = models.DateField(
        help_text="Date of institutional appointment/joining.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive faculty are retained for historical audit but not scheduled.",
    )

    class Meta:
        db_table = 'faculty'
        ordering = ['department', 'user__last_name']
        verbose_name = 'Faculty'
        verbose_name_plural = 'Faculty'
        indexes = [
            models.Index(fields=['department'], name='idx_faculty_department'),
            models.Index(fields=['is_active'], name='idx_faculty_is_active'),
        ]

    def __str__(self) -> str:
        return f"{self.user.get_full_name()} — {self.designation} ({self.department})"
