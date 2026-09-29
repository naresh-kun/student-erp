"""
Student ERP — Test Task 3.2 Architecture Scaffolding & Boundary Integrity
Verifies:
1. Shared abstract base classes exist in common.models
2. Every domain app has the required architectural files (models, services, serializers, views, urls)
3. Zero premature concrete ERP business models exist in Task 3.2
"""

import os
from django.conf import settings
from django.apps import apps
from common.models import BaseModel, UUIDModel, TimeStampedModel

ALL_DOMAIN_APPS = [
    'accounts',
    'students',
    'academics',
    'attendance',
    'marks',
    'timetable',
    'calendar',
    'allocation',
    'reports',
    'notifications',
    'audit',
]


def test_shared_abstract_base_models():
    """Verifies shared abstract models in common/models.py."""
    assert issubclass(BaseModel, UUIDModel)
    assert issubclass(BaseModel, TimeStampedModel)
    assert BaseModel._meta.abstract is True
    assert UUIDModel._meta.abstract is True
    assert TimeStampedModel._meta.abstract is True


def test_domain_apps_architectural_file_structure():
    """Verifies that every domain app exposes models, services, serializers, views, and urls."""
    base_apps_dir = settings.BASE_DIR / 'apps'
    required_files = ['models.py', 'services.py', 'serializers.py', 'views.py', 'urls.py']

    for app_name in ALL_DOMAIN_APPS:
        app_dir = base_apps_dir / app_name
        assert app_dir.is_dir(), f"Domain app directory '{app_name}' missing"
        for filename in required_files:
            file_path = app_dir / filename
            assert file_path.is_file(), f"App '{app_name}' missing required architectural file '{filename}'"


def test_task_3_4_concrete_models_registered_and_scope_boundaries_enforced():
    """
    Task 3.4 Boundary Assertion (supersedes Task 3.3 boundary assertion):

    1. Task 3.3 core concrete models ARE registered:
       accounts: Role, User, Parent, Faculty
       students: Student
       academics: AcademicYear, SchoolClass, Section, Subject, Enrollment

    2. Task 3.4 models ARE registered:
       attendance: Attendance, LeaveApplication
       marks: ExamType, Mark

    3. Later domain models remain NOT registered yet (Timetable, Calendar, Allocation, Report, Notification, AuditLog).
    """
    all_model_names = {m.__name__ for m in apps.get_models()}

    # --- Task 3.3 & Task 3.4 required models (must be present) ---
    required_models = {
        'Role', 'User', 'Parent', 'Faculty',   # accounts
        'Student',                              # students
        'AcademicYear', 'SchoolClass', 'Section', 'Subject', 'Enrollment',  # academics
        'Attendance', 'LeaveApplication',       # attendance (Task 3.4)
        'ExamType', 'Mark',                     # marks (Task 3.4)
    }
    missing = required_models - all_model_names
    assert not missing, (
        f"Required Task 3.3/3.4 models missing from app registry: {missing}."
    )

    # --- Later-domain deferred models (must NOT be present) ---
    deferred_later = {'Timetable', 'CalendarEvent', 'Allocation', 'Report', 'Notification', 'AuditLog'}
    leaked_later = deferred_later & all_model_names
    assert not leaked_later, (
        f"Later-domain models leaked into repository: {leaked_later}."
    )

