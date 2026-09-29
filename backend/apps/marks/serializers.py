"""
Student ERP — Marks DRF Serializers (Scaffolding)
Serializer-layer contract for marks and evaluation registers.
"""

from rest_framework import serializers


class ExamTypeSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    weightage = serializers.DecimalField(max_digits=5, decimal_places=2, default=100.00)


class MarkSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    student_id = serializers.CharField()
    subject_code = serializers.CharField()
    exam_type_name = serializers.CharField()
    marks_obtained = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    is_absent = serializers.BooleanField(default=False)
    max_marks = serializers.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    grade = serializers.CharField()
    remarks = serializers.CharField(required=False, allow_blank=True)
