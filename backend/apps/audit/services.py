"""
Student ERP — Audit Domain Service (Scaffolding)
Encapsulates audit logging and security telemetry boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class AuditService(BaseService):
    """
    Service-layer scaffolding for audit domain.
    """
    service_name = "audit"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
