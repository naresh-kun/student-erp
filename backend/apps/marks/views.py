"""
Student ERP — Marks DRF Views (Scaffolding)
Provides evaluation register and grade inquiry endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.marks.services import MarksService


class MarkListView(APIView):
    """
    GET /api/v1/marks/
    Lists academic evaluations. Scaffolding returns structured empty dataset prior to Task 3.3 models.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = MarksService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )


class ExamTypeListView(APIView):
    """
    GET /api/v1/marks/exam-types/
    Lists examination categories.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = MarksService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
