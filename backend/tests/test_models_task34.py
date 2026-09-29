"""
Student ERP — Task 3.4 Model Tests
Phase 3, Task 3.4: Attendance & Marks Database Layer

Test categories:
  A. No-DB tests (always runnable): migration graph, model structure, attendance formula, grading boundaries, validation.
  B. DB tests (@pytest.mark.django_db): require live PostgreSQL connection.
"""

from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.apps import apps as django_apps
from django.core.exceptions import ValidationError

from apps.attendance.models import Attendance, LeaveApplication
from apps.marks.models import ExamType, Mark
from common.constants import (
    ALL_GRADES,
    ATTENDANCE_STATUSES,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_LEAVE,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_PRESENT,
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
from common.exceptions import InvalidAttendanceStatusError
from common.utils import (
    calculate_attendance_percentage,
    calculate_cumulative_evaluation,
    calculate_grade,
    calculate_percentage,
    validate_attendance_status,
)


# ============================================================================
# A. No-DB Tests — Migration Graph & Model Structure
# ============================================================================

class TestMigrationGraphTask34:
    """Migration graph validation for attendance and marks apps."""

    def test_no_pending_model_changes(self):
        """All model changes must have corresponding migration files."""
        from django.db.migrations.autodetector import MigrationAutodetector
        from django.db.migrations.loader import MigrationLoader
        from django.db.migrations.state import ProjectState

        loader = MigrationLoader(None, ignore_no_migrations=True)
        autodetector = MigrationAutodetector(
            loader.project_state(),
            ProjectState.from_apps(django_apps),
        )
        changes = autodetector.changes(graph=loader.graph)
        assert not changes, f"Pending migrations detected: {changes}"

    def test_attendance_migration_exists(self):
        """attendance/migrations/0001_initial.py must exist."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        attendance_keys = [k for k in loader.disk_migrations if k[0] == 'attendance']
        assert len(attendance_keys) >= 1, "attendance app must have initial migration"

    def test_marks_migration_exists(self):
        """marks/migrations/0001_initial.py must exist."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        marks_keys = [k for k in loader.disk_migrations if k[0] == 'marks']
        assert len(marks_keys) >= 1, "marks app must have initial migration"

    def test_attendance_migration_dependencies(self):
        """attendance 0001_initial must depend on academics, accounts, and students."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        key = ('attendance', '0001_initial')
        assert key in loader.disk_migrations, "attendance 0001_initial missing from disk"
        mig = loader.disk_migrations[key]
        dep_apps = {d[0] for d in mig.dependencies}
        assert 'academics' in dep_apps, "attendance migration must depend on academics"
        assert 'accounts' in dep_apps, "attendance migration must depend on accounts"
        assert 'students' in dep_apps, "attendance migration must depend on students"

    def test_marks_migration_dependencies(self):
        """marks 0001_initial must depend on academics and accounts."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        key = ('marks', '0001_initial')
        assert key in loader.disk_migrations, "marks 0001_initial missing from disk"
        mig = loader.disk_migrations[key]
        dep_apps = {d[0] for d in mig.dependencies}
        assert 'academics' in dep_apps, "marks migration must depend on academics"
        assert 'accounts' in dep_apps, "marks migration must depend on accounts"


class TestAttendanceModelStructure:
    """Structure & validation checks for Attendance and LeaveApplication models."""

    def test_attendance_model_fields(self):
        """Verify field names and types on Attendance model."""
        fields = {f.name: f for f in Attendance._meta.get_fields()}
        expected_fields = [
            'id', 'enrollment', 'date', 'session_period', 'status',
            'remarks', 'recorded_by', 'approved_by_faculty', 'created_at', 'updated_at',
        ]
        for ef in expected_fields:
            assert ef in fields, f"Field '{ef}' missing from Attendance model"

    def test_leave_application_model_fields(self):
        """Verify field names and types on LeaveApplication model."""
        fields = {f.name: f for f in LeaveApplication._meta.get_fields()}
        expected_fields = [
            'id', 'student', 'leave_type', 'start_date', 'end_date',
            'reason', 'status', 'applied_on', 'reviewed_by', 'reviewed_at', 'review_remarks',
        ]
        for ef in expected_fields:
            assert ef in fields, f"Field '{ef}' missing from LeaveApplication model"

    def test_valid_statuses_are_exactly_4(self):
        """Attendance statuses must be exactly PRESENT, ABSENT, ON_DUTY, LEAVE."""
        assert set(ATTENDANCE_STATUSES) == {'PRESENT', 'ABSENT', 'ON_DUTY', 'LEAVE'}

    def test_forbidden_statuses_rejected_by_utility(self):
        """LATE and EXCUSED must be rejected with InvalidAttendanceStatusError."""
        for forbidden in FORBIDDEN_ATTENDANCE_STATUSES:
            with pytest.raises(InvalidAttendanceStatusError):
                validate_attendance_status(forbidden)

    def test_attendance_clean_rejects_forbidden_status(self):
        """Attendance.clean() raises ValidationError when status is invalid/forbidden."""
        att = Attendance(
            date=date.today(),
            status='LATE',
        )
        with pytest.raises(ValidationError) as excinfo:
            att.clean()
        assert 'status' in excinfo.value.message_dict

    def test_leave_application_end_date_before_start_date_raises_error(self):
        """LeaveApplication.clean() raises ValidationError if end_date < start_date."""
        today = date.today()
        leave = LeaveApplication(
            start_date=today,
            end_date=today - timedelta(days=1),
            reason="Family function",
        )
        with pytest.raises(ValidationError) as excinfo:
            leave.clean()
        assert 'end_date' in excinfo.value.message_dict


class TestAttendanceFormulaAndSemantics:
    """Validation of canonical attendance percentage calculations."""

    def test_canonical_attendance_formula(self):
        """Attendance % = (P + OD) / (P + A + OD + L) * 100."""
        # 10 PRESENT, 2 ABSENT, 1 ON_DUTY, 1 LEAVE -> total = 14, effective present = 11 -> 11/14 * 100 = 78.6%
        pct = calculate_attendance_percentage(present=10, absent=2, on_duty=1, leave=1)
        assert pct == 78.6

    def test_on_duty_counted_as_present(self):
        """ON_DUTY contributes to both numerator and denominator (100% when all ON_DUTY)."""
        pct = calculate_attendance_percentage(present=0, absent=0, on_duty=5, leave=0)
        assert pct == 100.0

    def test_leave_counted_as_absence_in_denominator(self):
        """LEAVE increases denominator without increasing numerator (50% when 5 PRESENT, 5 LEAVE)."""
        pct = calculate_attendance_percentage(present=5, absent=0, on_duty=0, leave=5)
        assert pct == 50.0

    def test_zero_denominator_returns_zero(self):
        """Zero total sessions must return 0.0 without division by zero."""
        pct = calculate_attendance_percentage(present=0, absent=0, on_duty=0, leave=0)
        assert pct == 0.0


class TestMarksModelStructureAndGrading:
    """Structure & validation checks for ExamType and Mark models, and CBSE grading."""

    def test_exam_type_model_fields(self):
        """Verify field names on ExamType model."""
        fields = {f.name: f for f in ExamType._meta.get_fields()}
        for ef in ['id', 'name', 'weightage', 'is_active']:
            assert ef in fields, f"Field '{ef}' missing from ExamType model"

    def test_mark_model_fields(self):
        """Verify field names on Mark model."""
        fields = {f.name: f for f in Mark._meta.get_fields()}
        for ef in ['id', 'enrollment', 'subject', 'exam_type', 'marks_obtained', 'max_marks', 'grade', 'evaluated_by']:
            assert ef in fields, f"Field '{ef}' missing from Mark model"

    def test_mark_clean_valid_range(self):
        """Mark.clean() allows 0.0 and 100.0 and derives letter grade."""
        m_zero = Mark(marks_obtained=Decimal('0.00'), max_marks=Decimal('100.00'))
        m_zero.clean()
        assert m_zero.grade == GRADE_E

        m_full = Mark(marks_obtained=Decimal('100.00'), max_marks=Decimal('100.00'))
        m_full.clean()
        assert m_full.grade == GRADE_A1

    def test_mark_clean_rejects_negative_marks(self):
        """Mark.clean() raises ValidationError for negative marks."""
        m_neg = Mark(marks_obtained=Decimal('-5.00'), max_marks=Decimal('100.00'))
        with pytest.raises(ValidationError) as excinfo:
            m_neg.clean()
        assert 'marks_obtained' in excinfo.value.message_dict

    def test_mark_clean_rejects_marks_exceeding_max(self):
        """Mark.clean() raises ValidationError if marks_obtained > max_marks."""
        m_over = Mark(marks_obtained=Decimal('105.00'), max_marks=Decimal('100.00'))
        with pytest.raises(ValidationError) as excinfo:
            m_over.clean()
        assert 'marks_obtained' in excinfo.value.message_dict

    def test_cbse_8_tier_grading_scale_boundaries(self):
        """Boundary assertions for CBSE 8-tier grading scale."""
        boundaries = [
            (32.99, GRADE_E),
            (33.00, GRADE_D),
            (40.99, GRADE_D),
            (41.00, GRADE_C2),
            (50.99, GRADE_C2),
            (51.00, GRADE_C1),
            (60.99, GRADE_C1),
            (61.00, GRADE_B2),
            (70.99, GRADE_B2),
            (71.00, GRADE_B1),
            (80.99, GRADE_B1),
            (81.00, GRADE_A2),
            (90.99, GRADE_A2),
            (91.00, GRADE_A1),
            (100.00, GRADE_A1),
        ]
        for pct, expected_grade in boundaries:
            derived = calculate_grade(pct)
            assert derived == expected_grade, f"Percentage {pct}% expected {expected_grade}, got {derived}"


# ============================================================================
# B. Live Database Integration Tests (Requires PostgreSQL)
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
class TestLiveDatabaseIntegrationTask34:
    """Integration tests running against live PostgreSQL database."""

    def test_create_exam_type(self):
        """Test persisting an ExamType record in PostgreSQL."""
        et = ExamType.objects.create(name="Midterm Examination 2026", weightage=Decimal('30.00'))
        assert et.id is not None
        assert ExamType.objects.count() == 1

