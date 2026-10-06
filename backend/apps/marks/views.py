"""
Student ERP — Marks DRF Views
Provides evaluation register, bulk marks recording, exam types, and report card inquiry endpoints.
Strictly adheres to CBSE/ICSE 8-tier letter grading scale (A1, A2, B1, B2, C1, C2, D, E).
"""

import uuid
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q

from common.constants import (
    ROLE_ADMIN,
    ROLE_FACULTY,
    PERM_MARKS_VIEW,
    PERM_MARKS_ENTER,
    PERM_MARKS_OVERRIDE,
    PERM_REPORTS_VIEW,
)
from common.authorization import AuthorizationService
from common.permissions import HasRequiredPermission, IsOwnerOrScopedAccess, require_permission
from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.marks.models import Mark, ExamType
from apps.marks.services import MarksService
from apps.academics.models import Enrollment
from apps.marks.serializers import (
    MarkSerializer,
    BulkMarkCreateSerializer,
    ExamTypeSerializer,
)


class MarkListView(APIView):
    """
    GET /api/v1/marks/
    Lists marks with query parameters.
    """
    permission_classes = [require_permission(PERM_MARKS_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = MarksService()
        student_id = request.query_params.get('student_id')
        subject_id = request.query_params.get('subject_id')
        exam_type_id = request.query_params.get('exam_type_id')
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')

        qs = service.get_marks_queryset(
            student_id=student_id,
            subject_id=subject_id,
            exam_type_id=exam_type_id,
            class_id=class_id,
            section_id=section_id,
        )
        qs = AuthorizationService.filter_queryset_for_user(qs, request.user, domain='marks')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = MarkSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = MarkSerializer(qs, many=True)
        return success_response(data=serializer.data)


class BulkMarkCreateView(APIView):
    """
    POST /api/v1/marks/bulk/
    Records evaluation marks for multiple students.
    Validates range (0–100) and derives 8-tier letter grade.
    """
    permission_classes = [require_permission(PERM_MARKS_ENTER)]

    def post(self, request, *args, **kwargs):
        serializer = BulkMarkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_role = AuthorizationService.get_user_role(request.user)
        faculty = getattr(request.user, 'faculty_profile', None)
        if user_role == ROLE_FACULTY:
            if not faculty:
                raise PermissionDenied("Faculty profile not found.")
            for item in serializer.validated_data['records']:
                enrollment = None
                if item.get('enrollment_id'):
                    enrollment = Enrollment.objects.select_related('section').filter(id=item['enrollment_id']).first()
                elif item.get('student_id'):
                    sid = item['student_id'].strip()
                    try:
                        val_uuid = uuid.UUID(sid)
                        enrollment = Enrollment.objects.select_related('section').filter(
                            Q(student__student_id=sid) | Q(student_id=val_uuid)
                        ).first()
                    except (ValueError, AttributeError):
                        enrollment = Enrollment.objects.select_related('section').filter(
                            student__student_id=sid
                        ).first()
                if not enrollment or enrollment.section.class_teacher_id != faculty.id:
                    raise PermissionDenied("Faculty can only enter marks for their assigned section.")

        service = MarksService()
        saved = service.record_bulk_marks(
            records=serializer.validated_data['records'],
            evaluated_by=faculty,
        )

        return success_response(
            data={
                'saved_count': len(saved),
                'records': MarkSerializer(saved, many=True).data,
            },
            status_code=status.HTTP_201_CREATED,
        )


class MarkDetailView(APIView):
    """
    GET /api/v1/marks/{id}/
    PATCH /api/v1/marks/{id}/
    Retrieves or updates a single mark record.
    """
    permission_classes = [HasRequiredPermission, IsOwnerOrScopedAccess]
    permission_map = {
        'GET': PERM_MARKS_VIEW,
        'PATCH': PERM_MARKS_ENTER,
    }

    def get(self, request, pk, *args, **kwargs):
        mark = get_object_or_404(
            Mark.objects.select_related(
                'enrollment__student__user',
                'enrollment__section__school_class',
                'subject',
                'exam_type',
                'evaluated_by__user',
            ),
            pk=pk,
        )
        self.check_object_permissions(request, mark)
        serializer = MarkSerializer(mark)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        mark = get_object_or_404(Mark, pk=pk)
        self.check_object_permissions(request, mark)
        serializer = MarkSerializer(mark, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        mark = serializer.save()
        return success_response(data=MarkSerializer(mark).data)


class ReportCardView(APIView):
    """
    GET /api/v1/marks/report-card/{student_id}/
    Returns calculated cumulative marks out of maximum, overall percentage, 8-tier letter grade,
    and subject breakdown.
    """
    permission_classes = [require_permission(PERM_REPORTS_VIEW)]

    def get(self, request, student_id, *args, **kwargs):
        from apps.students.services import StudentService
        student = StudentService().get_student_by_id_or_business_id(student_id)
        if not AuthorizationService.can_access_object(request.user, student, action='view'):
            raise PermissionDenied("You do not have permission to view this report card.")

        service = MarksService()
        academic_year_id = request.query_params.get('academic_year_id')
        report_data = service.generate_report_card(
            student_id=student_id,
            academic_year_id=academic_year_id,
        )
        return success_response(data=report_data)


class ExamTypeListView(APIView):
    """
    GET /api/v1/marks/exam-types/
    POST /api/v1/marks/exam-types/
    Lists and creates examination categories.
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_MARKS_VIEW,
        'POST': PERM_MARKS_OVERRIDE,
    }
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        qs = ExamType.objects.all()
        serializer = ExamTypeSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = ExamTypeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exam_type = serializer.save()
        return success_response(
            data=ExamTypeSerializer(exam_type).data,
            status_code=status.HTTP_201_CREATED,
        )
