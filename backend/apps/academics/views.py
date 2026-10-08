"""
Student ERP — Academics DRF Views
Provides directory endpoints for classes, sections, subjects, and academic years.
"""

from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q

from common.constants import PERM_ACADEMICS_VIEW, PERM_ACADEMICS_MANAGE
from common.permissions import HasRequiredPermission, require_permission
from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.academics.models import SchoolClass, Section, Subject, AcademicYear, Enrollment
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


class SectionListView(APIView):
    """
    GET /api/v1/academics/sections/
    Lists sections with optional class_id, academic_year, and search filter.
    """
    permission_classes = [require_permission(PERM_ACADEMICS_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AcademicService()
        class_id = request.query_params.get('class_id')
        academic_year = request.query_params.get('academic_year')
        search = request.query_params.get('search')
        qs = service.get_sections_queryset(class_id=class_id)
        if academic_year:
            qs = qs.filter(
                Q(school_class__academic_year__name=academic_year.strip())
                | Q(academic_year__name=academic_year.strip())
                | Q(academic_year_id=academic_year.strip())
            )
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(school_class__name__icontains=search)
                | Q(room__icontains=search)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = SectionSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = SectionSerializer(qs, many=True)
        return success_response(data=serializer.data)


class SectionDetailView(APIView):
    """
    GET /api/v1/academics/sections/{id}/
    PATCH /api/v1/academics/sections/{id}/
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_ACADEMICS_VIEW,
        'PATCH': PERM_ACADEMICS_MANAGE,
    }

    def get(self, request, pk, *args, **kwargs):
        section = get_object_or_404(
            Section.objects.select_related(
                'school_class',
                'school_class__academic_year',
                'class_teacher',
                'class_teacher__user',
            ).prefetch_related('enrollments'),
            pk=pk,
        )
        return success_response(data=SectionSerializer(section).data)

    def patch(self, request, pk, *args, **kwargs):
        section = get_object_or_404(Section, pk=pk)
        serializer = SectionSerializer(section, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        section = serializer.save()
        return success_response(data=SectionSerializer(section).data)


class EnrollmentListView(APIView):
    """
    GET /api/v1/academics/enrollments/
    Lists student enrollments with filters.
    """
    permission_classes = [require_permission(PERM_ACADEMICS_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        qs = Enrollment.objects.select_related(
            'student__user',
            'section__school_class',
            'academic_year',
        ).all().order_by('-academic_year__start_date', 'student__student_id')

        student_id = request.query_params.get('student_id')
        section_id = request.query_params.get('section_id')
        class_id = request.query_params.get('class_id')
        academic_year = request.query_params.get('academic_year')
        status_param = request.query_params.get('status')
        search = request.query_params.get('search')

        if student_id:
            qs = qs.filter(student__student_id__iexact=student_id.strip())
        if section_id:
            qs = qs.filter(section_id=section_id.strip())
        if class_id:
            qs = qs.filter(section__school_class_id=class_id.strip())
        if academic_year:
            qs = qs.filter(
                Q(academic_year__name=academic_year.strip())
                | Q(academic_year_id=academic_year.strip())
            )
        if status_param:
            qs = qs.filter(status__iexact=status_param.strip())
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(student__student_id__icontains=search)
                | Q(student__user__first_name__icontains=search)
                | Q(student__user__last_name__icontains=search)
                | Q(section__name__icontains=search)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = EnrollmentSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = EnrollmentSerializer(qs, many=True)
        return success_response(data=serializer.data)


class EnrollmentDetailView(APIView):
    """
    GET /api/v1/academics/enrollments/{id}/
    """
    permission_classes = [require_permission(PERM_ACADEMICS_VIEW)]

    def get(self, request, pk, *args, **kwargs):
        enrollment = get_object_or_404(
            Enrollment.objects.select_related(
                'student__user',
                'section__school_class',
                'academic_year',
            ),
            pk=pk,
        )
        return success_response(data=EnrollmentSerializer(enrollment).data)

