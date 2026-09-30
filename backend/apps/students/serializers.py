"""
Student ERP — Students DRF Serializers
Serializer-layer contract for student records and directories.
"""

from rest_framework import serializers
from apps.students.models import Student
from apps.accounts.models import User, Parent
from common.utils import validate_student_id
from common.exceptions import ImmutableFieldMutationError, DomainValidationError


class StudentListSerializer(serializers.ModelSerializer):
    """
    Serializer for student directory listings.
    Optimized for display in student directory grids/tables.
    """
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    parent_name = serializers.SerializerMethodField()
    current_class = serializers.SerializerMethodField()
    current_section = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'student_id',
            'admission_number',
            'roll_number',
            'first_name',
            'last_name',
            'email',
            'gender',
            'blood_group',
            'status',
            'parent_name',
            'current_class',
            'current_section',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_parent_name(self, obj) -> str:
        if obj.parent and obj.parent.user:
            return obj.parent.user.get_full_name()
        return ''

    def get_current_class(self, obj) -> str:
        # Check active enrollment if prefetched
        enrollments = getattr(obj, 'prefetched_enrollments', None)
        if enrollments is None:
            enrollments = obj.enrollments.all()
        if enrollments:
            latest = enrollments[0]
            if latest.section and latest.section.school_class:
                return latest.section.school_class.name
        return ''

    def get_current_section(self, obj) -> str:
        enrollments = getattr(obj, 'prefetched_enrollments', None)
        if enrollments is None:
            enrollments = obj.enrollments.all()
        if enrollments:
            latest = enrollments[0]
            if latest.section:
                return latest.section.name
        return ''


class StudentDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for full student record inspection.
    """
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    parent = serializers.SerializerMethodField()
    enrollments = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'student_id',
            'admission_number',
            'roll_number',
            'first_name',
            'last_name',
            'email',
            'phone',
            'date_of_birth',
            'gender',
            'blood_group',
            'emergency_contact',
            'address',
            'status',
            'parent',
            'enrollments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_parent(self, obj):
        if not obj.parent:
            return None
        return {
            'id': str(obj.parent.id),
            'name': obj.parent.user.get_full_name() if obj.parent.user else '',
            'relation': obj.parent.relation,
            'phone': obj.parent.user.phone if obj.parent.user else '',
            'email': obj.parent.user.email if obj.parent.user else '',
            'occupation': obj.parent.occupation,
        }

    def get_enrollments(self, obj):
        result = []
        for enr in obj.enrollments.select_related('section__school_class', 'academic_year').all():
            result.append({
                'id': str(enr.id),
                'academic_year': enr.academic_year.name if enr.academic_year else '',
                'class_name': enr.section.school_class.name if enr.section and enr.section.school_class else '',
                'section_name': enr.section.name if enr.section else '',
                'status': enr.status,
            })
        return result


class StudentWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating student records.
    Enforces format validation and immutability rules.
    """
    user_id = serializers.UUIDField(required=True)
    parent_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Student
        fields = [
            'id',
            'user_id',
            'parent_id',
            'student_id',
            'admission_number',
            'roll_number',
            'date_of_birth',
            'gender',
            'blood_group',
            'emergency_contact',
            'address',
            'status',
        ]
        read_only_fields = ['id']

    def validate_student_id(self, value):
        if not validate_student_id(value):
            raise serializers.ValidationError(
                f"Invalid Student ID format: '{value}'. Required: STU<4-digit-year><5-digit-sequence> (e.g. STU202600001)."
            )
        return value

    def validate(self, attrs):
        # If updating, check if student_id is attempting to be changed
        if self.instance is not None:
            if 'student_id' in attrs and attrs['student_id'] != self.instance.student_id:
                raise ImmutableFieldMutationError('student_id', self.instance.student_id)
        return attrs
