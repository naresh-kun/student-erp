"""
Student ERP — Accounts DRF Serializers (Scaffolding)
Serializer-layer contract for authentication and profile data.
"""

from rest_framework import serializers


class UserSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True)


class RoleSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)


class FacultySummarySerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    employee_code = serializers.CharField()
    department = serializers.CharField()
    designation = serializers.CharField()
    qualification = serializers.CharField(required=False, allow_blank=True)
    specialization = serializers.CharField(required=False, allow_blank=True)
    office_room = serializers.CharField(required=False, allow_blank=True)


class ParentSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    relation = serializers.CharField()
    occupation = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
