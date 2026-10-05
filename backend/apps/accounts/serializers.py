"""
Student ERP — Accounts DRF Serializers
Serializer-layer contract for authentication, users, roles, faculty, and parents.
"""

from typing import Optional
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.accounts.models import Role, User, Parent, Faculty


class ERPTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Authoritative login serializer for Student ERP (Task 4.2).
    Authenticates custom User, injects role & username claims,
    and returns access, refresh, token_type, and safe user identity.
    Adheres strictly to docs/API_CONTRACT.md Section 3.1 and standardized envelope.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.name if user.role else 'Unknown'
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        user_info = {
            'id': str(self.user.id),
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role.name if self.user.role else 'Unknown',
        }

        data['token_type'] = 'Bearer'
        data['user'] = user_info

        # Dual-compatibility envelope
        data['success'] = True
        data['data'] = {
            'access': data['access'],
            'refresh': data['refresh'],
            'token_type': 'Bearer',
            'user': user_info,
        }
        return data


class AuthTokenResponseSerializer(serializers.Serializer):
    """
    Standard schema for JWT token response (Phase 4 Foundation).
    """
    access = serializers.CharField(help_text="Short-lived JWT access token (15 minutes).")
    refresh = serializers.CharField(help_text="Long-lived JWT refresh token (7 days).")
    token_type = serializers.CharField(default="Bearer", help_text="Authentication scheme type.")


class LoginCredentialsSerializer(serializers.Serializer):
    """
    Input validation serializer for authentication credentials.
    Password is write-only and never exposed in serialized representations.
    """
    username = serializers.CharField(
        required=True,
        trim_whitespace=True,
        help_text="Institutional username or alphanumeric identifier.",
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Plaintext password for authentication. Never logged or stored plaintext.",
    )


class CurrentUserProfileSerializer(serializers.ModelSerializer):
    """
    Safe serializer for authenticated user profile context (/api/v1/auth/me/).
    Guarantees password, password hash, and security secrets are NEVER exposed.
    """
    role_name = serializers.CharField(source='role.name', read_only=True, default='Unknown')
    profile_details = serializers.SerializerMethodField()

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
            'last_login',
            'profile_details',
        ]
        read_only_fields = fields

    def get_profile_details(self, obj: User) -> Optional[dict]:
        if hasattr(obj, 'faculty_profile') and obj.faculty_profile:
            fac = obj.faculty_profile
            return {
                'type': 'faculty',
                'id': str(fac.id),
                'employee_code': fac.employee_code,
                'department': fac.department,
                'designation': fac.designation,
                'office_room': fac.office_room,
            }
        elif hasattr(obj, 'parent_profile') and obj.parent_profile:
            par = obj.parent_profile
            return {
                'type': 'parent',
                'id': str(par.id),
                'relation': par.relation,
                'occupation': par.occupation,
                'address': par.address,
            }
        elif hasattr(obj, 'student_profile') and obj.student_profile:
            stu = obj.student_profile
            return {
                'type': 'student',
                'id': str(stu.id),
                'student_id': stu.student_id,
                'admission_number': stu.admission_number,
                'roll_number': stu.roll_number,
                'status': stu.status,
            }
        return None



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
