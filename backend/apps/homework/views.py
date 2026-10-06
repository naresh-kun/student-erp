"""
Student ERP — Homework DRF Views (MOD_001)
REST endpoints for listing, creating, retrieving, updating, and deleting Homework.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from common.constants import (
    PERM_HOMEWORK_VIEW,
    PERM_HOMEWORK_CREATE,
    PERM_HOMEWORK_UPDATE,
    PERM_HOMEWORK_DELETE,
)
from common.permissions import HasRequiredPermission
from common.authorization import AuthorizationService
from common.responses import success_response
from common.pagination import StandardResultsSetPagination

from apps.homework.models import Homework
from apps.homework.serializers import (
    HomeworkListSerializer,
    HomeworkDetailSerializer,
    HomeworkWriteSerializer,
)
from apps.homework.services import HomeworkService


class HomeworkListView(APIView):
    """
    GET  /api/v1/homework/  — Lists scoped homework records.
    POST /api/v1/homework/  — Creates a new homework assignment (Faculty/Admin only).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_HOMEWORK_VIEW,
        'POST': PERM_HOMEWORK_CREATE,
    }
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = HomeworkService()
        filters = {
            'section_id': request.query_params.get('section_id'),
            'class_id': request.query_params.get('class_id'),
            'subject_id': request.query_params.get('subject_id'),
            'status': request.query_params.get('status'),
            'due_date_from': request.query_params.get('due_date_from'),
            'due_date_to': request.query_params.get('due_date_to'),
            'search': request.query_params.get('search'),
        }
        qs = service.get_homework_queryset(request.user, filters=filters)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = HomeworkListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = HomeworkListSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = HomeworkWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = HomeworkService()
        homework = service.create_homework(
            creator_user=request.user,
            validated_data=serializer.validated_data,
        )

        return success_response(
            data=HomeworkDetailSerializer(homework).data,
            status_code=status.HTTP_201_CREATED,
        )


class HomeworkDetailView(APIView):
    """
    GET    /api/v1/homework/<id>/ — Retrieves full homework details.
    PATCH  /api/v1/homework/<id>/ — Updates homework (author or Admin).
    DELETE /api/v1/homework/<id>/ — Deletes homework (author or Admin).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_HOMEWORK_VIEW,
        'PATCH': PERM_HOMEWORK_UPDATE,
        'PUT': PERM_HOMEWORK_UPDATE,
        'DELETE': PERM_HOMEWORK_DELETE,
    }

    def get(self, request, pk, *args, **kwargs):
        homework = get_object_or_404(
            Homework.objects.select_related(
                'faculty__user',
                'school_class',
                'section',
                'subject',
                'academic_year',
            ),
            pk=pk,
        )
        if not AuthorizationService.can_access_object(request.user, homework, action='view'):
            raise PermissionDenied("You do not have permission to view this homework.")

        serializer = HomeworkDetailSerializer(homework)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        homework = get_object_or_404(Homework, pk=pk)
        if not AuthorizationService.can_access_object(request.user, homework, action='update'):
            raise PermissionDenied("You do not have permission to update this homework.")

        service = HomeworkService()
        updated = service.update_homework(
            user=request.user,
            homework=homework,
            validated_data=request.data,
        )
        return success_response(data=HomeworkDetailSerializer(updated).data)

    def delete(self, request, pk, *args, **kwargs):
        homework = get_object_or_404(Homework, pk=pk)
        if not AuthorizationService.can_access_object(request.user, homework, action='delete'):
            raise PermissionDenied("You do not have permission to delete this homework.")

        service = HomeworkService()
        service.delete_homework(user=request.user, homework=homework)
        return Response(status=status.HTTP_204_NO_CONTENT)


class HomeworkTeachingScopeView(APIView):
    """
    GET /api/v1/homework/scope/
    Returns authorized teaching scope (classes, sections, subjects) for the authenticated user.
    Used by Faculty homework creation form to restrict selection strictly to authorized teaching assignments.
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_HOMEWORK_VIEW,
    }

    def get(self, request, *args, **kwargs):
        from apps.academics.models import TeachingAssignment
        from common.constants import ROLE_FACULTY, ROLE_ADMIN, ROLE_PRINCIPAL

        role = AuthorizationService.get_user_role(request.user)
        if role == ROLE_FACULTY:
            faculty = getattr(request.user, 'faculty_profile', None)
            if not faculty:
                return success_response(data=[])
            assignments = TeachingAssignment.objects.filter(
                faculty=faculty,
                is_active=True,
            ).select_related('school_class', 'section', 'subject', 'academic_year')
        elif role in (ROLE_ADMIN, ROLE_PRINCIPAL):
            assignments = TeachingAssignment.objects.filter(
                is_active=True,
            ).select_related('school_class', 'section', 'subject', 'academic_year')
        else:
            return success_response(data=[])

        data = [
            {
                'assignment_id': str(a.id),
                'class_id': str(a.school_class_id),
                'class_name': a.school_class.name,
                'section_id': str(a.section_id),
                'section_name': a.section.name,
                'subject_id': str(a.subject_id),
                'subject_name': a.subject.name,
                'subject_code': a.subject.code,
                'academic_year_id': str(a.academic_year_id),
                'academic_year_name': a.academic_year.name,
            }
            for a in assignments
        ]
        return success_response(data=data)

