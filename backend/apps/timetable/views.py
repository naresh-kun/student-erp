"""
Student ERP — Timetable DRF Views (Phase 6 Task 6.1)
REST endpoints for listing, creating, retrieving, updating, and deleting Timetable slots.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from common.constants import (
    PERM_TIMETABLE_VIEW,
    PERM_TIMETABLE_MANAGE,
)
from common.permissions import HasRequiredPermission
from common.authorization import AuthorizationService
from common.responses import success_response
from common.pagination import StandardResultsSetPagination

from apps.timetable.models import TimetableSlot
from apps.timetable.serializers import (
    TimetableSlotSerializer,
    TimetableSlotDetailSerializer,
    TimetableSlotWriteSerializer,
)
from apps.timetable.services import TimetableService


class TimetableListView(APIView):
    """
    GET  /api/v1/timetable/ — Lists scoped timetable records.
    POST /api/v1/timetable/ — Creates a new timetable slot (Admin only).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_TIMETABLE_VIEW,
        'POST': PERM_TIMETABLE_MANAGE,
    }
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = TimetableService()
        filters = {
            'section_id': request.query_params.get('section_id'),
            'day_of_week': request.query_params.get('day_of_week'),
            'faculty_id': request.query_params.get('faculty_id'),
            'subject_id': request.query_params.get('subject_id'),
            'academic_year_id': request.query_params.get('academic_year_id'),
        }
        qs = service.get_timetable_queryset(request.user, filters=filters)

        # Paginate if page query parameter is provided
        if request.query_params.get('page') is not None:
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(qs, request, view=self)
            if page is not None:
                serializer = TimetableSlotSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

        serializer = TimetableSlotSerializer(qs, many=True)
        return success_response(
            data=serializer.data,
            meta={
                'total_records': qs.count(),
                'filters_applied': {k: v for k, v in filters.items() if v is not None},
            }
        )

    def post(self, request, *args, **kwargs):
        serializer = TimetableSlotWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = TimetableService()
        slot = service.create_slot(
            user=request.user,
            validated_data=serializer.validated_data,
        )

        return success_response(
            data=TimetableSlotDetailSerializer(slot).data,
            status_code=status.HTTP_201_CREATED,
        )


class TimetableDetailView(APIView):
    """
    GET    /api/v1/timetable/<id>/ — Retrieves full details of a timetable slot.
    PATCH  /api/v1/timetable/<id>/ — Updates a timetable slot (Admin only).
    DELETE /api/v1/timetable/<id>/ — Deletes a timetable slot (Admin only).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_TIMETABLE_VIEW,
        'PATCH': PERM_TIMETABLE_MANAGE,
        'PUT': PERM_TIMETABLE_MANAGE,
        'DELETE': PERM_TIMETABLE_MANAGE,
    }

    def get(self, request, pk, *args, **kwargs):
        slot = get_object_or_404(
            TimetableSlot.objects.select_related(
                'section__school_class__academic_year',
                'section__academic_year',
                'subject',
                'faculty__user',
            ),
            pk=pk,
        )
        if not AuthorizationService.can_access_object(request.user, slot, action='view'):
            raise PermissionDenied("You do not have permission to view this timetable slot.")

        serializer = TimetableSlotDetailSerializer(slot)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        slot = get_object_or_404(TimetableSlot, pk=pk)
        if not AuthorizationService.can_access_object(request.user, slot, action='update'):
            raise PermissionDenied("You do not have permission to update timetable slots.")

        serializer = TimetableSlotWriteSerializer(slot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        service = TimetableService()
        updated = service.update_slot(
            user=request.user,
            slot=slot,
            validated_data=serializer.validated_data,
        )
        return success_response(data=TimetableSlotDetailSerializer(updated).data)

    def delete(self, request, pk, *args, **kwargs):
        slot = get_object_or_404(TimetableSlot, pk=pk)
        if not AuthorizationService.can_access_object(request.user, slot, action='delete'):
            raise PermissionDenied("You do not have permission to delete timetable slots.")

        service = TimetableService()
        service.delete_slot(user=request.user, slot=slot)
        return Response(status=status.HTTP_204_NO_CONTENT)
