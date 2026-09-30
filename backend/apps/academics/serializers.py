"""
Student ERP — Academics DRF Serializers
Serializer-layer contract for academic years, classes, sections, subjects, and enrollments.
"""

from rest_framework import serializers
from apps.academics.models import (
    AcademicYear,
    SchoolClass,
    Section,
    Subject,
    Enrollment,
)
from apps.accounts.serializers import FacultySummarySerializer


class AcademicYearSerializer(serializers.ModelSerializer):
    """Serializer for AcademicYear."""
    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current', 'created_at']
        read_only_fields = ['id', 'created_at']


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section within a class."""
    school_class_id = serializers.UUIDField(source='school_class.id', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name', read_only=True)
    class_teacher = FacultySummarySerializer(read_only=True)
    class_teacher_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    class_teacher_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id',
            'school_class_id',
            'school_class_name',
            'name',
            'room',
            'capacity',
            'class_teacher',
            'class_teacher_id',
            'class_teacher_name',
            'enrolled_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'enrolled_count', 'class_teacher_name']

    def get_class_teacher_name(self, obj) -> str:
        if obj.class_teacher and obj.class_teacher.user:
            return obj.class_teacher.user.get_full_name()
        return ''

    def get_enrolled_count(self, obj) -> int:
        return obj.enrollments.count() if hasattr(obj, 'enrollments') else 0


class SchoolClassSerializer(serializers.ModelSerializer):
    """
    Serializer for SchoolClass, with nested section summaries.
    """
    academic_year_id = serializers.UUIDField(source='academic_year.id', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all(),
        write_only=True,
        required=False,
    )
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolClass
        fields = [
            'id',
            'academic_year',
            'academic_year_id',
            'academic_year_name',
            'name',
            'code',
            'sections',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'sections']


class SubjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Subject.
    Replaces university credits with weekly_periods per ADR 008 / ADR 010.
    """
    class Meta:
        model = Subject
        fields = [
            'id',
            'name',
            'code',
            'department',
            'weekly_periods',
            'description',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for student section enrollment."""
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    class_name = serializers.CharField(source='section.school_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'section',
            'class_name',
            'section_name',
            'academic_year',
            'academic_year_name',
            'enrolled_date',
            'status',
        ]
        read_only_fields = ['id', 'enrolled_date']

    def get_student_name(self, obj) -> str:
        if obj.student and obj.student.user:
            return obj.student.user.get_full_name()
        return ''
