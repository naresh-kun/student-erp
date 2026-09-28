"""
Student ERP — Notifications DRF Views (Scaffolding)
Provides notification feed and read tracking endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.notifications.services import NotificationService


class NotificationListView(APIView):
    """
    GET /api/v1/notifications/
    Lists notifications for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = NotificationService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
