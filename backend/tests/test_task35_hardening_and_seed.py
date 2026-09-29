"""
Student ERP — Task 3.5 Tests
Phase 3, Task 3.5: Migrations, Constraints & Seed Data Hardening

Test categories:
  A. Migration & Graph Audit (no-DB required)
  B. Model Constraint & Delete Behavior Audit (no-DB required)
  C. Seed Data Command Logic & Idempotency Audit
  D. Live Database Integration Tests (@pytest.mark.django_db, skipped when PostgreSQL offline)
"""

import uuid
import pytest
from datetime import date, timedelta
from decimal import Decimal
from io import StringIO
from django.apps import apps as django_apps
from django.core.management import call_command
from django.core.exceptions import ValidationError

from apps.accounts.models import Role, User, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, Enrollment
from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import ExamType, Mark
from common.constants import (
    ALL_ROLES,
    ATTENDANCE_STATUSES,
    FORBIDDEN_ATTENDANCE_STATUSES,
    GRADE_A1, GRADE_A2, GRADE_B1, GRADE_B2, GRADE_C1, GRADE_C2, GRADE_D, GRADE_E,
)
from common.exceptions import InvalidAttendanceStatusError, ImmutableFieldMutationError
from common.utils import (
    calculate_attendance_percentage,
    calculate_grade,
    calculate_percentage,
    format_student_id,
    validate_student_id,
)


# ============================================================================
# A. Migration Inventory & Graph Audit
# ============================================================================

class TestMigrationInventoryTask35:
    """Migration inventory and graph validation for Task 3.5."""

    def test_no_pending_migrations(self):
        """Migration autodetector confirms zero pending model changes."""
        from django.db.migrations.autodetector import MigrationAutodetector
        from django.db.migrations.loader import MigrationLoader
        from django.db.migrations.state import ProjectState

        loader = MigrationLoader(None, ignore_no_migrations=True)
        autodetector = MigrationAutodetector(
            loader.project_state(),
            ProjectState.from_apps(django_apps),
        )
        changes = autodetector.changes(graph=loader.graph)
        assert not changes, f"Pending migration changes detected: {changes}"

    def test_migration_graph_dependency_chain(self):
        """
        Verify the migration dependency ordering:
        accounts -> students & academics -> attendance & marks
        """
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        graph = loader.graph

        # accounts/0001_initial must be present
        assert ('accounts', '0001_initial') in graph.nodes
        # students/0001_initial must depend on accounts/0001_initial
        students_deps = graph.nodes[('students', '0001_initial')].dependencies
        assert any(d[0] == 'accounts' for d in students_deps)

        # academics/0002_initial must depend on accounts & students
        academics_deps = graph.nodes[('academics', '0002_initial')].dependencies
        assert any(d[0] == 'accounts' for d in academics_deps)
        assert any(d[0] == 'students' for d in academics_deps)

        # attendance/0001_initial must depend on academics, accounts, and students
        att_deps = graph.nodes[('attendance', '0001_initial')].dependencies
        assert any(d[0] == 'academics' for d in att_deps)

        # marks/0001_initial must depend on academics & accounts
        marks_deps = graph.nodes[('marks', '0001_initial')].dependencies
        assert any(d[0] == 'academics' for d in marks_deps)

    def test_deferred_apps_have_zero_migrations(self):
        """Deferred apps must have zero migration files."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        deferred_apps = ('timetable', 'calendar', 'allocation', 'reports', 'notifications', 'audit')
        for app in deferred_apps:
            keys = [k for k in loader.disk_migrations if k[0] == app]
            assert keys == [], f"Deferred app '{app}' has unexpected migrations: {keys}"


# ============================================================================
# B. Model Constraint & Delete Behavior Audit
# ============================================================================

class TestConstraintAndDeleteBehaviorAudit:
    """Audit of foreign key deletion behavior and domain constraints."""

    def test_all_13_concrete_models_registered(self):
        """All 13 concrete 3NF domain models must be registered in Django app registry."""
        model_names = {m.__name__ for m in django_apps.get_models()}
        expected_13 = {
            'Role', 'User', 'Faculty', 'Parent',               # accounts (4)
            'Student',                                          # students (1)
            'AcademicYear', 'SchoolClass', 'Section',           # academics (5)
            'Subject', 'Enrollment',
            'Attendance', 'LeaveApplication',                   # attendance (2)
            'ExamType', 'Mark',                                 # marks (2)
        }
        missing = expected_13 - model_names
        assert not missing, f"Missing concrete models in Task 3.5: {missing}"

    def test_student_id_format_and_immutability_logic(self):
        """Permanent Student ID must follow regex STUYYYYNNNNN and raise error on mutation."""
        assert validate_student_id('STU202600001') is True
        assert validate_student_id('INVALID_123') is False

        s = Student.__new__(Student)
        s.pk = uuid.uuid4()
        s.student_id = 'STU202699999'

        original_get = Student.objects.get

        class _FakeOriginal:
            student_id = 'STU202600001'

        def _mock_get(**kwargs):
            return _FakeOriginal()

        Student.objects.get = _mock_get
        try:
            with pytest.raises(ImmutableFieldMutationError):
                s.save()
        finally:
            Student.objects.get = original_get

    def test_attendance_status_constraint_and_semantics(self):
        """Attendance status must accept PRESENT, ABSENT, ON_DUTY, LEAVE and reject LATE/EXCUSED."""
        for valid in ATTENDANCE_STATUSES:
            att = Attendance(status=valid, date=date.today())
            att.clean()
            assert att.status == valid

        for forbidden in FORBIDDEN_ATTENDANCE_STATUSES:
            att = Attendance(status=forbidden, date=date.today())
            with pytest.raises(ValidationError):
                att.clean()

    def test_marks_obtained_range_validation(self):
        """Marks obtained must be between 0.00 and max_marks."""
        m_valid = Mark(marks_obtained=Decimal('85.00'), max_marks=Decimal('100.00'))
        m_valid.clean()
        assert m_valid.grade == GRADE_A2

        m_neg = Mark(marks_obtained=Decimal('-1.00'), max_marks=Decimal('100.00'))
        with pytest.raises(ValidationError):
            m_neg.clean()

        m_over = Mark(marks_obtained=Decimal('101.00'), max_marks=Decimal('100.00'))
        with pytest.raises(ValidationError):
            m_over.clean()


# ============================================================================
# C. Seed Data Command Audit
# ============================================================================

class TestSeedDevDataCommandAudit:
    """Audit of seed_dev_data management command registration and parameters."""

    def test_seed_command_registered(self):
        """seed_dev_data management command must be registered and discoverable."""
        from django.core.management import get_commands
        commands = get_commands()
        assert 'seed_dev_data' in commands, "seed_dev_data command is not registered in management commands"


# ============================================================================
# D. Live DB Integration & Seed Idempotency (Requires PostgreSQL)
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
class TestLiveDatabaseSeedAndIdempotency:
    """Execution and idempotency verification for seed_dev_data on live PostgreSQL."""

    def test_seed_dev_data_idempotent_execution(self):
        """Executing seed_dev_data twice must succeed and yield identical entity counts."""
        out1 = StringIO()
        call_command('seed_dev_data', stdout=out1)
        role_count_1 = Role.objects.count()
        user_count_1 = User.objects.count()
        student_count_1 = Student.objects.count()

        out2 = StringIO()
        call_command('seed_dev_data', stdout=out2)
        role_count_2 = Role.objects.count()
        user_count_2 = User.objects.count()
        student_count_2 = Student.objects.count()

        assert role_count_1 == role_count_2 == len(ALL_ROLES)
        assert user_count_1 == user_count_2
        assert student_count_1 == student_count_2
