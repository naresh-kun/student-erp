"""
Student ERP — Reports DRF Serializers (Scaffolding)
Serializer-layer contract for academic, administrative, and executive reports.
"""

from rest_framework import serializers


class ReportSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    report_type = serializers.CharField()
    generated_by_id = serializers.UUIDField(required=False, allow_null=True)
    generated_at = serializers.DateTimeField(read_only=True)
    filter_criteria = serializers.DictField(default=dict)
    file_url = serializers.URLField(required=False, allow_blank=True)
    status = serializers.CharField(default='Completed')
