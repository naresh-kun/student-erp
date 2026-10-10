"""
Student ERP — Audit DRF Views
Provides immutable audit trail inquiry endpoints.
Strictly read-only; mutation endpoints return HTTP 405 Method Not Allowed.
"""

from rest_framework.views import APIView
from common.constants import PERM_AUDIT_VIEW
from common.permissions import require_permission
from common.pagination import StandardResultsSetPagination
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer


class AuditLogListView(APIView):
    """
    GET /api/v1/audit/
    Lists immutable audit events. Query filtering: resource_type, resource_id, action, actor_id.
    Authorized for Admin and Principal with PERM_AUDIT_VIEW.
    """
    permission_classes = [require_permission(PERM_AUDIT_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        qs = AuditLog.objects.all().select_related('actor', 'actor__role')

        resource_type = request.query_params.get('resource_type')
        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        resource_id = request.query_params.get('resource_id')
        if resource_id:
            qs = qs.filter(resource_id=resource_id)

        action = request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)

        actor_id = request.query_params.get('actor_id')
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
