"""
Student ERP — Accounts DRF Views
Provides endpoints for authentication profile, parent directory, and faculty directory.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.views import (
    TokenObtainPairView as SimpleJWTTokenObtainPairView,
    TokenRefreshView as SimpleJWTTokenRefreshView,
)

from common.constants import (
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    PERM_STUDENTS_VIEW,
    PERM_USERS_VIEW,
    PERM_USERS_CREATE,
    PERM_USERS_UPDATE,
)
from common.authorization import AuthorizationService
from common.permissions import HasRequiredPermission, IsOwnerOrScopedAccess, require_permission
from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from apps.accounts.models import Parent, Faculty
from apps.accounts.serializers import (
    ERPTokenObtainPairSerializer,
    ParentSerializer,
    ParentSummarySerializer,
    FacultySerializer,
    FacultySummarySerializer,
)
from apps.accounts.services import AccountService, AuthService


class TokenObtainPairView(SimpleJWTTokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Authoritative login endpoint for Student ERP (Task 4.2).
    Authenticates custom User credentials, issues JWT access/refresh tokens with safe claims,
    and returns safe user profile data matching docs/API_CONTRACT.md Section 3.1.
    """
    serializer_class = ERPTokenObtainPairSerializer


class TokenRefreshView(SimpleJWTTokenRefreshView):
    """
    POST /api/v1/auth/refresh/
    Authoritative token refresh endpoint for Student ERP (Task 4.2).
    Refreshes JWT access token and rotates refresh token per configuration.
    Provides dual-compatibility envelope adhering to API contract.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK and isinstance(response.data, dict):
            response.data['token_type'] = 'Bearer'
            response.data['success'] = True
            response.data['data'] = {
                'access': response.data.get('access'),
                'refresh': response.data.get('refresh'),
                'token_type': 'Bearer',
            }
        return response


class CurrentUserProfileView(APIView):
    """
    GET /api/v1/auth/me/
    Returns authenticated user profile context.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        service = AccountService()
        profile_data = service.get_user_profile_context(request.user)
        return success_response(data=profile_data)


class ParentListView(APIView):
    """
    GET /api/v1/parents/
    Lists parent profiles with optional search query parameter.
    """
    permission_classes = [require_permission(PERM_STUDENTS_VIEW)]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AccountService()
        search = request.query_params.get('search')
        qs = service.get_parents_queryset(search=search)
        qs = AuthorizationService.filter_queryset_for_user(qs, request.user, domain='students')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = ParentSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ParentSerializer(qs, many=True)
        return success_response(data=serializer.data)


class ParentDetailView(APIView):
    """
    GET /api/v1/parents/{id}/ or /api/v1/parents/me/
    Returns details for a specific parent profile.
    """
    permission_classes = [require_permission(PERM_STUDENTS_VIEW), IsOwnerOrScopedAccess]

    def get(self, request, pk, *args, **kwargs):
        if str(pk).lower() == 'me':
            if hasattr(request.user, 'parent_profile') and request.user.parent_profile:
                parent = request.user.parent_profile
            else:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Authenticated user does not have an associated parent profile.")
        else:
            parent = get_object_or_404(Parent.objects.select_related('user'), pk=pk)
        self.check_object_permissions(request, parent)
        serializer = ParentSerializer(parent)
        return success_response(data=serializer.data)


class ParentChildrenView(APIView):
    """
    GET /api/v1/parents/{id}/children/ or /api/v1/parents/me/children/
    Returns verified student profiles linked to this parent.
    """
    permission_classes = [require_permission(PERM_STUDENTS_VIEW), IsOwnerOrScopedAccess]

    def get(self, request, pk, *args, **kwargs):
        if str(pk).lower() == 'me':
            if hasattr(request.user, 'parent_profile') and request.user.parent_profile:
                parent = request.user.parent_profile
            else:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Authenticated user does not have an associated parent profile.")
        else:
            parent = get_object_or_404(Parent, pk=pk)
        self.check_object_permissions(request, parent)
        from apps.students.serializers import StudentDetailSerializer
        children = parent.children.select_related('user', 'parent').prefetch_related(
            'enrollments__section__school_class',
            'enrollments__section__class_teacher__user',
            'enrollments__academic_year'
        ).all()
        children = AuthorizationService.filter_queryset_for_user(children, request.user, domain='students')
        serializer = StudentDetailSerializer(children, many=True)
        return success_response(data=serializer.data)


class FacultyListView(APIView):
    """
    GET /api/v1/faculty/
    POST /api/v1/faculty/
    Lists and creates faculty profiles.
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_USERS_VIEW,
        'POST': PERM_USERS_CREATE,
    }
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AccountService()
        department = request.query_params.get('department')
        search = request.query_params.get('search')
        is_active_param = request.query_params.get('is_active')
        is_active = None
        if is_active_param is not None:
            is_active = is_active_param.lower() in ('true', '1', 'yes')

        qs = service.get_faculty_queryset(department=department, is_active=is_active, search=search)
        qs = AuthorizationService.filter_queryset_for_user(qs, request.user, domain='users')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = FacultySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = FacultySerializer(qs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = FacultySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faculty = serializer.save()
        return success_response(
            data=FacultySerializer(faculty).data,
            status_code=status.HTTP_201_CREATED,
        )


class FacultyDetailView(APIView):
    """
    GET /api/v1/faculty/{id}/
    PATCH /api/v1/faculty/{id}/
    Retrieves and updates faculty profile.
    """
    permission_classes = [HasRequiredPermission, IsOwnerOrScopedAccess]
    permission_map = {
        'GET': PERM_USERS_VIEW,
        'PATCH': PERM_USERS_UPDATE,
    }

    def get(self, request, pk, *args, **kwargs):
        if pk == 'me':
            faculty = getattr(request.user, 'faculty_profile', None)
            if not faculty:
                return error_response(
                    code='NOT_FOUND',
                    message='Faculty profile not found for authenticated user.',
                    status_code=status.HTTP_404_NOT_FOUND,
                )
        else:
            faculty = get_object_or_404(Faculty.objects.select_related('user'), pk=pk)
            self.check_object_permissions(request, faculty)

        serializer = FacultySerializer(faculty)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        if pk == 'me':
            faculty = getattr(request.user, 'faculty_profile', None)
            if not faculty:
                return error_response(
                    code='NOT_FOUND',
                    message='Faculty profile not found for authenticated user.',
                    status_code=status.HTTP_404_NOT_FOUND,
                )
        else:
            faculty = get_object_or_404(Faculty.objects.select_related('user'), pk=pk)
            self.check_object_permissions(request, faculty)

        # Faculty self-edit cannot modify administrative account fields
        user_role = AuthorizationService.get_user_role(request.user)
        if user_role == ROLE_FACULTY:
            privileged_fields = {'employee_code', 'is_active', 'department', 'designation', 'joining_date', 'user_id', 'user'}
            disallowed = [f for f in privileged_fields if f in request.data]
            if disallowed:
                raise PermissionDenied(f"Faculty cannot modify administrative account fields: {', '.join(disallowed)}")

        serializer = FacultySerializer(faculty, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        faculty = serializer.save()
        return success_response(data=FacultySerializer(faculty).data)


class FacultyClassesView(APIView):
    """
    GET /api/v1/faculty/me/classes/
    GET /api/v1/faculty/{id}/classes/
    Returns active assigned classes, sections, and subjects for the designated faculty member.
    """
    permission_classes = [HasRequiredPermission]
    permission_map = {
        'GET': PERM_USERS_VIEW,
    }

    def get(self, request, pk, *args, **kwargs):
        if pk == 'me':
            faculty = getattr(request.user, 'faculty_profile', None)
            if not faculty:
                return error_response(
                    code='NOT_FOUND',
                    message='Faculty profile not found for authenticated user.',
                    status_code=status.HTTP_404_NOT_FOUND,
                )
        else:
            faculty = get_object_or_404(Faculty.objects.select_related('user'), pk=pk)
            user_role = AuthorizationService.get_user_role(request.user)
            if user_role not in (ROLE_ADMIN, ROLE_PRINCIPAL):
                if getattr(request.user, 'faculty_profile', None) != faculty:
                    raise PermissionDenied("You do not have permission to view another faculty's assigned classes.")

        from apps.academics.models import TeachingAssignment
        assignments = TeachingAssignment.objects.filter(
            faculty=faculty,
            is_active=True,
        ).select_related('school_class', 'section', 'subject')

        class_items = []
        covered_section_ids = set()

        for a in assignments:
            covered_section_ids.add(a.section_id)
            is_ct = a.section.class_teacher_id == faculty.id
            student_count = a.section.enrollments.filter(
                status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled']
            ).count()
            class_items.append({
                'id': str(a.id),
                'class_id': str(a.school_class_id),
                'section_id': str(a.section_id),
                'class_name': a.school_class.name,
                'section_name': a.section.name,
                'display_name': f"{a.school_class.name} ({a.section.name})",
                'subject_id': str(a.subject_id),
                'subject': a.subject.name,
                'subject_code': a.subject.code,
                'room': a.section.room,
                'student_count': student_count,
                'is_class_teacher': is_ct,
                'periods_per_week': a.subject.weekly_periods,
            })

        for ct_sec in faculty.assigned_sections.exclude(id__in=covered_section_ids).select_related('school_class'):
            student_count = ct_sec.enrollments.filter(
                status__in=['Active', 'ACTIVE', 'Enrolled', 'enrolled']
            ).count()
            class_items.append({
                'id': str(ct_sec.id),
                'class_id': str(ct_sec.school_class_id),
                'section_id': str(ct_sec.id),
                'class_name': ct_sec.school_class.name,
                'section_name': ct_sec.name,
                'display_name': f"{ct_sec.school_class.name} ({ct_sec.name})",
                'subject_id': '',
                'subject': 'Class Teacher Supervisory',
                'subject_code': 'CT-SUP',
                'room': ct_sec.room,
                'student_count': student_count,
                'is_class_teacher': True,
                'periods_per_week': 0,
            })

        return success_response(data=class_items)
