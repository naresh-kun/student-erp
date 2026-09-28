"""
Student ERP — Reports DRF Views (Scaffolding)
Provides report index and retrieval endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.reports.services import ReportService


class ReportListView(APIView):
    """
    GET /api/v1/reports/
    Lists generated academic and administrative reports.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = ReportService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
