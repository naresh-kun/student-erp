"""
Student ERP — Accounts Domain Service (Scaffolding)
Encapsulates user identity, role resolution, and profile management boundaries.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class AccountService(BaseService):
    """
    Service-layer scaffolding for accounts and identity domain.
    """
    service_name = "accounts"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
