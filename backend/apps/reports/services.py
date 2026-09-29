"""
Student ERP — Reports Domain Service (Scaffolding)
Encapsulates academic, administrative, and executive report boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class ReportService(BaseService):
    """
    Service-layer scaffolding for reports domain.
    """
    service_name = "reports"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
