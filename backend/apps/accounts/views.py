"""
Student ERP — Accounts DRF Views (Scaffolding)
Provides authentication and profile read endpoints.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from apps.accounts.services import AccountService


class CurrentUserProfileView(APIView):
    """
    GET /api/v1/auth/me/
    Returns authenticated user profile context.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = AccountService()
        return success_response(data={
            "user_id": str(getattr(request.user, 'id', '')),
            "username": getattr(request.user, 'username', ''),
            "email": getattr(request.user, 'email', ''),
            "service_status": service.get_service_status(),
        })
