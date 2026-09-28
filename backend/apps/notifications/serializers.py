"""
Student ERP — Notifications DRF Serializers (Scaffolding)
Serializer-layer contract for notifications and alert feeds.
"""

from rest_framework import serializers


class NotificationSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    user_id = serializers.UUIDField()
    title = serializers.CharField()
    message = serializers.CharField()
    category = serializers.CharField()
    is_read = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)
