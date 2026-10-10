"""
Student ERP — Audit DRF Serializers
Serializer-layer contract for audit and security telemetry logs.
"""

from rest_framework import serializers
from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor',
            'actor_username',
            'actor_role',
            'action',
            'resource_type',
            'resource_id',
            'old_values',
            'new_values',
            'ip_address',
            'user_agent',
            'reason',
            'created_at',
        ]
        read_only_fields = fields

    def get_actor(self, obj):
        if obj.actor:
            role_name = obj.actor_role or (obj.actor.role.name if getattr(obj.actor, 'role', None) else '')
            return {
                'id': str(obj.actor.id),
                'username': obj.actor.username,
                'role': role_name,
            }
        return None
