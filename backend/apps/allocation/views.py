"""
Student ERP — Allocation DRF Views
Provides operational allocation endpoints:
- Student Section Allocation (List, Update, Delete)
- Class Teacher Allocation (List, Update, Delete)
"""

from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.exceptions import ValidationError, PermissionDenied

from common.constants import (
    PERM_ALLOCATION_VIEW,
    PERM_ALLOCATION_UPDATE_STUDENT_SECTION,
    PERM_ALLOCATION_DELETE_STUDENT_SECTION,
    PERM_ALLOCATION_UPDATE_CLASS_TEACHER,
    PERM_ALLOCATION_DELETE_CLASS_TEACHER,
)
from common.permissions import HasRequiredPermission, require_permission
from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.academics.models import Enrollment, Section, SchoolClass, AcademicYear
from apps.accounts.models import Faculty
from apps.students.models import Student
from apps.allocation.serializers import (
    StudentAllocationSerializer,
    StudentAllocationUpdateSerializer,
    ClassTeacherAllocationSerializer,
    ClassTeacherAllocationUpdateSerializer,
)


class AllocationOverviewView(APIView):
    """
    GET /api/v1/allocation/
    Provides operational allocation overview.
    Permitted: Admin, Principal, Faculty (PERM_ALLOCATION_VIEW).
    Forbidden: Student, Parent (403 Forbidden).
    """
    permission_classes = [require_permission(PERM_ALLOCATION_VIEW)]

    def get(self, request, *args, **kwargs):
        return success_response(
            data={
                'domain': 'allocation',
                'endpoints': {
                    'students': '/api/v1/allocation/students/',
                    'class_teachers': '/api/v1/allocation/class-teachers/',
                },
            }
        )


class StudentAllocationListView(APIView):
    """
    GET /api/v1/allocation/students/
    Lists student section allocations with filters.
    Permitted: Admin, Principal, Faculty (view-only).
    """
    permission_classes = [require_permission(PERM_ALLOCATION_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        qs = Enrollment.objects.select_related(
            'student__user',
            'section__school_class',
            'academic_year',
        ).all().order_by('-academic_year__start_date', 'student__student_id')

        search = request.query_params.get('search')
        grade = request.query_params.get('grade')
        stream = request.query_params.get('stream')
        section_name = request.query_params.get('section')
        academic_year = request.query_params.get('academic_year')

        if search:
            search = search.strip()
            qs = qs.filter(
                Q(student__student_id__icontains=search)
                | Q(student__user__first_name__icontains=search)
                | Q(student__user__last_name__icontains=search)
                | Q(student__roll_number__icontains=search)
                | Q(section__name__icontains=search)
            )

        if grade and grade != 'ALL':
            qs = qs.filter(section__school_class__name__icontains=grade.strip())

        if stream and stream != 'ALL':
            qs = qs.filter(section__school_class__name__icontains=stream.strip())

        if section_name and section_name != 'ALL':
            qs = qs.filter(section__name__icontains=section_name.strip())

        if academic_year:
            qs = qs.filter(
                Q(academic_year__name=academic_year.strip())
                | Q(academic_year_id=academic_year.strip())
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = StudentAllocationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = StudentAllocationSerializer(qs, many=True)
        return success_response(data=serializer.data)


class StudentAllocationDetailView(APIView):
    """
    PATCH /api/v1/allocation/students/{student_id}/
    DELETE /api/v1/allocation/students/{student_id}/
    Operational student section allocation management.
    Permitted: Admin, Principal (Faculty is strictly view-only, returns 403).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'PATCH': PERM_ALLOCATION_UPDATE_STUDENT_SECTION,
        'DELETE': PERM_ALLOCATION_DELETE_STUDENT_SECTION,
    }

    def _resolve_student(self, student_id: str) -> Student:
        student = Student.objects.filter(student_id__iexact=student_id.strip()).first()
        if not student:
            # Fallback to UUID pk if not matched by student_id
            try:
                student = Student.objects.get(pk=student_id)
            except Exception:
                raise get_object_or_404(Student, student_id=student_id)
        return student

    def patch(self, request, student_id, *args, **kwargs):
        student = self._resolve_student(student_id)
        serializer = StudentAllocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        section_id = serializer.validated_data.get('section_id')
        section_name = serializer.validated_data.get('section_name')
        target_section = None

        if section_id:
            target_section = Section.objects.select_related('school_class__academic_year').filter(pk=section_id).first()
        elif section_name:
            clean_name = section_name.replace('Section', '').strip()
            target_section = Section.objects.select_related('school_class__academic_year').filter(
                Q(name__iexact=clean_name) | Q(name__iexact=section_name.strip())
            ).first()

        if target_section:
            academic_year = target_section.academic_year or target_section.school_class.academic_year

            # Update or create active Enrollment for this student and academic year
            enrollment, _ = Enrollment.objects.get_or_create(
                student=student,
                academic_year=academic_year,
                defaults={
                    'section': target_section,
                    'status': 'Enrolled',
                }
            )
            enrollment.section = target_section
            enrollment.status = 'Enrolled'
            enrollment.save()
        else:
            enrollment = student.enrollments.filter(status='Enrolled').first() or student.enrollments.first()

        # Update roll number if provided
        roll_number = serializer.validated_data.get('roll_number')
        if roll_number:
            student.roll_number = roll_number.strip()
            student.save(update_fields=['roll_number'])

        return success_response(
            data=StudentAllocationSerializer(enrollment).data if enrollment else {},
            message=f"Student {student.student_id} allocation updated.",
        )

    def delete(self, request, student_id, *args, **kwargs):
        student = self._resolve_student(student_id)
        enrollment = student.enrollments.filter(status='Enrolled').first() or student.enrollments.first()
        if enrollment:
            enrollment.status = 'Unassigned'
            enrollment.save(update_fields=['status'])

        return success_response(
            data={
                "student_id": student.student_id,
                "allocation_status": "Unassigned",
                "section_name": "—",
            },
            message=f"Student {student.student_id} marked as Unassigned.",
        )


class ClassTeacherAllocationListView(APIView):
    """
    GET /api/v1/allocation/class-teachers/
    Lists Class Teacher allocations across sections.
    Permitted: Admin, Principal, Faculty (view-only).
    """
    permission_classes = [require_permission(PERM_ALLOCATION_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        qs = Section.objects.select_related(
            'school_class',
            'school_class__academic_year',
            'academic_year',
            'class_teacher__user',
        ).all().order_by('school_class__name', 'name')

        search = request.query_params.get('search')
        grade = request.query_params.get('grade')
        stream = request.query_params.get('stream')
        academic_year = request.query_params.get('academic_year')

        if search:
            search = search.strip()
            qs = qs.filter(
                Q(class_teacher__user__first_name__icontains=search)
                | Q(class_teacher__user__last_name__icontains=search)
                | Q(class_teacher__employee_code__icontains=search)
                | Q(school_class__name__icontains=search)
                | Q(name__icontains=search)
            )

        if grade and grade != 'ALL':
            qs = qs.filter(school_class__name__icontains=grade.strip())

        if stream and stream != 'ALL':
            qs = qs.filter(school_class__name__icontains=stream.strip())

        if academic_year:
            qs = qs.filter(
                Q(academic_year__name=academic_year.strip())
                | Q(school_class__academic_year__name=academic_year.strip())
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = ClassTeacherAllocationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ClassTeacherAllocationSerializer(qs, many=True)
        return success_response(data=serializer.data)


class ClassTeacherAllocationDetailView(APIView):
    """
    PATCH /api/v1/allocation/class-teachers/{section_id}/
    DELETE /api/v1/allocation/class-teachers/{section_id}/
    Operational Class Teacher assignment governance.
    Permitted: Admin, Principal (Faculty is strictly view-only, returns 403).
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'PATCH': PERM_ALLOCATION_UPDATE_CLASS_TEACHER,
        'DELETE': PERM_ALLOCATION_DELETE_CLASS_TEACHER,
    }

    def patch(self, request, section_id, *args, **kwargs):
        section = get_object_or_404(
            Section.objects.select_related('school_class__academic_year', 'academic_year'),
            pk=section_id,
        )
        serializer = ClassTeacherAllocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        faculty_id = serializer.validated_data.get('faculty_id')
        if faculty_id:
            faculty = Faculty.objects.select_related('user').get(pk=faculty_id)
            ay = section.academic_year or (section.school_class.academic_year if section.school_class else None)

            # Enforce 1 Class Teacher assignment per Faculty member per academic year invariant
            if ay:
                existing = Section.objects.filter(
                    school_class__academic_year=ay,
                    class_teacher=faculty,
                ).exclude(pk=section.pk).first()
                if existing:
                    raise ValidationError(
                        f"Faculty member {faculty.user.get_full_name()} is already assigned as Class Teacher "
                        f"for {existing} in Academic Year {ay.name}."
                    )

            section.class_teacher = faculty
            section.save()
            return success_response(
                data=ClassTeacherAllocationSerializer(section).data,
                message=f"Faculty member {faculty.user.get_full_name()} assigned as Class Teacher for {section}.",
            )
        else:
            section.class_teacher = None
            section.save()
            return success_response(
                data=ClassTeacherAllocationSerializer(section).data,
                message=f"Class Teacher removed for {section}.",
            )

    def delete(self, request, section_id, *args, **kwargs):
        section = get_object_or_404(Section, pk=section_id)
        section.class_teacher = None
        section.save()
        return success_response(
            data=ClassTeacherAllocationSerializer(section).data,
            message=f"Class Teacher assignment removed for {section}.",
        )

