"""
Student ERP — Calendar DRF Views (Scaffolding)
Provides calendar and event feed endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.calendar.services import CalendarService


class CalendarEventListView(APIView):
    """
    GET /api/v1/calendar/events/
    Lists institutional events and holidays. Scaffolding returns structured empty dataset prior to Task 3.3 models.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = CalendarService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
