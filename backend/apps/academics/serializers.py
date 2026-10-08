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
    academic_year_id = serializers.UUIDField(source='academic_year.id', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    class_teacher = FacultySummarySerializer(read_only=True)
    class_teacher_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    class_teacher_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()
    grade_level = serializers.SerializerMethodField()
    stream = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id',
            'school_class_id',
            'school_class_name',
            'academic_year_id',
            'academic_year_name',
            'name',
            'room',
            'capacity',
            'class_teacher',
            'class_teacher_id',
            'class_teacher_name',
            'enrolled_count',
            'grade_level',
            'stream',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'enrolled_count', 'class_teacher_name', 'grade_level', 'stream']

    def get_class_teacher_name(self, obj) -> str:
        if obj.class_teacher and obj.class_teacher.user:
            return obj.class_teacher.user.get_full_name()
        return ''

    def get_enrolled_count(self, obj) -> int:
        return obj.enrollments.count() if hasattr(obj, 'enrollments') else 0

    def get_grade_level(self, obj) -> int:
        if obj.school_class:
            name = obj.school_class.name
            if '12' in name:
                return 12
            if '11' in name:
                return 11
            if '10' in name:
                return 10
            if '9' in name:
                return 9
        return 11

    def get_stream(self, obj) -> str:
        if obj.school_class:
            name = obj.school_class.name
            if 'Computer Science' in name:
                return 'Computer Science A'
            if 'Bio-Maths' in name:
                return 'Bio-Maths B'
            if 'Commerce' in name:
                return 'Commerce C'
            if 'Pure Science' in name:
                return 'Pure Science D'
        return ''


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
    grade_level = serializers.SerializerMethodField()
    stream = serializers.SerializerMethodField()
    class_teacher_name = serializers.SerializerMethodField()
    total_enrolled = serializers.SerializerMethodField()
    total_capacity = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = [
            'id',
            'academic_year',
            'academic_year_id',
            'academic_year_name',
            'name',
            'code',
            'grade_level',
            'stream',
            'class_teacher_name',
            'total_enrolled',
            'total_capacity',
            'sections',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'sections', 'grade_level', 'stream', 'class_teacher_name', 'total_enrolled', 'total_capacity']

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = dict(data)
            if 'academic_year_id' in data and 'academic_year' not in data:
                data['academic_year'] = data['academic_year_id']
        return super().to_internal_value(data)

    def get_grade_level(self, obj) -> int:
        if '12' in obj.name or 'G12' in obj.code:
            return 12
        if '11' in obj.name or 'G11' in obj.code:
            return 11
        if '10' in obj.name or 'G10' in obj.code:
            return 10
        if '9' in obj.name or 'G9' in obj.code:
            return 9
        return 11

    def get_stream(self, obj) -> str:
        if 'Computer Science' in obj.name:
            return 'Computer Science A'
        if 'Bio-Maths' in obj.name:
            return 'Bio-Maths B'
        if 'Commerce' in obj.name:
            return 'Commerce C'
        if 'Pure Science' in obj.name:
            return 'Pure Science D'
        return ''

    def get_class_teacher_name(self, obj) -> str:
        first_sec = obj.sections.filter(class_teacher__isnull=False).select_related('class_teacher__user').first()
        if first_sec and first_sec.class_teacher and first_sec.class_teacher.user:
            return first_sec.class_teacher.user.get_full_name()
        return 'Unassigned'

    def get_total_enrolled(self, obj) -> int:
        from apps.academics.models import Enrollment
        return Enrollment.objects.filter(section__school_class=obj).count()

    def get_total_capacity(self, obj) -> int:
        from django.db.models import Sum
        total = obj.sections.aggregate(total=Sum('capacity'))['total']
        return total or 0


class SubjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Subject.
    Replaces university credits with weekly_periods per ADR 008 / ADR 010.
    """
    assigned_faculty_names = serializers.SerializerMethodField()
    applicable_grades = serializers.SerializerMethodField()
    applicable_streams = serializers.SerializerMethodField()

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
            'assigned_faculty_names',
            'applicable_grades',
            'applicable_streams',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'assigned_faculty_names', 'applicable_grades', 'applicable_streams']

    def get_assigned_faculty_names(self, obj) -> list:
        from apps.academics.models import TeachingAssignment
        names = []
        for ta in TeachingAssignment.objects.filter(subject=obj, is_active=True).select_related('faculty__user'):
            if ta.faculty and ta.faculty.user:
                names.append(ta.faculty.user.get_full_name())
        return list(set(names))

    def get_applicable_grades(self, obj) -> str:
        if 'CS' in obj.code or 'PHY' in obj.code or 'CHEM' in obj.code:
            return 'Grades 11, 12'
        return 'Grades 10, 11, 12'

    def get_applicable_streams(self, obj) -> str:
        if 'CS' in obj.code:
            return 'Computer Science A'
        if 'BIO' in obj.code:
            return 'Bio-Maths B'
        if 'COMM' in obj.code:
            return 'Commerce C'
        return 'All Streams'


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for student section enrollment."""
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    class_id = serializers.UUIDField(source='section.school_class.id', read_only=True)
    class_name = serializers.CharField(source='section.school_class.name', read_only=True)
    grade_name = serializers.CharField(source='section.school_class.name', read_only=True)
    grade_level = serializers.SerializerMethodField()
    stream = serializers.SerializerMethodField()
    section_name = serializers.CharField(source='section.name', read_only=True)
    roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'section',
            'class_id',
            'class_name',
            'grade_name',
            'grade_level',
            'stream',
            'section_name',
            'roll_number',
            'academic_year',
            'academic_year_name',
            'enrolled_date',
            'status',
        ]
        read_only_fields = ['id', 'enrolled_date', 'student_id', 'student_name', 'class_id', 'class_name', 'grade_name', 'grade_level', 'stream', 'section_name', 'roll_number', 'academic_year_name']

    def get_student_name(self, obj) -> str:
        if obj.student and obj.student.user:
            return obj.student.user.get_full_name()
        return ''

    def get_grade_level(self, obj) -> int:
        if obj.section and obj.section.school_class:
            name = obj.section.school_class.name
            if '12' in name:
                return 12
            if '11' in name:
                return 11
            if '10' in name:
                return 10
        return 11

    def get_stream(self, obj) -> str:
        if obj.section and obj.section.school_class:
            name = obj.section.school_class.name
            if 'Computer Science' in name:
                return 'Computer Science A'
            if 'Bio-Maths' in name:
                return 'Bio-Maths B'
            if 'Commerce' in name:
                return 'Commerce C'
            if 'Pure Science' in name:
                return 'Pure Science D'
        return ''
