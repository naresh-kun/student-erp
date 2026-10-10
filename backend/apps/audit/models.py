"""
Student ERP — Durable Audit Domain Models
Provides immutable, database-backed AuditLog model with two-tier protection.
"""

from django.db import models
from django.core.exceptions import PermissionDenied
from common.models import UUIDModel


class ImmutableQuerySet(models.QuerySet):
    """QuerySet that strictly disallows bulk updates and deletions."""

    def update(self, **kwargs):
        raise PermissionDenied("AuditLog records are append-only. Bulk QuerySet.update() is forbidden.")

    def delete(self):
        raise PermissionDenied("AuditLog records are append-only. Bulk QuerySet.delete() is forbidden.")


class ImmutableManager(models.Manager):
    """Manager enforcing ImmutableQuerySet across all queries."""

    def get_queryset(self):
        return ImmutableQuerySet(self.model, using=self._db)


class AuditLog(UUIDModel):
    """
    Durable, append-only audit trail persisting administrative mutations
    and security-critical domain modifications.
    """
    ACTION_CREATE = 'CREATE'
    ACTION_UPDATE = 'UPDATE'
    ACTION_ACTIVATE = 'ACTIVATE'
    ACTION_DEACTIVATE = 'DEACTIVATE'
    ACTION_DELETE = 'DELETE'

    ACTION_CHOICES = (
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_ACTIVATE, 'Activate'),
        (ACTION_DEACTIVATE, 'Deactivate'),
        (ACTION_DELETE, 'Delete'),
    )

    actor = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who initiated the action. Protected against cascading deletion.",
    )
    actor_username = models.CharField(
        max_length=150,
        blank=True,
        default='',
        help_text="Immutable snapshot of username at time of audit event.",
    )
    actor_role = models.CharField(
        max_length=32,
        blank=True,
        default='',
        help_text="Role of the actor at event time (e.g. Admin, Principal).",
    )
    action = models.CharField(
        max_length=32,
        choices=ACTION_CHOICES,
        db_index=True,
        help_text="Type of administrative operation performed.",
    )
    resource_type = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Entity domain model name (e.g. 'ExamType', 'Mark').",
    )
    resource_id = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Stringified UUID primary key of the affected resource.",
    )
    old_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="Minimized state snapshot of modified fields prior to change.",
    )
    new_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="Minimized state snapshot of modified fields after change.",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address initiating the HTTP mutation.",
    )
    user_agent = models.TextField(
        blank=True,
        default='',
        help_text="Client User-Agent header string.",
    )
    reason = models.TextField(
        blank=True,
        default='',
        help_text="Optional human-provided justification for administrative change.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Authoritative UTC timestamp when event was recorded.",
    )

    objects = ImmutableManager()

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        base_manager_name = 'objects'
        indexes = [
            models.Index(fields=['resource_type', 'resource_id'], name='idx_audit_resource'),
            models.Index(fields=['actor', 'created_at'], name='idx_audit_actor_time'),
            models.Index(fields=['action', 'created_at'], name='idx_audit_action_time'),
        ]

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M:%S}] {self.action} {self.resource_type}({self.resource_id}) by {self.actor_username or 'System'}"

    def save(self, *args, **kwargs):
        """Strict append-only constraint: disallow in-place instance updates."""
        if not self._state.adding:
            raise PermissionDenied("AuditLog records are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Strict append-only constraint: disallow instance deletion."""
        raise PermissionDenied("AuditLog records are append-only and cannot be deleted.")
