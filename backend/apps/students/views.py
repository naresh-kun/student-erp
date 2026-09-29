"""
Student ERP — Students DRF Views (Scaffolding)
Provides directory and profile read endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.students.services import StudentService


class StudentListView(APIView):
    """
    GET /api/v1/students/
    Lists student records. Scaffolding returns structured empty dataset prior to Task 3.3 models.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = StudentService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )


class StudentDetailView(APIView):
    """
    GET /api/v1/students/{id}/
    Returns detailed profile for a specific student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        service = StudentService()
        return success_response(
            data={"id": str(pk), "service": service.get_service_status()}
        )
