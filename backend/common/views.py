"""
Student ERP — Shared Common Views
Provides unauthenticated service health check and monitoring endpoints
"""

import logging
from django.db import connection
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    Unauthenticated service health check endpoint.
    GET /api/health/

    Returns HTTP 200 indicating the Django backend service is operational.
    Explicitly probes database connectivity without failing the liveness check
    if the database is offline or unreachable.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        db_status = "disconnected"
        try:
            connection.ensure_connection()
            if connection.is_usable():
                db_status = "connected"
        except Exception as exc:
            logger.debug("Database probe check failed: %s", exc)
            db_status = "disconnected"

        payload = {
            "status": "ok",
            "service": "student-erp-backend",
            "environment": "development" if settings.DEBUG else "production",
            "database": db_status,
        }
        return Response(payload, status=status.HTTP_200_OK)
