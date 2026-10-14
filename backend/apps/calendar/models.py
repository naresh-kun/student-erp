"""
Student ERP — Calendar Domain Models (Phase 6 Task 6.2)
Concrete model: CalendarEvent (mapped to db_table='calendar_events')
Strictly adheres to Section 3.5 of docs/DATABASE_SCHEMA.md.
"""

from typing import List, Optional
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from common.models import BaseModel
from common.constants import (
    ALL_ROLES,
    ROLE_CHOICES,
)

# Canonical Categories per Phase 6 specification and DATABASE_SCHEMA.md reconciliation
CALENDAR_CATEGORY_ACADEMIC = 'academic'
CALENDAR_CATEGORY_EXAM = 'exam'
CALENDAR_CATEGORY_HOLIDAY = 'holiday'
CALENDAR_CATEGORY_EVENT = 'event'
CALENDAR_CATEGORY_ADMINISTRATIVE = 'administrative'
CALENDAR_CATEGORY_MEETING = 'meeting'

CALENDAR_CATEGORIES = (
    CALENDAR_CATEGORY_ACADEMIC,
    CALENDAR_CATEGORY_EXAM,
    CALENDAR_CATEGORY_HOLIDAY,
    CALENDAR_CATEGORY_EVENT,
    CALENDAR_CATEGORY_ADMINISTRATIVE,
    CALENDAR_CATEGORY_MEETING,
)

CALENDAR_CATEGORY_CHOICES = tuple((cat, cat) for cat in CALENDAR_CATEGORIES)

# Aliases mapping (e.g. from frontend / legacy mock data)
CATEGORY_ALIASES = {
    'examination': CALENDAR_CATEGORY_EXAM,
    'exams': CALENDAR_CATEGORY_EXAM,
    'holidays': CALENDAR_CATEGORY_HOLIDAY,
    'events': CALENDAR_CATEGORY_EVENT,
    'general': CALENDAR_CATEGORY_EVENT,
    'sports': CALENDAR_CATEGORY_EVENT,
    'cultural': CALENDAR_CATEGORY_EVENT,
    'ptm': CALENDAR_CATEGORY_MEETING,
    'admin': CALENDAR_CATEGORY_ADMINISTRATIVE,
}


def normalize_category(cat: Optional[str]) -> str:
    """Normalizes category string to lowercase canonical enumeration."""
    if not cat:
        return ''
    cleaned = str(cat).strip().lower()
    return CATEGORY_ALIASES.get(cleaned, cleaned)


class CalendarEvent(BaseModel):
    """
    Academic calendar event, holiday, exam window, or school-wide activity.
    Authoritative schema: Section 3.5 of docs/DATABASE_SCHEMA.md (table 'calendar_events').

    Enforces that:
      - Title is non-empty.
      - Category belongs to canonical categories (academic, exam, holiday, event, administrative, meeting).
      - start_date <= end_date.
      - target_roles is a list of valid canonical ERP roles (empty list means public to all authenticated roles).
      - is_holiday is True whenever category == 'holiday'.
      - is_published controls publication state (draft vs published).
      - is_school_sanctioned flags events qualifying for On-Duty (OD) attendance credit reference.
    """
    title = models.CharField(
        max_length=200,
        help_text="Title or headline of the academic event.",
    )
    category = models.CharField(
        max_length=64,
        choices=CALENDAR_CATEGORY_CHOICES,
        db_index=True,
        help_text="Event classification (academic, exam, holiday, event, administrative, meeting).",
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text="Detailed description of the event, guidelines, or instructions.",
    )
    start_date = models.DateTimeField(
        help_text="Scheduled start date and time of the event.",
    )
    end_date = models.DateTimeField(
        help_text="Scheduled end date and time of the event.",
    )
    target_roles = models.JSONField(
        default=list,
        blank=True,
        help_text="List of target user roles (empty list signifies public/global visibility).",
    )
    location = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Physical venue, classroom, hall, or virtual meeting location.",
    )
    is_holiday = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Flag indicating whether institutional sessions and classes are suspended.",
    )
    is_published = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Publication state of event (drafts visible only to creators and administrators).",
    )
    is_school_sanctioned = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Designates school-sanctioned events qualifying as references for On-Duty (OD) attendance.",
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_calendar_events',
        help_text="User who authored the calendar event.",
    )

    class Meta:
        db_table = 'calendar_events'
        ordering = ['start_date', 'title']
        verbose_name = 'Calendar Event'
        verbose_name_plural = 'Calendar Events'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(start_date__lte=models.F('end_date')),
                name='check_calendar_event_date_order',
            ),
        ]
        indexes = [
            models.Index(fields=['start_date', 'end_date'], name='idx_cal_event_dates'),
            models.Index(fields=['category'], name='idx_cal_event_category'),
            models.Index(fields=['is_holiday'], name='idx_cal_event_is_holiday'),
            models.Index(fields=['is_published'], name='idx_cal_event_is_published'),
        ]

    def __str__(self) -> str:
        date_str = self.start_date.strftime('%Y-%m-%d') if self.start_date else 'No Date'
        return f"{self.title} ({self.category}, {date_str})"

    @property
    def od_eligible(self) -> bool:
        """Alias for is_school_sanctioned for frontend compatibility."""
        return self.is_school_sanctioned

    @od_eligible.setter
    def od_eligible(self, value: bool) -> None:
        self.is_school_sanctioned = bool(value)

    @property
    def is_public(self) -> bool:
        """True if the event has no role targeting (globally visible)."""
        return not bool(self.target_roles)

    def clean_fields(self, exclude=None):
        """Normalizes category before Django validates field choices."""
        if self.category and (exclude is None or 'category' not in exclude):
            self.category = normalize_category(self.category)
        super().clean_fields(exclude=exclude)

    def clean(self) -> None:
        """
        Validates model domain invariants:
        1. Title is required and non-empty.
        2. Category is valid and normalized.
        3. start_date <= end_date.
        4. target_roles is a valid list of canonical role names.
        5. is_holiday is synchronized when category is 'holiday'.
        """
        super().clean()
        errors = {}

        # 1. Title validation
        if not self.title or not self.title.strip():
            errors['title'] = "Title is required and cannot be empty."

        # 2. Category normalization & validation
        if self.category:
            norm_cat = normalize_category(self.category)
            if norm_cat not in CALENDAR_CATEGORIES:
                errors['category'] = (
                    f"Invalid category '{self.category}'. Must be one of {list(CALENDAR_CATEGORIES)}."
                )
            else:
                self.category = norm_cat
                if self.category == CALENDAR_CATEGORY_HOLIDAY:
                    self.is_holiday = True
        else:
            errors['category'] = "Category is required."

        # 3. Date ordering validation
        if self.start_date and self.end_date and self.start_date > self.end_date:
            errors['end_date'] = "End date must not precede start date."

        # 4. Target roles validation
        if self.target_roles is not None:
            if not isinstance(self.target_roles, list):
                errors['target_roles'] = "Target roles must be a list of canonical role names."
            else:
                invalid_roles = [r for r in self.target_roles if r not in ALL_ROLES]
                if invalid_roles:
                    errors['target_roles'] = (
                        f"Invalid target roles: {invalid_roles}. Must be one of {list(ALL_ROLES)}."
                    )
                # Deduplicate while preserving order
                seen = set()
                deduped = []
                for r in self.target_roles:
                    if r not in seen and r in ALL_ROLES:
                        seen.add(r)
                        deduped.append(r)
                self.target_roles = deduped

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
