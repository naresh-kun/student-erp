"""
Student ERP — Academics Domain Service
Encapsulates academic structures, classes, sections, subjects, and course management.
"""

from typing import Optional
from django.db.models import QuerySet, Q
from common.services import BaseService
from apps.academics.models import (
    AcademicYear,
    SchoolClass,
    Section,
    Subject,
    Enrollment,
)


class AcademicService(BaseService):
    """
    Domain service for academic structure operations.
    """
    service_name = "academics"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}

    def get_classes_queryset(
        self,
        academic_year: Optional[str] = None,
        search: Optional[str] = None,
    ) -> QuerySet[SchoolClass]:
        """
        Returns optimized queryset of classes with academic year and sections prefetched.
        """
        qs = SchoolClass.objects.select_related('academic_year').prefetch_related(
            'sections__class_teacher__user',
            'sections__enrollments',
        ).all()

        if academic_year:
            qs = qs.filter(
                Q(academic_year__name=academic_year.strip())
                | Q(academic_year_id=academic_year.strip())
            )

        if search:
            search = search.strip()
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
            )

        return qs

    def get_sections_queryset(
        self,
        class_id: Optional[str] = None,
    ) -> QuerySet[Section]:
        """
        Returns optimized queryset of sections.
        """
        qs = Section.objects.select_related(
            'school_class',
            'school_class__academic_year',
            'class_teacher',
            'class_teacher__user',
        ).prefetch_related('enrollments').all()

        if class_id:
            qs = qs.filter(school_class_id=class_id)

        return qs

    def get_subjects_queryset(
        self,
        department: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> QuerySet[Subject]:
        """
        Returns optimized queryset of academic subjects.
        """
        qs = Subject.objects.all()

        if department:
            qs = qs.filter(department__iexact=department.strip())

        if is_active is not None:
            qs = qs.filter(is_active=is_active)

        if search:
            search = search.strip()
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(department__icontains=search)
            )

        return qs

    def get_academic_years_queryset(self) -> QuerySet[AcademicYear]:
        return AcademicYear.objects.all()
