"""
Student ERP — Attendance Domain Models
Contains concrete models for Student Attendance and Leave Applications.
Strictly adheres to Master Plan Amendment 2 (4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE).
"""

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from common.constants import (
    ATTENDANCE_STATUSES,
    ATTENDANCE_STATUS_LEAVE,
)
from common.models import UUIDModel, TimeStampedModel
from common.utils import validate_attendance_status


class LeaveApplication(UUIDModel, TimeStampedModel):
    """
    Persists student leave requests and institutional sanctioning state.
    Leaves are created in PENDING status and can only be approved/rejected by Faculty authority.
    """
    LEAVE_TYPE_CHOICES = [
        ('Medical', 'Medical Leave'),
        ('Casual', 'Casual Leave'),
        ('Duty', 'Duty Leave'),
        ('Other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='leave_applications',
    )
    leave_type = models.CharField(
        max_length=32,
        choices=LEAVE_TYPE_CHOICES,
        default='Casual',
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default='PENDING',
    )
    applied_on = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        'accounts.Faculty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_leave_applications',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_remarks = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'attendance_leave_applications'
        ordering = ['-applied_on']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date cannot be prior to start date.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Leave ({self.student.student_id}): {self.start_date} to {self.end_date} [{self.status}]"


class Attendance(UUIDModel, TimeStampedModel):
    """
    Persists student daily/session attendance records.
    Canonical 4 statuses strictly enforced: PRESENT, ABSENT, ON_DUTY, LEAVE.
    Legacy statuses (LATE, EXCUSED) are strictly rejected.
    """
    STATUS_CHOICES = [(s, s) for s in ATTENDANCE_STATUSES]

    enrollment = models.ForeignKey(
        'academics.Enrollment',
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    date = models.DateField()
    session_period = models.PositiveSmallIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
    )
    remarks = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='recorded_attendances',
    )
    approved_by_faculty = models.ForeignKey(
        'accounts.Faculty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_leave_attendances',
    )

    class Meta:
        db_table = 'attendance_records'
        ordering = ['-date', 'session_period']
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'date', 'session_period'],
                name='unique_attendance_per_session',
                nulls_distinct=False,
            ),
            models.CheckConstraint(
                condition=models.Q(status__in=list(ATTENDANCE_STATUSES)),
                name='check_valid_attendance_status',
            ),
        ]
        indexes = [
            models.Index(fields=['enrollment', 'date']),
            models.Index(fields=['date', 'status']),
        ]

    def clean(self):
        super().clean()
        if self.status:
            try:
                self.status = validate_attendance_status(self.status)
            except Exception as exc:
                raise ValidationError({'status': str(exc)})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        period_str = f" Period {self.session_period}" if self.session_period else ""
        return f"Attendance ({self.enrollment.student.student_id}): {self.date}{period_str} - {self.status}"
