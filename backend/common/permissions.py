"""
Student ERP — Reusable DRF RBAC Permission Classes
Authoritative Security Boundary for the 5 System Roles
"""

from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Allows access only to users with the Admin role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'Admin')


class IsPrincipalUser(permissions.BasePermission):
    """Allows access only to users with the Principal role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'Principal')


class IsFacultyUser(permissions.BasePermission):
    """Allows access only to users with the Faculty role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'Faculty')


class IsStudentUser(permissions.BasePermission):
    """Allows access only to users with the Student role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'Student')


class IsParentUser(permissions.BasePermission):
    """Allows access only to users with the Parent role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'Parent')


class IsStaffOrExecutive(permissions.BasePermission):
    """Allows access to Admin, Principal, or Faculty roles."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            getattr(request.user, 'role', '') in ['Admin', 'Principal', 'Faculty']
        )
