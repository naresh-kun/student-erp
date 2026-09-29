"""
Student ERP — Students DRF Serializers (Scaffolding)
Serializer-layer contract for student records and directories.
"""

from rest_framework import serializers


class StudentSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    student_id = serializers.CharField()
    admission_number = serializers.CharField()
    roll_number = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    gender = serializers.CharField()
    status = serializers.CharField()


class StudentDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    student_id = serializers.CharField()
    admission_number = serializers.CharField()
    roll_number = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    date_of_birth = serializers.DateField()
    gender = serializers.CharField()
    blood_group = serializers.CharField(required=False, allow_blank=True)
    emergency_contact = serializers.CharField()
    address = serializers.CharField()
    status = serializers.CharField()
