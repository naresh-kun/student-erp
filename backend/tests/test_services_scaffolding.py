"""
Student ERP — Test Domain Services Scaffolding
Verifies that all 11 domain services inherit from BaseService and provide valid scaffolding.
"""

import pytest
from common.services import BaseService
from apps.accounts.services import AccountService
from apps.students.services import StudentService
from apps.academics.services import AcademicService
from apps.attendance.services import AttendanceService
from apps.marks.services import MarksService
from apps.timetable.services import TimetableService
from apps.calendar.services import CalendarService
from apps.allocation.services import AllocationService
from apps.reports.services import ReportService
from apps.notifications.services import NotificationService
from apps.audit.services import AuditService


ALL_SERVICES = [
    (AccountService, "accounts"),
    (StudentService, "students"),
    (AcademicService, "academics"),
    (AttendanceService, "attendance"),
    (MarksService, "marks"),
    (TimetableService, "timetable"),
    (CalendarService, "calendar"),
    (AllocationService, "allocation"),
    (ReportService, "reports"),
    (NotificationService, "notifications"),
    (AuditService, "audit"),
]


@pytest.mark.parametrize("service_cls,expected_name", ALL_SERVICES)
def test_domain_services_inheritance_and_name(service_cls, expected_name):
    service = service_cls()
    assert isinstance(service, BaseService), f"{service_cls.__name__} must inherit from BaseService"
    assert service.service_name == expected_name
    status = service.get_service_status()
    assert status['service'] == expected_name
    assert status['status'] == 'scaffolded'


def test_base_service_helpers():
    service = BaseService()
    assert hasattr(service, 'atomic')
    assert hasattr(service, 'validate_required_fields')
    assert hasattr(service, 'raise_not_found')
    assert hasattr(service, 'raise_business_error')
