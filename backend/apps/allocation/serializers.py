"""
Student ERP — Allocation DRF Serializers (Scaffolding)
Serializer-layer contract for section and teacher allocation workflows.
"""

from rest_framework import serializers


class AllocationSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    academic_year_id = serializers.UUIDField()
    run_timestamp = serializers.DateTimeField(read_only=True)
    parameters = serializers.DictField(default=dict)
    status = serializers.CharField(default='Draft')
    notes = serializers.CharField(required=False, allow_blank=True)
