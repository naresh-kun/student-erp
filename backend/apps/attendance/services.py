"""
Student ERP — Attendance Domain Service
Encapsulates attendance tracking, bulk recording, absentees queries, and percentage calculation.
Strictly adheres to Master Plan Amendment 2 (4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE).
"""

from typing import Optional, List, Dict, Any
from django.db.models import QuerySet, Q, Count
from common.services import BaseService
from common.utils import calculate_attendance_percentage, validate_attendance_status
from common.constants import (
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_LEAVE,
)
from apps.attendance.models import Attendance, LeaveApplication
from apps.academics.models import Enrollment
from apps.students.models import Student
from apps.accounts.models import Faculty, User


class AttendanceService(BaseService):
    """
    Domain service for attendance operations.
    """
    service_name = "attendance"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}

    def get_attendance_queryset(
        self,
        student_id: Optional[str] = None,
        class_id: Optional[str] = None,
        section_id: Optional[str] = None,
        date: Optional[str] = None,
        month: Optional[str] = None,
        status: Optional[str] = None,
    ) -> QuerySet[Attendance]:
        """
        Returns optimized queryset of attendance records with FK relations selected.
        """
        qs = Attendance.objects.select_related(
            'enrollment',
            'enrollment__student',
            'enrollment__student__user',
            'enrollment__section',
            'enrollment__section__school_class',
            'recorded_by',
            'approved_by_faculty',
            'approved_by_faculty__user',
        ).all()

        if student_id:
            student_id = student_id.strip()
            qs = qs.filter(
                Q(enrollment__student__student_id=student_id)
                | Q(enrollment__student_id=student_id)
            )

        if class_id:
            qs = qs.filter(enrollment__section__school_class_id=class_id)

        if section_id:
            qs = qs.filter(enrollment__section_id=section_id)

        if date:
            qs = qs.filter(date=date)

        if month:
            # month format: YYYY-MM
            parts = month.strip().split('-')
            if len(parts) == 2:
                year, m = int(parts[0]), int(parts[1])
                qs = qs.filter(date__year=year, date__month=m)

        if status:
            qs = qs.filter(status=status.strip())

        return qs

    def calculate_attendance_summary(self, queryset: QuerySet[Attendance]) -> Dict[str, Any]:
        """
        Calculates 4-status distribution and canonical attendance percentage:
        Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
        """
        counts = queryset.values('status').annotate(count=Count('id'))
        count_map = {item['status']: item['count'] for item in counts}

        present_count = count_map.get(ATTENDANCE_STATUS_PRESENT, 0)
        absent_count = count_map.get(ATTENDANCE_STATUS_ABSENT, 0)
        on_duty_count = count_map.get(ATTENDANCE_STATUS_ON_DUTY, 0)
        leave_count = count_map.get(ATTENDANCE_STATUS_LEAVE, 0)
        total_sessions = present_count + absent_count + on_duty_count + leave_count

        percentage = calculate_attendance_percentage(
            present=present_count,
            absent=absent_count,
            on_duty=on_duty_count,
            leave=leave_count,
        )

        return {
            'total_sessions': total_sessions,
            'present_count': present_count,
            'absent_count': absent_count,
            'on_duty_count': on_duty_count,
            'leave_count': leave_count,
            'attendance_percentage': percentage,
        }

    def record_bulk_attendance(
        self,
        date,
        records: List[Dict[str, Any]],
        recorded_by: User,
        default_session_period: Optional[int] = None,
    ) -> List[Attendance]:
        """
        Persists a batch of attendance records within an atomic transaction.
        Validates statuses and resolves enrollments.
        """
        saved_records = []
        with self.atomic():
            for item in records:
                status_val = validate_attendance_status(item['status'])
                session_period = item.get('session_period', default_session_period)
                remarks = item.get('remarks', '')

                # Resolve enrollment
                enrollment = None
                if item.get('enrollment_id'):
                    enrollment = Enrollment.objects.get(pk=item['enrollment_id'])
                elif item.get('student_id'):
                    student_id = item['student_id'].strip()
                    # Find active enrollment for student
                    student = Student.objects.get(
                        Q(student_id=student_id) | Q(id=student_id)
                    )
                    enrollment = Enrollment.objects.filter(student=student).first()
                    if not enrollment:
                        self.raise_business_error(f"No active enrollment found for student {student_id}")

                approved_faculty = None
                if item.get('approved_by_faculty_id'):
                    approved_faculty = Faculty.objects.get(pk=item['approved_by_faculty_id'])

                att_record, _ = Attendance.objects.update_or_create(
                    enrollment=enrollment,
                    date=date,
                    session_period=session_period,
                    defaults={
                        'status': status_val,
                        'remarks': remarks,
                        'recorded_by': recorded_by,
                        'approved_by_faculty': approved_faculty,
                    },
                )
                saved_records.append(att_record)

        return saved_records
