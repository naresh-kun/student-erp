"""
Student ERP — Academics Domain Service (Scaffolding)
Encapsulates academic structures, grades, streams, and course management boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class AcademicService(BaseService):
    """
    Service-layer scaffolding for academics domain.
    """
    service_name = "academics"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
