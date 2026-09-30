"""
Student ERP — Attendance DRF Views
Provides attendance overview, bulk logging, absentees listing, and leave application endpoints.
Strictly adheres to Master Plan Amendment 2 (4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE).
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.attendance.models import Attendance, LeaveApplication
from apps.attendance.services import AttendanceService
from apps.attendance.serializers import (
    AttendanceRecordSerializer,
    BulkAttendanceCreateSerializer,
    LeaveApplicationSerializer,
)


class AttendanceOverviewView(APIView):
    """
    GET /api/v1/attendance/
    Lists attendance records with filters. Includes canonical attendance % calculation in response metadata.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AttendanceService()
        student_id = request.query_params.get('student_id')
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')
        date = request.query_params.get('date')
        month = request.query_params.get('month')
        att_status = request.query_params.get('status')

        qs = service.get_attendance_queryset(
            student_id=student_id,
            class_id=class_id,
            section_id=section_id,
            date=date,
            month=month,
            status=att_status,
        )

        # Calculate statistics across the filtered queryset
        stats = service.calculate_attendance_summary(qs)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = AttendanceRecordSerializer(page, many=True)
            res = paginator.get_paginated_response(serializer.data)
            # Enrich response meta with attendance statistics
            res.data['meta']['attendance_summary'] = stats
            return res

        serializer = AttendanceRecordSerializer(qs, many=True)
        return success_response(data=serializer.data, meta={'attendance_summary': stats})


class BulkAttendanceCreateView(APIView):
    """
    POST /api/v1/attendance/bulk/
    Bulk records attendance for an entire class/section/date.
    Allowed statuses: PRESENT, ABSENT, ON_DUTY, LEAVE (rejects LATE, EXCUSED).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = BulkAttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = AttendanceService()
        saved = service.record_bulk_attendance(
            date=serializer.validated_data['date'],
            records=serializer.validated_data['records'],
            recorded_by=request.user,
            default_session_period=serializer.validated_data.get('session_period'),
        )

        return success_response(
            data={
                'saved_count': len(saved),
                'date': str(serializer.validated_data['date']),
                'records': AttendanceRecordSerializer(saved, many=True).data,
            },
            status_code=status.HTTP_201_CREATED,
        )


class AttendanceDetailView(APIView):
    """
    GET /api/v1/attendance/{id}/
    PATCH /api/v1/attendance/{id}/
    Retrieves or updates single attendance record state.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        att = get_object_or_404(
            Attendance.objects.select_related(
                'enrollment__student__user',
                'enrollment__section__school_class',
                'recorded_by',
                'approved_by_faculty__user',
            ),
            pk=pk,
        )
        serializer = AttendanceRecordSerializer(att)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        att = get_object_or_404(Attendance, pk=pk)
        serializer = AttendanceRecordSerializer(att, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        att = serializer.save()
        return success_response(data=AttendanceRecordSerializer(att).data)


class StudentAbsenteesView(APIView):
    """
    GET /api/v1/attendance/absentees/
    Dedicated visibility surface returning ONLY students with attendance status ABSENT.
    Excludes PRESENT, ON_DUTY, and LEAVE per ADR 007 / ADR 009.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AttendanceService()
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')
        date = request.query_params.get('date')

        qs = service.get_attendance_queryset(
            class_id=class_id,
            section_id=section_id,
            date=date,
            status='ABSENT',
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = AttendanceRecordSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AttendanceRecordSerializer(qs, many=True)
        return success_response(data=serializer.data)


class LeaveApplicationListView(APIView):
    """
    GET /api/v1/attendance/leaves/
    POST /api/v1/attendance/leaves/
    Lists and submits leave applications.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        student_id = request.query_params.get('student_id')
        leave_status = request.query_params.get('status')
        qs = LeaveApplication.objects.select_related('student__user', 'reviewed_by__user').all()

        if student_id:
            qs = qs.filter(student__student_id=student_id.strip())
        if leave_status:
            qs = qs.filter(status=leave_status.strip())

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = LeaveApplicationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = LeaveApplicationSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = LeaveApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave_app = serializer.save()
        return success_response(
            data=LeaveApplicationSerializer(leave_app).data,
            status_code=status.HTTP_201_CREATED,
        )
