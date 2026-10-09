"""
Student ERP — Marks DRF Serializers
Serializer-layer contract for marks, exam types, bulk marks entry, and report cards.
Strictly adheres to CBSE/ICSE 8-tier letter grading scale (A1, A2, B1, B2, C1, C2, D, E).
Purges university terms (GPA, CGPA, credits).
"""

from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from apps.marks.models import ExamType, Mark
from common.utils import calculate_grade, calculate_percentage


class ExamTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for ExamType.
    Validates name uniqueness, non-empty bounds, and weightage ranges (0-100).
    """
    class Meta:
        model = ExamType
        fields = ['id', 'name', 'weightage', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Exam type name cannot be blank.")
        # Check uniqueness during update/create
        instance = self.instance
        qs = ExamType.objects.filter(name__iexact=cleaned)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An exam type with this name already exists.")
        return cleaned

    def validate_weightage(self, value):
        if value < Decimal('0.00') or value > Decimal('100.00'):
            raise serializers.ValidationError("Exam weightage must be between 0.00 and 100.00 percent.")
        return value


class MarkSerializer(serializers.ModelSerializer):
    """
    Serializer for Mark evaluation records.
    Supports numeric marks (0–100) and 'AB' for absent students.
    """
    student_id = serializers.CharField(source='enrollment.student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    evaluated_by_name = serializers.SerializerMethodField()
    marks_obtained = serializers.CharField(required=False)

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

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            if 'marks_obtained' in data and data['marks_obtained'] is not None:
                data['marks_obtained'] = str(data['marks_obtained'])
        return super().to_internal_value(data)

    def validate_marks_obtained(self, value):
        if value is None or value == '':
            return value
        val_str = str(value).strip()
        if val_str.upper() == 'AB':
            return 'AB'
        try:
            dec_val = Decimal(val_str)
        except (ValueError, TypeError, InvalidOperation):
            raise serializers.ValidationError("Marks obtained must be a number between 0 and 100, or 'AB'.")
        if dec_val < Decimal('0'):
            raise serializers.ValidationError("Marks obtained cannot be negative.")
        if dec_val > Decimal('100.00'):
            raise serializers.ValidationError("Marks obtained cannot exceed 100.00.")
        return dec_val

    def validate(self, attrs):
        marks_obtained = attrs.get('marks_obtained', getattr(self.instance, 'marks_obtained', None))
        max_marks = attrs.get('max_marks', getattr(self.instance, 'max_marks', Decimal('100.00')))

        if max_marks is not None and max_marks <= Decimal('0'):
            raise serializers.ValidationError({'max_marks': 'Maximum marks must be greater than zero.'})

        if marks_obtained is not None and max_marks is not None and marks_obtained != 'AB':
            try:
                dec_obtained = Decimal(str(marks_obtained))
            except (ValueError, TypeError, InvalidOperation):
                raise serializers.ValidationError({'marks_obtained': "Marks obtained must be a number between 0 and 100, or 'AB'."})
            if dec_obtained < Decimal('0'):
                raise serializers.ValidationError({'marks_obtained': 'Marks obtained cannot be negative.'})
            if dec_obtained > max_marks:
                raise serializers.ValidationError({
                    'marks_obtained': f"Marks obtained ({marks_obtained}) cannot exceed maximum marks ({max_marks})."
                })

        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if getattr(instance, 'grade', '') == 'AB':
            ret['marks_obtained'] = 'AB'
        return ret

    def update(self, instance, validated_data):
        marks_obtained = validated_data.get('marks_obtained')
        if marks_obtained == 'AB':
            validated_data['marks_obtained'] = Decimal('0.00')
            validated_data['grade'] = 'AB'
        elif marks_obtained is not None:
            validated_data['marks_obtained'] = Decimal(str(marks_obtained))
            max_m = validated_data.get('max_marks', instance.max_marks or Decimal('100.00'))
            pct = calculate_percentage(float(validated_data['marks_obtained']), float(max_m))
            validated_data['grade'] = calculate_grade(pct)
        return super().update(instance, validated_data)


class MarkBulkItemSerializer(serializers.Serializer):
    """Single student mark entry within bulk submission."""
    student_id = serializers.CharField(required=False)
    enrollment_id = serializers.UUIDField(required=False)
    subject_id = serializers.CharField()
    exam_type_id = serializers.CharField()
    marks_obtained = serializers.CharField(required=True)
    max_marks = serializers.DecimalField(max_digits=5, decimal_places=2, default=Decimal('100.00'), required=False)
    remarks = serializers.CharField(required=False, allow_blank=True, default='')

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            if 'subject_id' in data and data['subject_id'] is not None:
                data['subject_id'] = str(data['subject_id'])
            if 'exam_type_id' in data and data['exam_type_id'] is not None:
                data['exam_type_id'] = str(data['exam_type_id'])
            if 'marks_obtained' in data and data['marks_obtained'] is not None:
                data['marks_obtained'] = str(data['marks_obtained'])
        return super().to_internal_value(data)

    def validate_marks_obtained(self, value):
        if value is None or value == '':
            raise serializers.ValidationError("Marks obtained is required.")
        val_str = str(value).strip()
        if val_str.upper() == 'AB':
            return 'AB'
        try:
            dec_val = Decimal(val_str)
        except (ValueError, TypeError, InvalidOperation):
            raise serializers.ValidationError("Marks obtained must be a number between 0 and 100, or 'AB'.")
        if dec_val < Decimal('0'):
            raise serializers.ValidationError("Marks obtained cannot be negative.")
        if dec_val > Decimal('100.00'):
            raise serializers.ValidationError("Marks obtained cannot exceed 100.00.")
        return dec_val

    def validate(self, attrs):
        if not attrs.get('student_id') and not attrs.get('enrollment_id'):
            raise serializers.ValidationError("Either 'student_id' or 'enrollment_id' must be provided.")
        marks_obtained = attrs.get('marks_obtained')
        max_marks = attrs.get('max_marks', Decimal('100.00'))
        if max_marks <= Decimal('0'):
            raise serializers.ValidationError({'max_marks': 'Maximum marks must be greater than zero.'})
        if marks_obtained != 'AB' and marks_obtained is not None:
            try:
                dec_obtained = Decimal(str(marks_obtained))
            except (ValueError, TypeError, InvalidOperation):
                raise serializers.ValidationError({'marks_obtained': "Marks obtained must be a number between 0 and 100, or 'AB'."})
            if dec_obtained > max_marks:
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
