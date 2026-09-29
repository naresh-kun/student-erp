"""
Student ERP — Academics DRF Serializers (Scaffolding)
Serializer-layer contract for academic years, classes, sections, and subjects.
"""

from rest_framework import serializers


class AcademicYearSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    is_current = serializers.BooleanField(default=False)


class SectionSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    room = serializers.CharField(required=False, allow_blank=True)
    capacity = serializers.IntegerField(default=35)
    class_teacher_id = serializers.UUIDField(required=False, allow_null=True)


class ClassSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    code = serializers.CharField()
    stream = serializers.CharField(required=False, allow_blank=True)
    sections = SectionSerializer(many=True, required=False)


class SubjectSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    code = serializers.CharField()
    department = serializers.CharField()
    periods_per_week = serializers.IntegerField(default=5)
    description = serializers.CharField(required=False, allow_blank=True)


class EnrollmentSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    student_id = serializers.CharField()
    section_id = serializers.UUIDField()
    academic_year_id = serializers.UUIDField()
    status = serializers.CharField(default='Enrolled')
