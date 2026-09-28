"""
Student ERP — Timetable DRF Serializers (Scaffolding)
Serializer-layer contract for period schedules and room assignments.
"""

from rest_framework import serializers


class TimetableSlotSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    section_id = serializers.UUIDField()
    subject_code = serializers.CharField()
    faculty_id = serializers.UUIDField()
    day_of_week = serializers.CharField()
    period_number = serializers.IntegerField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    room_number = serializers.CharField(required=False, allow_blank=True)
