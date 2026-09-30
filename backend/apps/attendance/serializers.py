"""
Student ERP — Attendance DRF Serializers
Serializer-layer contract for attendance records, bulk logging, and leave applications.
Strictly adheres to Master Plan Amendment 2 (4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE).
"""

from rest_framework import serializers
from apps.attendance.models import Attendance, LeaveApplication
from common.constants import ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LEAVE
from common.utils import validate_attendance_status
from common.exceptions import InvalidAttendanceStatusError


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for single attendance record.
    """
    student_id = serializers.CharField(source='enrollment.student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    class_name = serializers.CharField(source='enrollment.section.school_class.name', read_only=True)
    section_name = serializers.CharField(source='enrollment.section.name', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()
    approved_by_faculty_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id',
            'enrollment',
            'student_id',
            'student_name',
            'class_name',
            'section_name',
            'date',
            'session_period',
            'status',
            'remarks',
            'recorded_by',
            'recorded_by_name',
            'approved_by_faculty',
            'approved_by_faculty_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_student_name(self, obj) -> str:
        if obj.enrollment and obj.enrollment.student and obj.enrollment.student.user:
            return obj.enrollment.student.user.get_full_name()
        return ''

    def get_recorded_by_name(self, obj) -> str:
        if obj.recorded_by:
            return obj.recorded_by.get_full_name()
        return ''

    def get_approved_by_faculty_name(self, obj) -> str:
        if obj.approved_by_faculty and obj.approved_by_faculty.user:
            return obj.approved_by_faculty.user.get_full_name()
        return ''

    def validate_status(self, value: str) -> str:
        try:
            return validate_attendance_status(value)
        except Exception as exc:
            raise serializers.ValidationError(str(exc))


class AttendanceBulkItemSerializer(serializers.Serializer):
    """Single student attendance entry within a bulk submission."""
    student_id = serializers.CharField(required=False)
    enrollment_id = serializers.UUIDField(required=False)
    status = serializers.CharField()
    session_period = serializers.IntegerField(required=False, allow_null=True, default=None)
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    approved_by_faculty_id = serializers.UUIDField(required=False, allow_null=True, default=None)

    def validate_status(self, value: str) -> str:
        try:
            return validate_attendance_status(value)
        except Exception as exc:
            raise serializers.ValidationError(str(exc))

    def validate(self, attrs):
        if not attrs.get('student_id') and not attrs.get('enrollment_id'):
            raise serializers.ValidationError("Either 'student_id' or 'enrollment_id' must be provided.")
        return attrs


class BulkAttendanceCreateSerializer(serializers.Serializer):
    """
    Bulk attendance recording payload serializer.
    """
    date = serializers.DateField()
    session_period = serializers.IntegerField(required=False, allow_null=True, default=None)
    section_id = serializers.UUIDField(required=False, allow_null=True)
    records = AttendanceBulkItemSerializer(many=True)

    def validate(self, attrs):
        if not attrs.get('records'):
            raise serializers.ValidationError({'records': 'At least one attendance record must be provided.'})
        return attrs


class LeaveApplicationSerializer(serializers.ModelSerializer):
    """Serializer for LeaveApplication."""
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveApplication
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'leave_type',
            'start_date',
            'end_date',
            'reason',
            'status',
            'applied_on',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'review_remarks',
        ]
        read_only_fields = ['id', 'applied_on', 'reviewed_at']

    def get_student_name(self, obj) -> str:
        if obj.student and obj.student.user:
            return obj.student.user.get_full_name()
        return ''

    def get_reviewed_by_name(self, obj) -> str:
        if obj.reviewed_by and obj.reviewed_by.user:
            return obj.reviewed_by.user.get_full_name()
        return ''
