"""
Student ERP — Allocation DRF Views (Scaffolding)
Provides allocation runs and operational allocation endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.allocation.services import AllocationService


class AllocationListView(APIView):
    """
    GET /api/v1/allocation/
    Lists allocation runs. Scaffolding returns structured empty dataset prior to Task 3.3 models.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = AllocationService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
