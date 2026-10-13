"""
Student ERP — Timetable Domain Service (Phase 6 Task 6.1)
Encapsulates weekly schedule queries, conflict detection, and transactional slot management.
"""

import logging
from typing import Any, Dict, Optional
from django.db import transaction, IntegrityError
from django.db.models import QuerySet, Q
from django.core.exceptions import ValidationError
from rest_framework import status

from common.services import BaseService
from common.authorization import AuthorizationService
from common.constants import (
    PERM_TIMETABLE_VIEW,
    PERM_TIMETABLE_MANAGE,
)
from common.exceptions import (
    StudentERPException,
    DomainValidationError,
    PermissionDeniedError,
    ResourceNotFoundError,
)
from apps.timetable.models import TimetableSlot

logger = logging.getLogger(__name__)


class TimetableConflictError(StudentERPException):
    """
    Raised when a proposed timetable slot conflicts with existing assignments
    (e.g., section double-booking or faculty double-booking). Returns HTTP 409 Conflict.
    """
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Scheduling conflict detected for timetable slot."
    default_code = "CONFLICT"


class TimetableService(BaseService):
    """
    Service layer for the timetable domain.
    Enforces role-based query scoping, double-booking detection, and atomic mutations.
    """
    service_name = "timetable"

    def get_service_status(self) -> dict:
        """Preserves backward compatibility for scaffolding test assertions."""
        return {"service": self.service_name, "status": "scaffolded"}

    def get_timetable_queryset(
        self,
        user: Any,
        filters: Optional[Dict[str, Any]] = None,
    ) -> QuerySet:
        """
        Retrieves timetable slots scoped to the user's role and applies optional query filters.
        """
        qs = TimetableSlot.objects.select_related(
            'section__school_class__academic_year',
            'section__academic_year',
            'subject',
            'faculty__user',
        )

        # Scoping per user role
        qs = AuthorizationService.filter_queryset_for_user(qs, user, domain='timetable')

        if not filters:
            return qs

        section_id = filters.get('section_id')
        if section_id:
            qs = qs.filter(section_id=section_id)

        day_of_week = filters.get('day_of_week')
        if day_of_week:
            qs = qs.filter(day_of_week__iexact=day_of_week)

        faculty_id = filters.get('faculty_id')
        if faculty_id:
            qs = qs.filter(faculty_id=faculty_id)

        subject_id = filters.get('subject_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        academic_year_id = filters.get('academic_year_id')
        if academic_year_id:
            qs = qs.filter(
                Q(section__academic_year_id=academic_year_id)
                | Q(section__school_class__academic_year_id=academic_year_id)
            )

        return qs

    def check_conflicts(
        self,
        section_id: Any,
        faculty_id: Any,
        day_of_week: str,
        period_number: int,
        exclude_id: Optional[Any] = None,
    ) -> None:
        """
        Validates whether creating or moving a slot to (day_of_week, period_number)
        conflicts with an existing slot for the same section or same faculty.
        Raises TimetableConflictError (HTTP 409) if a conflict is detected.
        """
        # 1. Section conflict (same section cannot have two classes at the same period)
        sec_conflict = TimetableSlot.objects.filter(
            section_id=section_id,
            day_of_week__iexact=day_of_week,
            period_number=period_number,
        )
        if exclude_id:
            sec_conflict = sec_conflict.exclude(pk=exclude_id)

        if sec_conflict.exists():
            existing = sec_conflict.select_related('section', 'subject', 'faculty').first()
            raise TimetableConflictError(
                message=(
                    f"Scheduling conflict: Section '{existing.section}' already has a slot assigned for "
                    f"{existing.day_of_week} period {existing.period_number} "
                    f"(Subject: {existing.subject.code}, Faculty: {existing.faculty})."
                ),
                code='SECTION_SCHEDULE_CONFLICT',
                details=[{
                    'conflict_type': 'SECTION_DOUBLE_BOOKING',
                    'section_id': str(section_id),
                    'day_of_week': existing.day_of_week,
                    'period_number': existing.period_number,
                    'existing_slot_id': str(existing.id),
                }]
            )

        # 2. Faculty conflict (same faculty cannot teach two sections at the same period)
        fac_conflict = TimetableSlot.objects.filter(
            faculty_id=faculty_id,
            day_of_week__iexact=day_of_week,
            period_number=period_number,
        )
        if exclude_id:
            fac_conflict = fac_conflict.exclude(pk=exclude_id)

        if fac_conflict.exists():
            existing = fac_conflict.select_related('section', 'subject', 'faculty').first()
            raise TimetableConflictError(
                message=(
                    f"Scheduling conflict: Faculty member '{existing.faculty}' is already assigned to section '{existing.section}' "
                    f"for {existing.day_of_week} period {existing.period_number}."
                ),
                code='FACULTY_SCHEDULE_CONFLICT',
                details=[{
                    'conflict_type': 'FACULTY_DOUBLE_BOOKING',
                    'faculty_id': str(faculty_id),
                    'day_of_week': existing.day_of_week,
                    'period_number': existing.period_number,
                    'existing_slot_id': str(existing.id),
                }]
            )

    def create_slot(self, user: Any, validated_data: Dict[str, Any]) -> TimetableSlot:
        """
        Creates a new TimetableSlot atomically after verifying authorization and scheduling conflicts.
        """
        if not AuthorizationService.has_permission(user, PERM_TIMETABLE_MANAGE):
            raise PermissionDeniedError("Only authorized administrators can create timetable slots.")

        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise DomainValidationError("Start time must strictly precede end time.")

        section = validated_data['section']
        faculty = validated_data['faculty']
        day_of_week = validated_data['day_of_week']
        period_number = validated_data['period_number']

        self.check_conflicts(
            section_id=section.id,
            faculty_id=faculty.id,
            day_of_week=day_of_week,
            period_number=period_number,
        )

        try:
            with transaction.atomic():
                slot = TimetableSlot(**validated_data)
                slot.full_clean()
                slot.save()
                return slot
        except IntegrityError as exc:
            logger.warning("Database unique constraint violation on timetable slot creation: %s", exc)
            raise TimetableConflictError(
                message="A timetable slot already exists for this section or faculty at the scheduled time.",
                code='SCHEDULE_INTEGRITY_CONFLICT',
            )
        except ValidationError as exc:
            msg = exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            raise DomainValidationError(
                message=str(msg),
                details=[exc.message_dict] if hasattr(exc, 'message_dict') else [str(exc)],
            )

    def update_slot(
        self,
        user: Any,
        slot: TimetableSlot,
        validated_data: Dict[str, Any],
    ) -> TimetableSlot:
        """
        Updates an existing TimetableSlot atomically after verifying authorization and scheduling conflicts.
        """
        if not AuthorizationService.has_permission(user, PERM_TIMETABLE_MANAGE):
            raise PermissionDeniedError("Only authorized administrators can update timetable slots.")

        section = validated_data.get('section', slot.section)
        faculty = validated_data.get('faculty', slot.faculty)
        day_of_week = validated_data.get('day_of_week', slot.day_of_week)
        period_number = validated_data.get('period_number', slot.period_number)
        start_time = validated_data.get('start_time', slot.start_time)
        end_time = validated_data.get('end_time', slot.end_time)

        if start_time and end_time and start_time >= end_time:
            raise DomainValidationError("Start time must strictly precede end time.")

        self.check_conflicts(
            section_id=section.id,
            faculty_id=faculty.id,
            day_of_week=day_of_week,
            period_number=period_number,
            exclude_id=slot.id,
        )

        try:
            with transaction.atomic():
                for attr, val in validated_data.items():
                    setattr(slot, attr, val)
                slot.full_clean()
                slot.save()
                return slot
        except IntegrityError as exc:
            logger.warning("Database unique constraint violation on timetable slot update: %s", exc)
            raise TimetableConflictError(
                message="A timetable slot already exists for this section or faculty at the scheduled time.",
                code='SCHEDULE_INTEGRITY_CONFLICT',
            )
        except ValidationError as exc:
            msg = exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            raise DomainValidationError(
                message=str(msg),
                details=[exc.message_dict] if hasattr(exc, 'message_dict') else [str(exc)],
            )

    def delete_slot(self, user: Any, slot: TimetableSlot) -> None:
        """
        Deletes a TimetableSlot after verifying authorization.
        """
        if not AuthorizationService.has_permission(user, PERM_TIMETABLE_MANAGE):
            raise PermissionDeniedError("Only authorized administrators can delete timetable slots.")

        with transaction.atomic():
            slot.delete()
