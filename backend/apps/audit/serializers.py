"""
Student ERP — Audit DRF Serializers (Scaffolding)
Serializer-layer contract for audit and security telemetry logs.
"""

from rest_framework import serializers


class AuditLogSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    user_id = serializers.UUIDField(required=False, allow_null=True)
    action = serializers.CharField()
    target_table = serializers.CharField()
    target_id = serializers.CharField()
    old_values = serializers.DictField(required=False, allow_null=True)
    new_values = serializers.DictField(required=False, allow_null=True)
    ip_address = serializers.IPAddressField(required=False, allow_null=True)
    timestamp = serializers.DateTimeField(read_only=True)
