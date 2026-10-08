"""
Student ERP — Allocation DRF Serializers
Serializer-layer contract for student section allocation and Class Teacher allocation workflows.
"""

from rest_framework import serializers
from apps.academics.models import Enrollment, Section, AcademicYear, TeachingAssignment
from apps.accounts.models import Faculty
from apps.students.models import Student


class StudentAllocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Student Section Allocation Register.
    Matches frontend StudentAllocationItem contract.
    """
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    grade_level = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    stream = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()
    roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    academic_year = serializers.CharField(source='academic_year.name', read_only=True)
    academic_year_id = serializers.UUIDField(source='academic_year.id', read_only=True)
    allocation_status = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'student_id',
            'student_name',
            'grade_level',
            'grade_name',
            'stream',
            'section',
            'section_name',
            'roll_number',
            'academic_year',
            'academic_year_id',
            'allocation_status',
            'status',
        ]
        read_only_fields = ['id']

    def get_student_name(self, obj) -> str:
        return obj.student.user.get_full_name() if obj.student and obj.student.user else ''

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

    def get_grade_name(self, obj) -> str:
        if obj.section and obj.section.school_class:
            return obj.section.school_class.name
        return '—'

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

    def get_section(self, obj):
        if self.get_allocation_status(obj) == 'Unassigned' or not obj.section:
            return None
        return str(obj.section_id) if obj.section_id else None

    def get_section_name(self, obj) -> str:
        if self.get_allocation_status(obj) == 'Unassigned' or not obj.section:
            return '—'
        sec_name = obj.section.name or ''
        if sec_name.startswith('Section '):
            return sec_name
        return f"Section {sec_name}"

    def get_allocation_status(self, obj) -> str:
        if obj.status in ('Enrolled', 'Active', 'ACTIVE', 'enrolled') and obj.section:
            return 'Allocated'
        return 'Unassigned'

    def get_status(self, obj) -> str:
        return self.get_allocation_status(obj)


class StudentAllocationUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating student section placement.
    Student ID is immutable and cannot be altered.
    """
    section_id = serializers.UUIDField(required=False, allow_null=True)
    section_name = serializers.CharField(required=False, allow_blank=True)
    roll_number = serializers.CharField(required=False, allow_blank=True)

    def validate_section_id(self, value):
        if not value:
            return value
        try:
            section = Section.objects.select_related('school_class').get(pk=value)
        except Section.DoesNotExist:
            raise serializers.ValidationError("Target section does not exist.")
        return value


class ClassTeacherAllocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Class Teacher Allocation Register.
    Matches frontend ClassTeacherAllocationItem contract.
    """
    section_id = serializers.UUIDField(source='id', read_only=True)
    faculty_id = serializers.SerializerMethodField()
    faculty_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    subjects = serializers.SerializerMethodField()
    academic_year = serializers.SerializerMethodField()
    academic_year_id = serializers.SerializerMethodField()
    grade_level = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    stream = serializers.SerializerMethodField()
    section_name = serializers.CharField(source='name', read_only=True)
    is_assigned = serializers.SerializerMethodField()
    assignment_status = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id',
            'section_id',
            'faculty_id',
            'faculty_name',
            'employee_code',
            'designation',
            'subjects',
            'academic_year',
            'academic_year_id',
            'grade_level',
            'grade_name',
            'stream',
            'section_name',
            'room',
            'capacity',
            'is_assigned',
            'assignment_status',
            'status',
        ]
        read_only_fields = ['id', 'section_id']

    def get_faculty_id(self, obj):
        return str(obj.class_teacher_id) if obj.class_teacher_id else None

    def get_faculty_name(self, obj) -> str:
        if obj.class_teacher and obj.class_teacher.user:
            return obj.class_teacher.user.get_full_name()
        return 'Unassigned'

    def get_employee_code(self, obj) -> str:
        return obj.class_teacher.employee_code if obj.class_teacher else '—'

    def get_designation(self, obj) -> str:
        return obj.class_teacher.designation if obj.class_teacher else '—'

    def get_subjects(self, obj) -> list:
        if not obj.class_teacher:
            return []
        return list(
            TeachingAssignment.objects.filter(
                faculty=obj.class_teacher, is_active=True
            ).values_list('subject__name', flat=True).distinct()
        )

    def get_academic_year(self, obj) -> str:
        ay = obj.academic_year or (obj.school_class.academic_year if obj.school_class else None)
        return ay.name if ay else '2026-2027'

    def get_academic_year_id(self, obj):
        ay = obj.academic_year or (obj.school_class.academic_year if obj.school_class else None)
        return str(ay.id) if ay else None

    def get_grade_level(self, obj) -> int:
        if obj.school_class:
            name = obj.school_class.name
            if '12' in name:
                return 12
            if '11' in name:
                return 11
            if '10' in name:
                return 10
        return 11

    def get_grade_name(self, obj) -> str:
        return obj.school_class.name if obj.school_class else '—'

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

    def get_is_assigned(self, obj) -> bool:
        return bool(obj.class_teacher_id)

    def get_assignment_status(self, obj) -> str:
        return 'Assigned' if obj.class_teacher_id else 'Unassigned'

    def get_status(self, obj) -> str:
        return self.get_assignment_status(obj)


class ClassTeacherAllocationUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating/clearing Class Teacher assignment.
    """
    faculty_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_faculty_id(self, value):
        if value:
            try:
                Faculty.objects.get(pk=value)
            except Faculty.DoesNotExist:
                raise serializers.ValidationError("Faculty record does not exist.")
        return value

