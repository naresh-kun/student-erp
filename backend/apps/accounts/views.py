"""
Student ERP — Accounts DRF Views
Provides endpoints for authentication profile, parent directory, and faculty directory.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.views import (
    TokenObtainPairView as SimpleJWTTokenObtainPairView,
    TokenRefreshView as SimpleJWTTokenRefreshView,
)

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
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, *args, **kwargs):
        service = AccountService()
        search = request.query_params.get('search')
        qs = service.get_parents_queryset(search=search)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = ParentSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ParentSerializer(qs, many=True)
        return success_response(data=serializer.data)


class ParentDetailView(APIView):
    """
    GET /api/v1/parents/{id}/
    Returns details for a specific parent profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        parent = get_object_or_404(Parent.objects.select_related('user'), pk=pk)
        serializer = ParentSerializer(parent)
        return success_response(data=serializer.data)


class ParentChildrenView(APIView):
    """
    GET /api/v1/parents/{id}/children/
    Returns verified student profiles linked to this parent.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        parent = get_object_or_404(Parent, pk=pk)
        from apps.students.serializers import StudentListSerializer
        children = parent.children.select_related('user', 'parent').all()
        serializer = StudentListSerializer(children, many=True)
        return success_response(data=serializer.data)


class FacultyListView(APIView):
    """
    GET /api/v1/faculty/
    POST /api/v1/faculty/
    Lists and creates faculty profiles.
    """
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        faculty = get_object_or_404(Faculty.objects.select_related('user'), pk=pk)
        serializer = FacultySerializer(faculty)
        return success_response(data=serializer.data)

    def patch(self, request, pk, *args, **kwargs):
        faculty = get_object_or_404(Faculty.objects.select_related('user'), pk=pk)
        serializer = FacultySerializer(faculty, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        faculty = serializer.save()
        return success_response(data=FacultySerializer(faculty).data)
