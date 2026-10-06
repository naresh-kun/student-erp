"""
Student ERP — Academics DRF Views
Provides directory endpoints for classes, sections, subjects, and academic years.
"""

from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404

from common.constants import PERM_ACADEMICS_VIEW, PERM_ACADEMICS_MANAGE
from common.permissions import HasRequiredPermission, require_permission
from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.academics.models import SchoolClass, Section, Subject, AcademicYear
from apps.academics.services import AcademicService
from apps.academics.serializers import (
    SchoolClassSerializer,
    SectionSerializer,
    SubjectSerializer,
    AcademicYearSerializer,
    EnrollmentSerializer,
)


class ClassListView(APIView):
    """
    GET /api/v1/classes/
    POST /api/v1/classes/
    Lists school classes and associated sections, or creates a new class definition.
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_ACADEMICS_VIEW,
        'POST': PERM_ACADEMICS_MANAGE,
    }
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AcademicService()
        academic_year = request.query_params.get('academic_year')
        search = request.query_params.get('search')
        qs = service.get_classes_queryset(academic_year=academic_year, search=search)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = SchoolClassSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = SchoolClassSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = SchoolClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        school_class = serializer.save()
        return success_response(
            data=SchoolClassSerializer(school_class).data,
            status_code=status.HTTP_201_CREATED,
        )


class ClassDetailView(APIView):
    """
    GET /api/v1/classes/{id}/
    Returns details of a specific class.
    """
    permission_classes = [require_permission(PERM_ACADEMICS_VIEW)]

    def get(self, request, pk, *args, **kwargs):
        school_class = get_object_or_404(
            SchoolClass.objects.select_related('academic_year').prefetch_related(
                'sections__class_teacher__user',
                'sections__enrollments',
            ),
            pk=pk,
        )
        serializer = SchoolClassSerializer(school_class)
        return success_response(data=serializer.data)


class ClassSectionsView(APIView):
    """
    GET /api/v1/classes/{id}/sections/
    Lists sections, room numbers, capacities, and assigned class teachers for a class.
    """
    permission_classes = [require_permission(PERM_ACADEMICS_VIEW)]

    def get(self, request, pk, *args, **kwargs):
        service = AcademicService()
        # Verify class exists
        get_object_or_404(SchoolClass, pk=pk)
        qs = service.get_sections_queryset(class_id=pk)
        serializer = SectionSerializer(qs, many=True)
        return success_response(data=serializer.data)


class SubjectListView(APIView):
    """
    GET /api/v1/subjects/
    POST /api/v1/subjects/
    Lists school subjects and weekly periods, or registers a new subject.
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_ACADEMICS_VIEW,
        'POST': PERM_ACADEMICS_MANAGE,
    }
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AcademicService()
        department = request.query_params.get('department')
        search = request.query_params.get('search')
        is_active_param = request.query_params.get('is_active')
        is_active = None
        if is_active_param is not None:
            is_active = is_active_param.lower() in ('true', '1', 'yes')

        qs = service.get_subjects_queryset(department=department, is_active=is_active, search=search)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = SubjectSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = SubjectSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = SubjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subject = serializer.save()
        return success_response(
            data=SubjectSerializer(subject).data,
            status_code=status.HTTP_201_CREATED,
        )


class SubjectDetailView(APIView):
    """
    GET /api/v1/subjects/{id}/
    Returns details for a specific subject.
    """
    permission_classes = [require_permission(PERM_ACADEMICS_VIEW)]

    def get(self, request, pk, *args, **kwargs):
        subject = get_object_or_404(Subject, pk=pk)
        serializer = SubjectSerializer(subject)
        return success_response(data=serializer.data)


class AcademicYearListView(APIView):
    """
    GET /api/v1/academics/years/
    Lists academic years.
    """
    permission_classes = [require_permission(PERM_ACADEMICS_VIEW)]

    def get(self, request, *args, **kwargs):
        service = AcademicService()
        qs = service.get_academic_years_queryset()
        serializer = AcademicYearSerializer(qs, many=True)
        return success_response(data=serializer.data)
