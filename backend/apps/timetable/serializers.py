"""
Student ERP — Timetable DRF Serializers (Phase 6 Task 6.1)
Provides serialization and input validation for TimetableSlot records.
"""

from rest_framework import serializers

from apps.academics.models import Section, Subject
from apps.accounts.models import Faculty
from apps.timetable.models import TimetableSlot, DAYS_OF_WEEK


class TimetableSlotSerializer(serializers.ModelSerializer):
    """
    Serializer for TimetableSlot representation in list and detail responses.
    Includes resolved metadata for Section, SchoolClass, AcademicYear, Subject, and Faculty.
    """
    section_name = serializers.CharField(source='section.name', read_only=True)
    class_id = serializers.UUIDField(source='section.school_class.id', read_only=True)
    class_name = serializers.CharField(source='section.school_class.name', read_only=True)
    academic_year_id = serializers.UUIDField(source='academic_year.id', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    faculty_name = serializers.SerializerMethodField()
    faculty_employee_code = serializers.CharField(source='faculty.employee_code', read_only=True)

    class Meta:
        model = TimetableSlot
        fields = [
            'id',
            'section',
            'section_name',
            'class_id',
            'class_name',
            'academic_year_id',
            'academic_year_name',
            'subject',
            'subject_name',
            'subject_code',
            'faculty',
            'faculty_name',
            'faculty_employee_code',
            'day_of_week',
            'period_number',
            'start_time',
            'end_time',
            'room_number',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_faculty_name(self, obj) -> str:
        if not obj.faculty or not obj.faculty.user:
            return ""
        name = obj.faculty.user.get_full_name()
        return name if name.strip() else obj.faculty.employee_code


TimetableSlotListSerializer = TimetableSlotSerializer


class TimetableSlotDetailSerializer(TimetableSlotSerializer):
    """
    Detailed serializer for TimetableSlot with full nested object information.
    """
    class Meta(TimetableSlotSerializer.Meta):
        pass


class TimetableSlotWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer for TimetableSlot creation and updates.
    Enforces required relationships, day bounds, and time validity.
    """
    section = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(),
        help_text="UUID of the assigned section.",
    )
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        help_text="UUID of the taught subject.",
    )
    faculty = serializers.PrimaryKeyRelatedField(
        queryset=Faculty.objects.all(),
        help_text="UUID of the assigned faculty member.",
    )
    day_of_week = serializers.ChoiceField(
        choices=DAYS_OF_WEEK,
        help_text="Day of the week (e.g. 'Monday').",
    )
    period_number = serializers.IntegerField(
        min_value=1,
        help_text="Period index for the day (positive integer >= 1).",
    )
    start_time = serializers.TimeField(
        help_text="Period start time (HH:MM:SS or HH:MM).",
    )
    end_time = serializers.TimeField(
        help_text="Period end time (HH:MM:SS or HH:MM).",
    )
    room_number = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        max_length=64,
        help_text="Optional room or classroom identifier.",
    )

    class Meta:
        model = TimetableSlot
        fields = [
            'id',
            'section',
            'subject',
            'faculty',
            'day_of_week',
            'period_number',
            'start_time',
            'end_time',
            'room_number',
        ]
        read_only_fields = ['id']
        validators = []

    def validate(self, attrs):
        start = attrs.get('start_time') or (self.instance.start_time if self.instance else None)
        end = attrs.get('end_time') or (self.instance.end_time if self.instance else None)
        if start and end and start >= end:
            raise serializers.ValidationError({
                'end_time': "Start time must strictly precede end time."
            })
        return attrs
