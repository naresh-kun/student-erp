"""
Student ERP — Task 3.6 API Foundation Tests
Phase 3, Task 3.6: Initial REST API Foundation

Comprehensive test suite verifying:
1. Master API routing & URL resolution (/api/v1/ and /api/health/)
2. DRF serializers across accounts, students, academics, attendance, and marks
3. Standard response and error envelope compliance
4. Attendance 4-status validation & percentage calculations (Master Plan Amendment 2)
5. Marks 0-100 boundaries & CBSE 8-tier grading scale
6. Pagination and query filtering
7. DB integration tests (when PostgreSQL is active)
"""

import uuid
from decimal import Decimal
from datetime import date
import pytest
from django.urls import resolve, reverse
from django.conf import settings
from rest_framework import status, serializers
from rest_framework.test import APIRequestFactory, force_authenticate

# Common helpers & constants
from common.constants import (
    ATTENDANCE_STATUSES,
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_LEAVE,
    FORBIDDEN_ATTENDANCE_STATUSES,
    GRADE_A1,
    GRADE_A2,
    GRADE_B1,
    GRADE_B2,
    GRADE_C1,
    GRADE_C2,
    GRADE_D,
    GRADE_E,
)
from common.responses import success_response, error_response
from common.exceptions import (
    custom_exception_handler,
    DomainValidationError,
    BusinessLogicError,
    ResourceNotFoundError,
    PermissionDeniedError,
    InvalidAttendanceStatusError,
    ImmutableFieldMutationError,
)
from common.pagination import StandardResultsSetPagination

# App serializers
from apps.accounts.serializers import (
    RoleSerializer,
    UserSummarySerializer,
    ParentSerializer,
    ParentSummarySerializer,
    FacultySerializer,
    FacultySummarySerializer,
)
from apps.students.serializers import (
    StudentListSerializer,
    StudentDetailSerializer,
    StudentWriteSerializer,
)
from apps.academics.serializers import (
    AcademicYearSerializer,
    SchoolClassSerializer,
    SectionSerializer,
    SubjectSerializer,
    EnrollmentSerializer,
)
from apps.attendance.serializers import (
    AttendanceRecordSerializer,
    BulkAttendanceCreateSerializer,
    AttendanceBulkItemSerializer,
    LeaveApplicationSerializer,
)
from apps.marks.serializers import (
    ExamTypeSerializer,
    MarkSerializer,
    BulkMarkCreateSerializer,
    MarkBulkItemSerializer,
)

# App views
from common.views import HealthCheckView
from apps.accounts.views import (
    CurrentUserProfileView,
    ParentListView,
    ParentDetailView,
    ParentChildrenView,
    FacultyListView,
    FacultyDetailView,
)
from apps.students.views import StudentListView, StudentDetailView
from apps.academics.views import (
    ClassListView,
    ClassDetailView,
    ClassSectionsView,
    SubjectListView,
    SubjectDetailView,
    AcademicYearListView,
)
from apps.attendance.views import (
    AttendanceOverviewView,
    BulkAttendanceCreateView,
    AttendanceDetailView,
    StudentAbsenteesView,
    LeaveApplicationListView,
)
from apps.marks.views import (
    MarkListView,
    BulkMarkCreateView,
    MarkDetailView,
    ReportCardView,
    ExamTypeListView,
)

# App services
from apps.accounts.services import AccountService
from apps.students.services import StudentService
from apps.academics.services import AcademicService
from apps.attendance.services import AttendanceService
from apps.marks.services import MarksService


# ============================================================================
# 1. ROUTING & URL RESOLUTION TESTS
# ============================================================================

class TestApiRoutingTask36:
    """Verifies that all required REST endpoints resolve to the correct view classes."""

    def test_health_check_route_resolves(self):
        resolver = resolve('/api/health/')
        assert resolver.func.view_class == HealthCheckView
        assert resolver.url_name == 'health_check'

    def test_auth_me_route_resolves(self):
        resolver = resolve('/api/v1/auth/me/')
        assert resolver.func.view_class == CurrentUserProfileView
        assert resolver.url_name == 'current_user_profile'

    def test_students_routes_resolve(self):
        list_res = resolve('/api/v1/students/')
        assert list_res.func.view_class == StudentListView
        assert list_res.url_name == 'student_list'

        detail_res = resolve('/api/v1/students/STU202600001/')
        assert detail_res.func.view_class == StudentDetailView
        assert detail_res.url_name == 'student_detail'

    def test_parents_routes_resolve(self):
        list_res = resolve('/api/v1/parents/')
        assert list_res.func.view_class == ParentListView

        sample_uuid = str(uuid.uuid4())
        detail_res = resolve(f'/api/v1/parents/{sample_uuid}/')
        assert detail_res.func.view_class == ParentDetailView

        children_res = resolve(f'/api/v1/parents/{sample_uuid}/children/')
        assert children_res.func.view_class == ParentChildrenView

    def test_faculty_routes_resolve(self):
        list_res = resolve('/api/v1/faculty/')
        assert list_res.func.view_class == FacultyListView

        sample_uuid = str(uuid.uuid4())
        detail_res = resolve(f'/api/v1/faculty/{sample_uuid}/')
        assert detail_res.func.view_class == FacultyDetailView

    def test_classes_routes_resolve(self):
        list_res = resolve('/api/v1/classes/')
        assert list_res.func.view_class == ClassListView

        sample_uuid = str(uuid.uuid4())
        detail_res = resolve(f'/api/v1/classes/{sample_uuid}/')
        assert detail_res.func.view_class == ClassDetailView

        sections_res = resolve(f'/api/v1/classes/{sample_uuid}/sections/')
        assert sections_res.func.view_class == ClassSectionsView

    def test_subjects_routes_resolve(self):
        list_res = resolve('/api/v1/subjects/')
        assert list_res.func.view_class == SubjectListView

        sample_uuid = str(uuid.uuid4())
        detail_res = resolve(f'/api/v1/subjects/{sample_uuid}/')
        assert detail_res.func.view_class == SubjectDetailView

    def test_attendance_routes_resolve(self):
        overview_res = resolve('/api/v1/attendance/')
        assert overview_res.func.view_class == AttendanceOverviewView

        bulk_res = resolve('/api/v1/attendance/bulk/')
        assert bulk_res.func.view_class == BulkAttendanceCreateView

        absentees_res = resolve('/api/v1/attendance/absentees/')
        assert absentees_res.func.view_class == StudentAbsenteesView

        leaves_res = resolve('/api/v1/attendance/leaves/')
        assert leaves_res.func.view_class == LeaveApplicationListView

        sample_uuid = str(uuid.uuid4())
        detail_res = resolve(f'/api/v1/attendance/{sample_uuid}/')
        assert detail_res.func.view_class == AttendanceDetailView

    def test_marks_routes_resolve(self):
        list_res = resolve('/api/v1/marks/')
        assert list_res.func.view_class == MarkListView

        bulk_res = resolve('/api/v1/marks/bulk/')
        assert bulk_res.func.view_class == BulkMarkCreateView

        exam_types_res = resolve('/api/v1/marks/exam-types/')
        assert exam_types_res.func.view_class == ExamTypeListView

        report_card_res = resolve('/api/v1/marks/report-card/STU202600001/')
        assert report_card_res.func.view_class == ReportCardView

        sample_uuid = str(uuid.uuid4())
        detail_res = resolve(f'/api/v1/marks/{sample_uuid}/')
        assert detail_res.func.view_class == MarkDetailView


# ============================================================================
# 2. SERIALIZERS & VALIDATION TESTS
# ============================================================================

class TestSerializersTask36:
    """Verifies serializer validation rules and domain constraints."""

    def test_student_id_validation_logic(self):
        from common.utils import validate_student_id
        assert validate_student_id('STU202600001') is True
        assert validate_student_id('STU202400999') is True
        for invalid_id in ['INVALID123', 'STUDENT12345', 'STU20261', '12345', 'STU-2026-00001']:
            assert validate_student_id(invalid_id) is False

    def test_student_write_serializer_validation_method(self):
        serializer = StudentWriteSerializer()
        with pytest.raises(serializers.ValidationError):
            serializer.validate_student_id('INVALID_FORMAT')
        assert serializer.validate_student_id('STU202600001') == 'STU202600001'

    def test_subject_serializer_fields_and_weekly_periods(self):
        serializer = SubjectSerializer()
        assert 'weekly_periods' in serializer.fields
        assert 'credits' not in serializer.fields

    def test_attendance_serializer_validates_4_statuses(self):
        for valid_status in ATTENDANCE_STATUSES:
            item_data = {
                'student_id': 'STU202600001',
                'status': valid_status,
                'session_period': 1,
            }
            serializer = AttendanceBulkItemSerializer(data=item_data)
            assert serializer.is_valid(), f"Status {valid_status} should be valid: {serializer.errors}"

    def test_attendance_serializer_rejects_forbidden_legacy_statuses(self):
        for forbidden in FORBIDDEN_ATTENDANCE_STATUSES:
            item_data = {
                'student_id': 'STU202600001',
                'status': forbidden,
            }
            serializer = AttendanceBulkItemSerializer(data=item_data)
            assert not serializer.is_valid()
            assert 'status' in serializer.errors

    def test_bulk_attendance_create_serializer(self):
        data = {
            'date': '2026-09-30',
            'session_period': 1,
            'records': [
                {'student_id': 'STU202600001', 'status': 'PRESENT'},
                {'student_id': 'STU202600002', 'status': 'ABSENT'},
                {'student_id': 'STU202600003', 'status': 'ON_DUTY'},
                {'student_id': 'STU202600004', 'status': 'LEAVE'},
            ]
        }
        serializer = BulkAttendanceCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_marks_serializer_accepts_0_and_100(self):
        for valid_mark in [Decimal('0.00'), Decimal('50.50'), Decimal('100.00')]:
            item_data = {
                'student_id': 'STU202600001',
                'subject_id': uuid.uuid4(),
                'exam_type_id': uuid.uuid4(),
                'marks_obtained': valid_mark,
                'max_marks': Decimal('100.00'),
            }
            serializer = MarkBulkItemSerializer(data=item_data)
            assert serializer.is_valid(), f"Mark {valid_mark} should be valid: {serializer.errors}"

    def test_marks_serializer_rejects_negative_marks(self):
        item_data = {
            'student_id': 'STU202600001',
            'subject_id': uuid.uuid4(),
            'exam_type_id': uuid.uuid4(),
            'marks_obtained': Decimal('-5.00'),
            'max_marks': Decimal('100.00'),
        }
        serializer = MarkBulkItemSerializer(data=item_data)
        assert not serializer.is_valid()
        assert 'marks_obtained' in serializer.errors

    def test_marks_serializer_rejects_marks_exceeding_maximum(self):
        item_data = {
            'student_id': 'STU202600001',
            'subject_id': uuid.uuid4(),
            'exam_type_id': uuid.uuid4(),
            'marks_obtained': Decimal('105.00'),
            'max_marks': Decimal('100.00'),
        }
        serializer = MarkBulkItemSerializer(data=item_data)
        assert not serializer.is_valid()


# ============================================================================
# 3. RESPONSE & ERROR ENVELOPE TESTS
# ============================================================================

class TestEnvelopeFormatTask36:
    """Verifies standard envelope conformity for successes, errors, and pagination."""

    def test_success_response_structure(self):
        res = success_response(
            data={'item': 'value'},
            meta={'page': 1, 'page_size': 20, 'total_records': 1},
        )
        assert res.status_code == 200
        assert res.data['success'] is True
        assert res.data['data'] == {'item': 'value'}
        assert res.data['meta']['page'] == 1
        assert res.data['meta']['total_records'] == 1

    def test_error_response_structure(self):
        res = error_response(
            message="Validation error occurred",
            code="VALIDATION_ERROR",
            details=[{'field': 'student_id', 'error': 'Invalid format'}],
            status_code=422,
        )
        assert res.status_code == 422
        assert res.data['success'] is False
        assert res.data['error']['code'] == 'VALIDATION_ERROR'
        assert res.data['error']['message'] == 'Validation error occurred'
        assert res.data['error']['status_code'] == 422
        assert len(res.data['error']['details']) == 1

    def test_custom_exception_handler_catches_domain_exceptions(self):
        exc = DomainValidationError("Invalid value", code="INVALID_VALUE")
        res = custom_exception_handler(exc, context={})
        assert res is not None
        assert res.status_code == 422
        assert res.data['success'] is False
        assert res.data['error']['code'] == 'INVALID_VALUE'

    def test_custom_exception_handler_catches_django_validation_error(self):
        from django.core.exceptions import ValidationError as DjangoValidationError
        exc = DjangoValidationError({'student_id': ['Invalid format']})
        res = custom_exception_handler(exc, context={})
        assert res is not None
        assert res.status_code == 400
        assert res.data['success'] is False
        assert res.data['error']['code'] == 'VALIDATION_ERROR'

    def test_custom_exception_handler_catches_404(self):
        from django.http import Http404
        exc = Http404("Item not found")
        res = custom_exception_handler(exc, context={})
        assert res is not None
        assert res.status_code == 404
        assert res.data['success'] is False
        assert res.data['error']['code'] == 'NOT_FOUND'

    def test_pagination_envelope_structure(self):
        paginator = StandardResultsSetPagination()
        paginator.page = type('DummyPage', (), {
            'number': 1,
            'paginator': type('DummyPaginator', (), {'count': 50, 'num_pages': 3})(),
            'has_next': lambda self=None: True,
            'has_previous': lambda self=None: False,
        })()
        paginator.request = type('DummyRequest', (), {'query_params': {}})()
        res = paginator.get_paginated_response([{'id': 1}, {'id': 2}])
        assert res.data['success'] is True
        assert res.data['meta']['page'] == 1
        assert res.data['meta']['total_records'] == 50
        assert res.data['meta']['total_pages'] == 3
        assert res.data['meta']['has_next'] is True
        assert res.data['meta']['has_previous'] is False


# ============================================================================
# 4. ATTENDANCE & MARKS DOMAIN SERVICES TESTS
# ============================================================================

class TestDomainServicesLogicTask36:
    """Verifies domain service calculations (attendance percentage, CBSE grading, report card)."""

    def test_attendance_percentage_master_plan_amendment_2(self):
        """
        Formula:
        (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
        """
        from common.utils import calculate_attendance_percentage
        # 18 present, 2 on-duty, 3 absent, 1 leave = 20 / 24 * 100 = 83.33% -> 83.3%
        pct = calculate_attendance_percentage(
            present=18,
            absent=3,
            on_duty=2,
            leave=1,
        )
        assert pct == 83.3

    def test_cbse_8_tier_letter_grade_derivation(self):
        from common.utils import calculate_grade
        assert calculate_grade(95.0) == GRADE_A1
        assert calculate_grade(91.0) == GRADE_A1
        assert calculate_grade(85.0) == GRADE_A2
        assert calculate_grade(81.0) == GRADE_A2
        assert calculate_grade(75.0) == GRADE_B1
        assert calculate_grade(71.0) == GRADE_B1
        assert calculate_grade(65.0) == GRADE_B2
        assert calculate_grade(61.0) == GRADE_B2
        assert calculate_grade(55.0) == GRADE_C1
        assert calculate_grade(51.0) == GRADE_C1
        assert calculate_grade(45.0) == GRADE_C2
        assert calculate_grade(41.0) == GRADE_C2
        assert calculate_grade(35.0) == GRADE_D
        assert calculate_grade(33.0) == GRADE_D
        assert calculate_grade(32.9) == GRADE_E
        assert calculate_grade(0.0) == GRADE_E

    def test_cumulative_evaluation_calculation(self):
        from common.utils import calculate_cumulative_evaluation
        # 435 / 500 = 87.00% -> A2
        subject_evals = [
            {'marks_obtained': 90.0, 'max_marks': 100.0},
            {'marks_obtained': 85.0, 'max_marks': 100.0},
            {'marks_obtained': 88.0, 'max_marks': 100.0},
            {'marks_obtained': 92.0, 'max_marks': 100.0},
            {'marks_obtained': 80.0, 'max_marks': 100.0},
        ]
        result = calculate_cumulative_evaluation(subject_evals)
        assert result['total_obtained'] == 435.0
        assert result['total_max'] == 500.0
        assert result['percentage'] == 87.0
        assert result['grade'] == GRADE_A2
        assert result['is_passing'] is True


# ============================================================================
# 5. DB INTEGRATION TESTS (Require Live PostgreSQL)
# ============================================================================

def _is_db_available():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect(('localhost', 5432))
        s.close()
        return True
    except (socket.error, OSError):
        return False

db_available = pytest.mark.skipif(
    not _is_db_available(),
    reason="PostgreSQL not running on localhost:5432 (live DB required for integration tests)"
)


@db_available
@pytest.mark.django_db
class TestApiIntegrationDBTask36:
    """Full API endpoints integration test against PostgreSQL database."""

    @pytest.fixture
    def api_factory(self):
        return APIRequestFactory()

    @pytest.fixture
    def seed_academic_structure(self):
        from apps.accounts.models import Role, User, Faculty
        from apps.students.models import Student
        from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment

        admin_role, _ = Role.objects.get_or_create(name='Admin')
        faculty_role, _ = Role.objects.get_or_create(name='Faculty')
        student_role, _ = Role.objects.get_or_create(name='Student')

        admin_user = User.objects.create_superuser(
            username='admin_api_test',
            email='admin@erp.test',
            password='testpassword123',
            role=admin_role,
        )

        teacher_user = User.objects.create_user(
            username='teacher_api_test',
            email='teacher@erp.test',
            password='testpassword123',
            role=faculty_role,
            first_name='Ananya',
            last_name='Sharma',
        )
        faculty = Faculty.objects.create(
            user=teacher_user,
            employee_code='FAC_API_001',
            department='Mathematics',
            designation='PGT Mathematics',
            joining_date=date(2020, 6, 1),
        )

        ay = AcademicYear.objects.create(
            name='2026-2027',
            start_date=date(2026, 6, 1),
            end_date=date(2027, 4, 30),
            is_current=True,
        )
        school_class = SchoolClass.objects.create(
            academic_year=ay,
            name='Grade 11 - Computer Science',
            code='G11-CS',
        )
        section = Section.objects.create(
            school_class=school_class,
            name='A1',
            room='Room 101',
            capacity=35,
            class_teacher=faculty,
        )
        subject = Subject.objects.create(
            name='Mathematics',
            code='MATH11',
            department='Mathematics',
            weekly_periods=6,
        )

        stu_user = User.objects.create_user(
            username='student_api_test',
            email='student@erp.test',
            password='testpassword123',
            role=student_role,
            first_name='Arjun',
            last_name='Reddy',
        )
        student = Student.objects.create(
            user=stu_user,
            student_id='STU202600001',
            admission_number='ADM2026001',
            roll_number='11-A1-01',
            date_of_birth=date(2009, 5, 14),
            gender='Male',
            emergency_contact='+91 9876543210',
            address='Bengaluru, Karnataka',
            status='Enrolled',
        )
        enrollment = Enrollment.objects.create(
            student=student,
            section=section,
            academic_year=ay,
            status='Enrolled',
        )

        return {
            'admin_user': admin_user,
            'faculty': faculty,
            'student': student,
            'enrollment': enrollment,
            'academic_year': ay,
            'school_class': school_class,
            'section': section,
            'subject': subject,
        }

    def test_student_list_and_detail_api(self, api_factory, seed_academic_structure):
        data = seed_academic_structure
        view = StudentListView.as_view()
        req = api_factory.get('/api/v1/students/')
        force_authenticate(req, user=data['admin_user'])
        res = view(req)

        assert res.status_code == status.HTTP_200_OK
        assert res.data['success'] is True
        assert len(res.data['data']) >= 1

        # Test detail view
        detail_view = StudentDetailView.as_view()
        detail_req = api_factory.get(f'/api/v1/students/{data["student"].student_id}/')
        force_authenticate(detail_req, user=data['admin_user'])
        detail_res = detail_view(detail_req, pk=data['student'].student_id)

        assert detail_res.status_code == status.HTTP_200_OK
        assert detail_res.data['data']['student_id'] == 'STU202600001'

    def test_bulk_attendance_and_percentage_calculation_api(self, api_factory, seed_academic_structure):
        data = seed_academic_structure
        view = BulkAttendanceCreateView.as_view()

        payload = {
            'date': '2026-09-30',
            'session_period': 1,
            'records': [
                {
                    'student_id': data['student'].student_id,
                    'status': 'PRESENT',
                    'remarks': 'On time',
                }
            ]
        }
        req = api_factory.post('/api/v1/attendance/bulk/', data=payload, format='json')
        force_authenticate(req, user=data['admin_user'])
        res = view(req)

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['success'] is True
        assert res.data['data']['saved_count'] == 1

        # Query overview and verify percentage
        overview_view = AttendanceOverviewView.as_view()
        over_req = api_factory.get(f'/api/v1/attendance/?student_id={data["student"].student_id}')
        force_authenticate(over_req, user=data['admin_user'])
        over_res = overview_view(over_req)

        assert over_res.status_code == status.HTTP_200_OK
        assert over_res.data['meta']['attendance_summary']['attendance_percentage'] == 100.0

    def test_bulk_marks_and_report_card_api(self, api_factory, seed_academic_structure):
        from apps.marks.models import ExamType
        data = seed_academic_structure
        exam_type = ExamType.objects.create(name='Midterm Exam', weightage=Decimal('100.00'))

        view = BulkMarkCreateView.as_view()
        payload = {
            'records': [
                {
                    'student_id': data['student'].student_id,
                    'subject_id': str(data['subject'].id),
                    'exam_type_id': str(exam_type.id),
                    'marks_obtained': '92.50',
                    'max_marks': '100.00',
                    'remarks': 'Excellent mastery',
                }
            ]
        }
        req = api_factory.post('/api/v1/marks/bulk/', data=payload, format='json')
        force_authenticate(req, user=data['admin_user'])
        res = view(req)

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['success'] is True
        assert res.data['data']['records'][0]['grade'] == GRADE_A1

        # Test report card endpoint
        report_view = ReportCardView.as_view()
        rep_req = api_factory.get(f'/api/v1/marks/report-card/{data["student"].student_id}/')
        force_authenticate(rep_req, user=data['admin_user'])
        rep_res = report_view(rep_req, student_id=data['student'].student_id)

        assert rep_res.status_code == status.HTTP_200_OK
        assert rep_res.data['data']['overall_grade'] == GRADE_A1
        assert rep_res.data['data']['overall_percentage'] == 92.5
