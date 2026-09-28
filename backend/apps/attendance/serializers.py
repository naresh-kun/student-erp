"""
Student ERP — Attendance DRF Serializers (Scaffolding)
Serializer-layer contract for attendance records and leave applications.
"""

from rest_framework import serializers


class AttendanceRecordSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    student_id = serializers.CharField()
    date = serializers.DateField()
    session_period = serializers.IntegerField(default=1)
    status = serializers.CharField()
    remarks = serializers.CharField(required=False, allow_blank=True)


class LeaveApplicationSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    student_id = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField()
    status = serializers.CharField(default='PENDING')
    review_notes = serializers.CharField(required=False, allow_blank=True)
