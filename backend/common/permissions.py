"""
Student ERP — Reusable DRF RBAC Permission Classes
Phase 4 Task 4.3: Authoritative Security Boundary for the 5 System Roles

Architecture:
  request
    ↓
  authenticated & active? (401 if not)
    ↓
  role resolution (live database state, never client payload)
    ↓
  permission check (ROLE_PERMISSIONS_MATRIX)
    ↓
  scope resolution (GLOBAL, FACULTY_ASSIGNED, SELF, LINKED_CHILD)
    ↓
  object ownership check (can_access_object)
    ↓
  ALLOW / DENY (403 if forbidden)
"""

from typing import Optional, Type
from rest_framework import permissions

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
)
from common.authorization import AuthorizationService


# ============================================================================
# Core Dynamic Permission Base Class
# ============================================================================

class HasRequiredPermission(permissions.BasePermission):
    """
    Authoritative DRF permission class evaluating domain permissions.
    Can be used by subclassing with `required_permission = 'domain.action'`,
    or setting `required_permission` on the view class.
    """
    required_permission: Optional[str] = None

    def __init__(self, required_permission: Optional[str] = None):
        if required_permission:
            self.required_permission = required_permission

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        perm = getattr(self, 'required_permission', None)
        if not perm and hasattr(view, 'permission_map') and isinstance(view.permission_map, dict):
            perm = view.permission_map.get(request.method)
        if not perm:
            perm = getattr(view, 'required_permission', None)

        if not perm:
            # If no permission declared, default to requiring authentication and active user
            return request.user.is_authenticated and request.user.is_active

        return AuthorizationService.has_permission(request.user, perm)

    def has_object_permission(self, request, view, obj) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        action = getattr(view, 'action', None)
        if not action:
            method_map = {
                'GET': 'view',
                'HEAD': 'view',
                'OPTIONS': 'view',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete',
            }
            action = method_map.get(request.method, 'view')

        action_map = {
            'retrieve': 'view',
            'list': 'view',
            'get': 'view',
            'create': 'create',
            'post': 'create',
            'update': 'update',
            'put': 'update',
            'patch': 'update',
            'partial_update': 'update',
            'destroy': 'delete',
            'delete': 'delete',
        }
        domain_action = action_map.get(action, action or 'view')

        return AuthorizationService.can_access_object(request.user, obj, action=domain_action)


def require_permission(perm: str) -> Type[HasRequiredPermission]:
    """
    Factory helper generating a DRF permission class bound to a specific permission.
    Example usage:
        permission_classes = [require_permission(PERM_STUDENTS_VIEW)]
    """
    class ConcretePermission(HasRequiredPermission):
        required_permission = perm
    ConcretePermission.__name__ = f"Require_{perm.replace('.', '_')}"
    return ConcretePermission


# ============================================================================
# Role-Specific DRF Permission Classes
# ============================================================================

class IsAdminRole(permissions.BasePermission):
    """Allows access only to users with the Admin role."""
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and AuthorizationService.get_user_role(request.user) == ROLE_ADMIN
        )


class IsPrincipalRole(permissions.BasePermission):
    """Allows access only to users with the Principal role."""
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and AuthorizationService.get_user_role(request.user) == ROLE_PRINCIPAL
        )


class IsFacultyRole(permissions.BasePermission):
    """Allows access only to users with the Faculty role."""
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and AuthorizationService.get_user_role(request.user) == ROLE_FACULTY
        )


class IsStudentRole(permissions.BasePermission):
    """Allows access only to users with the Student role."""
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and AuthorizationService.get_user_role(request.user) == ROLE_STUDENT
        )


class IsParentRole(permissions.BasePermission):
    """Allows access only to users with the Parent role."""
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and AuthorizationService.get_user_role(request.user) == ROLE_PARENT
        )


class IsAdminOrPrincipal(permissions.BasePermission):
    """Allows access to Admin or Principal roles (e.g. Allocation update/delete per Task 2.7)."""
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and AuthorizationService.get_user_role(request.user) in (ROLE_ADMIN, ROLE_PRINCIPAL)
        )


class IsStaffOrExecutive(permissions.BasePermission):
    """Allows access to Admin, Principal, or Faculty roles."""
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and AuthorizationService.get_user_role(request.user) in (ROLE_ADMIN, ROLE_PRINCIPAL, ROLE_FACULTY)
        )


class IsOwnerOrScopedAccess(permissions.BasePermission):
    """
    DRF object-level permission class enforcing ownership and faculty scoping.
    Delegates to AuthorizationService.can_access_object.
    """
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_active)

    def has_object_permission(self, request, view, obj) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        action = getattr(view, 'action', None)
        if not action:
            method_map = {
                'GET': 'view',
                'HEAD': 'view',
                'OPTIONS': 'view',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete',
            }
            action = method_map.get(request.method, 'view')

        action_map = {
            'retrieve': 'view',
            'list': 'view',
            'get': 'view',
            'create': 'create',
            'post': 'create',
            'update': 'update',
            'put': 'update',
            'patch': 'update',
            'partial_update': 'update',
            'destroy': 'delete',
            'delete': 'delete',
        }
        domain_action = action_map.get(action, action or 'view')
        return AuthorizationService.can_access_object(request.user, obj, action=domain_action)


# Backward-compatible alias definitions
IsAdminUser = IsAdminRole
IsPrincipalUser = IsPrincipalRole
IsFacultyUser = IsFacultyRole
IsStudentUser = IsStudentRole
IsParentUser = IsParentRole
