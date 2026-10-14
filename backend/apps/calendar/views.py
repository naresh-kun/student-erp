"""
Student ERP — Calendar DRF Views (Phase 6 Task 6.2)
REST endpoints for listing, creating, retrieving, updating, and deleting Calendar events.
"""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from common.constants import (
    PERM_CALENDAR_VIEW,
    PERM_CALENDAR_CREATE,
    PERM_CALENDAR_PUBLISH,
)
from common.permissions import HasRequiredPermission
from common.authorization import AuthorizationService
from common.responses import success_response
from common.pagination import StandardResultsSetPagination

from apps.calendar.models import CalendarEvent
from apps.calendar.serializers import (
    CalendarEventSerializer,
    CalendarEventWriteSerializer,
)
from apps.calendar.services import CalendarService

logger = logging.getLogger(__name__)


class CalendarEventListView(APIView):
    """
    GET  /api/v1/calendar/events/ — Lists institutional events and holidays scoped to caller role.
    POST /api/v1/calendar/events/ — Creates a new academic event or holiday (Admin/Principal/Faculty).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_CALENDAR_VIEW,
        'POST': PERM_CALENDAR_CREATE,
    }
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = CalendarService()
        filters = {
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'category': request.query_params.get('category'),
            'is_holiday': request.query_params.get('is_holiday'),
            'target_role': request.query_params.get('target_role'),
            'is_school_sanctioned': request.query_params.get('is_school_sanctioned') or request.query_params.get('od_eligible'),
            'is_published': request.query_params.get('is_published'),
        }
        qs = service.get_calendar_events_queryset(request.user, filters=filters)

        # Pagination support if page parameter supplied
        if request.query_params.get('page') is not None:
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(qs, request, view=self)
            if page is not None:
                serializer = CalendarEventSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

        serializer = CalendarEventSerializer(qs, many=True)
        return success_response(
            data=serializer.data,
            meta={
                'total_records': qs.count(),
                'filters_applied': {k: v for k, v in filters.items() if v is not None},
            }
        )

    def post(self, request, *args, **kwargs):
        serializer = CalendarEventWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = CalendarService()
        event = service.create_event(
            user=request.user,
            validated_data=serializer.validated_data,
        )

        return success_response(
            data=CalendarEventSerializer(event).data,
            status_code=status.HTTP_201_CREATED,
        )


class CalendarEventDetailView(APIView):
    """
    GET    /api/v1/calendar/events/<id>/ — Retrieves full details of a calendar event.
    PATCH  /api/v1/calendar/events/<id>/ — Updates a calendar event (Admin/Principal/Creator).
    DELETE /api/v1/calendar/events/<id>/ — Deletes a calendar event (Admin only).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_CALENDAR_VIEW,
        'PATCH': PERM_CALENDAR_CREATE,
        'PUT': PERM_CALENDAR_CREATE,
        'DELETE': PERM_CALENDAR_CREATE,
    }

    def get(self, request, pk, *args, **kwargs):
        event = get_object_or_404(
            CalendarEvent.objects.select_related('created_by'),
            pk=pk,
        )
        if not AuthorizationService.can_access_object(request.user, event, action='view'):
            raise PermissionDenied("You do not have permission to view this calendar event.")

        serializer = CalendarEventSerializer(event)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        event = get_object_or_404(CalendarEvent, pk=pk)
        if not AuthorizationService.can_access_object(request.user, event, action='update'):
            raise PermissionDenied("You do not have permission to update this calendar event.")

        serializer = CalendarEventWriteSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        service = CalendarService()
        updated = service.update_event(
            user=request.user,
            event=event,
            validated_data=serializer.validated_data,
        )
        return success_response(data=CalendarEventSerializer(updated).data)

    def delete(self, request, pk, *args, **kwargs):
        event = get_object_or_404(CalendarEvent, pk=pk)
        if not AuthorizationService.can_access_object(request.user, event, action='delete'):
            raise PermissionDenied("Only Administrators have permission to delete calendar events.")

        service = CalendarService()
        service.delete_event(user=request.user, event=event)
        return Response(status=status.HTTP_204_NO_CONTENT)
