"""
Student ERP — Timetable Domain Models (Phase 6 Task 6.1)
Concrete model: TimetableSlot (mapped to db_table='timetables')
Strictly adheres to Section 3.4 of docs/DATABASE_SCHEMA.md.
"""

from django.db import models
from django.core.exceptions import ValidationError

from common.models import BaseModel


DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
]

DAY_CHOICES = [(d, d) for d in DAYS_OF_WEEK]


class TimetableSlot(BaseModel):
    """
    TimetableSlot represents a scheduled instructional period for a class section,
    mapping section, subject, faculty, day of week, period number, and time bounds.

    Authoritative schema: Section 3.4 of docs/DATABASE_SCHEMA.md (table 'timetables').
    Enforces that:
      - A section cannot be double-booked on the same day and period.
      - A faculty member cannot be double-booked on the same day and period.
      - Start time must precede end time.
      - Period number must be positive (>= 1).
      - Academic year is resolved through section.academic_year.
    """
    section = models.ForeignKey(
        'academics.Section',
        on_delete=models.CASCADE,
        related_name='timetable_slots',
        help_text="Class section for this scheduled slot.",
    )
    subject = models.ForeignKey(
        'academics.Subject',
        on_delete=models.PROTECT,
        related_name='timetable_slots',
        help_text="Subject taught during this slot.",
    )
    faculty = models.ForeignKey(
        'accounts.Faculty',
        on_delete=models.PROTECT,
        related_name='timetable_slots',
        help_text="Assigned faculty member for this slot.",
    )
    day_of_week = models.CharField(
        max_length=16,
        choices=DAY_CHOICES,
        help_text="Day of the week (e.g., 'Monday').",
    )
    period_number = models.PositiveSmallIntegerField(
        help_text="Period index for the day (1-indexed).",
    )
    start_time = models.TimeField(
        help_text="Scheduled period start time.",
    )
    end_time = models.TimeField(
        help_text="Scheduled period end time.",
    )
    room_number = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text="Classroom or hall location.",
    )

    class Meta:
        db_table = 'timetables'
        ordering = ['day_of_week', 'period_number', 'start_time']
        verbose_name = 'Timetable Slot'
        verbose_name_plural = 'Timetable Slots'
        constraints = [
            models.UniqueConstraint(
                fields=['section', 'day_of_week', 'period_number'],
                name='unique_section_day_period',
            ),
            models.UniqueConstraint(
                fields=['faculty', 'day_of_week', 'period_number'],
                name='unique_faculty_day_period',
            ),
            models.CheckConstraint(
                condition=models.Q(start_time__lt=models.F('end_time')),
                name='check_timetable_slot_time_order',
            ),
            models.CheckConstraint(
                condition=models.Q(period_number__gte=1),
                name='check_timetable_slot_period_number_positive',
            ),
        ]
        indexes = [
            models.Index(fields=['section', 'day_of_week'], name='idx_timetable_sec_day'),
            models.Index(fields=['faculty', 'day_of_week'], name='idx_timetable_fac_day'),
        ]

    def __str__(self) -> str:
        sec_name = str(self.section) if self.section_id else "Unknown"
        subj_code = self.subject.code if self.subject_id else "Unknown"
        return f"{sec_name} | {self.day_of_week} P{self.period_number} ({subj_code})"

    @property
    def academic_year(self):
        """Resolves academic year through section relationship."""
        if not self.section_id:
            return None
        return getattr(self.section, 'academic_year', None) or (
            self.section.school_class.academic_year if getattr(self.section, 'school_class', None) else None
        )

    @property
    def school_class(self):
        """Resolves school class through section relationship."""
        if not self.section_id:
            return None
        return getattr(self.section, 'school_class', None)

    def clean(self) -> None:
        """
        Validates domain integrity:
        1. start_time < end_time
        2. valid day_of_week
        3. period_number >= 1
        4. section double-booking detection
        5. faculty double-booking detection
        """
        super().clean()
        errors = {}

        if self.start_time and self.end_time and self.start_time >= self.end_time:
            errors['end_time'] = "Start time must strictly precede end time."

        if self.day_of_week:
            normalized_days = {d.lower(): d for d in DAYS_OF_WEEK}
            if self.day_of_week.lower() in normalized_days:
                self.day_of_week = normalized_days[self.day_of_week.lower()]
            else:
                errors['day_of_week'] = f"Invalid day of week '{self.day_of_week}'. Must be one of {DAYS_OF_WEEK}."

        if self.period_number is not None and self.period_number < 1:
            errors['period_number'] = "Period number must be positive (>= 1)."

        # Section double-booking check
        if self.section_id and self.day_of_week and self.period_number:
            conflict = TimetableSlot.objects.filter(
                section_id=self.section_id,
                day_of_week=self.day_of_week,
                period_number=self.period_number,
            ).exclude(pk=self.pk)
            if conflict.exists():
                errors['period_number'] = (
                    f"Section '{self.section}' already has a slot assigned for "
                    f"{self.day_of_week} period {self.period_number}."
                )

        # Faculty double-booking check
        if self.faculty_id and self.day_of_week and self.period_number:
            conflict = TimetableSlot.objects.filter(
                faculty_id=self.faculty_id,
                day_of_week=self.day_of_week,
                period_number=self.period_number,
            ).exclude(pk=self.pk)
            if conflict.exists():
                errors['faculty'] = (
                    f"Faculty member '{self.faculty}' is already assigned to another slot for "
                    f"{self.day_of_week} period {self.period_number}."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
