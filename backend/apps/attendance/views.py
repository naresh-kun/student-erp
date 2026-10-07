"""
Student ERP — Attendance DRF Views
Provides attendance overview, bulk logging, absentees listing, and leave application endpoints.
Strictly adheres to Master Plan Amendment 2 (4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE).
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
    ROLE_STUDENT,
    ROLE_PARENT,
    PERM_ATTENDANCE_VIEW,
    PERM_ATTENDANCE_MARK,
    PERM_ATTENDANCE_VIEW_ABSENTEES,
)
from common.authorization import AuthorizationService
from common.permissions import HasRequiredPermission, IsOwnerOrScopedAccess, require_permission
from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.attendance.models import Attendance, LeaveApplication
from apps.attendance.services import AttendanceService
from apps.academics.models import Enrollment
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
    permission_classes = [require_permission(PERM_ATTENDANCE_VIEW)]
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
        qs = AuthorizationService.filter_queryset_for_user(qs, request.user, domain='attendance')

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
    permission_classes = [require_permission(PERM_ATTENDANCE_MARK)]

    def post(self, request, *args, **kwargs):
        serializer = BulkAttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_role = AuthorizationService.get_user_role(request.user)
        if user_role == ROLE_FACULTY:
            faculty = getattr(request.user, 'faculty_profile', None)
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
                if not enrollment or not AuthorizationService.can_faculty_manage_section_attendance(faculty, enrollment.section):
                    raise PermissionDenied("Faculty can only record attendance for their assigned section.")

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
    permission_classes = [HasRequiredPermission, IsOwnerOrScopedAccess]
    permission_map = {
        'GET': PERM_ATTENDANCE_VIEW,
        'PATCH': PERM_ATTENDANCE_MARK,
    }

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
        self.check_object_permissions(request, att)
        serializer = AttendanceRecordSerializer(att)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        att = get_object_or_404(Attendance, pk=pk)
        self.check_object_permissions(request, att)
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
    permission_classes = [require_permission(PERM_ATTENDANCE_VIEW_ABSENTEES)]
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
        qs = AuthorizationService.filter_queryset_for_user(qs, request.user, domain='attendance')

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
    permission_classes = [require_permission(PERM_ATTENDANCE_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        student_id = request.query_params.get('student_id')
        leave_status = request.query_params.get('status')
        qs = LeaveApplication.objects.select_related('student__user', 'reviewed_by__user').all()

        if student_id:
            qs = qs.filter(student__student_id=student_id.strip())
        if leave_status:
            qs = qs.filter(status=leave_status.strip())

        qs = AuthorizationService.filter_queryset_for_user(qs, request.user, domain='attendance')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = LeaveApplicationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = LeaveApplicationSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        user_role = AuthorizationService.get_user_role(request.user)
        if user_role == ROLE_STUDENT:
            student = getattr(request.user, 'student_profile', None)
            if not student:
                raise PermissionDenied("Student profile not found.")
            if 'student' in request.data and str(request.data['student']) != str(student.id):
                raise PermissionDenied("Students may only submit leave applications for themselves.")
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            data['student'] = str(student.id)
            data['status'] = 'PENDING'
            serializer = LeaveApplicationSerializer(data=data)
        elif user_role == ROLE_PARENT:
            parent = getattr(request.user, 'parent_profile', None)
            if not parent:
                raise PermissionDenied("Parent profile not found.")
            target_student_id = request.data.get('student') or request.data.get('student_id')
            if not target_student_id:
                raise PermissionDenied("Target student must be specified.")
            from apps.students.models import Student
            try:
                target_uuid = uuid.UUID(str(target_student_id))
                student = Student.objects.filter(Q(id=target_uuid) | Q(student_id__iexact=str(target_student_id)), parent=parent).first()
            except (ValueError, AttributeError):
                student = Student.objects.filter(student_id__iexact=str(target_student_id), parent=parent).first()
            if not student:
                raise PermissionDenied("Parents may only submit leave applications for their linked children.")
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            data['student'] = str(student.id)
            data['status'] = 'PENDING'
            serializer = LeaveApplicationSerializer(data=data)
        elif user_role in (ROLE_ADMIN, ROLE_FACULTY):
            serializer = LeaveApplicationSerializer(data=request.data)
        else:
            raise PermissionDenied("Role not permitted to submit leave applications.")

        serializer.is_valid(raise_exception=True)
        leave_app = serializer.save()
        return success_response(
            data=LeaveApplicationSerializer(leave_app).data,
            status_code=status.HTTP_201_CREATED,
        )
