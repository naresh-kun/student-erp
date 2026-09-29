"""
Student ERP — Academics Domain Models (Task 3.3)
Concrete models: AcademicYear, SchoolClass, Section, Subject, Enrollment

Design Notes:
- AcademicYear: foundational; used as FK anchor by all academic structure.
- SchoolClass: named 'SchoolClass' in Python to avoid ambiguity with 'class' keyword;
  maps to db_table='classes' per DATABASE_SCHEMA.md.
- Section: unique per (school_class, name); class_teacher is SET_NULL to preserve
  section history when a faculty member is removed.
- Subject: 'weekly_periods' replaces 'credits' from DATABASE_SCHEMA.md per ADR 008
  (Indian school model purges GPA/credits concepts). Deviation documented in DECISIONS.md.
- Enrollment: unique on (student, academic_year) — one active enrollment per year;
  CASCADE on both student and section deletions.

FK delete semantics:
  - AcademicYear → PROTECT (cannot delete year with existing classes)
  - SchoolClass → CASCADE (deleting a class cascades to its sections)
  - Section (class_teacher) → SET_NULL (removing faculty leaves section intact)
  - Student in Enrollment → CASCADE (deleting a student removes their enrollments)
  - Section in Enrollment → CASCADE (deleting a section removes associated enrollments)
  - AcademicYear in Enrollment → CASCADE (deleting an academic year removes enrollments)
"""

from django.db import models
from django.core.exceptions import ValidationError

from common.models import BaseModel


# ─── Controlled vocabulary ────────────────────────────────────────────────────

ENROLLMENT_STATUS_CHOICES = [
    ('Enrolled', 'Enrolled'),
    ('Promoted', 'Promoted'),
    ('Transferred', 'Transferred'),
    ('Graduated', 'Graduated'),
    ('Withdrawn', 'Withdrawn'),
]


# ============================================================================
# AcademicYear
# ============================================================================
class AcademicYear(BaseModel):
    """
    Academic year definition for the institution.
    Only one academic year should be marked is_current=True at any time.
    PROTECT: prevents deletion of an academic year that has class structures defined.
    """
    name = models.CharField(
        max_length=32,
        unique=True,
        help_text="Academic year label (e.g. '2025-2026', '2026-2027').",
    )
    start_date = models.DateField(
        help_text="First day of the academic year.",
    )
    end_date = models.DateField(
        help_text="Last day of the academic year.",
    )
    is_current = models.BooleanField(
        default=False,
        help_text="Marks the currently active academic year. Only one should be True at a time.",
    )

    class Meta:
        db_table = 'academic_years'
        ordering = ['-start_date']
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'
        indexes = [
            models.Index(fields=['is_current'], name='idx_academic_years_is_current'),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self) -> None:
        """Validate that end_date is strictly after start_date."""
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError({
                'end_date': 'Academic year end date must be strictly after start date.'
            })


# ============================================================================
# SchoolClass (maps to db_table = 'classes')
# ============================================================================
class SchoolClass(BaseModel):
    """
    Academic grade/class definition within an academic year.

    In this Indian school model, a 'class' record represents a
    grade-stream combination (e.g. 'Grade 11 - Computer Science', 'Grade 10 - General').
    Grades 1–10 use no stream; Grades 11–12 carry a stream (A/B/C/D per ADR 008).

    Named 'SchoolClass' in Python to avoid collision with the 'class' keyword.
    Database table is 'classes' to match DATABASE_SCHEMA.md.

    PROTECT: Cannot delete an academic year while class definitions exist.
    Unique constraint: (academic_year, code) prevents duplicate class codes per year.
    """
    academic_year = models.ForeignKey(
        'AcademicYear',
        on_delete=models.PROTECT,
        related_name='classes',
        help_text="PROTECT: Cannot delete an academic year that has class definitions.",
    )
    name = models.CharField(
        max_length=100,
        help_text="Human-readable class name (e.g. 'Grade 11 - Computer Science', 'Grade 9').",
    )
    code = models.CharField(
        max_length=32,
        help_text="Short class code (e.g. 'G11-CS', 'G10-GEN', 'G9').",
    )

    class Meta:
        db_table = 'classes'
        unique_together = [('academic_year', 'code')]
        ordering = ['academic_year', 'code']
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'

    def __str__(self) -> str:
        return f"{self.name} ({self.academic_year.name})"


# ============================================================================
# Section
# ============================================================================
class Section(BaseModel):
    """
    A section within a class (e.g. Section A1 inside Grade 11 - Computer Science).

    For Grades 11–12, section names follow stream conventions: A, A1, A2, A3 (CS),
    B, B1, B2, B3 (Bio-Maths), C, C1, C2, C3 (Commerce), D, D1, D2, D3 (Pure Science).
    For Grades 1–10, section names are generic: A, B, C, D.

    class_teacher (SET_NULL): removing a faculty member leaves the section intact
    but unassigned, rather than destroying section history and enrollment records.
    """
    school_class = models.ForeignKey(
        'SchoolClass',
        on_delete=models.CASCADE,
        related_name='sections',
        help_text="CASCADE: Deleting a class cascades to and removes all its sections.",
    )
    name = models.CharField(
        max_length=32,
        help_text="Section label (e.g. 'A', 'A1', 'B2', 'C3').",
    )
    room = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text="Assigned classroom or room number.",
    )
    capacity = models.IntegerField(
        default=35,
        help_text="Maximum student enrollment capacity for this section.",
    )
    class_teacher = models.ForeignKey(
        'accounts.Faculty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_sections',
        help_text=(
            "SET_NULL: Removing a faculty record marks this section as unassigned "
            "rather than deleting the section itself."
        ),
    )

    class Meta:
        db_table = 'sections'
        unique_together = [('school_class', 'name')]
        ordering = ['school_class', 'name']
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'

    def __str__(self) -> str:
        return f"{self.school_class.name} / Section {self.name}"


# ============================================================================
# Subject
# ============================================================================
class Subject(BaseModel):
    """
    Academic subject definition.

    DEVIATION from DATABASE_SCHEMA.md (documented in docs/DECISIONS.md):
    DATABASE_SCHEMA.md specifies a 'credits' INTEGER field (default 3).
    ADR 008 explicitly removes all credit/GPA concepts from the Indian school model.
    This model uses 'weekly_periods' (instructional periods per week) instead.
    Deviation recorded as ADR 010 in DECISIONS.md.

    Subject codes must be institution-wide unique (e.g. MATH11, CS12A, PHY11).
    is_active: inactive subjects are preserved for historical marks but excluded from
    new timetable scheduling.
    """
    name = models.CharField(
        max_length=150,
        help_text="Full subject name (e.g. 'Mathematics', 'Computer Science', 'Physics').",
    )
    code = models.CharField(
        max_length=32,
        unique=True,
        help_text="Unique subject code (e.g. 'MATH11', 'CS12', 'PHY11B').",
    )
    department = models.CharField(
        max_length=100,
        help_text="Academic department owning this subject.",
    )
    weekly_periods = models.IntegerField(
        default=6,
        help_text=(
            "Number of instructional periods per week. "
            "Replaces 'credits' (purged per ADR 008 Indian school reconciliation)."
        ),
    )
    description = models.TextField(
        blank=True,
        default='',
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive subjects are retained for historical marks but not scheduled.",
    )

    class Meta:
        db_table = 'subjects'
        ordering = ['department', 'name']
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'
        indexes = [
            models.Index(fields=['department'], name='idx_subjects_department'),
            models.Index(fields=['is_active'], name='idx_subjects_is_active'),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


# ============================================================================
# Enrollment
# ============================================================================
class Enrollment(BaseModel):
    """
    Student enrollment in a section for an academic year.

    Unique constraint on (student, academic_year): a student may hold only one
    active enrollment per academic year, preventing contradictory section placements.

    FK semantics:
      student  → CASCADE: deleting a student removes all their enrollment records.
      section  → CASCADE: deleting a section removes associated enrollment records.
      academic_year → CASCADE: deleting an academic year purges all enrollments for that year.

    This model provides the relational foundation for:
      - Attendance tracking (Task 3.4 links attendance to enrollment)
      - Marks recording (Task 3.4 links marks to enrollment)
      - Student section allocation governance (RBAC: Admin/Principal only)
    """
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text="CASCADE: Deleting a student removes all their enrollment records.",
    )
    section = models.ForeignKey(
        'Section',
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text="CASCADE: Deleting a section removes its associated enrollment records.",
    )
    academic_year = models.ForeignKey(
        'AcademicYear',
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text="CASCADE: Deleting an academic year removes all its enrollment records.",
    )
    enrolled_date = models.DateField(
        auto_now_add=True,
        help_text="Date on which the enrollment was registered.",
    )
    status = models.CharField(
        max_length=32,
        choices=ENROLLMENT_STATUS_CHOICES,
        default='Enrolled',
        help_text="Current enrollment lifecycle status.",
    )

    class Meta:
        db_table = 'enrollments'
        unique_together = [('student', 'academic_year')]
        ordering = ['-academic_year__start_date', 'student__student_id']
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
        indexes = [
            # (student, academic_year) unique constraint already creates an index.
            models.Index(
                fields=['section', 'academic_year'],
                name='idx_enrollments_section_year',
            ),
            models.Index(
                fields=['status'],
                name='idx_enrollments_status',
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.student.student_id} → {self.section} "
            f"({self.academic_year.name}) [{self.status}]"
        )
