"""
Student ERP — Allocation Domain Service (Scaffolding)
Encapsulates student section allocation and Class Teacher assignment boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class AllocationService(BaseService):
    """
    Service-layer scaffolding for allocation domain.
    """
    service_name = "allocation"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
