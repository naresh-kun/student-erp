"""
Student ERP — Notifications Domain Service (Scaffolding)
Encapsulates notification dispatching and alert boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class NotificationService(BaseService):
    """
    Service-layer scaffolding for notifications domain.
    """
    service_name = "notifications"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
