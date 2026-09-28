"""
Student ERP — Marks Domain Service (Scaffolding)
Encapsulates examination and academic evaluation boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class MarksService(BaseService):
    """
    Service-layer scaffolding for marks and evaluations domain.
    """
    service_name = "marks"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
