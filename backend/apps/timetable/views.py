"""
Student ERP — Timetable DRF Views (Scaffolding)
Provides schedule retrieval endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.timetable.services import TimetableService


class TimetableListView(APIView):
    """
    GET /api/v1/timetable/
    Lists scheduled periods. Scaffolding returns structured empty dataset prior to Task 3.3 models.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = TimetableService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
