"""
Student ERP — Homework Domain Service (MOD_001)
Encapsulates business logic, teaching-scope verification, and lifecycle operations for Homework.
"""

from typing import Any, Dict, Optional
from django.db.models import QuerySet, Q
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from common.services import BaseService
from common.authorization import AuthorizationService
from common.constants import ROLE_ADMIN, ROLE_FACULTY
from apps.homework.models import Homework
from apps.academics.models import TeachingAssignment, Section, Subject, SchoolClass, AcademicYear


class HomeworkService(BaseService):
    """Authoritative domain service for Homework management."""
    service_name = "homework"

    def get_homework_queryset(
        self,
        user: Any,
        filters: Optional[Dict[str, Any]] = None,
    ) -> QuerySet:
        """
        Retrieves scoped homework queryset for the given user,
        applying query parameter filters before serialization.
        """
        qs = Homework.objects.select_related(
            'faculty__user',
            'school_class',
            'section',
            'subject',
            'academic_year',
        ).all()

        qs = AuthorizationService.filter_queryset_for_user(qs, user, domain='homework')

        if not filters:
            return qs

        if filters.get('section_id'):
            qs = qs.filter(section_id=filters['section_id'])

        if filters.get('class_id'):
            qs = qs.filter(school_class_id=filters['class_id'])

        if filters.get('subject_id'):
            qs = qs.filter(subject_id=filters['subject_id'])

        if filters.get('status'):
            status_val = filters['status'].upper()
            if status_val in dict(Homework.STATUS_CHOICES):
                qs = qs.filter(status=status_val)

        if filters.get('due_date_from'):
            qs = qs.filter(due_date__gte=filters['due_date_from'])

        if filters.get('due_date_to'):
            qs = qs.filter(due_date__lte=filters['due_date_to'])

        if filters.get('search'):
            query = str(filters['search']).strip()
            qs = qs.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(subject__name__icontains=query)
                | Q(subject__code__icontains=query)
            )

        return qs

    def create_homework(
        self,
        creator_user: Any,
        validated_data: Dict[str, Any],
    ) -> Homework:
        """
        Creates a new Homework record after authoritative teaching-scope verification.
        Creator identity is derived strictly from request.user -> faculty_profile.
        """
        role = AuthorizationService.get_user_role(creator_user)
        section = validated_data['resolved_section']
        subject = validated_data['resolved_subject']
        school_class = validated_data['resolved_school_class']
        academic_year = validated_data['resolved_academic_year']

        if role == ROLE_FACULTY:
            faculty = getattr(creator_user, 'faculty_profile', None)
            if not faculty:
                raise PermissionDenied("Faculty profile not found.")

            # Strict teaching assignment verification:
            # Class Teacher alone does NOT grant subject authority.
            has_assignment = TeachingAssignment.objects.filter(
                faculty=faculty,
                section=section,
                subject=subject,
                is_active=True,
            ).exists()

            if not has_assignment:
                raise PermissionDenied(
                    "Faculty is not authorized to assign homework for this subject and section. "
                    "An active Subject Faculty Teaching Assignment is required."
                )

            target_faculty = faculty

        elif role == ROLE_ADMIN:
            # Admin can specify faculty or use section class teacher or teaching faculty
            if validated_data.get('faculty_id'):
                from apps.accounts.models import Faculty
                target_faculty = Faculty.objects.filter(id=validated_data['faculty_id']).first()
                if not target_faculty:
                    raise PermissionDenied("Specified faculty does not exist.")
            else:
                # Resolve from teaching assignment or section class teacher
                assignment = TeachingAssignment.objects.filter(
                    section=section,
                    subject=subject,
                    is_active=True,
                ).first()
                if assignment:
                    target_faculty = assignment.faculty
                elif section.class_teacher:
                    target_faculty = section.class_teacher
                else:
                    raise PermissionDenied("A faculty creator must be assigned to the section or specified.")
        else:
            raise PermissionDenied("Only Faculty and Admin roles can create homework.")

        assigned_date = validated_data.get('assigned_date') or timezone.now().date()
        due_date = validated_data.get('due_date')
        status = validated_data.get('status', Homework.STATUS_PUBLISHED)

        homework = Homework(
            title=validated_data['title'],
            description=validated_data['description'],
            faculty=target_faculty,
            academic_year=academic_year,
            school_class=school_class,
            section=section,
            subject=subject,
            assigned_date=assigned_date,
            due_date=due_date,
            status=status,
        )
        homework.full_clean()
        homework.save()
        return homework

    def update_homework(
        self,
        user: Any,
        homework: Homework,
        validated_data: Dict[str, Any],
    ) -> Homework:
        """
        Updates an existing Homework record after object-level permission check.
        Faculty can only update homework they authored.
        """
        if not AuthorizationService.can_access_object(user, homework, action='update'):
            raise PermissionDenied("You do not have permission to update this homework.")

        if 'title' in validated_data:
            homework.title = validated_data['title']
        if 'description' in validated_data:
            homework.description = validated_data['description']
        if 'due_date' in validated_data:
            homework.due_date = validated_data['due_date']
        if 'status' in validated_data:
            homework.status = validated_data['status']

        homework.full_clean()
        homework.save()
        return homework

    def delete_homework(
        self,
        user: Any,
        homework: Homework,
    ) -> None:
        """
        Deletes a Homework record after object-level permission check.
        Faculty can only delete homework they authored.
        """
        if not AuthorizationService.can_access_object(user, homework, action='delete'):
            raise PermissionDenied("You do not have permission to delete this homework.")

        homework.delete()
