"""
Student ERP — Marks Domain Models
Contains concrete models for Exam Types and Student Marks.
Strictly adheres to Indian-school (CBSE/ICSE) 8-tier letter grading (A1, A2, B1, B2, C1, C2, D, E).
Purges university terms (GPA, CGPA, credits, 4-point grading).
"""

from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models

from common.models import UUIDModel, TimeStampedModel
from common.utils import calculate_grade, calculate_percentage


class ExamType(UUIDModel, TimeStampedModel):
    """
    Persists examination and assessment categories (e.g. Midterm Exam, Final Exam, Quiz 1).
    """
    name = models.CharField(max_length=64, unique=True)
    weightage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('100.00'),
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'marks_exam_types'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (Weightage: {self.weightage}%)"


class Mark(UUIDModel, TimeStampedModel):
    """
    Persists student marks for subjects and exam types.
    Raw marks are evaluated out of max_marks (default 100.00).
    Grade is deterministically derived via standard CBSE 8-tier letter grading utility.
    """
    enrollment = models.ForeignKey(
        'academics.Enrollment',
        on_delete=models.CASCADE,
        related_name='marks',
    )
    subject = models.ForeignKey(
        'academics.Subject',
        on_delete=models.PROTECT,
        related_name='marks',
    )
    exam_type = models.ForeignKey(
        'marks.ExamType',
        on_delete=models.PROTECT,
        related_name='marks',
    )
    marks_obtained = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )
    max_marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('100.00'),
    )
    grade = models.CharField(
        max_length=8,
        blank=True,
    )
    remarks = models.TextField(blank=True, default='')
    evaluated_by = models.ForeignKey(
        'accounts.Faculty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluated_marks',
    )
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'marks_records'
        ordering = ['enrollment', 'subject', 'exam_type']
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'subject', 'exam_type'],
                name='unique_student_subject_exam_mark',
            ),
            models.CheckConstraint(
                condition=models.Q(marks_obtained__gte=0) & models.Q(marks_obtained__lte=models.F('max_marks')),
                name='check_marks_obtained_range',
            ),
        ]
        indexes = [
            models.Index(fields=['enrollment', 'subject']),
            models.Index(fields=['exam_type', 'subject']),
        ]

    def clean(self):
        super().clean()
        if self.max_marks is not None and self.max_marks <= Decimal('0'):
            raise ValidationError({'max_marks': 'Maximum marks must be greater than zero.'})

        if self.marks_obtained is not None:
            if self.marks_obtained < Decimal('0'):
                raise ValidationError({'marks_obtained': 'Marks obtained cannot be negative.'})
            if self.max_marks is not None and self.marks_obtained > self.max_marks:
                raise ValidationError({'marks_obtained': f'Marks obtained ({self.marks_obtained}) cannot exceed maximum marks ({self.max_marks}).'})

            # Derive grade deterministically, preserving 'AB' only if marked absent and marks_obtained is 0
            if getattr(self, 'grade', '') == 'AB' and self.marks_obtained == Decimal('0.00'):
                pass
            else:
                pct = calculate_percentage(float(self.marks_obtained), float(self.max_marks or 100.0))
                self.grade = calculate_grade(pct)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        score_display = "AB" if self.grade == 'AB' else f"{self.marks_obtained}/{self.max_marks}"
        return f"Mark ({self.enrollment.student.student_id} - {self.subject.code} - {self.exam_type.name}): {score_display} [{self.grade}]"
