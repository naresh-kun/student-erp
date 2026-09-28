"""
Student ERP — Task 3.3 Model Tests
Phase 3, Task 3.3: Core Database Models & PostgreSQL Schema

Test categories:
  A. No-DB tests (always runnable): migration graph, model structure, settings.
  B. DB tests (@pytest.mark.django_db): require a live PostgreSQL connection.
     These will be skipped/error if PostgreSQL is unavailable — this is expected
     and reported honestly per Task 3.3 spec section 31.
"""

import uuid
import pytest
from io import StringIO
from django.conf import settings
from django.apps import apps as django_apps
from django.core.management import call_command


# ============================================================================
# A. No-DB Tests — Migration Graph & Model Structure
# ============================================================================

class TestSettings:
    """Settings-level checks for Task 3.3 requirements."""

    def test_auth_user_model_set_to_accounts_user(self):
        """AUTH_USER_MODEL must be 'accounts.User' from Task 3.3 onward."""
        assert settings.AUTH_USER_MODEL == 'accounts.User', (
            f"AUTH_USER_MODEL must be 'accounts.User', got '{settings.AUTH_USER_MODEL}'. "
            f"Custom user model is a Task 3.3 requirement."
        )


class TestMigrationGraph:
    """Migration graph validation — no live DB required."""

    def test_no_pending_model_changes(self):
        """
        All model changes must have corresponding migration files.
        Checked in-memory via MigrationAutodetector without DB query.
        """
        from django.db.migrations.autodetector import MigrationAutodetector
        from django.db.migrations.loader import MigrationLoader
        from django.db.migrations.state import ProjectState

        loader = MigrationLoader(None, ignore_no_migrations=True)
        autodetector = MigrationAutodetector(
            loader.project_state(),
            ProjectState.from_apps(django_apps),
        )
        changes = autodetector.changes(graph=loader.graph)
        assert not changes, f"Pending migrations detected — model changes without migration files exist: {changes}"

    def test_accounts_migration_exists(self):
        """accounts/migrations/0001_initial.py must exist."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        accounts_keys = [k for k in loader.disk_migrations if k[0] == 'accounts']
        assert len(accounts_keys) >= 1, "accounts app must have at least one migration (Task 3.3)"

    def test_students_migration_exists(self):
        """students/migrations/0001_initial.py must exist."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        students_keys = [k for k in loader.disk_migrations if k[0] == 'students']
        assert len(students_keys) >= 1, "students app must have at least one migration (Task 3.3)"

    def test_academics_migration_exists(self):
        """academics/migrations/0001_initial.py must exist."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        academics_keys = [k for k in loader.disk_migrations if k[0] == 'academics']
        assert len(academics_keys) >= 1, "academics app must have at least one migration (Task 3.3)"

    def test_students_migration_depends_on_accounts(self):
        """students/0001_initial must depend on accounts/0001_initial."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        students_keys = sorted([k for k in loader.disk_migrations if k[0] == 'students'])
        if students_keys:
            first_students = loader.disk_migrations[students_keys[0]]
            accounts_deps = [d for d in first_students.dependencies if d[0] == 'accounts']
            assert accounts_deps, (
                "students 0001_initial must declare a dependency on accounts. "
                "Student references accounts.User and accounts.Parent."
            )

    def test_academics_migration_depends_on_accounts_and_students(self):
        """academics/0002_initial must depend on both accounts and students."""
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        # 0002_initial is the one that wires cross-app FKs
        key = ('academics', '0002_initial')
        if key in loader.disk_migrations:
            mig = loader.disk_migrations[key]
            dep_apps = {d[0] for d in mig.dependencies}
            assert 'accounts' in dep_apps, "academics 0002_initial must depend on accounts"
            assert 'students' in dep_apps, "academics 0002_initial must depend on students"

    def test_attendance_and_marks_have_no_migrations(self):
        """
        Task 3.4 boundary: attendance and marks apps must have zero migrations.
        No attendance or marks tables should exist at the end of Task 3.3.
        """
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(None, ignore_no_migrations=True)
        for deferred_app in ('attendance', 'marks'):
            mig_keys = [k for k in loader.disk_migrations if k[0] == deferred_app]
            assert mig_keys == [], (
                f"Task 3.4 violation: '{deferred_app}' app has migration files {mig_keys}. "
                f"Attendance and Marks belong to Task 3.4."
            )


class TestModelStructure:
    """Structural model validation — no live DB required."""

    def test_all_task_33_models_registered(self):
        """All 10 Task 3.3 concrete models must be in the app registry."""
        all_names = {m.__name__ for m in django_apps.get_models()}
        required = {
            'Role', 'User', 'Parent', 'Faculty',
            'Student',
            'AcademicYear', 'SchoolClass', 'Section', 'Subject', 'Enrollment',
        }
        missing = required - all_names
        assert not missing, f"Missing Task 3.3 models: {missing}"

    def test_deferred_models_not_registered(self):
        """Task 3.4+ models must not be registered."""
        all_names = {m.__name__ for m in django_apps.get_models()}
        forbidden = {
            'Attendance', 'LeaveApplication',  # Task 3.4
            'ExamType', 'Mark',                 # Task 3.4
            'Timetable', 'CalendarEvent', 'Allocation', 'Report', 'Notification', 'AuditLog',
        }
        leaked = forbidden & all_names
        assert not leaked, f"Deferred models leaked into Task 3.3: {leaked}"

    def test_abstract_base_models_not_registered_as_concrete(self):
        """Abstract base models in common must remain abstract."""
        all_names = {m.__name__ for m in django_apps.get_models()}
        assert 'BaseModel' not in all_names
        assert 'UUIDModel' not in all_names
        assert 'TimeStampedModel' not in all_names

    def test_role_model_uuid_pk(self):
        from apps.accounts.models import Role
        pk = Role._meta.pk
        assert isinstance(pk, django_apps.get_model('accounts', 'Role')._meta.pk.__class__)
        assert pk.name == 'id'
        from django.db.models import UUIDField
        assert isinstance(pk, UUIDField), "Role primary key must be UUIDField"

    def test_user_model_uuid_pk(self):
        from apps.accounts.models import User
        from django.db.models import UUIDField
        pk = User._meta.pk
        assert isinstance(pk, UUIDField), "User primary key must be UUIDField"

    def test_user_model_has_role_fk(self):
        from apps.accounts.models import User
        from django.db.models import ForeignKey
        role_field = User._meta.get_field('role')
        assert isinstance(role_field, ForeignKey)

    def test_user_role_fk_uses_restrict(self):
        from apps.accounts.models import User
        from django.db.models import RESTRICT
        role_field = User._meta.get_field('role')
        assert role_field.remote_field.on_delete == RESTRICT

    def test_student_model_uuid_pk(self):
        from apps.students.models import Student
        from django.db.models import UUIDField
        pk = Student._meta.pk
        assert isinstance(pk, UUIDField), "Student primary key must be UUIDField"

    def test_student_id_field_unique(self):
        from apps.students.models import Student
        field = Student._meta.get_field('student_id')
        assert field.unique is True, "student_id must be unique"

    def test_student_parent_fk_uses_protect(self):
        from apps.students.models import Student
        from django.db.models import PROTECT
        parent_field = Student._meta.get_field('parent')
        assert parent_field.remote_field.on_delete == PROTECT

    def test_student_parent_fk_nullable(self):
        from apps.students.models import Student
        parent_field = Student._meta.get_field('parent')
        assert parent_field.null is True

    def test_section_class_teacher_fk_set_null(self):
        from apps.academics.models import Section
        from django.db.models import SET_NULL
        field = Section._meta.get_field('class_teacher')
        assert field.remote_field.on_delete == SET_NULL

    def test_section_class_teacher_nullable(self):
        from apps.academics.models import Section
        field = Section._meta.get_field('class_teacher')
        assert field.null is True
        assert field.blank is True

    def test_school_class_fk_academic_year_uses_protect(self):
        from apps.academics.models import SchoolClass
        from django.db.models import PROTECT
        field = SchoolClass._meta.get_field('academic_year')
        assert field.remote_field.on_delete == PROTECT

    def test_enrollment_unique_together_student_academic_year(self):
        from apps.academics.models import Enrollment
        unique_sets = [frozenset(ut) for ut in Enrollment._meta.unique_together]
        assert frozenset({'student', 'academic_year'}) in unique_sets, (
            "Enrollment must enforce unique_together = [('student', 'academic_year')]"
        )

    def test_section_unique_together_class_name(self):
        from apps.academics.models import Section
        unique_sets = [frozenset(ut) for ut in Section._meta.unique_together]
        assert frozenset({'school_class', 'name'}) in unique_sets

    def test_school_class_unique_together_year_code(self):
        from apps.academics.models import SchoolClass
        unique_sets = [frozenset(ut) for ut in SchoolClass._meta.unique_together]
        assert frozenset({'academic_year', 'code'}) in unique_sets

    def test_subject_code_unique(self):
        from apps.academics.models import Subject
        field = Subject._meta.get_field('code')
        assert field.unique is True

    def test_subject_uses_weekly_periods_not_credits(self):
        """ADR 008: Subject must have weekly_periods, not credits."""
        from apps.academics.models import Subject
        field_names = {f.name for f in Subject._meta.get_fields()}
        assert 'weekly_periods' in field_names, "Subject must have weekly_periods (ADR 008)"
        assert 'credits' not in field_names, "credits field is purged per ADR 008"

    def test_faculty_profile_is_strictly_descriptive(self):
        """ADR 008: Faculty model must NOT contain evaluative fields."""
        from apps.academics.models import Section  # noqa (import check)
        from apps.accounts.models import Faculty
        field_names = {f.name for f in Faculty._meta.get_fields()}
        evaluative_fields = {
            'performance_rating', 'rating', 'score', 'rank', 'ranking',
            'appraisal', 'evaluation_score', 'leaderboard_rank',
        }
        leaked = evaluative_fields & field_names
        assert not leaked, f"Faculty has evaluative fields (violates ADR 008): {leaked}"


class TestStudentIdValidation:
    """Student ID format and immutability logic — no live DB required."""

    def test_valid_student_id_format_passes_clean(self):
        from apps.students.models import Student
        from apps.accounts.models import User
        from django.core.exceptions import ValidationError
        student = Student.__new__(Student)
        student.student_id = 'STU202600001'
        try:
            student.clean()
        except ValidationError as e:
            pytest.fail(f"Valid student_id 'STU202600001' raised ValidationError: {e}")

    def test_invalid_student_id_format_fails_clean(self):
        from apps.students.models import Student
        from django.core.exceptions import ValidationError
        student = Student.__new__(Student)
        student.student_id = 'BADFORMAT'
        with pytest.raises(ValidationError) as exc_info:
            student.clean()
        assert 'student_id' in exc_info.value.message_dict

    def test_student_id_immutability_raises_on_change(self):
        """Immutability guard raises ImmutableFieldMutationError on student_id change."""
        from apps.students.models import Student
        from common.exceptions import ImmutableFieldMutationError
        # Simulate an existing record by creating a mock with pk set
        student = Student.__new__(Student)
        student.pk = uuid.uuid4()
        student.student_id = 'STU202699999'

        # Patch objects.get to return a mock with a different student_id
        original_get = Student.objects.get

        class _FakeOriginal:
            student_id = 'STU202600001'

        def _mock_get(**kwargs):
            return _FakeOriginal()

        Student.objects.get = _mock_get
        try:
            with pytest.raises(ImmutableFieldMutationError):
                student.save()
        finally:
            Student.objects.get = original_get


# ============================================================================
# B. DB Tests — Require live PostgreSQL
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
class TestRoleModelDB:
    """Role model CRUD and constraints — requires PostgreSQL."""

    def test_role_creation_with_uuid_pk(self):
        from apps.accounts.models import Role
        role = Role.objects.create(name='Admin', description='System administrator.')
        assert isinstance(role.id, uuid.UUID)
        assert role.name == 'Admin'
        assert role.created_at is not None

    def test_role_name_unique_constraint(self):
        from apps.accounts.models import Role
        from django.db import IntegrityError
        Role.objects.create(name='Principal')
        with pytest.raises(IntegrityError):
            Role.objects.create(name='Principal')

    def test_all_five_roles_created(self):
        from apps.accounts.models import Role
        from common.constants import ALL_ROLES
        for role_name in ALL_ROLES:
            role = Role.objects.create(name=role_name)
            assert str(role) == role_name


@db_available
@pytest.mark.django_db
class TestUserModelDB:
    """User model CRUD — requires PostgreSQL."""

    def test_user_creation_uuid_pk(self):
        from apps.accounts.models import User
        user = User.objects.create_user(
            username='testuser01', password='pass123', email='u@erp.in'
        )
        assert isinstance(user.id, uuid.UUID)

    def test_user_with_role_assignment(self):
        from apps.accounts.models import User, Role
        role = Role.objects.create(name='Faculty')
        user = User.objects.create_user(
            username='fac01', password='pass', email='fac@erp.in', role=role
        )
        assert user.role.name == 'Faculty'

    def test_role_restrict_prevents_deletion_with_users(self):
        from apps.accounts.models import User, Role
        from django.db import IntegrityError
        role = Role.objects.create(name='Student')
        User.objects.create_user(username='stu99', password='p', email='s@erp.in', role=role)
        with pytest.raises((IntegrityError, Exception)):
            role.delete()


@db_available
@pytest.mark.django_db
class TestStudentModelDB:
    """Student model CRUD, immutability, uniqueness — requires PostgreSQL."""

    def _make_user(self, username='stu_test', email=None, role_name='Student'):
        from apps.accounts.models import User, Role
        role, _ = Role.objects.get_or_create(name=role_name)
        return User.objects.create_user(
            username=username,
            password='pass',
            email=email or f'{username}@erp.in',
            role=role,
        )

    def test_student_creation(self):
        from apps.students.models import Student
        user = self._make_user()
        student = Student.objects.create(
            user=user,
            student_id='STU202600001',
            admission_number='ADM20240001',
            roll_number='11-A2-01',
            date_of_birth='2009-05-14',
            gender='Male',
            emergency_contact='+91-9876543210',
            address='123 Test Street, Chennai',
        )
        assert isinstance(student.id, uuid.UUID)
        assert student.student_id == 'STU202600001'
        assert student.status == 'Enrolled'

    def test_student_id_unique_constraint(self):
        from apps.students.models import Student
        from django.db import IntegrityError
        user_a = self._make_user('stu_a', 'a@erp.in')
        user_b = self._make_user('stu_b', 'b@erp.in')
        Student.objects.create(
            user=user_a, student_id='STU202600002',
            admission_number='ADM002', roll_number='1',
            date_of_birth='2009-01-01', gender='Female',
            emergency_contact='9876543210', address='Addr',
        )
        with pytest.raises(IntegrityError):
            Student.objects.create(
                user=user_b, student_id='STU202600002',
                admission_number='ADM003', roll_number='2',
                date_of_birth='2010-01-01', gender='Male',
                emergency_contact='9876543210', address='Addr',
            )

    def test_student_id_immutability(self):
        from apps.students.models import Student
        from common.exceptions import ImmutableFieldMutationError
        user = self._make_user()
        student = Student.objects.create(
            user=user, student_id='STU202600003',
            admission_number='ADM003', roll_number='1',
            date_of_birth='2009-01-01', gender='Male',
            emergency_contact='9876543210', address='Addr',
        )
        student.student_id = 'STU202699999'
        with pytest.raises(ImmutableFieldMutationError):
            student.save()

    def test_parent_protect_prevents_deletion(self):
        from apps.accounts.models import Parent
        from apps.students.models import Student
        from django.db import ProtectedError
        parent_user = self._make_user('par01', 'par@erp.in', 'Parent')
        parent = Parent.objects.create(user=parent_user, relation='Father')
        student_user = self._make_user('stu_p', 'stup@erp.in')
        Student.objects.create(
            user=student_user, parent=parent,
            student_id='STU202600010', admission_number='ADM010',
            roll_number='1', date_of_birth='2009-01-01', gender='Male',
            emergency_contact='9876543210', address='Addr',
        )
        with pytest.raises((ProtectedError, Exception)):
            parent.delete()


@db_available
@pytest.mark.django_db
class TestAcademicStructureDB:
    """Academic structure models CRUD and constraints — requires PostgreSQL."""

    def test_academic_year_creation(self):
        from apps.academics.models import AcademicYear
        ay = AcademicYear.objects.create(
            name='2026-2027', start_date='2026-06-01',
            end_date='2027-03-31', is_current=True,
        )
        assert ay.name == '2026-2027'
        assert isinstance(ay.id, uuid.UUID)

    def test_school_class_creation(self):
        from apps.academics.models import AcademicYear, SchoolClass
        ay = AcademicYear.objects.create(
            name='2026-2027', start_date='2026-06-01', end_date='2027-03-31'
        )
        sc = SchoolClass.objects.create(
            academic_year=ay, name='Grade 11 - Computer Science', code='G11-CS'
        )
        assert sc.name == 'Grade 11 - Computer Science'
        assert isinstance(sc.id, uuid.UUID)

    def test_school_class_unique_code_per_year(self):
        from apps.academics.models import AcademicYear, SchoolClass
        from django.db import IntegrityError
        ay = AcademicYear.objects.create(
            name='2026-2027-b', start_date='2026-06-01', end_date='2027-03-31'
        )
        SchoolClass.objects.create(academic_year=ay, name='Grade 11 CS', code='G11-CS')
        with pytest.raises(IntegrityError):
            SchoolClass.objects.create(academic_year=ay, name='Grade 11 CS Dup', code='G11-CS')

    def test_section_unique_name_per_class(self):
        from apps.academics.models import AcademicYear, SchoolClass, Section
        from django.db import IntegrityError
        ay = AcademicYear.objects.create(
            name='2026-2027-c', start_date='2026-06-01', end_date='2027-03-31'
        )
        sc = SchoolClass.objects.create(academic_year=ay, name='G11 CS', code='G11-CS-c')
        Section.objects.create(school_class=sc, name='A1', room='Room 101')
        with pytest.raises(IntegrityError):
            Section.objects.create(school_class=sc, name='A1', room='Room 102')

    def test_section_class_teacher_set_null_on_faculty_delete(self):
        from apps.accounts.models import User, Role, Faculty
        from apps.academics.models import AcademicYear, SchoolClass, Section
        role, _ = Role.objects.get_or_create(name='Faculty')
        u = User.objects.create_user(username='fac_del', password='p', email='fd@erp.in', role=role)
        fac = Faculty.objects.create(
            user=u, employee_code='FAC_DEL_01', department='Maths',
            designation='PGT', joining_date='2020-06-01'
        )
        ay = AcademicYear.objects.create(
            name='2026-2027-d', start_date='2026-06-01', end_date='2027-03-31'
        )
        sc = SchoolClass.objects.create(academic_year=ay, name='G11', code='G11-d')
        sec = Section.objects.create(school_class=sc, name='A', class_teacher=fac)
        assert sec.class_teacher == fac
        # Delete user → cascades to faculty → section.class_teacher becomes NULL
        u.delete()
        sec.refresh_from_db()
        assert sec.class_teacher is None

    def test_subject_code_unique(self):
        from apps.academics.models import Subject
        from django.db import IntegrityError
        Subject.objects.create(
            name='Mathematics', code='MATH11', department='Mathematics'
        )
        with pytest.raises(IntegrityError):
            Subject.objects.create(
                name='Mathematics Duplicate', code='MATH11', department='Mathematics'
            )

    def test_enrollment_unique_per_student_per_year(self):
        from apps.accounts.models import User, Role
        from apps.students.models import Student
        from apps.academics.models import AcademicYear, SchoolClass, Section, Enrollment
        from django.db import IntegrityError

        role, _ = Role.objects.get_or_create(name='Student')
        u = User.objects.create_user(username='enr_test', password='p', email='en@erp.in', role=role)
        student = Student.objects.create(
            user=u, student_id='STU202600099',
            admission_number='ADM099', roll_number='1',
            date_of_birth='2009-01-01', gender='Female',
            emergency_contact='9876543210', address='Addr',
        )
        ay = AcademicYear.objects.create(
            name='2026-2027-e', start_date='2026-06-01', end_date='2027-03-31'
        )
        sc = SchoolClass.objects.create(academic_year=ay, name='G11', code='G11-e')
        sec1 = Section.objects.create(school_class=sc, name='A1-e')
        sec2 = Section.objects.create(school_class=sc, name='A2-e')
        Enrollment.objects.create(student=student, section=sec1, academic_year=ay)
        with pytest.raises(IntegrityError):
            Enrollment.objects.create(student=student, section=sec2, academic_year=ay)
