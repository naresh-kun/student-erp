"""
Student ERP — Homework Domain Serializers (MOD_001)
Provides list, detail, and write serializers for the Homework entity.
"""

from rest_framework import serializers
from apps.homework.models import Homework
from apps.academics.models import Section, Subject, SchoolClass, AcademicYear


class HomeworkListSerializer(serializers.ModelSerializer):
    """List serializer for Homework items."""
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    faculty_name = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()

    class Meta:
        model = Homework
        fields = [
            'id',
            'title',
            'status',
            'assigned_date',
            'due_date',
            'school_class_id',
            'class_name',
            'section_id',
            'section_name',
            'subject_id',
            'subject_name',
            'subject_code',
            'faculty_id',
            'faculty_name',
            'faculty',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_faculty_name(self, obj) -> str:
        if obj.faculty and obj.faculty.user:
            return obj.faculty.user.get_full_name()
        return ''

    def get_faculty(self, obj) -> dict:
        if obj.faculty and obj.faculty.user:
            return {
                'id': str(obj.faculty.id),
                'employee_code': obj.faculty.employee_code,
                'name': obj.faculty.user.get_full_name(),
                'email': obj.faculty.user.email,
            }
        return None


class HomeworkDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for Homework item including instructions/description."""
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    faculty_name = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Homework
        fields = [
            'id',
            'title',
            'description',
            'status',
            'assigned_date',
            'due_date',
            'academic_year_id',
            'academic_year_name',
            'school_class_id',
            'class_name',
            'section_id',
            'section_name',
            'subject_id',
            'subject_name',
            'subject_code',
            'faculty_id',
            'faculty_name',
            'faculty',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_faculty_name(self, obj) -> str:
        if obj.faculty and obj.faculty.user:
            return obj.faculty.user.get_full_name()
        return ''

    def get_faculty(self, obj) -> dict:
        if obj.faculty and obj.faculty.user:
            return {
                'id': str(obj.faculty.id),
                'employee_code': obj.faculty.employee_code,
                'name': obj.faculty.user.get_full_name(),
                'email': obj.faculty.user.email,
            }
        return None


class HomeworkWriteSerializer(serializers.Serializer):
    """
    Serializer for creating and updating Homework records.
    Derives faculty author server-side; validates section, class, and subject.
    """
    title = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    section_id = serializers.UUIDField(required=True)
    subject_id = serializers.UUIDField(required=True)
    class_id = serializers.UUIDField(required=False, allow_null=True)
    academic_year_id = serializers.UUIDField(required=False, allow_null=True)
    faculty_id = serializers.UUIDField(required=False, allow_null=True)
    assigned_date = serializers.DateField(required=False)
    due_date = serializers.DateField(required=False, allow_null=True)
    status = serializers.ChoiceField(
        choices=Homework.STATUS_CHOICES,
        default=Homework.STATUS_PUBLISHED,
        required=False,
    )

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = dict(data)
            if 'section' in data and 'section_id' not in data:
                data['section_id'] = data['section']
            if 'subject' in data and 'subject_id' not in data:
                data['subject_id'] = data['subject']
            if 'school_class' in data and 'class_id' not in data:
                data['class_id'] = data['school_class']
            elif 'class' in data and 'class_id' not in data:
                data['class_id'] = data['class']
            if 'academic_year' in data and 'academic_year_id' not in data:
                data['academic_year_id'] = data['academic_year']
            if 'faculty' in data and 'faculty_id' not in data:
                data['faculty_id'] = data['faculty']
        return super().to_internal_value(data)

    def validate(self, attrs):
        section_id = attrs.get('section_id')
        section = Section.objects.select_related('school_class__academic_year').filter(id=section_id).first()
        if not section:
            raise serializers.ValidationError({'section_id': 'Specified section does not exist.'})

        subject_id = attrs.get('subject_id')
        subject = Subject.objects.filter(id=subject_id).first()
        if not subject:
            raise serializers.ValidationError({'subject_id': 'Specified subject does not exist.'})

        school_class = section.school_class
        academic_year = school_class.academic_year if school_class else None

        if attrs.get('class_id') and str(attrs['class_id']) != str(school_class.id):
            raise serializers.ValidationError({'class_id': 'Provided class_id does not match the section.'})

        if attrs.get('academic_year_id') and academic_year and str(attrs['academic_year_id']) != str(academic_year.id):
            raise serializers.ValidationError({'academic_year_id': 'Provided academic_year_id does not match the class.'})

        assigned_date = attrs.get('assigned_date')
        due_date = attrs.get('due_date')
        if assigned_date and due_date and due_date < assigned_date:
            raise serializers.ValidationError({'due_date': 'Due date cannot be earlier than assigned date.'})

        attrs['resolved_section'] = section
        attrs['resolved_subject'] = subject
        attrs['resolved_school_class'] = school_class
        attrs['resolved_academic_year'] = academic_year

        return attrs
