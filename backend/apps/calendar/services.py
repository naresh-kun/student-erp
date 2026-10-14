"""
Student ERP — Calendar Domain Service (Phase 6 Task 6.2)
Encapsulates academic calendar queries, target-role scoping, date-range filtering,
and transactional event management.
"""

import logging
from datetime import datetime, date, time
from typing import Any, Dict, List, Optional
from django.db import transaction
from django.db.models import QuerySet, Q
from django.core.exceptions import ValidationError
from django.utils.dateparse import parse_datetime, parse_date
from django.utils import timezone
from rest_framework import status

from common.services import BaseService
from common.authorization import AuthorizationService
from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
    ALL_ROLES,
    PERM_CALENDAR_VIEW,
    PERM_CALENDAR_CREATE,
    PERM_CALENDAR_PUBLISH,
)
from common.exceptions import (
    StudentERPException,
    DomainValidationError,
    PermissionDeniedError,
    ResourceNotFoundError,
)
from apps.calendar.models import (
    CalendarEvent,
    CALENDAR_CATEGORIES,
    normalize_category,
)

logger = logging.getLogger(__name__)


def parse_query_date(val: Any, is_end_of_day: bool = False) -> datetime:
    """
    Parses a date or datetime string into a timezone-aware datetime.
    Supports ISO formats: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SSZ'.
    Raises DomainValidationError on invalid or unparseable formats.
    """
    if isinstance(val, datetime):
        return val if timezone.is_aware(val) else timezone.make_aware(val)
    if isinstance(val, date):
        t = time.max if is_end_of_day else time.min
        return timezone.make_aware(datetime.combine(val, t))

    val_str = str(val).strip()
    # Try parsing full datetime first
    parsed_dt = parse_datetime(val_str)
    if parsed_dt is not None:
        return parsed_dt if timezone.is_aware(parsed_dt) else timezone.make_aware(parsed_dt)

    # Try parsing date only
    parsed_d = parse_date(val_str)
    if parsed_d is not None:
        t = time.max if is_end_of_day else time.min
        return timezone.make_aware(datetime.combine(parsed_d, t))

    raise DomainValidationError(
        f"Invalid date format '{val}'. Expected ISO format (e.g., 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SSZ').",
        status_code=status.HTTP_400_BAD_REQUEST,
    )


def parse_boolean_query_param(val: Any, param_name: str) -> bool:
    """Parses a boolean query parameter, raising DomainValidationError on invalid values."""
    if isinstance(val, bool):
        return val
    val_str = str(val).strip().lower()
    if val_str in ('true', '1', 'yes'):
        return True
    if val_str in ('false', '0', 'no'):
        return False
    raise DomainValidationError(
        f"Invalid boolean value for '{param_name}': '{val}'. Expected 'true' or 'false'.",
        status_code=status.HTTP_400_BAD_REQUEST,
    )


class CalendarService(BaseService):
    """
    Service layer for academic calendar events.
    Enforces role-based query scoping, multi-day interval date filtering,
    category normalization, and transactional event management.
    """
    service_name = "calendar"

    def get_service_status(self) -> dict:
        """Preserves backward compatibility for scaffolding test assertions."""
        return {"service": self.service_name, "status": "scaffolded"}

    def get_calendar_events_queryset(
        self,
        user: Any,
        filters: Optional[Dict[str, Any]] = None,
    ) -> QuerySet:
        """
        Retrieves calendar events scoped to caller role and applies query parameter filters.
        Multi-day date filtering semantics:
          An event matches the query range [start, end] if it overlaps the window:
          event.start_date <= query_end AND event.end_date >= query_start.
        """
        qs = CalendarEvent.objects.select_related('created_by')

        # 1. Authoritative RBAC & role visibility scoping
        qs = AuthorizationService.filter_queryset_for_user(qs, user, domain='calendar')

        if not filters:
            return qs

        # 2. Date range filtering & multi-day event inclusion
        raw_start = filters.get('start_date')
        raw_end = filters.get('end_date')

        parsed_start = parse_query_date(raw_start, is_end_of_day=False) if raw_start else None
        parsed_end = parse_query_date(raw_end, is_end_of_day=True) if raw_end else None

        if parsed_start and parsed_end:
            if parsed_start > parsed_end:
                raise DomainValidationError(
                    "start_date cannot be after end_date.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            # Interval overlap: event starts before/at query window end AND ends after/at query window start
            qs = qs.filter(start_date__lte=parsed_end, end_date__gte=parsed_start)
        elif parsed_start:
            # Event has not ended before the requested start date
            qs = qs.filter(end_date__gte=parsed_start)
        elif parsed_end:
            # Event has started on or before the requested end date
            qs = qs.filter(start_date__lte=parsed_end)

        # 3. Category filtering
        raw_category = filters.get('category')
        if raw_category:
            norm_cat = normalize_category(raw_category)
            if norm_cat not in CALENDAR_CATEGORIES:
                raise DomainValidationError(
                    f"Invalid category '{raw_category}'. Must be one of {list(CALENDAR_CATEGORIES)}.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(category=norm_cat)

        # 4. Holiday filter
        raw_holiday = filters.get('is_holiday')
        if raw_holiday is not None:
            is_hol = parse_boolean_query_param(raw_holiday, 'is_holiday')
            qs = qs.filter(is_holiday=is_hol)

        # 5. Published filter
        raw_published = filters.get('is_published')
        if raw_published is not None:
            is_pub = parse_boolean_query_param(raw_published, 'is_published')
            qs = qs.filter(is_published=is_pub)

        # 6. School-sanctioned / OD eligible filter
        raw_sanctioned = filters.get('is_school_sanctioned')
        if raw_sanctioned is not None:
            is_sanc = parse_boolean_query_param(raw_sanctioned, 'is_school_sanctioned')
            qs = qs.filter(is_school_sanctioned=is_sanc)

        # 7. Target role filter
        raw_target_role = filters.get('target_role')
        if raw_target_role:
            if raw_target_role not in ALL_ROLES:
                raise DomainValidationError(
                    f"Invalid target_role '{raw_target_role}'. Must be one of {list(ALL_ROLES)}.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(target_roles__contains=[raw_target_role])

        return qs

    @transaction.atomic
    def create_event(
        self,
        user: Any,
        validated_data: Dict[str, Any],
    ) -> CalendarEvent:
        """
        Creates a new CalendarEvent within a transactional boundary.
        Enforces that:
          - Caller has calendar.create permission.
          - Publishing (is_published=True) requires calendar.publish permission.
          - Non-publishing creators (Faculty) can only create drafts (is_published=False).
          - Full domain clean invariants are enforced.
        """
        if not AuthorizationService.has_permission(user, PERM_CALENDAR_CREATE):
            raise PermissionDeniedError("You do not have permission to create calendar events.")

        has_publish = AuthorizationService.has_permission(user, PERM_CALENDAR_PUBLISH)
        requested_published = validated_data.get('is_published')

        if requested_published is True and not has_publish:
            raise PermissionDeniedError(
                "You do not have permission to publish calendar events. Only draft events may be created."
            )

        # Default publishing state: True for Admin/Principal, False for Faculty
        if requested_published is None:
            validated_data['is_published'] = True if has_publish else False

        creator = user if getattr(user, 'is_authenticated', False) else None
        event = CalendarEvent(created_by=creator, **validated_data)
        event.full_clean()
        event.save()

        logger.info(
            "Calendar event created: '%s' (ID: %s, Category: %s, Published: %s) by %s",
            event.title,
            event.id,
            event.category,
            event.is_published,
            getattr(user, 'username', 'anonymous'),
        )
        return event

    @transaction.atomic
    def update_event(
        self,
        user: Any,
        event: CalendarEvent,
        validated_data: Dict[str, Any],
    ) -> CalendarEvent:
        """
        Updates an existing CalendarEvent within a transactional boundary.
        Enforces object-level update permissions and publishing authorization.
        """
        if not AuthorizationService.can_access_object(user, event, action='update'):
            raise PermissionDeniedError("You do not have permission to update this calendar event.")

        has_publish = AuthorizationService.has_permission(user, PERM_CALENDAR_PUBLISH)
        requested_published = validated_data.get('is_published')

        if requested_published is True and not has_publish and not event.is_published:
            raise PermissionDeniedError(
                "You do not have permission to publish calendar events."
            )

        for field, value in validated_data.items():
            setattr(event, field, value)

        event.full_clean()
        event.save()

        logger.info(
            "Calendar event updated: '%s' (ID: %s) by %s",
            event.title,
            event.id,
            getattr(user, 'username', 'anonymous'),
        )
        return event

    @transaction.atomic
    def delete_event(
        self,
        user: Any,
        event: CalendarEvent,
    ) -> None:
        """
        Deletes a CalendarEvent. Strictly restricted to Administrators.
        """
        role = AuthorizationService.get_user_role(user)
        if role != ROLE_ADMIN or not AuthorizationService.can_access_object(user, event, action='delete'):
            raise PermissionDeniedError("Only Administrators have permission to delete calendar events.")

        event_id = event.id
        title = event.title
        event.delete()

        logger.info(
            "Calendar event deleted: '%s' (ID: %s) by %s",
            title,
            event_id,
            getattr(user, 'username', 'anonymous'),
        )
