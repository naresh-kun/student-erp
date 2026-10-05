"""
Student ERP — Development Seed Data Command
Populates a reproducible, synthetic, deterministic development dataset.
Idempotent and transactionally safe: safe to execute multiple times.
Covers all 13 concrete models across accounts, students, academics, attendance, and marks.
"""

from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from apps.accounts.models import Role, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import ExamType, Mark
from common.constants import (
    ALL_ROLES,
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_LEAVE,
)
from common.utils import calculate_grade, calculate_percentage, format_student_id

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds deterministic, synthetic development data for Student ERP (Idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Initiating Student ERP development data seeding..."))

        # 1. Roles
        roles = {}
        for role_name in ALL_ROLES:
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': f'System role for {role_name}.'}
            )
            roles[role_name] = role
            status_str = "Created" if created else "Retained"
            self.stdout.write(f"  [Role] {role_name}: {status_str}")

        # 2. Users & Profiles
        # Admin User
        admin_user, _ = User.objects.get_or_create(
            username='admin_demo',
            defaults={
                'email': 'admin@school.edu.in',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': roles[ROLE_ADMIN],
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('demo123')
        admin_user.save()

        # Principal User
        principal_user, _ = User.objects.get_or_create(
            username='principal_demo',
            defaults={
                'email': 'principal@school.edu.in',
                'first_name': 'Dr. K.',
                'last_name': 'Radhakrishnan',
                'role': roles[ROLE_PRINCIPAL],
            }
        )
        principal_user.set_password('demo123')
        principal_user.save()

        # Faculty User (R. Suresh)
        faculty_user, _ = User.objects.get_or_create(
            username='faculty_suresh',
            defaults={
                'email': 'suresh.r@school.edu.in',
                'first_name': 'R.',
                'last_name': 'Suresh',
                'role': roles[ROLE_FACULTY],
            }
        )
        faculty_user.set_password('demo123')
        faculty_user.save()

        faculty_profile, _ = Faculty.objects.get_or_create(
            user=faculty_user,
            defaults={
                'employee_code': 'FAC2026001',
                'department': 'Computer Science',
                'designation': 'PGT Computer Science',
                'joining_date': date(2018, 6, 1),
                'qualification': 'M.Tech Computer Science',
                'office_room': 'Lab 2',
            }
        )

        # Parent User (S. Ramanathan)
        parent_user, _ = User.objects.get_or_create(
            username='parent_ramanathan',
            defaults={
                'email': 'ramanathan.s@gmail.com',
                'first_name': 'S.',
                'last_name': 'Ramanathan',
                'role': roles[ROLE_PARENT],
                'phone': '9840012345',
            }
        )
        parent_user.set_password('demo123')
        parent_user.save()

        parent_profile, _ = Parent.objects.get_or_create(
            user=parent_user,
            defaults={
                'relation': 'Father',
                'occupation': 'Senior Software Engineer',
                'address': 'Flat 4B, Shanthi Apts, T. Nagar, Chennai 600017',
            }
        )

        # Student User (Arun Kumar)
        student_user, _ = User.objects.get_or_create(
            username='student_arun',
            defaults={
                'email': 'arun.kumar@student.school.edu.in',
                'first_name': 'Arun',
                'last_name': 'Kumar',
                'role': roles[ROLE_STUDENT],
            }
        )
        student_user.set_password('demo123')
        student_user.save()

        student_id_str = format_student_id(2026, 1)  # STU202600001
        student_profile, _ = Student.objects.get_or_create(
            user=student_user,
            defaults={
                'parent': parent_profile,
                'student_id': student_id_str,
                'admission_number': 'ADM20240091',
                'roll_number': '11-A2-04',
                'date_of_birth': date(2009, 5, 14),
                'gender': 'Male',
                'blood_group': 'O+',
                'emergency_contact': '9840012345',
                'address': 'No. 42, Anna Nagar West, Chennai, Tamil Nadu - 600040',
                'status': 'Enrolled',
            }
        )

        # 3. Academic Structure
        academic_year, _ = AcademicYear.objects.get_or_create(
            name='2026-2027',
            defaults={
                'start_date': date(2026, 6, 1),
                'end_date': date(2027, 3, 31),
                'is_current': True,
            }
        )

        school_class, _ = SchoolClass.objects.get_or_create(
            academic_year=academic_year,
            code='G11-CS',
            defaults={
                'name': 'Grade 11 - Computer Science',
            }
        )

        section, _ = Section.objects.get_or_create(
            school_class=school_class,
            name='A2',
            defaults={
                'room': 'Room 302',
                'capacity': 35,
                'class_teacher': faculty_profile,
            }
        )

        subjects_data = [
            ('Computer Science', 'CS101', 'Computer Science', 5),
            ('Mathematics', 'MATH101', 'Mathematics', 5),
            ('Physics', 'PHY101', 'Physics', 4),
            ('English Core', 'ENG101', 'English', 4),
        ]
        created_subjects = {}
        for sub_name, sub_code, sub_dept, sub_periods in subjects_data:
            sub, _ = Subject.objects.get_or_create(
                code=sub_code,
                defaults={
                    'name': sub_name,
                    'department': sub_dept,
                    'weekly_periods': sub_periods,
                }
            )
            created_subjects[sub_code] = sub

        enrollment, _ = Enrollment.objects.get_or_create(
            student=student_profile,
            academic_year=academic_year,
            defaults={
                'section': section,
                'status': 'Active',
            }
        )

        # 4. Attendance Data
        base_date = date.today() - timedelta(days=5)
        attendance_samples = [
            (base_date, 1, ATTENDANCE_STATUS_PRESENT, None),
            (base_date + timedelta(days=1), 1, ATTENDANCE_STATUS_PRESENT, None),
            (base_date + timedelta(days=2), 1, ATTENDANCE_STATUS_ON_DUTY, None),
            (base_date + timedelta(days=3), 1, ATTENDANCE_STATUS_LEAVE, faculty_profile),
            (base_date + timedelta(days=4), 1, ATTENDANCE_STATUS_ABSENT, None),
        ]
        for att_date, period, att_status, app_fac in attendance_samples:
            Attendance.objects.get_or_create(
                enrollment=enrollment,
                date=att_date,
                session_period=period,
                defaults={
                    'status': att_status,
                    'recorded_by': faculty_user,
                    'approved_by_faculty': app_fac,
                    'remarks': f"Synthetic {att_status} entry for demo.",
                }
            )

        # Leave Application
        LeaveApplication.objects.get_or_create(
            student=student_profile,
            start_date=base_date + timedelta(days=3),
            end_date=base_date + timedelta(days=3),
            defaults={
                'leave_type': 'Medical',
                'reason': 'High fever and doctor advised rest.',
                'status': 'APPROVED',
                'reviewed_by': faculty_profile,
                'reviewed_at': base_date + timedelta(days=2),
                'review_remarks': 'Approved medical leave request.',
            }
        )

        # 5. Marks Data
        midterm_exam, _ = ExamType.objects.get_or_create(
            name='Half-Yearly Examination 2026',
            defaults={'weightage': Decimal('50.00'), 'is_active': True}
        )

        marks_data = [
            ('CS101', Decimal('92.00'), Decimal('100.00')),
            ('MATH101', Decimal('88.50'), Decimal('100.00')),
            ('PHY101', Decimal('84.00'), Decimal('100.00')),
            ('ENG101', Decimal('90.00'), Decimal('100.00')),
        ]
        for sub_code, obtained, max_m in marks_data:
            sub = created_subjects[sub_code]
            pct = calculate_percentage(float(obtained), float(max_m))
            derived_grade = calculate_grade(pct)
            Mark.objects.get_or_create(
                enrollment=enrollment,
                subject=sub,
                exam_type=midterm_exam,
                defaults={
                    'marks_obtained': obtained,
                    'max_marks': max_m,
                    'grade': derived_grade,
                    'evaluated_by': faculty_profile,
                    'remarks': 'Evaluated by HOD.',
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Student ERP development dataset!"))
