"""
Student ERP — Students DRF Views
Provides directory, profile read, creation, and update endpoints for student entities.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.students.services import StudentService
from apps.students.serializers import (
    StudentListSerializer,
    StudentDetailSerializer,
    StudentWriteSerializer,
)


class StudentListView(APIView):
    """
    GET /api/v1/students/
    POST /api/v1/students/
    Lists students with query filters or registers a new student profile.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = StudentService()
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')
        academic_year = request.query_params.get('academic_year')
        search = request.query_params.get('search')
        student_status = request.query_params.get('status')

        qs = service.get_students_queryset(
            class_id=class_id,
            section_id=section_id,
            academic_year=academic_year,
            search=search,
            status=student_status,
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = StudentListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = StudentListSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = StudentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return success_response(
            data=StudentDetailSerializer(student).data,
            status_code=status.HTTP_201_CREATED,
        )


class StudentDetailView(APIView):
    """
    GET /api/v1/students/{id}/
    PATCH /api/v1/students/{id}/
    Returns or updates detailed profile for a specific student (by UUID or student_id).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        service = StudentService()
        student = service.get_student_by_id_or_business_id(pk)
        serializer = StudentDetailSerializer(student)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        service = StudentService()
        student = service.get_student_by_id_or_business_id(pk)
        serializer = StudentWriteSerializer(student, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return success_response(data=StudentDetailSerializer(student).data)
