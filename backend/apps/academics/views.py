"""
Student ERP — Academics DRF Views (Scaffolding)
Provides directory endpoints for classes, sections, and subjects.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.academics.services import AcademicService


class ClassListView(APIView):
    """
    GET /api/v1/academics/classes/
    Lists classes, streams, and associated sections.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = AcademicService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )


class SubjectListView(APIView):
    """
    GET /api/v1/academics/subjects/
    Lists school subjects and weekly periods.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = AcademicService()
        return success_response(
            data=[],
            meta={"page": 1, "page_size": 20, "total_records": 0, "service": service.get_service_status()}
        )
