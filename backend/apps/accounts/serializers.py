"""
Student ERP — Accounts DRF Serializers
Serializer-layer contract for authentication, users, roles, faculty, and parents.
"""

from typing import Optional
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from apps.accounts.models import Role, User, Parent, Faculty
from apps.accounts.services import AuthService


class ERPTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Authoritative login serializer for Student ERP (Task 4.2 / Task 4.5).
    Authenticates custom User, Student ID, or Parent-linked Student ID,
    injects role & username claims, and returns access, refresh, token_type, and safe user identity.
    Adheres strictly to docs/API_CONTRACT.md Section 3.1 and standardized envelope.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.name if user.role else 'Unknown'
        token['username'] = user.username
        return token

    def validate(self, attrs):
        identifier = attrs.get(self.username_field, '')
        password = attrs.get('password', '')

        auth_service = AuthService()
        user = auth_service.authenticate_by_identifier(identifier, password)

        if user is None or not user.is_active:
            raise AuthenticationFailed(
                self.error_messages['no_active_account'],
                'no_active_account',
            )

        self.user = user

        refresh = self.get_token(self.user)
        access = str(refresh.access_token)

        user_info = {
            'id': str(self.user.id),
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role.name if self.user.role else 'Unknown',
        }

        data = {
            'refresh': str(refresh),
            'access': access,
            'token_type': 'Bearer',
            'user': user_info,
            'success': True,
            'data': {
                'access': access,
                'refresh': str(refresh),
                'token_type': 'Bearer',
                'user': user_info,
            },
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
    name = serializers.SerializerMethodField()
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    children_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = [
            'id',
            'user',
            'name',
            'first_name',
            'last_name',
            'email',
            'phone',
            'relation',
            'occupation',
            'address',
            'children_count',
            'children',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'children_count', 'children']

    def get_name(self, obj) -> str:
        return obj.user.get_full_name() if obj.user else ''

    def get_children_count(self, obj) -> int:
        return obj.children.count() if hasattr(obj, 'children') else 0

    def get_children(self, obj) -> list:
        result = []
        if hasattr(obj, 'children'):
            for child in obj.children.select_related('user').all():
                enrollment = child.enrollments.select_related('section__school_class').first()
                class_name = enrollment.section.school_class.name if enrollment and enrollment.section and enrollment.section.school_class else '—'
                result.append({
                    'student_id': child.student_id,
                    'name': child.user.get_full_name() if child.user else '',
                    'class_name': class_name,
                    'roll_number': child.roll_number or '—',
                })
        return result


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
    full_name = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    class_teacher_of = serializers.SerializerMethodField()
    assigned_classes_count = serializers.SerializerMethodField()
    assigned_students_count = serializers.SerializerMethodField()
    assigned_subjects = serializers.SerializerMethodField()
    assigned_classes = serializers.SerializerMethodField()
    weekly_periods = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Faculty
        fields = [
            'id',
            'user',
            'user_id',
            'first_name',
            'last_name',
            'full_name',
            'name',
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
            'status',
            'class_teacher_of',
            'assigned_classes_count',
            'assigned_students_count',
            'assigned_subjects',
            'assigned_classes',
            'weekly_periods',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'full_name',
            'name',
            'status',
            'class_teacher_of',
            'assigned_classes_count',
            'assigned_students_count',
            'assigned_subjects',
            'assigned_classes',
            'weekly_periods',
        ]

    def get_full_name(self, obj) -> str:
        return obj.user.get_full_name() if obj.user else ''

    def get_name(self, obj) -> str:
        return self.get_full_name(obj)

    def get_assigned_subjects(self, obj) -> list:
        from apps.academics.models import TeachingAssignment
        return list(TeachingAssignment.objects.filter(faculty=obj, is_active=True).values_list('subject__name', flat=True).distinct())

    def get_assigned_classes(self, obj) -> list:
        from apps.academics.models import TeachingAssignment
        assignments = TeachingAssignment.objects.filter(
            faculty=obj, is_active=True
        ).select_related('school_class', 'section', 'subject')
        results = []
        for a in assignments:
            c_name = a.school_class.name if a.school_class else ''
            s_name = a.section.name if a.section else ''
            sub_name = a.subject.name if a.subject else ''
            results.append(f"{c_name}-{s_name} ({sub_name})".strip())
        return results

    def get_class_teacher_of(self, obj) -> Optional[dict]:
        section = obj.assigned_sections.select_related('school_class').first()
        if section:
            return {
                'class_id': str(section.school_class_id),
                'section_id': str(section.id),
                'class_name': section.school_class.name,
                'section_name': section.name,
                'name': section.name,
                'display_name': f"{section.school_class.name} ({section.name})",
                'room': section.room,
            }
        return None

    def get_assigned_classes_count(self, obj) -> int:
        from apps.academics.models import TeachingAssignment
        sec_ids = set(TeachingAssignment.objects.filter(faculty=obj, is_active=True).values_list('section_id', flat=True))
        ct_sec_ids = set(obj.assigned_sections.values_list('id', flat=True))
        return len(sec_ids | ct_sec_ids)

    def get_assigned_students_count(self, obj) -> int:
        from apps.academics.models import TeachingAssignment, Enrollment
        sec_ids = set(TeachingAssignment.objects.filter(faculty=obj, is_active=True).values_list('section_id', flat=True))
        ct_sec_ids = set(obj.assigned_sections.values_list('id', flat=True))
        all_sec_ids = sec_ids | ct_sec_ids
        if not all_sec_ids:
            return 0
        return Enrollment.objects.filter(
            section_id__in=all_sec_ids,
            status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled'],
        ).count()

    def get_weekly_periods(self, obj) -> int:
        from apps.academics.models import TeachingAssignment
        from django.db.models import Sum
        total = TeachingAssignment.objects.filter(faculty=obj, is_active=True).aggregate(
            total=Sum('subject__weekly_periods')
        )['total']
        return total or 0

    def get_status(self, obj) -> str:
        return 'Active' if obj.is_active else 'Inactive'


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
