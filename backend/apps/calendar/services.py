"""
Student ERP — Calendar Domain Service (Scaffolding)
Encapsulates academic calendar and school event scheduling boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class CalendarService(BaseService):
    """
    Service-layer scaffolding for calendar domain.
    """
    service_name = "calendar"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
