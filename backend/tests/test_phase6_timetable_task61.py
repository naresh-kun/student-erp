"""
Student ERP — Phase 6 Task 6.1 Test Suite
Timetable Domain Models, Migrations, Service Layer, and REST APIs

Verifies:
1. Model & Schema Validation:
   - TimetableSlot model creation and field contracts.
   - String representations and properties (academic_year, school_class).
   - Validation constraints: start_time < end_time, positive period_number, valid day_of_week.
   - Section double-booking rejection (clean & database constraint).
   - Faculty double-booking rejection (clean & database constraint).
   - Foreign key cascade and protect deletion policies.
2. Service Layer & Conflict Detection:
   - TimetableService conflict detection raising TimetableConflictError (HTTP 409).
   - Conflict check allows slot self-updates without false positive conflicts.
   - Atomic creation, update, and deletion under TimetableService.
   - Administrative permission checks on mutations.
3. REST API & RBAC Scoping:
   - Unauthenticated requests denied with 401.
   - Admin receives full school-wide list and filter capabilities.
   - Principal receives school-wide read-only oversight; mutations denied with 403.
   - Faculty access is strictly scoped to assigned slots.
   - Student access is strictly scoped to enrolled section.
   - Parent access is strictly scoped to linked children's sections.
   - Admin creation (201 Created) and conflict rejection (409 Conflict).
   - Invalid payloads return structured error envelope (400 Bad Request).
   - Admin update (200 OK) and conflict rejection (409 Conflict).
   - Admin deletion (204 No Content) and non-admin denial (403 Forbidden).
   - Object-level authorization on detail endpoint (200 for allowed, 403 for unauthorized).
   - Verified runtime database identity is strictly erp_app.
"""

from datetime import date, time
import pytest
from django.db import connection, IntegrityError
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework import status
from rest_framework.test import APIClient

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
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
from apps.timetable.models import TimetableSlot
from apps.timetable.services import TimetableService, TimetableConflictError


@pytest.fixture
def timetable_setup(db):
    """
    Sets up academic structure, users across all 5 roles, and baseline timetable slots.
    """
    # 1. Roles
    role_admin, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
    role_principal, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL)
    role_faculty, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
    role_student, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
    role_parent, _ = Role.objects.get_or_create(name=ROLE_PARENT)

    # 2. Academic Year
    academic_year, _ = AcademicYear.objects.get_or_create(
        name='2026-2027',
        defaults={'start_date': date(2026, 6, 1), 'end_date': date(2027, 3, 31), 'is_current': True}
    )

    # 3. School Classes & Sections
    school_class, _ = SchoolClass.objects.get_or_create(
        academic_year=academic_year,
        code='G11-CS',
        defaults={'name': 'Grade 11 CS'}
    )
    other_class, _ = SchoolClass.objects.get_or_create(
        academic_year=academic_year,
        code='G10-GEN',
        defaults={'name': 'Grade 10'}
    )

    section_a, _ = Section.objects.get_or_create(
        school_class=school_class,
        name='A',
        defaults={'room': 'Room 101', 'academic_year': academic_year}
    )
    section_b, _ = Section.objects.get_or_create(
        school_class=school_class,
        name='B',
        defaults={'room': 'Room 102', 'academic_year': academic_year}
    )
    section_c, _ = Section.objects.get_or_create(
        school_class=other_class,
        name='A',
        defaults={'room': 'Room 201', 'academic_year': academic_year}
    )

    # 4. Subjects
    subj_math, _ = Subject.objects.get_or_create(
        code='MATH11',
        defaults={'name': 'Mathematics 11', 'weekly_periods': 6}
    )
    subj_cs, _ = Subject.objects.get_or_create(
        code='CS11',
        defaults={'name': 'Computer Science 11', 'weekly_periods': 6}
    )
    subj_phy, _ = Subject.objects.get_or_create(
        code='PHY11',
        defaults={'name': 'Physics 11', 'weekly_periods': 5}
    )

    # 5. Users and Profiles
    # Admin
    user_admin = User.objects.create_user(
        username='admin_tt', email='admin_tt@school.local', password='pwd', role=role_admin
    )
    # Principal
    user_principal = User.objects.create_user(
        username='principal_tt', email='principal_tt@school.local', password='pwd', role=role_principal
    )

    # Faculty 1: Suresh
    user_suresh = User.objects.create_user(
        username='fac_suresh_tt', email='suresh_tt@school.local', password='pwd', role=role_faculty,
        first_name='Suresh', last_name='R'
    )
    faculty_suresh = Faculty.objects.create(
        user=user_suresh, employee_code='FAC_TT_001', department='Computer Science',
        joining_date=date(2023, 1, 1)
    )

    # Faculty 2: Priya
    user_priya = User.objects.create_user(
        username='fac_priya_tt', email='priya_tt@school.local', password='pwd', role=role_faculty,
        first_name='Priya', last_name='K'
    )
    faculty_priya = Faculty.objects.create(
        user=user_priya, employee_code='FAC_TT_002', department='Mathematics',
        joining_date=date(2023, 1, 1)
    )

    # Parent & Students
    user_parent = User.objects.create_user(
        username='parent_tt', email='parent_tt@school.local', password='pwd', role=role_parent
    )
    parent = Parent.objects.create(user=user_parent, relation='Father')

    # Student 1: Enrolled in Section A
    user_student_1 = User.objects.create_user(
        username='stu_tt_1', email='stu1@school.local', password='pwd', role=role_student,
        first_name='Arun', last_name='K'
    )
    student_1 = Student.objects.create(
        user=user_student_1, parent=parent, student_id='STU202600101',
        admission_number='ADM101', roll_number='11A-01',
        date_of_birth=date(2009, 1, 1), gender='Male', status='Enrolled'
    )
    Enrollment.objects.create(
        student=student_1, academic_year=academic_year, section=section_a, status='Active'
    )

    # Student 2: Enrolled in Section B (unrelated parent)
    user_parent_2 = User.objects.create_user(
        username='parent_tt_2', email='parent2@school.local', password='pwd', role=role_parent
    )
    parent_2 = Parent.objects.create(user=user_parent_2, relation='Mother')

    user_student_2 = User.objects.create_user(
        username='stu_tt_2', email='stu2@school.local', password='pwd', role=role_student,
        first_name='Bala', last_name='M'
    )
    student_2 = Student.objects.create(
        user=user_student_2, parent=parent_2, student_id='STU202600102',
        admission_number='ADM102', roll_number='11B-01',
        date_of_birth=date(2009, 2, 2), gender='Male', status='Enrolled'
    )
    Enrollment.objects.create(
        student=student_2, academic_year=academic_year, section=section_b, status='Active'
    )

    # 6. Baseline Timetable Slot: Section A, Monday Period 1 (Suresh, CS)
    slot_1 = TimetableSlot.objects.create(
        section=section_a,
        subject=subj_cs,
        faculty=faculty_suresh,
        day_of_week='Monday',
        period_number=1,
        start_time=time(8, 30),
        end_time=time(9, 15),
        room_number='Lab 1',
    )

    # Baseline Timetable Slot 2: Section B, Monday Period 1 (Priya, Math)
    slot_2 = TimetableSlot.objects.create(
        section=section_b,
        subject=subj_math,
        faculty=faculty_priya,
        day_of_week='Monday',
        period_number=1,
        start_time=time(8, 30),
        end_time=time(9, 15),
        room_number='Room 102',
    )

    return {
        'academic_year': academic_year,
        'school_class': school_class,
        'other_class': other_class,
        'section_a': section_a,
        'section_b': section_b,
        'section_c': section_c,
        'subj_math': subj_math,
        'subj_cs': subj_cs,
        'subj_phy': subj_phy,
        'user_admin': user_admin,
        'user_principal': user_principal,
        'user_suresh': user_suresh,
        'faculty_suresh': faculty_suresh,
        'user_priya': user_priya,
        'faculty_priya': faculty_priya,
        'user_parent': user_parent,
        'parent': parent,
        'user_parent_2': user_parent_2,
        'parent_2': parent_2,
        'user_student_1': user_student_1,
        'student_1': student_1,
        'user_student_2': user_student_2,
        'student_2': student_2,
        'slot_1': slot_1,
        'slot_2': slot_2,
    }


def auth_client(user=None) -> APIClient:
    """Returns an APIClient authenticated as the given user."""
    client = APIClient()
    if user:
        client.force_authenticate(user=user)
    return client


# ============================================================================
# 1. Model & Schema Validation Tests
# ============================================================================

@pytest.mark.django_db
class TestTimetableSlotModelValidation:
    """Verifies TimetableSlot model rules, constraints, and relationships."""

    def test_timetable_slot_creation_valid(self, timetable_setup):
        """Verifies creating a valid timetable slot with all fields."""
        data = timetable_setup
        slot = TimetableSlot.objects.create(
            section=data['section_a'],
            subject=data['subj_math'],
            faculty=data['faculty_priya'],
            day_of_week='Tuesday',
            period_number=2,
            start_time=time(9, 20),
            end_time=time(10, 5),
            room_number='Room 101',
        )
        assert slot.id is not None
        assert slot.academic_year == data['academic_year']
        assert slot.school_class == data['school_class']
        assert slot.room_number == 'Room 101'
        assert str(slot).startswith(str(data['section_a']))

    def test_timetable_slot_start_time_must_precede_end_time(self, timetable_setup):
        """Validates that start_time >= end_time raises ValidationError."""
        data = timetable_setup
        slot = TimetableSlot(
            section=data['section_a'],
            subject=data['subj_math'],
            faculty=data['faculty_priya'],
            day_of_week='Wednesday',
            period_number=3,
            start_time=time(10, 0),
            end_time=time(9, 30),  # invalid: ends before start
        )
        with pytest.raises(ValidationError) as exc_info:
            slot.full_clean()
        assert 'end_time' in exc_info.value.message_dict

    def test_timetable_slot_invalid_day_of_week_rejected(self, timetable_setup):
        """Validates that invalid day_of_week strings are rejected."""
        data = timetable_setup
        slot = TimetableSlot(
            section=data['section_a'],
            subject=data['subj_math'],
            faculty=data['faculty_priya'],
            day_of_week='Funday',  # invalid day
            period_number=1,
            start_time=time(8, 30),
            end_time=time(9, 15),
        )
        with pytest.raises(ValidationError) as exc_info:
            slot.full_clean()
        assert 'day_of_week' in exc_info.value.message_dict

    def test_timetable_slot_period_number_positive(self, timetable_setup):
        """Validates that period_number < 1 is rejected."""
        data = timetable_setup
        slot = TimetableSlot(
            section=data['section_a'],
            subject=data['subj_math'],
            faculty=data['faculty_priya'],
            day_of_week='Thursday',
            period_number=0,  # invalid period number
            start_time=time(8, 30),
            end_time=time(9, 15),
        )
        with pytest.raises(ValidationError) as exc_info:
            slot.full_clean()
        assert 'period_number' in exc_info.value.message_dict

    def test_timetable_slot_section_double_booking_rejected_by_clean(self, timetable_setup):
        """Validates that assigning a section to two subjects at the same day/period is rejected."""
        data = timetable_setup
        # Section A already has slot_1 on Monday Period 1 (with Suresh)
        duplicate_slot = TimetableSlot(
            section=data['section_a'],
            subject=data['subj_phy'],
            faculty=data['faculty_priya'],
            day_of_week='Monday',
            period_number=1,  # Section A already booked
            start_time=time(8, 30),
            end_time=time(9, 15),
        )
        with pytest.raises(ValidationError) as exc_info:
            duplicate_slot.full_clean()
        assert 'period_number' in exc_info.value.message_dict

    def test_timetable_slot_faculty_double_booking_rejected_by_clean(self, timetable_setup):
        """Validates that assigning a faculty member to two sections at the same day/period is rejected."""
        data = timetable_setup
        # Suresh already teaches Section A on Monday Period 1
        duplicate_slot = TimetableSlot(
            section=data['section_c'],  # Different section
            subject=data['subj_cs'],
            faculty=data['faculty_suresh'],  # Same faculty
            day_of_week='Monday',
            period_number=1,  # Suresh already booked
            start_time=time(8, 30),
            end_time=time(9, 15),
        )
        with pytest.raises(ValidationError) as exc_info:
            duplicate_slot.full_clean()
        assert 'faculty' in exc_info.value.message_dict

    def test_timetable_slot_database_unique_section_constraint(self, timetable_setup):
        """Verifies database-level uniqueness constraint on (section, day_of_week, period_number)."""
        data = timetable_setup
        duplicate_slot = TimetableSlot(
            section=data['section_a'],
            subject=data['subj_phy'],
            faculty=data['faculty_priya'],
            day_of_week='Monday',
            period_number=1,
            start_time=time(8, 30),
            end_time=time(9, 15),
        )
        with pytest.raises(IntegrityError):
            super(TimetableSlot, duplicate_slot).save()

    def test_timetable_slot_database_unique_faculty_constraint(self, timetable_setup):
        """Verifies database-level uniqueness constraint on (faculty, day_of_week, period_number)."""
        data = timetable_setup
        duplicate_slot = TimetableSlot(
            section=data['section_c'],
            subject=data['subj_cs'],
            faculty=data['faculty_suresh'],
            day_of_week='Monday',
            period_number=1,
            start_time=time(8, 30),
            end_time=time(9, 15),
        )
        with pytest.raises(IntegrityError):
            super(TimetableSlot, duplicate_slot).save()

    def test_timetable_slot_cascade_and_protect_fk_rules(self, timetable_setup):
        """Deleting a section cascades to timetable slots; faculty and subject deletions are PROTECT."""
        data = timetable_setup
        slot = data['slot_1']

        # Faculty cannot be deleted while assigned to timetable slots
        from django.db.models import ProtectedError
        with pytest.raises(ProtectedError):
            data['faculty_suresh'].delete()

        # Subject cannot be deleted while assigned to timetable slots
        with pytest.raises(ProtectedError):
            data['subj_cs'].delete()

        # Section deletion cascades and deletes slot
        sec_id = data['section_a'].id
        data['section_a'].delete()
        assert not TimetableSlot.objects.filter(section_id=sec_id).exists()


# ============================================================================
# 2. Service Layer & Conflict Detection Tests
# ============================================================================

@pytest.mark.django_db
class TestTimetableService:
    """Verifies TimetableService conflict detection and transactional CRUD."""

    def test_service_check_conflicts_raises_409_for_section(self, timetable_setup):
        """check_conflicts raises TimetableConflictError when section is double-booked."""
        data = timetable_setup
        service = TimetableService()

        with pytest.raises(TimetableConflictError) as exc_info:
            service.check_conflicts(
                section_id=data['section_a'].id,
                faculty_id=data['faculty_priya'].id,
                day_of_week='Monday',
                period_number=1,
            )
        assert exc_info.value.status_code == status.HTTP_409_CONFLICT
        assert exc_info.value.default_code == 'SECTION_SCHEDULE_CONFLICT'

    def test_service_check_conflicts_raises_409_for_faculty(self, timetable_setup):
        """check_conflicts raises TimetableConflictError when faculty is double-booked."""
        data = timetable_setup
        service = TimetableService()

        with pytest.raises(TimetableConflictError) as exc_info:
            service.check_conflicts(
                section_id=data['section_c'].id,
                faculty_id=data['faculty_suresh'].id,
                day_of_week='Monday',
                period_number=1,
            )
        assert exc_info.value.status_code == status.HTTP_409_CONFLICT
        assert exc_info.value.default_code == 'FACULTY_SCHEDULE_CONFLICT'

    def test_service_check_conflicts_allows_same_slot_update(self, timetable_setup):
        """Updating a slot without changing its time/period does not trigger self-conflict."""
        data = timetable_setup
        service = TimetableService()
        slot = data['slot_1']

        # Should NOT raise an exception when exclude_id=slot.id
        service.check_conflicts(
            section_id=slot.section_id,
            faculty_id=slot.faculty_id,
            day_of_week=slot.day_of_week,
            period_number=slot.period_number,
            exclude_id=slot.id,
        )

    def test_service_create_slot_admin_only(self, timetable_setup):
        """Admin can create slot via service; non-admin raises PermissionDeniedError."""
        data = timetable_setup
        service = TimetableService()

        payload = {
            'section': data['section_a'],
            'subject': data['subj_phy'],
            'faculty': data['faculty_priya'],
            'day_of_week': 'Wednesday',
            'period_number': 1,
            'start_time': time(8, 30),
            'end_time': time(9, 15),
            'room_number': 'Room 101',
        }

        # Non-admin user (e.g. Faculty or Student) is denied
        from common.exceptions import PermissionDeniedError
        with pytest.raises(PermissionDeniedError):
            service.create_slot(user=data['user_suresh'], validated_data=payload)

        # Admin succeeds
        created = service.create_slot(user=data['user_admin'], validated_data=payload)
        assert created.id is not None
        assert created.period_number == 1

    def test_service_update_and_delete_slot_admin_only(self, timetable_setup):
        """Admin can update and delete slots; non-admin raises PermissionDeniedError."""
        data = timetable_setup
        service = TimetableService()
        slot = data['slot_1']

        from common.exceptions import PermissionDeniedError
        with pytest.raises(PermissionDeniedError):
            service.update_slot(
                user=data['user_principal'],
                slot=slot,
                validated_data={'room_number': 'New Room'},
            )

        updated = service.update_slot(
            user=data['user_admin'],
            slot=slot,
            validated_data={'room_number': 'New Room 99'},
        )
        assert updated.room_number == 'New Room 99'

        with pytest.raises(PermissionDeniedError):
            service.delete_slot(user=data['user_suresh'], slot=slot)

        service.delete_slot(user=data['user_admin'], slot=slot)
        assert not TimetableSlot.objects.filter(pk=slot.id).exists()


# ============================================================================
# 3. REST API & Scoping Tests
# ============================================================================

@pytest.mark.django_db
class TestTimetableAPIEndpointsAndScoping:
    """Verifies /api/v1/timetable/ REST endpoints and 5-role scoping."""

    def test_api_unauthenticated_access_denied_401(self, timetable_setup):
        """Unauthenticated requests to /api/v1/timetable/ return 401."""
        client = auth_client(None)
        res = client.get('/api/v1/timetable/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_api_admin_school_wide_list_and_filters(self, timetable_setup):
        """Admin sees school-wide timetable records and can filter by section, day, and faculty."""
        data = timetable_setup
        client = auth_client(data['user_admin'])

        res = client.get('/api/v1/timetable/')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['success'] is True
        assert len(res.data['data']) == 2  # slot_1 and slot_2

        # Filter by section_id
        res_sec = client.get(f'/api/v1/timetable/?section_id={data["section_a"].id}')
        assert res_sec.status_code == status.HTTP_200_OK
        assert len(res_sec.data['data']) == 1
        assert str(res_sec.data['data'][0]['section']) == str(data['section_a'].id)

        # Filter by faculty_id
        res_fac = client.get(f'/api/v1/timetable/?faculty_id={data["faculty_suresh"].id}')
        assert res_fac.status_code == status.HTTP_200_OK
        assert len(res_fac.data['data']) == 1
        assert str(res_fac.data['data'][0]['faculty']) == str(data['faculty_suresh'].id)

    def test_api_principal_school_wide_read_only_oversight(self, timetable_setup):
        """Principal has school-wide read oversight (200), but mutations return 403 Forbidden."""
        data = timetable_setup
        client = auth_client(data['user_principal'])

        # GET: Read-only oversight sees all 2 slots
        res_get = client.get('/api/v1/timetable/')
        assert res_get.status_code == status.HTTP_200_OK
        assert len(res_get.data['data']) == 2

        # POST: Mutation denied with 403
        payload = {
            'section': str(data['section_a'].id),
            'subject': str(data['subj_phy'].id),
            'faculty': str(data['faculty_priya'].id),
            'day_of_week': 'Friday',
            'period_number': 3,
            'start_time': '10:00:00',
            'end_time': '10:45:00',
        }
        res_post = client.post('/api/v1/timetable/', data=payload, format='json')
        assert res_post.status_code == status.HTTP_403_FORBIDDEN

        # PATCH: Mutation denied with 403
        res_patch = client.patch(f'/api/v1/timetable/{data["slot_1"].id}/', data={'room_number': 'X'}, format='json')
        assert res_patch.status_code == status.HTTP_403_FORBIDDEN

        # DELETE: Mutation denied with 403
        res_del = client.delete(f'/api/v1/timetable/{data["slot_1"].id}/')
        assert res_del.status_code == status.HTTP_403_FORBIDDEN

    def test_api_faculty_scoped_to_assigned_slots_only(self, timetable_setup):
        """Faculty member sees only slots where they are the assigned faculty."""
        data = timetable_setup
        # Suresh teaches slot_1, but not slot_2
        client_suresh = auth_client(data['user_suresh'])
        res = client_suresh.get('/api/v1/timetable/')
        assert res.status_code == status.HTTP_200_OK
        slots = res.data['data']
        assert len(slots) == 1
        assert str(slots[0]['id']) == str(data['slot_1'].id)
        assert str(slots[0]['faculty']) == str(data['faculty_suresh'].id)

        # Priya teaches slot_2, but not slot_1
        client_priya = auth_client(data['user_priya'])
        res_p = client_priya.get('/api/v1/timetable/')
        assert res_p.status_code == status.HTTP_200_OK
        slots_p = res_p.data['data']
        assert len(slots_p) == 1
        assert str(slots_p[0]['id']) == str(data['slot_2'].id)
        assert str(slots_p[0]['faculty']) == str(data['faculty_priya'].id)

    def test_api_student_scoped_to_enrolled_section_only(self, timetable_setup):
        """Student sees only timetable slots for their currently enrolled section."""
        data = timetable_setup
        # Student 1 is enrolled in Section A (slot_1)
        client_stu = auth_client(data['user_student_1'])
        res = client_stu.get('/api/v1/timetable/')
        assert res.status_code == status.HTTP_200_OK
        slots = res.data['data']
        assert len(slots) == 1
        assert str(slots[0]['id']) == str(data['slot_1'].id)
        assert str(slots[0]['section']) == str(data['section_a'].id)

        # Student 2 is enrolled in Section B (slot_2)
        client_stu2 = auth_client(data['user_student_2'])
        res2 = client_stu2.get('/api/v1/timetable/')
        assert res2.status_code == status.HTTP_200_OK
        slots2 = res2.data['data']
        assert len(slots2) == 1
        assert str(slots2[0]['id']) == str(data['slot_2'].id)
        assert str(slots2[0]['section']) == str(data['section_b'].id)

    def test_api_parent_scoped_to_linked_children_sections_only(self, timetable_setup):
        """Parent sees only timetable slots for their linked children's enrolled sections."""
        data = timetable_setup
        # Parent 1 is linked to Student 1 (Section A -> slot_1)
        client_parent = auth_client(data['user_parent'])
        res = client_parent.get('/api/v1/timetable/')
        assert res.status_code == status.HTTP_200_OK
        slots = res.data['data']
        assert len(slots) == 1
        assert slots[0]['id'] == str(data['slot_1'].id)

        # Parent 2 is linked to Student 2 (Section B -> slot_2)
        client_parent2 = auth_client(data['user_parent_2'])
        res2 = client_parent2.get('/api/v1/timetable/')
        assert res2.status_code == status.HTTP_200_OK
        slots2 = res2.data['data']
        assert len(slots2) == 1
        assert slots2[0]['id'] == str(data['slot_2'].id)

    def test_api_admin_can_create_timetable_slot_201(self, timetable_setup):
        """Admin can create a new timetable slot and receives 201 Created."""
        data = timetable_setup
        client = auth_client(data['user_admin'])

        payload = {
            'section': str(data['section_a'].id),
            'subject': str(data['subj_math'].id),
            'faculty': str(data['faculty_priya'].id),
            'day_of_week': 'Tuesday',
            'period_number': 1,
            'start_time': '08:30:00',
            'end_time': '09:15:00',
            'room_number': 'Room 101',
        }
        res = client.post('/api/v1/timetable/', data=payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['success'] is True
        assert res.data['data']['period_number'] == 1
        assert res.data['data']['day_of_week'] == 'Tuesday'
        assert res.data['data']['subject_code'] == 'MATH11'

    def test_api_non_admin_roles_cannot_create_timetable_slot_403(self, timetable_setup):
        """Non-admin roles (Principal, Faculty, Student, Parent) cannot create slots (403)."""
        data = timetable_setup
        payload = {
            'section': str(data['section_a'].id),
            'subject': str(data['subj_math'].id),
            'faculty': str(data['faculty_priya'].id),
            'day_of_week': 'Wednesday',
            'period_number': 2,
            'start_time': '09:20:00',
            'end_time': '10:05:00',
        }

        for user in [data['user_principal'], data['user_suresh'], data['user_student_1'], data['user_parent']]:
            client = auth_client(user)
            res = client.post('/api/v1/timetable/', data=payload, format='json')
            assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_api_create_slot_conflict_returns_409(self, timetable_setup):
        """Attempting to double-book section or faculty via API returns 409 Conflict."""
        data = timetable_setup
        client = auth_client(data['user_admin'])

        # Section A already has slot_1 on Monday Period 1
        conflict_payload = {
            'section': str(data['section_a'].id),
            'subject': str(data['subj_phy'].id),
            'faculty': str(data['faculty_priya'].id),
            'day_of_week': 'Monday',
            'period_number': 1,
            'start_time': '08:30:00',
            'end_time': '09:15:00',
        }
        res = client.post('/api/v1/timetable/', data=conflict_payload, format='json')
        assert res.status_code == status.HTTP_409_CONFLICT
        assert res.data['success'] is False
        assert res.data['error']['status_code'] == 409
        assert 'conflict' in res.data['error']['message'].lower()

    def test_api_create_slot_invalid_payload_returns_400(self, timetable_setup):
        """Invalid payload (e.g. start_time >= end_time) returns 400 Bad Request."""
        data = timetable_setup
        client = auth_client(data['user_admin'])

        invalid_payload = {
            'section': str(data['section_a'].id),
            'subject': str(data['subj_math'].id),
            'faculty': str(data['faculty_priya'].id),
            'day_of_week': 'Monday',
            'period_number': 4,
            'start_time': '10:30:00',
            'end_time': '09:15:00',  # invalid time order
        }
        res = client.post('/api/v1/timetable/', data=invalid_payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data['success'] is False

    def test_api_admin_can_patch_and_delete_slot(self, timetable_setup):
        """Admin can PATCH update and DELETE a timetable slot."""
        data = timetable_setup
        client = auth_client(data['user_admin'])
        slot = data['slot_1']

        # PATCH
        patch_res = client.patch(
            f'/api/v1/timetable/{slot.id}/',
            data={'room_number': 'Upgraded Lab 1'},
            format='json',
        )
        assert patch_res.status_code == status.HTTP_200_OK
        assert patch_res.data['data']['room_number'] == 'Upgraded Lab 1'

        # DELETE
        del_res = client.delete(f'/api/v1/timetable/{slot.id}/')
        assert del_res.status_code == status.HTTP_204_NO_CONTENT
        assert not TimetableSlot.objects.filter(pk=slot.id).exists()

    def test_api_patch_slot_conflict_returns_409(self, timetable_setup):
        """Admin PATCH moving slot_2 into slot_1's slot triggers 409 Conflict."""
        data = timetable_setup
        client = auth_client(data['user_admin'])

        # slot_1 is Monday Period 1 Section A with Suresh
        # Moving slot_2 (Section B, Monday P1 Priya) to Section A Monday P1 must conflict
        patch_res = client.patch(
            f'/api/v1/timetable/{data["slot_2"].id}/',
            data={'section': str(data['section_a'].id)},
            format='json',
        )
        assert patch_res.status_code == status.HTTP_409_CONFLICT
        assert patch_res.data['success'] is False

    def test_api_detail_view_scoping_and_object_access(self, timetable_setup):
        """GET /api/v1/timetable/<id>/ returns 200 for scoped actors and 403 for unauthorized actors."""
        data = timetable_setup
        slot_1 = data['slot_1']  # Section A, Faculty Suresh

        # Admin: allowed
        res_adm = auth_client(data['user_admin']).get(f'/api/v1/timetable/{slot_1.id}/')
        assert res_adm.status_code == status.HTTP_200_OK

        # Suresh (assigned faculty): allowed
        res_fac = auth_client(data['user_suresh']).get(f'/api/v1/timetable/{slot_1.id}/')
        assert res_fac.status_code == status.HTTP_200_OK

        # Student 1 (enrolled in Section A): allowed
        res_stu1 = auth_client(data['user_student_1']).get(f'/api/v1/timetable/{slot_1.id}/')
        assert res_stu1.status_code == status.HTTP_200_OK

        # Student 2 (enrolled in Section B, not A): denied with 403
        res_stu2 = auth_client(data['user_student_2']).get(f'/api/v1/timetable/{slot_1.id}/')
        assert res_stu2.status_code == status.HTTP_403_FORBIDDEN

        # Priya (not assigned to slot_1): denied with 403
        res_priya = auth_client(data['user_priya']).get(f'/api/v1/timetable/{slot_1.id}/')
        assert res_priya.status_code == status.HTTP_403_FORBIDDEN

    def test_api_database_identity_is_erp_app(self, timetable_setup):
        """Verifies that the database identity running tests is strictly erp_app."""
        with connection.cursor() as cur:
            cur.execute("SELECT current_user, current_database();")
            current_user, current_db = cur.fetchone()
        assert current_user == 'erp_app', (
            f"Test execution database identity must be 'erp_app', found: '{current_user}'"
        )
        assert 'test_' in current_db, (
            f"Test database must be an isolated test DB, found: '{current_db}'"
        )
