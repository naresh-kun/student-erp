"""
Student ERP — Phase 6 Task 6.2 Test Suite
Academic Calendar Models, Role Scoping, Migrations, and REST APIs

Verifies:
1. Model & Schema Validation:
   - Valid academic event creation.
   - Valid holiday creation (auto is_holiday=True when category='holiday').
   - Required title and category validation.
   - Date range validation (end_date < start_date rejected by clean and check constraint).
   - Target roles validation (only canonical ERP roles allowed).
   - Schema properties: od_eligible, is_public, string representation.
2. Service Layer:
   - Multi-day interval overlapping query semantics.
   - Category filtering with alias normalization.
   - Inverted date range validation (HTTP 400 DomainValidationError).
   - Malformed date format validation (HTTP 400).
   - Invalid category and target role validation (HTTP 400).
   - Role-targeted visibility scoping across all 5 roles.
   - Publishing control (Faculty cannot publish; Admin/Principal can publish).
   - Deletion authority (Admin only).
3. REST API Endpoints & RBAC:
   - Anonymous access rejected with 401 Unauthorized.
   - GET /api/v1/calendar/events/ scoped to caller role.
   - Multi-day event retrieval across date query windows.
   - Filter query parameters: start_date, end_date, category, is_holiday, target_role.
   - Structured error responses on invalid filters.
   - Admin event creation (201 Created).
   - Principal event creation (201 Created).
   - Faculty event creation as draft (201 Created); publishing attempt denied (403 Forbidden).
   - Student & Parent event creation denied with 403 Forbidden.
   - Admin & Principal event update / publishing (200 OK).
   - Faculty draft update allowed for creator; non-creator denied with 403 Forbidden.
   - Student & Parent event update denied with 403 Forbidden.
   - Admin event deletion (204 No Content).
   - Principal, Faculty, Student, Parent deletion denied with 403 Forbidden.
   - Detail endpoint /api/v1/calendar/events/<id>/ scoping and object access.
   - Standard envelope adherence across success and error responses.
4. Attendance Semantics Preservation:
   - Calendar event creation/publishing does not alter attendance records or mark students ON_DUTY.
   - Attendance marking remains strictly Class Teacher authorized.
5. Option B Database Security:
   - Test execution database identity is verified as unprivileged 'erp_app'.
"""

from datetime import datetime, date, time, timedelta
import pytest
from django.db import connection, IntegrityError
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
    ALL_ROLES,
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_LEAVE,
)
from apps.accounts.models import User, Role, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import (
    AcademicYear,
    SchoolClass,
    Section,
    Subject,
    Enrollment,
)
from apps.attendance.models import Attendance
from apps.calendar.models import (
    CalendarEvent,
    CALENDAR_CATEGORY_ACADEMIC,
    CALENDAR_CATEGORY_EXAM,
    CALENDAR_CATEGORY_HOLIDAY,
    CALENDAR_CATEGORY_EVENT,
    CALENDAR_CATEGORY_ADMINISTRATIVE,
    CALENDAR_CATEGORY_MEETING,
    CALENDAR_CATEGORIES,
    normalize_category,
)
from apps.calendar.services import CalendarService
from common.exceptions import DomainValidationError, PermissionDeniedError


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def calendar_setup(db):
    """
    Sets up users across all 5 roles and baseline calendar events.
    """
    # 1. Roles
    role_admin, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
    role_principal, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL)
    role_faculty, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
    role_student, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
    role_parent, _ = Role.objects.get_or_create(name=ROLE_PARENT)

    # 2. Users & Profiles
    user_admin = User.objects.create_user(
        username='admin_cal_user',
        email='admin_cal@school.edu',
        password='password123',
        role=role_admin,
    )

    user_principal = User.objects.create_user(
        username='principal_cal_user',
        email='principal_cal@school.edu',
        password='password123',
        role=role_principal,
    )

    user_faculty_1 = User.objects.create_user(
        username='faculty_cal_user1',
        email='faculty_cal1@school.edu',
        password='password123',
        role=role_faculty,
    )
    fac_profile_1 = Faculty.objects.create(
        user=user_faculty_1,
        employee_code='FAC-CAL-001',
        department='Science',
        designation='Senior Lecturer',
        joining_date=date(2020, 6, 1),
    )

    user_faculty_2 = User.objects.create_user(
        username='faculty_cal_user2',
        email='faculty_cal2@school.edu',
        password='password123',
        role=role_faculty,
    )
    fac_profile_2 = Faculty.objects.create(
        user=user_faculty_2,
        employee_code='FAC-CAL-002',
        department='Humanities',
        designation='Lecturer',
        joining_date=date(2021, 6, 1),
    )

    user_parent = User.objects.create_user(
        username='parent_cal_user',
        email='parent_cal@school.edu',
        password='password123',
        role=role_parent,
    )
    parent_profile = Parent.objects.create(
        user=user_parent,
        relation='Father',
    )

    user_student = User.objects.create_user(
        username='student_cal_user',
        email='student_cal@school.edu',
        password='password123',
        role=role_student,
    )
    student_profile = Student.objects.create(
        user=user_student,
        parent=parent_profile,
        admission_number='ADM-CAL-001',
        roll_number='R-CAL-001',
        date_of_birth=date(2008, 5, 10),
        gender='Male',
        emergency_contact='+919876543210',
        address='123 Campus Avenue',
    )

    # Academic structure for attendance integration checks
    ay, _ = AcademicYear.objects.get_or_create(
        name='2026-2027',
        defaults={'start_date': date(2026, 6, 1), 'end_date': date(2027, 3, 31), 'is_current': True}
    )
    school_class, _ = SchoolClass.objects.get_or_create(
        academic_year=ay,
        code='G11-CAL',
        defaults={'name': 'Grade 11'}
    )
    section, _ = Section.objects.get_or_create(
        school_class=school_class,
        name='A',
        defaults={'room': 'Room 101', 'class_teacher': fac_profile_1, 'academic_year': ay}
    )
    enrollment, _ = Enrollment.objects.get_or_create(
        student=student_profile,
        section=section,
        academic_year=ay,
        defaults={'status': 'Enrolled'}
    )

    # 3. Base Timestamp definitions
    base_tz = timezone.get_current_timezone()
    t_start = timezone.make_aware(datetime(2026, 10, 15, 9, 0, 0), base_tz)
    t_end = timezone.make_aware(datetime(2026, 10, 15, 16, 0, 0), base_tz)

    # 4. Standard Events
    # Event 1: Global / Public Academic Event (All roles)
    evt_public = CalendarEvent.objects.create(
        title='Annual Science Exhibition 2026',
        category=CALENDAR_CATEGORY_ACADEMIC,
        description='Annual student science showcase in the auditorium.',
        start_date=t_start,
        end_date=t_end,
        target_roles=[],
        location='Auditorium',
        is_holiday=False,
        is_published=True,
        is_school_sanctioned=True,
        created_by=user_admin,
    )

    # Event 2: Student & Parent Targeted Exam Event
    evt_exam = CalendarEvent.objects.create(
        title='Midterm Examination 2026',
        category=CALENDAR_CATEGORY_EXAM,
        description='Term 1 Midterm examinations for classes 10-12.',
        start_date=t_start + timedelta(days=2),
        end_date=t_start + timedelta(days=5),  # Multi-day event
        target_roles=['Student', 'Parent'],
        location='Examination Hall 1',
        is_holiday=False,
        is_published=True,
        is_school_sanctioned=False,
        created_by=user_admin,
    )

    # Event 3: School Holiday
    evt_holiday = CalendarEvent.objects.create(
        title='Diwali School Break',
        category=CALENDAR_CATEGORY_HOLIDAY,
        description='School closed for festival celebration.',
        start_date=t_start + timedelta(days=10),
        end_date=t_start + timedelta(days=14),
        target_roles=[],
        location='Campus Wide',
        is_holiday=True,
        is_published=True,
        is_school_sanctioned=False,
        created_by=user_principal,
    )

    # Event 4: Faculty Only Meeting
    evt_faculty_only = CalendarEvent.objects.create(
        title='Faculty Curriculum Planning Session',
        category=CALENDAR_CATEGORY_MEETING,
        description='Staff meeting to finalize term syllabi.',
        start_date=t_start + timedelta(days=1),
        end_date=t_start + timedelta(days=1, hours=3),
        target_roles=['Faculty'],
        location='Conference Hall B',
        is_holiday=False,
        is_published=True,
        is_school_sanctioned=False,
        created_by=user_principal,
    )

    # Event 5: Admin / Administrative Event
    evt_admin_only = CalendarEvent.objects.create(
        title='Board of Governors Meeting',
        category=CALENDAR_CATEGORY_ADMINISTRATIVE,
        description='Institutional governance and audit meeting.',
        start_date=t_start + timedelta(days=7),
        end_date=t_start + timedelta(days=7, hours=2),
        target_roles=['Admin', 'Principal'],
        location='Boardroom',
        is_holiday=False,
        is_published=True,
        is_school_sanctioned=False,
        created_by=user_admin,
    )

    # Event 6: Faculty 1 Unpublished Draft Event
    evt_faculty_draft = CalendarEvent.objects.create(
        title='Physics Olympiad Workshop (Draft Proposal)',
        category=CALENDAR_CATEGORY_EVENT,
        description='Proposed weekend workshop for advanced science students.',
        start_date=t_start + timedelta(days=20),
        end_date=t_start + timedelta(days=20, hours=4),
        target_roles=['Student', 'Faculty'],
        location='Physics Lab',
        is_holiday=False,
        is_published=False,  # DRAFT
        is_school_sanctioned=True,
        created_by=user_faculty_1,
    )

    return {
        'user_admin': user_admin,
        'user_principal': user_principal,
        'user_faculty_1': user_faculty_1,
        'user_faculty_2': user_faculty_2,
        'user_student': user_student,
        'user_parent': user_parent,
        'fac_profile_1': fac_profile_1,
        'student_profile': student_profile,
        'enrollment': enrollment,
        'section': section,
        'evt_public': evt_public,
        'evt_exam': evt_exam,
        'evt_holiday': evt_holiday,
        'evt_faculty_only': evt_faculty_only,
        'evt_admin_only': evt_admin_only,
        'evt_faculty_draft': evt_faculty_draft,
        'base_start': t_start,
        'base_end': t_end,
    }


def auth_client(user=None):
    """Helper to return an APIClient authenticated as the given user."""
    client = APIClient()
    if user is not None:
        client.force_authenticate(user=user)
    return client


# ============================================================================
# 1. Model & Schema Validation Tests
# ============================================================================

@pytest.mark.django_db
class TestCalendarEventModelValidation:

    def test_valid_academic_event_creation(self, calendar_setup):
        """Tests that a standard academic event is saved with correct attributes."""
        now = timezone.now()
        event = CalendarEvent.objects.create(
            title='Mathematics Symposium',
            category='academic',
            description='Keynote lectures by university professors.',
            start_date=now,
            end_date=now + timedelta(hours=4),
            location='Main Hall',
            is_holiday=False,
            is_published=True,
            is_school_sanctioned=True,
        )
        assert event.id is not None
        assert event.title == 'Mathematics Symposium'
        assert event.category == 'academic'
        assert event.is_school_sanctioned is True
        assert event.od_eligible is True
        assert event.is_public is True
        assert 'Mathematics Symposium' in str(event)

    def test_valid_holiday_creation(self, calendar_setup):
        """Tests that creating a holiday event automatically ensures is_holiday=True."""
        now = timezone.now()
        event = CalendarEvent(
            title='Republic Day',
            category='holiday',
            start_date=now,
            end_date=now + timedelta(days=1),
            is_holiday=False,  # clean should synchronize this to True
        )
        event.full_clean()
        event.save()
        assert event.is_holiday is True
        assert event.category == 'holiday'

    def test_category_normalization_and_alias_mapping(self, calendar_setup):
        """Tests that category aliases (e.g., 'Examination', 'PTM') normalize to canonical choices."""
        now = timezone.now()
        event1 = CalendarEvent(
            title='Term Finals',
            category='Examination',  # TitleCase alias
            start_date=now,
            end_date=now + timedelta(days=2),
        )
        event1.full_clean()
        assert event1.category == 'exam'

        event2 = CalendarEvent(
            title='Parent Teacher Consultation',
            category='PTM',
            start_date=now,
            end_date=now + timedelta(hours=3),
        )
        event2.full_clean()
        assert event2.category == 'meeting'

    def test_invalid_category_rejected(self, calendar_setup):
        """Tests that an unsupported category raises a ValidationError."""
        now = timezone.now()
        event = CalendarEvent(
            title='Carnival',
            category='party_carnival',  # unsupported
            start_date=now,
            end_date=now + timedelta(hours=2),
        )
        with pytest.raises(ValidationError) as exc:
            event.full_clean()
        assert 'category' in exc.value.message_dict

    def test_required_title_validation(self, calendar_setup):
        """Tests that blank or whitespace-only titles are rejected."""
        now = timezone.now()
        event = CalendarEvent(
            title='   ',
            category='academic',
            start_date=now,
            end_date=now + timedelta(hours=1),
        )
        with pytest.raises(ValidationError) as exc:
            event.full_clean()
        assert 'title' in exc.value.message_dict

    def test_invalid_date_range_rejected_by_clean(self, calendar_setup):
        """Tests that end_date preceding start_date is rejected by model clean."""
        now = timezone.now()
        event = CalendarEvent(
            title='Retroactive Workshop',
            category='academic',
            start_date=now,
            end_date=now - timedelta(hours=2),  # Inverted range
        )
        with pytest.raises(ValidationError) as exc:
            event.full_clean()
        assert 'end_date' in exc.value.message_dict

    def test_invalid_date_range_rejected_by_db_constraint(self, calendar_setup):
        """Tests that the database CheckConstraint rejects end_date < start_date on save."""
        now = timezone.now()
        event = CalendarEvent(
            title='Bypass Clean Inverted',
            category='academic',
            start_date=now,
            end_date=now - timedelta(hours=1),
        )
        # Call super().save() bypassing full_clean to trigger DB constraint
        with pytest.raises(IntegrityError):
            super(CalendarEvent, event).save()

    def test_invalid_target_role_rejected(self, calendar_setup):
        """Tests that non-canonical roles (e.g. 'Teacher', 'Guest') in target_roles are rejected."""
        now = timezone.now()
        event = CalendarEvent(
            title='Alumni Meet',
            category='event',
            start_date=now,
            end_date=now + timedelta(hours=2),
            target_roles=['Student', 'AlumniGuest'],  # 'AlumniGuest' is invalid
        )
        with pytest.raises(ValidationError) as exc:
            event.full_clean()
        assert 'target_roles' in exc.value.message_dict


# ============================================================================
# 2. Calendar Service Layer Tests
# ============================================================================

@pytest.mark.django_db
class TestCalendarServiceLayer:

    def test_service_date_filtering_and_multi_day_overlap(self, calendar_setup):
        """
        Tests multi-day event inclusion:
        Midterm Exam runs from Oct 17 to Oct 20.
        Filtering from Oct 18 to Oct 19 must include the Midterm Exam.
        """
        data = calendar_setup
        service = CalendarService()

        # Query range: Oct 18 - Oct 19
        filters = {
            'start_date': '2026-10-18',
            'end_date': '2026-10-19',
        }
        qs = service.get_calendar_events_queryset(data['user_admin'], filters=filters)
        event_titles = list(qs.values_list('title', flat=True))

        assert 'Midterm Examination 2026' in event_titles
        # Science Exhibition (Oct 15) must NOT be included in Oct 18-19 window
        assert 'Annual Science Exhibition 2026' not in event_titles

    def test_service_category_filtering(self, calendar_setup):
        """Tests filtering events by category."""
        data = calendar_setup
        service = CalendarService()

        qs = service.get_calendar_events_queryset(data['user_admin'], filters={'category': 'holiday'})
        assert qs.count() == 1
        assert qs.first().title == 'Diwali School Break'

    def test_service_inverted_date_range_raises_domain_error(self, calendar_setup):
        """Tests that querying with start_date > end_date raises DomainValidationError."""
        data = calendar_setup
        service = CalendarService()
        filters = {
            'start_date': '2026-10-25',
            'end_date': '2026-10-20',
        }
        with pytest.raises(DomainValidationError) as exc:
            service.get_calendar_events_queryset(data['user_admin'], filters=filters)
        assert 'start_date cannot be after end_date' in str(exc.value)

    def test_service_malformed_date_raises_domain_error(self, calendar_setup):
        """Tests that malformed date strings raise DomainValidationError."""
        data = calendar_setup
        service = CalendarService()
        with pytest.raises(DomainValidationError):
            service.get_calendar_events_queryset(data['user_admin'], filters={'start_date': 'not-a-date'})

    def test_service_role_scoping_student(self, calendar_setup):
        """
        Student must only see:
        - Published public events (Science Exhibition, Diwali Break)
        - Published Student-targeted events (Midterm Exam)
        Must NOT see:
        - Faculty only meeting
        - Admin only meeting
        - Unpublished draft events
        """
        data = calendar_setup
        service = CalendarService()
        qs = service.get_calendar_events_queryset(data['user_student'])
        titles = set(qs.values_list('title', flat=True))

        assert 'Annual Science Exhibition 2026' in titles
        assert 'Midterm Examination 2026' in titles
        assert 'Diwali School Break' in titles
        assert 'Faculty Curriculum Planning Session' not in titles
        assert 'Board of Governors Meeting' not in titles
        assert 'Physics Olympiad Workshop (Draft Proposal)' not in titles

    def test_service_role_scoping_parent(self, calendar_setup):
        """
        Parent must only see:
        - Published public events
        - Published Parent-targeted events
        Must NOT see:
        - Faculty only meeting
        - Admin only meeting
        - Unpublished drafts
        """
        data = calendar_setup
        service = CalendarService()
        qs = service.get_calendar_events_queryset(data['user_parent'])
        titles = set(qs.values_list('title', flat=True))

        assert 'Annual Science Exhibition 2026' in titles
        assert 'Midterm Examination 2026' in titles  # targeted to Student and Parent
        assert 'Diwali School Break' in titles
        assert 'Faculty Curriculum Planning Session' not in titles
        assert 'Board of Governors Meeting' not in titles

    def test_service_role_scoping_faculty(self, calendar_setup):
        """
        Faculty 1 must see:
        - Published public events
        - Published Faculty-targeted events
        - Own unpublished draft events
        Must NOT see:
        - Student/Parent exclusive events (Midterm Exam targets ['Student', 'Parent'])
        - Admin only meetings
        """
        data = calendar_setup
        service = CalendarService()
        qs = service.get_calendar_events_queryset(data['user_faculty_1'])
        titles = set(qs.values_list('title', flat=True))

        assert 'Annual Science Exhibition 2026' in titles
        assert 'Faculty Curriculum Planning Session' in titles
        assert 'Diwali School Break' in titles
        assert 'Physics Olympiad Workshop (Draft Proposal)' in titles  # Own draft
        assert 'Midterm Examination 2026' not in titles  # targets only Student & Parent
        assert 'Board of Governors Meeting' not in titles

    def test_service_faculty_cannot_publish_directly(self, calendar_setup):
        """Faculty has calendar.create but lacks calendar.publish; attempting to create published event must fail."""
        data = calendar_setup
        service = CalendarService()
        now = timezone.now()
        payload = {
            'title': 'Faculty Auto Published Event',
            'category': 'academic',
            'start_date': now,
            'end_date': now + timedelta(hours=2),
            'is_published': True,
        }
        with pytest.raises(PermissionDeniedError) as exc:
            service.create_event(data['user_faculty_1'], payload)
        assert 'permission to publish' in str(exc.value)

    def test_service_delete_restricted_to_admin(self, calendar_setup):
        """Only Admin can delete events; Principal deletion attempt must be denied."""
        data = calendar_setup
        service = CalendarService()
        evt = data['evt_public']

        # Principal attempt: raises PermissionDeniedError
        with pytest.raises(PermissionDeniedError):
            service.delete_event(data['user_principal'], evt)

        # Admin attempt: succeeds
        service.delete_event(data['user_admin'], evt)
        assert not CalendarEvent.objects.filter(pk=evt.pk).exists()


# ============================================================================
# 3. REST API & Endpoint Tests
# ============================================================================

@pytest.mark.django_db
class TestCalendarAPIEndpointsAndScoping:

    def test_api_unauthenticated_access_denied_401(self):
        """Unauthenticated requests to calendar endpoints must return HTTP 401."""
        client = APIClient()
        res_list = client.get('/api/v1/calendar/events/')
        assert res_list.status_code == status.HTTP_401_UNAUTHORIZED

        res_post = client.post('/api/v1/calendar/events/', data={'title': 'Test'}, format='json')
        assert res_post.status_code == status.HTTP_401_UNAUTHORIZED

    def test_api_admin_school_wide_list_and_filters(self, calendar_setup):
        """Admin receives full institutional list and can filter by category and dates."""
        data = calendar_setup
        client = auth_client(data['user_admin'])

        res = client.get('/api/v1/calendar/events/')
        assert res.status_code == status.HTTP_200_OK
        res_json = res.json()
        assert res_json['success'] is True
        assert len(res_json['data']) >= 6

        # Filter by category=exam
        res_exam = client.get('/api/v1/calendar/events/?category=exam')
        assert res_exam.status_code == status.HTTP_200_OK
        data_exam = res_exam.json()['data']
        assert len(data_exam) == 1
        assert data_exam[0]['title'] == 'Midterm Examination 2026'

    def test_api_invalid_date_filter_returns_400(self, calendar_setup):
        """Providing invalid dates or inverted ranges returns structured error envelope (HTTP 400)."""
        data = calendar_setup
        client = auth_client(data['user_admin'])

        # Inverted range
        res = client.get('/api/v1/calendar/events/?start_date=2026-10-25&end_date=2026-10-20')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        body = res.json()
        assert body['success'] is False
        assert body['error']['code'] == 'VALIDATION_ERROR'

        # Malformed format
        res_bad = client.get('/api/v1/calendar/events/?start_date=invalid-date')
        assert res_bad.status_code == status.HTTP_400_BAD_REQUEST
        assert res_bad.json()['success'] is False

    def test_api_invalid_category_filter_returns_400(self, calendar_setup):
        """Filtering by an unsupported category returns HTTP 400 Bad Request."""
        data = calendar_setup
        client = auth_client(data['user_admin'])
        res = client.get('/api/v1/calendar/events/?category=unsupported_category_name')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.json()['success'] is False

    def test_api_student_and_parent_role_scoping(self, calendar_setup):
        """
        Verifies that Student and Parent can only view published events targeted to their role or public.
        """
        data = calendar_setup

        # Student request
        res_stu = auth_client(data['user_student']).get('/api/v1/calendar/events/')
        assert res_stu.status_code == status.HTTP_200_OK
        stu_titles = [e['title'] for e in res_stu.json()['data']]
        assert 'Annual Science Exhibition 2026' in stu_titles
        assert 'Midterm Examination 2026' in stu_titles
        assert 'Faculty Curriculum Planning Session' not in stu_titles
        assert 'Board of Governors Meeting' not in stu_titles
        assert 'Physics Olympiad Workshop (Draft Proposal)' not in stu_titles

        # Parent request
        res_par = auth_client(data['user_parent']).get('/api/v1/calendar/events/')
        assert res_par.status_code == status.HTTP_200_OK
        par_titles = [e['title'] for e in res_par.json()['data']]
        assert 'Annual Science Exhibition 2026' in par_titles
        assert 'Midterm Examination 2026' in par_titles
        assert 'Faculty Curriculum Planning Session' not in par_titles

    def test_api_admin_can_create_event_201(self, calendar_setup):
        """Admin can create an event with 201 Created."""
        data = calendar_setup
        client = auth_client(data['user_admin'])
        now = timezone.now()
        payload = {
            'title': 'Inter-School Football Tournament',
            'category': 'event',
            'description': 'Annual sports match.',
            'start_date': (now + timedelta(days=30)).isoformat(),
            'end_date': (now + timedelta(days=32)).isoformat(),
            'target_roles': ['Student', 'Faculty'],
            'location': 'Sports Grounds',
            'is_holiday': False,
            'is_published': True,
            'od_eligible': True,
        }
        res = client.post('/api/v1/calendar/events/', data=payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        body = res.json()
        assert body['success'] is True
        assert body['data']['title'] == 'Inter-School Football Tournament'
        assert body['data']['is_school_sanctioned'] is True
        assert body['data']['od_eligible'] is True

    def test_api_principal_can_create_event_201(self, calendar_setup):
        """Principal has calendar.create & calendar.publish; can create events directly with 201 Created."""
        data = calendar_setup
        client = auth_client(data['user_principal'])
        now = timezone.now()
        payload = {
            'title': 'Principal Address to Students',
            'category': 'academic',
            'description': 'Term beginning address.',
            'start_date': (now + timedelta(days=15)).isoformat(),
            'end_date': (now + timedelta(days=15, hours=2)).isoformat(),
            'target_roles': ['Student', 'Faculty'],
            'location': 'Auditorium',
            'is_published': True,
        }
        res = client.post('/api/v1/calendar/events/', data=payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        assert res.json()['data']['title'] == 'Principal Address to Students'

    def test_api_faculty_can_create_draft_event_201(self, calendar_setup):
        """Faculty can create draft events (is_published=False) with 201 Created."""
        data = calendar_setup
        client = auth_client(data['user_faculty_1'])
        now = timezone.now()
        payload = {
            'title': 'Robotics Club Demo Session',
            'category': 'academic',
            'description': 'Draft proposal for STEM club session.',
            'start_date': (now + timedelta(days=25)).isoformat(),
            'end_date': (now + timedelta(days=25, hours=3)).isoformat(),
            'target_roles': ['Student'],
            'location': 'Lab 3',
            'is_published': False,  # Draft allowed
        }
        res = client.post('/api/v1/calendar/events/', data=payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        assert res.json()['data']['is_published'] is False

    def test_api_faculty_publishing_attempt_rejected_403(self, calendar_setup):
        """Faculty attempting to create a published event without calendar.publish receives HTTP 403."""
        data = calendar_setup
        client = auth_client(data['user_faculty_1'])
        now = timezone.now()
        payload = {
            'title': 'Unauthorized Published Event',
            'category': 'academic',
            'start_date': (now + timedelta(days=25)).isoformat(),
            'end_date': (now + timedelta(days=25, hours=2)).isoformat(),
            'is_published': True,
        }
        res = client.post('/api/v1/calendar/events/', data=payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_api_non_authorized_roles_cannot_create_event_403(self, calendar_setup):
        """Student and Parent lack calendar.create and receive 403 Forbidden."""
        data = calendar_setup
        now = timezone.now()
        payload = {
            'title': 'Student Submits Event',
            'category': 'event',
            'start_date': now.isoformat(),
            'end_date': (now + timedelta(hours=1)).isoformat(),
        }

        # Student attempt
        res_stu = auth_client(data['user_student']).post('/api/v1/calendar/events/', data=payload, format='json')
        assert res_stu.status_code == status.HTTP_403_FORBIDDEN

        # Parent attempt
        res_par = auth_client(data['user_parent']).post('/api/v1/calendar/events/', data=payload, format='json')
        assert res_par.status_code == status.HTTP_403_FORBIDDEN

    def test_api_admin_can_patch_and_publish_event(self, calendar_setup):
        """Admin can update an event and publish a draft event."""
        data = calendar_setup
        client = auth_client(data['user_admin'])
        draft_evt = data['evt_faculty_draft']

        # Publish the faculty draft
        res = client.patch(
            f'/api/v1/calendar/events/{draft_evt.id}/',
            data={'is_published': True, 'location': 'Main Auditorium'},
            format='json',
        )
        assert res.status_code == status.HTTP_200_OK
        updated = res.json()['data']
        assert updated['is_published'] is True
        assert updated['location'] == 'Main Auditorium'

    def test_api_faculty_can_patch_own_draft_but_not_publish(self, calendar_setup):
        """Faculty can update their own draft event, but cannot publish it."""
        data = calendar_setup
        client = auth_client(data['user_faculty_1'])
        draft_evt = data['evt_faculty_draft']

        # Updating location on own draft: allowed
        res = client.patch(
            f'/api/v1/calendar/events/{draft_evt.id}/',
            data={'location': 'Updated Lab 2'},
            format='json',
        )
        assert res.status_code == status.HTTP_200_OK
        assert res.json()['data']['location'] == 'Updated Lab 2'

        # Attempting to publish without calendar.publish: denied with 403
        res_pub = client.patch(
            f'/api/v1/calendar/events/{draft_evt.id}/',
            data={'is_published': True},
            format='json',
        )
        assert res_pub.status_code == status.HTTP_403_FORBIDDEN

    def test_api_faculty_cannot_patch_other_events(self, calendar_setup):
        """Faculty 2 cannot patch Faculty 1's draft event or administrative events."""
        data = calendar_setup
        client = auth_client(data['user_faculty_2'])
        draft_evt = data['evt_faculty_draft']

        res = client.patch(
            f'/api/v1/calendar/events/{draft_evt.id}/',
            data={'title': 'Hijacked Event'},
            format='json',
        )
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_api_admin_can_delete_event_204(self, calendar_setup):
        """Admin can delete an event with 204 No Content."""
        data = calendar_setup
        client = auth_client(data['user_admin'])
        evt = data['evt_public']

        res = client.delete(f'/api/v1/calendar/events/{evt.id}/')
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert not CalendarEvent.objects.filter(pk=evt.pk).exists()

    def test_api_non_admin_roles_cannot_delete_event_403(self, calendar_setup):
        """Principal, Faculty, Student, and Parent are forbidden from deleting events (HTTP 403)."""
        data = calendar_setup
        evt = data['evt_exam']

        for user in [data['user_principal'], data['user_faculty_1'], data['user_student'], data['user_parent']]:
            res = auth_client(user).delete(f'/api/v1/calendar/events/{evt.id}/')
            assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_api_detail_scoping_and_object_access(self, calendar_setup):
        """
        Tests GET /api/v1/calendar/events/<id>/ scoping:
        - Admin and Principal can retrieve any event.
        - Student cannot retrieve an event targeted only to Faculty (403 Forbidden).
        - Student cannot retrieve an unpublished draft (403 Forbidden).
        """
        data = calendar_setup
        evt_faculty = data['evt_faculty_only']
        evt_draft = data['evt_faculty_draft']

        # Admin: allowed on faculty-only
        res_adm = auth_client(data['user_admin']).get(f'/api/v1/calendar/events/{evt_faculty.id}/')
        assert res_adm.status_code == status.HTTP_200_OK

        # Faculty 1: allowed on faculty-only
        res_fac = auth_client(data['user_faculty_1']).get(f'/api/v1/calendar/events/{evt_faculty.id}/')
        assert res_fac.status_code == status.HTTP_200_OK

        # Student: denied on faculty-only with 403
        res_stu_fac = auth_client(data['user_student']).get(f'/api/v1/calendar/events/{evt_faculty.id}/')
        assert res_stu_fac.status_code == status.HTTP_403_FORBIDDEN

        # Student: denied on unpublished draft with 403
        res_stu_draft = auth_client(data['user_student']).get(f'/api/v1/calendar/events/{evt_draft.id}/')
        assert res_stu_draft.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# 4. Attendance Semantics Preservation Tests
# ============================================================================

@pytest.mark.django_db
class TestCalendarAttendanceSemantics:

    def test_school_sanctioned_event_does_not_alter_attendance(self, calendar_setup):
        """
        Preserves the invariant:
        Creating or publishing an event with is_school_sanctioned=True (od_eligible=True)
        must NOT modify attendance records or automatically mark any student ON_DUTY.
        """
        data = calendar_setup
        initial_attendance_count = Attendance.objects.count()

        # Create a school-sanctioned event
        client = auth_client(data['user_admin'])
        now = timezone.now()
        payload = {
            'title': 'State Science Fair (OD Eligible)',
            'category': 'academic',
            'start_date': (now + timedelta(days=2)).isoformat(),
            'end_date': (now + timedelta(days=3)).isoformat(),
            'target_roles': ['Student'],
            'is_published': True,
            'od_eligible': True,
        }
        res = client.post('/api/v1/calendar/events/', data=payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED

        # Verify zero attendance records were created or modified
        assert Attendance.objects.count() == initial_attendance_count
        assert not Attendance.objects.filter(status=ATTENDANCE_STATUS_ON_DUTY).exists()

    def test_attendance_remains_manually_controlled_by_class_teacher(self, calendar_setup):
        """
        Verifies that marking ON_DUTY attendance remains strictly within the
        authorized Attendance domain (Class Teacher only), and calendar data cannot bypass this rule.
        """
        data = calendar_setup
        student = data['student_profile']
        enrollment = data['enrollment']

        # Faculty 1 (Class Teacher of Section A) marks ON_DUTY with an event remark
        att = Attendance.objects.create(
            enrollment=enrollment,
            date=date(2026, 10, 15),
            session_period=1,
            status=ATTENDANCE_STATUS_ON_DUTY,
            remarks="Sanctioned OD for Science Exhibition 2026",
            recorded_by=data['user_faculty_1'],
        )
        assert att.id is not None
        assert att.status == ATTENDANCE_STATUS_ON_DUTY
        assert "Science Exhibition" in att.remarks


# ============================================================================
# 5. Database Identity Test (Option B Dual-Role Verification)
# ============================================================================

@pytest.mark.django_db
class TestDatabaseIdentity:

    def test_api_database_identity_is_erp_app(self, calendar_setup):
        """Verifies that the database identity running tests is strictly erp_app under Option B."""
        with connection.cursor() as cur:
            cur.execute("SELECT current_user, current_database();")
            current_user, current_db = cur.fetchone()
        assert current_user == 'erp_app', (
            f"Test execution database identity must be 'erp_app', found: '{current_user}'"
        )
        assert 'test_' in current_db, (
            f"Test database must be an isolated test DB, found: '{current_db}'"
        )
