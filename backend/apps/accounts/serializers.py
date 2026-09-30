"""
Student ERP — Accounts DRF Serializers
Serializer-layer contract for authentication, users, roles, faculty, and parents.
"""

from rest_framework import serializers
from apps.accounts.models import Role, User, Parent, Faculty


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for ERP Role."""
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class UserSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for User representation."""
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'role_name',
            'phone',
            'avatar_url',
            'is_active',
            'date_joined',
        ]
        read_only_fields = ['id', 'role_name', 'date_joined']


class ParentSerializer(serializers.ModelSerializer):
    """Serializer for Parent profile with nested User representation."""
    user = UserSummarySerializer(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = [
            'id',
            'user',
            'first_name',
            'last_name',
            'email',
            'phone',
            'relation',
            'occupation',
            'address',
            'children_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'children_count']

    def get_children_count(self, obj) -> int:
        return obj.children.count() if hasattr(obj, 'children') else 0


class ParentSummarySerializer(serializers.ModelSerializer):
    """Summary representation of Parent profile."""
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = Parent
        fields = ['id', 'name', 'email', 'phone', 'relation', 'occupation']
        read_only_fields = ['id']

    def get_name(self, obj) -> str:
        return obj.user.get_full_name() if obj.user else ''


class FacultySerializer(serializers.ModelSerializer):
    """
    Serializer for Faculty profile.
    Strictly non-evaluative per ADR 008 (zero ratings or scorecards).
    """
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = Faculty
        fields = [
            'id',
            'user',
            'user_id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'employee_code',
            'department',
            'designation',
            'qualification',
            'specialization',
            'office_room',
            'joining_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FacultySummarySerializer(serializers.ModelSerializer):
    """Summary representation of Faculty profile."""
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Faculty
        fields = ['id', 'employee_code', 'name', 'email', 'department', 'designation', 'office_room', 'is_active']
        read_only_fields = ['id']

    def get_name(self, obj) -> str:
        return obj.user.get_full_name() if obj.user else ''
