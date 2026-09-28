"""
Student ERP — Students Domain Models (Task 3.3)
Concrete model: Student

Design Notes:
- Student has a UUID database primary key (id) separate from the permanent business identifier (student_id).
- student_id format: STU<4-digit-year><5-digit-sequence> e.g. STU202600001 (per ADR 008).
- student_id is IMMUTABLE after creation — enforced in save() via ImmutableFieldMutationError.
- student_id format is validated in clean() using common.utils.validate_student_id.
- Parent FK uses PROTECT: a parent record cannot be deleted while students are linked.
- Student status uses controlled choices from common.constants.
"""

from django.db import models
from django.core.exceptions import ValidationError

from common.models import BaseModel
from common.constants import (
    ENROLLMENT_STATUS_ENROLLED,
)
from common.exceptions import ImmutableFieldMutationError
from common.utils import validate_student_id


# ─── Controlled vocabulary ────────────────────────────────────────────────────

STUDENT_STATUS_CHOICES = [
    ('Enrolled', 'Enrolled'),
    ('Promoted', 'Promoted'),
    ('Transferred', 'Transferred'),
    ('Graduated', 'Graduated'),
    ('Withdrawn', 'Withdrawn'),
]

GENDER_CHOICES = [
    ('Male', 'Male'),
    ('Female', 'Female'),
    ('Other', 'Other'),
]

BLOOD_GROUP_CHOICES = [
    ('A+', 'A+'),
    ('A-', 'A-'),
    ('B+', 'B+'),
    ('B-', 'B-'),
    ('AB+', 'AB+'),
    ('AB-', 'AB-'),
    ('O+', 'O+'),
    ('O-', 'O-'),
]


# ============================================================================
# Student
# ============================================================================
class Student(BaseModel):
    """
    Student profile — the central entity of the Student ERP.

    Identity strategy (two distinct identifiers):
      id (UUID, PK)     — opaque database identity, never exposed to end users.
      student_id (str)  — permanent human/business identifier (STU202600001).

    student_id is IMMUTABLE after initial creation.
    Any mutation attempt raises ImmutableFieldMutationError.

    Parent FK (PROTECT): prevents deleting a parent record while linked students exist,
    preserving family relationship history and supporting Parent portal login by Student ID.
    """
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='student_profile',
        help_text="CASCADE: Deleting the user record removes this student profile.",
    )
    parent = models.ForeignKey(
        'accounts.Parent',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='children',
        help_text=(
            "PROTECT: Cannot delete a parent record while students are linked. "
            "NULL permitted — a student may not yet have a linked parent account."
        ),
    )
    student_id = models.CharField(
        max_length=20,
        unique=True,
        help_text=(
            "Permanent immutable business identifier. "
            "Format: STU<4-digit-year><5-digit-sequence> (e.g. STU202600001). "
            "IMMUTABLE after creation. Cannot be modified via any update operation."
        ),
    )
    admission_number = models.CharField(
        max_length=64,
        unique=True,
        help_text="Unique institutional admission number (e.g. ADM20240091).",
    )
    roll_number = models.CharField(
        max_length=64,
        help_text="Class roll number (e.g. 11-A2-04). May change on section transfer.",
    )
    date_of_birth = models.DateField()
    gender = models.CharField(
        max_length=16,
        choices=GENDER_CHOICES,
    )
    blood_group = models.CharField(
        max_length=8,
        blank=True,
        default='',
        choices=BLOOD_GROUP_CHOICES,
    )
    emergency_contact = models.CharField(
        max_length=32,
        help_text="Emergency contact phone number.",
    )
    address = models.TextField(
        help_text="Home address.",
    )
    status = models.CharField(
        max_length=32,
        choices=STUDENT_STATUS_CHOICES,
        default=ENROLLMENT_STATUS_ENROLLED,
        help_text="Current enrollment lifecycle status.",
    )

    class Meta:
        db_table = 'students'
        ordering = ['student_id']
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        indexes = [
            # student_id unique constraint already creates an implicit index.
            # Additional operational indexes:
            models.Index(fields=['status'], name='idx_students_status'),
            models.Index(fields=['parent'], name='idx_students_parent'),
        ]

    def __str__(self) -> str:
        return f"{self.user.get_full_name()} [{self.student_id}]"

    def clean(self) -> None:
        """
        Validate student_id format against the approved pattern.
        Pattern: STU<4-digit-year><5-digit-sequence> (e.g. STU202600001)
        """
        if self.student_id and not validate_student_id(self.student_id):
            raise ValidationError({
                'student_id': (
                    f"Invalid Student ID format: '{self.student_id}'. "
                    f"Required format: STU<4-digit-year><5-digit-sequence> "
                    f"(e.g. STU202600001)."
                )
            })

    def save(self, *args, **kwargs) -> None:
        """
        Enforce Student ID immutability on all update operations.

        If this is an update (pk exists and record already persisted),
        any change to student_id raises ImmutableFieldMutationError
        before writing reaches the database.
        """
        if self.pk:
            try:
                original = Student.objects.get(pk=self.pk)
                if original.student_id != self.student_id:
                    raise ImmutableFieldMutationError('student_id', self.student_id)
            except Student.DoesNotExist:
                pass  # New object being created — no mutation to guard against
        super().save(*args, **kwargs)
