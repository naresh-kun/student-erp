"""
Student ERP — Durable Audit Domain Service
Implements centralized, transactional audit event recording and payload minimization.
"""

import logging
from typing import Optional, Dict, Any
from common.services import BaseService
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {
    'password', 'password_hash', 'token', 'secret',
    'access', 'refresh', 'authorization', 'cookie',
    'csrf', 'sessionid',
}


def sanitize_payload(data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Recursively strip or redact secrets from audit event payloads."""
    if not isinstance(data, dict):
        return {}
    sanitized = {}
    for key, val in data.items():
        if any(sensitive in key.lower() for sensitive in SENSITIVE_KEYS):
            continue  # Exclude secrets completely
        if isinstance(val, dict):
            sanitized[key] = sanitize_payload(val)
        else:
            sanitized[key] = val
    return sanitized


class AuditService(BaseService):
    """
    Centralized domain service managing durable audit trail persistence.
    """
    service_name = "audit"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}

    @classmethod
    def record_event(
        cls,
        actor=None,
        action: str = AuditLog.ACTION_UPDATE,
        resource_type: str = '',
        resource_id: str = '',
        old_data: Optional[Dict[str, Any]] = None,
        new_data: Optional[Dict[str, Any]] = None,
        request=None,
        reason: str = '',
    ) -> AuditLog:
        """
        Persists an immutable audit log entry inside the active database transaction.
        Enforces delta minimization, secret sanitization, and actor identity snapshotting.
        """
        old_cleaned = sanitize_payload(old_data)
        new_cleaned = sanitize_payload(new_data)

        # Compute field-level delta minimization
        if action == AuditLog.ACTION_CREATE:
            old_values = {}
            new_values = new_cleaned
        else:
            all_keys = set(old_cleaned.keys()) | set(new_cleaned.keys())
            old_values = {}
            new_values = {}
            for k in all_keys:
                old_val = old_cleaned.get(k)
                new_val = new_cleaned.get(k)
                # Compare as strings or exact types
                if str(old_val) != str(new_val):
                    if k in old_cleaned:
                        old_values[k] = old_val
                    if k in new_cleaned:
                        new_values[k] = new_val

        # Actor identity snapshots
        actor_user = None
        actor_username = 'System'
        actor_role = ''

        if actor and getattr(actor, 'is_authenticated', False):
            actor_user = actor
            actor_username = getattr(actor, 'username', '')
            if hasattr(actor, 'role') and actor.role:
                actor_role = getattr(actor.role, 'name', '')
            elif hasattr(actor, 'role_id') and actor.role_id:
                actor_role = str(actor.role_id)
        elif actor and getattr(actor, 'username', None):
            actor_user = actor
            actor_username = actor.username

        # Best-effort client metadata extraction
        ip_address = None
        user_agent = ''
        if request:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded:
                ip_address = x_forwarded.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        log_entry = AuditLog.objects.create(
            actor=actor_user,
            actor_username=actor_username,
            actor_role=actor_role,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            reason=reason or '',
        )

        logger.info(
            "AuditLog recorded: id=%s action=%s resource=%s(%s) by %s",
            log_entry.id, action, resource_type, resource_id, actor_username
        )
        return log_entry
