"""
Student ERP — Students Domain Service
Encapsulates student profile lifecycle, directory filters, and lookup interfaces.
"""

from typing import Optional
import uuid
from django.db.models import QuerySet, Q
from django.shortcuts import get_object_or_404
from common.services import BaseService
from common.exceptions import ResourceNotFoundError
from apps.students.models import Student


class StudentService(BaseService):
    """
    Domain service for student operations.
    """
    service_name = "students"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}

    def get_students_queryset(
        self,
        class_id: Optional[str] = None,
        section_id: Optional[str] = None,
        academic_year: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> QuerySet[Student]:
        """
        Returns an optimized queryset of students matching filter parameters.
        Applies select_related and prefetch_related to eliminate N+1 queries.
        """
        qs = Student.objects.select_related(
            'user',
            'parent',
            'parent__user',
        ).prefetch_related(
            'enrollments__section__school_class',
            'enrollments__academic_year',
        ).all()

        if status:
            qs = qs.filter(status=status.strip())

        if class_id:
            qs = qs.filter(enrollments__section__school_class_id=class_id)

        if section_id:
            qs = qs.filter(enrollments__section_id=section_id)

        if academic_year:
            qs = qs.filter(
                Q(enrollments__academic_year__name=academic_year.strip())
                | Q(enrollments__academic_year_id=academic_year.strip())
            )

        if search:
            search = search.strip()
            qs = qs.filter(
                Q(student_id__icontains=search)
                | Q(admission_number__icontains=search)
                | Q(roll_number__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
            )

        return qs.distinct()

    def get_student_by_id_or_business_id(self, identifier: str) -> Student:
        """
        Finds a student by UUID PK or business identifier (student_id / admission_number).
        """
        identifier = str(identifier).strip()
        qs = Student.objects.select_related('user', 'parent', 'parent__user').prefetch_related(
            'enrollments__section__school_class',
            'enrollments__academic_year',
        )

        # Check if valid UUID
        try:
            uuid_obj = uuid.UUID(identifier)
            student = qs.filter(id=uuid_obj).first()
            if student:
                return student
        except (ValueError, AttributeError):
            pass

        # Match by student_id or admission_number
        student = qs.filter(Q(student_id=identifier) | Q(admission_number=identifier)).first()
        if not student:
            raise ResourceNotFoundError(f"Student with identifier '{identifier}' was not found.")

        return student
