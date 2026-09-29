"""
Student ERP — Students Domain Service (Scaffolding)
Encapsulates student profile lifecycle and permanent Student ID boundary interfaces.
Concrete domain logic scheduled for Phase 3 Task 3.3+.
"""

from common.services import BaseService


class StudentService(BaseService):
    """
    Service-layer scaffolding for students domain.
    """
    service_name = "students"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}
