"""
Student ERP — Accounts Domain Service
Encapsulates user identity, role resolution, faculty, and parent profile queries.
"""

from typing import Optional
from django.db.models import QuerySet, Q
from common.services import BaseService
from apps.accounts.models import User, Role, Parent, Faculty


class AccountService(BaseService):
    """
    Domain service for identity and profile operations.
    """
    service_name = "accounts"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "scaffolded"}

    def get_user_profile_context(self, user: User) -> dict:
        """Constructs full context dictionary for current user profile."""
        role_name = user.role.name if user.role else 'Unknown'
        profile_data = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role_name,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
        }

        # Attach role-specific profile details if existing
        if hasattr(user, 'faculty_profile') and user.faculty_profile:
            fac = user.faculty_profile
            profile_data["faculty_profile"] = {
                "id": str(fac.id),
                "employee_code": fac.employee_code,
                "department": fac.department,
                "designation": fac.designation,
                "office_room": fac.office_room,
            }
        elif hasattr(user, 'parent_profile') and user.parent_profile:
            par = user.parent_profile
            profile_data["parent_profile"] = {
                "id": str(par.id),
                "relation": par.relation,
                "occupation": par.occupation,
                "address": par.address,
            }
        elif hasattr(user, 'student_profile') and user.student_profile:
            stu = user.student_profile
            profile_data["student_profile"] = {
                "id": str(stu.id),
                "student_id": stu.student_id,
                "admission_number": stu.admission_number,
                "roll_number": stu.roll_number,
                "status": stu.status,
            }

        return profile_data

    def get_parents_queryset(self, search: Optional[str] = None) -> QuerySet[Parent]:
        """Returns optimized queryset of parents with user records selected."""
        qs = Parent.objects.select_related('user').prefetch_related('children').all()
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(occupation__icontains=search)
            )
        return qs

    def get_faculty_queryset(
        self,
        department: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> QuerySet[Faculty]:
        """Returns optimized queryset of faculty members with user records selected."""
        qs = Faculty.objects.select_related('user').all()
        if department:
            qs = qs.filter(department__iexact=department.strip())
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(employee_code__icontains=search)
                | Q(department__icontains=search)
                | Q(designation__icontains=search)
            )
        return qs
