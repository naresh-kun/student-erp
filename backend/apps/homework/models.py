"""
Student ERP — Homework Domain Models (MOD_001)
Concrete model: Homework
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from common.models import BaseModel


class Homework(BaseModel):
    """
    Homework entity for school academic communication.
    Represents assigned homework within an authorized teaching scope
    (Faculty, AcademicYear, SchoolClass, Section, Subject).
    """
    STATUS_DRAFT = 'DRAFT'
    STATUS_PUBLISHED = 'PUBLISHED'
    STATUS_CLOSED = 'CLOSED'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PUBLISHED, 'Published'),
        (STATUS_CLOSED, 'Closed'),
    ]

    title = models.CharField(
        max_length=200,
        help_text="Homework title or topic heading.",
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text="Detailed instructions, reading passages, or questions.",
    )
    faculty = models.ForeignKey(
        'accounts.Faculty',
        on_delete=models.PROTECT,
        related_name='assigned_homework',
        help_text="Faculty member who created and assigned this homework.",
    )
    academic_year = models.ForeignKey(
        'academics.AcademicYear',
        on_delete=models.PROTECT,
        related_name='homework',
        help_text="Academic year for this homework assignment.",
    )
    school_class = models.ForeignKey(
        'academics.SchoolClass',
        on_delete=models.CASCADE,
        related_name='homework',
        help_text="Class for this homework.",
    )
    section = models.ForeignKey(
        'academics.Section',
        on_delete=models.CASCADE,
        related_name='homework',
        help_text="Section for which this homework is assigned.",
    )
    subject = models.ForeignKey(
        'academics.Subject',
        on_delete=models.PROTECT,
        related_name='homework',
        help_text="Subject to which this homework belongs.",
    )
    assigned_date = models.DateField(
        default=timezone.now,
        help_text="Date when homework was assigned/published.",
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text="Submission due date for students.",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PUBLISHED,
        help_text="Lifecycle status: DRAFT, PUBLISHED, or CLOSED.",
    )

    class Meta:
        db_table = 'homework'
        ordering = ['-assigned_date', '-created_at']
        verbose_name = 'Homework'
        verbose_name_plural = 'Homework'
        indexes = [
            models.Index(fields=['status'], name='idx_hw_status'),
            models.Index(fields=['section', 'status'], name='idx_hw_sec_status'),
            models.Index(fields=['faculty', 'status'], name='idx_hw_fac_status'),
            models.Index(fields=['due_date'], name='idx_hw_due_date'),
        ]

    def __str__(self) -> str:
        return f"{self.title} — {self.section} / {self.subject.code} [{self.status}]"

    def clean(self) -> None:
        super().clean()
        if self.section and self.school_class and self.section.school_class_id != self.school_class_id:
            raise ValidationError({'section': 'Section must belong to the specified school class.'})
        if self.school_class and self.academic_year and self.school_class.academic_year_id != self.academic_year_id:
            raise ValidationError({'school_class': 'School class must belong to the specified academic year.'})
        if self.assigned_date and self.due_date and self.due_date < self.assigned_date:
            raise ValidationError({'due_date': 'Due date cannot be earlier than assigned date.'})

    def save(self, *args, **kwargs):
        if not self.school_class_id and self.section_id:
            self.school_class_id = self.section.school_class_id
        if not self.academic_year_id and self.school_class_id:
            self.academic_year_id = self.school_class.academic_year_id
        super().save(*args, **kwargs)
