"""
Student ERP — Attendance Domain Service (Scaffolding)
Encapsulates attendance tracking and leave management boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class AttendanceService(BaseService):
    """
    Service-layer scaffolding for attendance domain.
    """
    service_name = "attendance"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
