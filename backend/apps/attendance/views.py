"""
Student ERP — Attendance DRF Views (Scaffolding)
Provides attendance logging, overview, and absentees listing endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.attendance.services import AttendanceService


class AttendanceOverviewView(APIView):
    """
    GET /api/v1/attendance/
    Lists attendance records. Scaffolding returns structured empty dataset prior to Task 3.3 models.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = AttendanceService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )


class StudentAbsenteesView(APIView):
    """
    GET /api/v1/attendance/absentees/
    Dedicated visibility for students with status ABSENT.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = AttendanceService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
