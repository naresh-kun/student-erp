"""
Student ERP — Timetable Domain Service (Scaffolding)
Encapsulates weekly schedule structures and period allocations.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class TimetableService(BaseService):
    """
    Service-layer scaffolding for timetable domain.
    """
    service_name = "timetable"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
