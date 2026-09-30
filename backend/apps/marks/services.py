"""
Student ERP — Marks Domain Service
Encapsulates examination and academic evaluation calculations and report card generation.
Strictly adheres to CBSE/ICSE 8-tier letter grading (A1, A2, B1, B2, C1, C2, D, E).
"""

from typing import Optional, List, Dict, Any
from decimal import Decimal
from django.db.models import QuerySet, Q
from common.services import BaseService
from common.utils import calculate_grade, calculate_percentage, calculate_cumulative_evaluation
from common.exceptions import ResourceNotFoundError
from apps.marks.models import Mark, ExamType
from apps.academics.models import Enrollment, Subject
from apps.students.models import Student
from apps.accounts.models import Faculty


class MarksService(BaseService):
    """
    Domain service for marks and evaluation operations.
    """
    service_name = "marks"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}

    def get_marks_queryset(
        self,
        student_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        exam_type_id: Optional[str] = None,
        class_id: Optional[str] = None,
        section_id: Optional[str] = None,
    ) -> QuerySet[Mark]:
        """
        Returns optimized queryset of marks with related entities selected.
        """
        qs = Mark.objects.select_related(
            'enrollment',
            'enrollment__student',
            'enrollment__student__user',
            'enrollment__section',
            'enrollment__section__school_class',
            'subject',
            'exam_type',
            'evaluated_by',
            'evaluated_by__user',
        ).all()

        if student_id:
            student_id = student_id.strip()
            qs = qs.filter(
                Q(enrollment__student__student_id=student_id)
                | Q(enrollment__student_id=student_id)
            )

        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        if exam_type_id:
            qs = qs.filter(exam_type_id=exam_type_id)

        if class_id:
            qs = qs.filter(enrollment__section__school_class_id=class_id)

        if section_id:
            qs = qs.filter(enrollment__section_id=section_id)

        return qs

    def record_bulk_marks(
        self,
        records: List[Dict[str, Any]],
        evaluated_by: Optional[Faculty] = None,
    ) -> List[Mark]:
        """
        Persists a batch of marks within an atomic transaction.
        Derives grade deterministically and updates or creates records.
        """
        saved_records = []
        with self.atomic():
            for item in records:
                marks_obtained = Decimal(str(item['marks_obtained']))
                max_marks = Decimal(str(item.get('max_marks', '100.00')))
                remarks = item.get('remarks', '')

                # Resolve enrollment
                enrollment = None
                if item.get('enrollment_id'):
                    enrollment = Enrollment.objects.get(pk=item['enrollment_id'])
                elif item.get('student_id'):
                    student_id = item['student_id'].strip()
                    student = Student.objects.get(
                        Q(student_id=student_id) | Q(id=student_id)
                    )
                    enrollment = Enrollment.objects.filter(student=student).first()
                    if not enrollment:
                        self.raise_business_error(f"No active enrollment found for student {student_id}")

                subject = Subject.objects.get(pk=item['subject_id'])
                exam_type = ExamType.objects.get(pk=item['exam_type_id'])

                # Derive grade
                pct = calculate_percentage(float(marks_obtained), float(max_marks))
                derived_grade = calculate_grade(pct)

                mark_record, _ = Mark.objects.update_or_create(
                    enrollment=enrollment,
                    subject=subject,
                    exam_type=exam_type,
                    defaults={
                        'marks_obtained': marks_obtained,
                        'max_marks': max_marks,
                        'grade': derived_grade,
                        'remarks': remarks,
                        'evaluated_by': evaluated_by,
                    },
                )
                saved_records.append(mark_record)

        return saved_records

    def generate_report_card(
        self,
        student_id: str,
        academic_year_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Computes cumulative marks, overall percentage, 8-tier letter grade, and subject breakdown.
        """
        student_id = student_id.strip()
        student = Student.objects.select_related('user').filter(
            Q(student_id=student_id) | Q(id=student_id)
        ).first()

        if not student:
            raise ResourceNotFoundError(f"Student '{student_id}' not found.")

        # Find active enrollment
        enrollment_qs = Enrollment.objects.select_related(
            'section',
            'section__school_class',
            'academic_year',
        ).filter(student=student)

        if academic_year_id:
            enrollment_qs = enrollment_qs.filter(academic_year_id=academic_year_id)

        enrollment = enrollment_qs.first()
        if not enrollment:
            raise ResourceNotFoundError(f"No enrollment found for student '{student_id}'.")

        marks_qs = Mark.objects.select_related('subject', 'exam_type').filter(enrollment=enrollment)

        mark_items = []
        for m in marks_qs:
            mark_items.append({
                'id': str(m.id),
                'subject_id': str(m.subject.id),
                'subject_code': m.subject.code,
                'subject_name': m.subject.name,
                'exam_type': m.exam_type.name,
                'marks_obtained': float(m.marks_obtained),
                'max_marks': float(m.max_marks),
                'percentage': calculate_percentage(float(m.marks_obtained), float(m.max_marks)),
                'grade': m.grade or calculate_grade(calculate_percentage(float(m.marks_obtained), float(m.max_marks))),
                'remarks': m.remarks,
            })

        # Calculate cumulative totals
        cumulative_eval = calculate_cumulative_evaluation(mark_items)

        return {
            'student_id': student.student_id,
            'student_name': student.user.get_full_name(),
            'admission_number': student.admission_number,
            'roll_number': student.roll_number,
            'academic_year': enrollment.academic_year.name if enrollment.academic_year else '',
            'class_name': enrollment.section.school_class.name if enrollment.section and enrollment.section.school_class else '',
            'section_name': enrollment.section.name if enrollment.section else '',
            'total_marks_obtained': round(total_obtained, 2),
            'total_max_marks': round(total_max, 2),
            'overall_percentage': cumulative_eval['percentage'],
            'overall_grade': cumulative_eval['grade'],
            'subject_count': len(mark_items),
            'marks': mark_items,
        }
