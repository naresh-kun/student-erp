"""
Student ERP — Calendar DRF Serializers (Scaffolding)
Serializer-layer contract for academic calendar events.
"""

from rest_framework import serializers


class CalendarEventSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField()
    category = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    target_roles = serializers.ListField(child=serializers.CharField(), required=False)
    location = serializers.CharField(required=False, allow_blank=True)
    is_holiday = serializers.BooleanField(default=False)
