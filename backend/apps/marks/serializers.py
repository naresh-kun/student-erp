"""
Student ERP — Marks DRF Serializers
Serializer-layer contract for marks, exam types, bulk marks entry, and report cards.
Strictly adheres to CBSE/ICSE 8-tier letter grading scale (A1, A2, B1, B2, C1, C2, D, E).
Purges university terms (GPA, CGPA, credits).
"""

from decimal import Decimal
from rest_framework import serializers
from apps.marks.models import ExamType, Mark
from common.utils import calculate_grade, calculate_percentage


class ExamTypeSerializer(serializers.ModelSerializer):
    """Serializer for ExamType."""
    class Meta:
        model = ExamType
        fields = ['id', 'name', 'weightage', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class MarkSerializer(serializers.ModelSerializer):
    """
    Serializer for Mark evaluation records.
    """
    student_id = serializers.CharField(source='enrollment.student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    evaluated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Mark
        fields = [
            'id',
            'enrollment',
            'student_id',
            'student_name',
            'subject',
            'subject_code',
            'subject_name',
            'exam_type',
            'exam_type_name',
            'marks_obtained',
            'max_marks',
            'grade',
            'remarks',
            'evaluated_by',
            'evaluated_by_name',
            'evaluated_at',
            'created_at',
        ]
        read_only_fields = ['id', 'grade', 'evaluated_at', 'created_at']

    def get_student_name(self, obj) -> str:
        if obj.enrollment and obj.enrollment.student and obj.enrollment.student.user:
            return obj.enrollment.student.user.get_full_name()
        return ''

    def get_evaluated_by_name(self, obj) -> str:
        if obj.evaluated_by and obj.evaluated_by.user:
            return obj.evaluated_by.user.get_full_name()
        return ''

    def validate_marks_obtained(self, value: Decimal) -> Decimal:
        if value < Decimal('0'):
            raise serializers.ValidationError("Marks obtained cannot be negative.")
        if value > Decimal('100.00'):
            raise serializers.ValidationError("Marks obtained cannot exceed 100.00.")
        return value

    def validate(self, attrs):
        marks_obtained = attrs.get('marks_obtained', getattr(self.instance, 'marks_obtained', None))
        max_marks = attrs.get('max_marks', getattr(self.instance, 'max_marks', Decimal('100.00')))

        if max_marks is not None and max_marks <= Decimal('0'):
            raise serializers.ValidationError({'max_marks': 'Maximum marks must be greater than zero.'})

        if marks_obtained is not None and max_marks is not None:
            if marks_obtained < Decimal('0'):
                raise serializers.ValidationError({'marks_obtained': 'Marks obtained cannot be negative.'})
            if marks_obtained > max_marks:
                raise serializers.ValidationError({
                    'marks_obtained': f"Marks obtained ({marks_obtained}) cannot exceed maximum marks ({max_marks})."
                })

        return attrs


class MarkBulkItemSerializer(serializers.Serializer):
    """Single student mark entry within bulk submission."""
    student_id = serializers.CharField(required=False)
    enrollment_id = serializers.UUIDField(required=False)
    subject_id = serializers.UUIDField()
    exam_type_id = serializers.UUIDField()
    marks_obtained = serializers.DecimalField(max_digits=5, decimal_places=2)
    max_marks = serializers.DecimalField(max_digits=5, decimal_places=2, default=Decimal('100.00'))
    remarks = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_marks_obtained(self, value: Decimal) -> Decimal:
        if value < Decimal('0'):
            raise serializers.ValidationError("Marks obtained cannot be negative.")
        if value > Decimal('100.00'):
            raise serializers.ValidationError("Marks obtained cannot exceed 100.00.")
        return value

    def validate(self, attrs):
        if not attrs.get('student_id') and not attrs.get('enrollment_id'):
            raise serializers.ValidationError("Either 'student_id' or 'enrollment_id' must be provided.")
        marks_obtained = attrs.get('marks_obtained')
        max_marks = attrs.get('max_marks', Decimal('100.00'))
        if max_marks <= Decimal('0'):
            raise serializers.ValidationError({'max_marks': 'Maximum marks must be greater than zero.'})
        if marks_obtained is not None and marks_obtained > max_marks:
            raise serializers.ValidationError({
                'marks_obtained': f"Marks obtained ({marks_obtained}) cannot exceed maximum marks ({max_marks})."
            })
        return attrs


class BulkMarkCreateSerializer(serializers.Serializer):
    """Bulk marks recording payload serializer."""
    records = MarkBulkItemSerializer(many=True)

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = dict(data)
            if 'records' not in data and 'marks' in data:
                data['records'] = data['marks']
        return super().to_internal_value(data)

    def validate(self, attrs):
        if not attrs.get('records'):
            raise serializers.ValidationError({'records': 'At least one mark record must be provided.'})
        return attrs
