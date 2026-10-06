"""
Student ERP — Accounts Domain Service
Encapsulates user identity, role resolution, faculty, and parent profile queries.
"""

from typing import Optional, List, Dict, Any
from django.db.models import QuerySet, Q
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed

from common.services import BaseService
from common.authorization import AuthorizationService
from common.constants import ENROLLMENT_STATUS_WITHDRAWN
from common.utils import STUDENT_ID_REGEX
from apps.accounts.models import User, Role, Parent, Faculty


class AuthService(BaseService):
    """
    Dedicated authentication domain service (Phase 4 Authentication Foundation).
    Encapsulates credential verification, token generation, and password validation.
    """
    service_name = "auth"

    def get_service_status(self) -> dict:
        return {"service": self.service_name, "status": "active"}

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Safely validates user credentials using Django authentication.
        Rejects empty credentials and inactive accounts.
        Returns authenticated User or None.
        """
        if not username or not password:
            return None
        user = authenticate(username=username, password=password)
        if user is not None and not user.is_active:
            return None
        return user

    def authenticate_by_identifier(self, identifier: str, password: str) -> Optional[User]:
        """
        Unified authentication workflow (Task 4.5):
        Resolves Student, Parent (via linked child), or standard direct user credentials.

        Resolution Order:
        1. Normalizes identifier (strip surrounding whitespace).
        2. If identifier matches canonical Student ID format (^STU\\d{4}\\d{5}$ case-insensitive):
           a. Look up Student by student_id (case-insensitive).
           b. If Student found:
              - Verify student.user password.
              - If student password matches:
                Require student.user.is_active == True AND student.status != Withdrawn.
                On success, return student.user (Role: Student).
                On failure (inactive or withdrawn), reject (return None).
              - If student authentication does not succeed:
                Attempt Parent resolution via linked child (student.parent -> parent.user).
                Verify parent.user password.
                If parent password matches:
                  Require parent.user.is_active == True.
                  On success, return parent.user (Role: Parent).
                  On failure (inactive), reject (return None).
           c. If Student not found or has no linked parent before password verification:
              Execute dummy password hash check to mitigate timing enumeration.
        3. Standard Login Fallback:
           Preserve existing direct username authentication:
           authenticate(username=cleaned_identifier, password=password)
           Supports Admin, Principal, Faculty, and normal usernames.
        4. Rejects inactive accounts and returns None (generic 401 envelope at serializer/view layer).
        """
        if not identifier or not isinstance(identifier, str) or not password:
            return None

        cleaned_identifier = identifier.strip()
        if not cleaned_identifier:
            return None

        # Check for Student ID pattern
        if STUDENT_ID_REGEX.match(cleaned_identifier.upper()):
            from apps.students.models import Student

            student = (
                Student.objects.select_related(
                    'user',
                    'user__role',
                    'parent',
                    'parent__user',
                    'parent__user__role',
                )
                .filter(student_id__iexact=cleaned_identifier)
                .first()
            )

            if student is not None:
                # 1. Attempt Student authentication
                student_user = getattr(student, 'user', None)
                if student_user is not None and student_user.check_password(password):
                    status_normalized = (student.status or '').strip().lower()
                    if student_user.is_active and status_normalized != ENROLLMENT_STATUS_WITHDRAWN.lower():
                        return student_user
                    # Matched student password, but student is inactive or withdrawn -> reject
                    return None

                # 2. Attempt Parent authentication via linked child
                parent_profile = getattr(student, 'parent', None)
                if parent_profile is not None:
                    parent_user = getattr(parent_profile, 'user', None)
                    if parent_user is not None and parent_user.check_password(password):
                        if parent_user.is_active:
                            return parent_user
                        # Matched parent password, but parent account is inactive -> reject
                        return None
                else:
                    # Student exists but has no linked parent.
                    # Run dummy password check to normalize timing with parent-linked lookups.
                    User().set_password(password)
            else:
                # Non-existent Student ID: run dummy password check before fallback
                User().set_password(password)

        # 3. Standard Login Fallback (Admin, Principal, Faculty, or direct username)
        return self.authenticate_user(username=cleaned_identifier, password=password)

    def generate_tokens_for_user(self, user: User) -> Dict[str, Any]:
        """
        Generates JWT access and refresh token pair for an authenticated user.
        Injects standard claims (role, username) into the token payload.
        """
        if not user.is_active:
            raise AuthenticationFailed("User is inactive.")

        refresh = RefreshToken.for_user(user)
        role_name = user.role.name if user.role else 'Unknown'
        refresh['role'] = role_name
        refresh['username'] = user.username

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'token_type': 'Bearer',
        }

    def login_with_credentials(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Executes complete login authentication workflow (Task 4.2 / Task 4.5):
        1. Validates input credentials via authenticate_by_identifier.
        2. Rejects inactive or non-existent accounts safely.
        3. Issues JWT access and refresh tokens with safe claims.
        4. Returns safe authenticated user context and tokens.
        """
        user = self.authenticate_by_identifier(username, password)
        if user is None:
            return None

        tokens = self.generate_tokens_for_user(user)
        user_info = {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.name if user.role else 'Unknown',
        }

        return {
            'user': user_info,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'token_type': tokens.get('token_type', 'Bearer'),
        }

    def validate_password_strength(self, password: str, user: Optional[User] = None) -> List[str]:
        """
        Validates password against configured AUTH_PASSWORD_VALIDATORS.
        Returns empty list if valid, or list of error messages.
        """
        errors = []
        try:
            validate_password(password, user=user)
        except DjangoValidationError as exc:
            errors = list(exc.messages)
        return errors

    def get_user_by_id(self, user_id: Any) -> Optional[User]:
        """
        Safely retrieves a user by UUID id. Returns None if not found or invalid UUID.
        """
        try:
            return User.objects.select_related('role').get(id=user_id)
        except (User.DoesNotExist, DjangoValidationError, ValueError):
            return None


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
        qs = Parent.objects.select_related('user').prefetch_related('children').order_by('created_at', 'id')
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
        qs = Faculty.objects.select_related('user').order_by('created_at', 'id')
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
