"""
Student ERP — Task 4.1 Authentication Foundation Tests
Phase 4, Task 4.1: Authentication Foundation

Comprehensive test suite verifying:
1. Authentication architecture & SimpleJWT settings
2. Password security, validators, and hashing (no plaintext storage)
3. AuthService boundaries (credential check, token generation, password strength)
4. Serializer security (password/hash exclusion)
5. Exactly 5 approved system roles preservation
6. URL routing for /api/v1/auth/ (login, refresh, me)
7. Security boundary enforcement (inactive accounts, invalid tokens, safe errors)
"""

import uuid
from datetime import timedelta
import pytest
from django.conf import settings
from django.contrib.auth.hashers import check_password, identify_hasher, is_password_usable
from django.urls import resolve, reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.exceptions import AuthenticationFailed

from common.constants import (
    ALL_ROLES,
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
)
from apps.accounts.models import Role, User
from apps.accounts.services import AuthService, AccountService
from apps.accounts.serializers import (
    AuthTokenResponseSerializer,
    LoginCredentialsSerializer,
    CurrentUserProfileSerializer,
    UserSummarySerializer,
)


# ============================================================================
# 1. Configuration & Token Settings Tests
# ============================================================================
class TestAuthenticationSettingsAndConfiguration:
    """Verifies authentication settings, token configuration, and security options."""

    def test_auth_user_model_is_accounts_user(self):
        """Custom user model must remain accounts.User."""
        assert settings.AUTH_USER_MODEL == 'accounts.User'

    def test_drf_authentication_classes(self):
        """DRF must specify SimpleJWT authentication as primary."""
        auth_classes = settings.REST_FRAMEWORK.get('DEFAULT_AUTHENTICATION_CLASSES', ())
        assert 'rest_framework_simplejwt.authentication.JWTAuthentication' in auth_classes
        assert 'rest_framework.authentication.SessionAuthentication' in auth_classes

    def test_simple_jwt_configuration_exists(self):
        """SIMPLE_JWT configuration dictionary must be present and correctly populated."""
        assert hasattr(settings, 'SIMPLE_JWT')
        jwt_conf = settings.SIMPLE_JWT

        assert jwt_conf['ACCESS_TOKEN_LIFETIME'] == timedelta(minutes=15)
        assert jwt_conf['REFRESH_TOKEN_LIFETIME'] == timedelta(days=7)
        assert jwt_conf['ALGORITHM'] == 'HS256'
        assert jwt_conf['AUTH_HEADER_TYPES'] == ('Bearer',)
        assert jwt_conf['AUTH_HEADER_NAME'] == 'HTTP_AUTHORIZATION'
        assert jwt_conf['USER_ID_FIELD'] == 'id'
        assert jwt_conf['USER_ID_CLAIM'] == 'user_id'
        assert jwt_conf['SIGNING_KEY'] is not None
        assert len(jwt_conf['SIGNING_KEY']) > 0

    def test_password_validators_configured(self):
        """All 4 standard Django password validators must be configured."""
        validators = [v['NAME'] for v in settings.AUTH_PASSWORD_VALIDATORS]
        assert 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator' in validators
        assert 'django.contrib.auth.password_validation.MinimumLengthValidator' in validators
        assert 'django.contrib.auth.password_validation.CommonPasswordValidator' in validators
        assert 'django.contrib.auth.password_validation.NumericPasswordValidator' in validators


# ============================================================================
# 2. Password Security & User Model Tests
# ============================================================================
@pytest.mark.django_db
class TestUserModelPasswordSecurity:
    """Verifies password hashing, validation, and inactive user behavior."""

    def test_user_password_hashing(self):
        """User password must be securely hashed and never stored plaintext."""
        user = User.objects.create(
            username='test_sec_user_1',
            email='sec_user_1@erp.local',
        )
        plaintext = 'SuperSecret@2026'
        user.set_password(plaintext)
        user.save()

        # Password must not equal plaintext
        assert user.password != plaintext
        # Password must be identified by a registered Django hasher (e.g. PBKDF2)
        hasher = identify_hasher(user.password)
        assert hasher is not None
        assert user.password.startswith('pbkdf2_sha256$')
        # is_password_usable must be True
        assert is_password_usable(user.password)
        # check_password must verify correctly
        assert user.check_password(plaintext) is True
        assert user.check_password('WrongPassword!') is False

    def test_user_str_does_not_leak_password_or_secrets(self):
        """String representation of user must contain only username and role."""
        role, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
        user = User.objects.create(
            username='teacher_john',
            email='teacher@erp.local',
            role=role,
        )
        user.set_password('SecretP@ssword123')
        user_str = str(user)
        assert 'teacher_john' in user_str
        assert 'Faculty' in user_str
        assert 'SecretP@ssword123' not in user_str
        assert 'pbkdf2' not in user_str


# ============================================================================
# 3. AuthService Domain Boundary Tests
# ============================================================================
@pytest.mark.django_db
class TestAuthServiceBoundary:
    """Tests the AuthService methods for credential verification and token issuance."""

    def test_auth_service_status(self):
        """AuthService reports active status."""
        service = AuthService()
        status_data = service.get_service_status()
        assert status_data['service'] == 'auth'
        assert status_data['status'] == 'active'

    def test_authenticate_user_valid_credentials(self):
        """AuthService.authenticate_user returns user when credentials are valid."""
        user = User.objects.create(
            username='auth_valid_user',
            email='valid@erp.local',
            is_active=True,
        )
        user.set_password('ValidPass@123')
        user.save()

        service = AuthService()
        authenticated = service.authenticate_user('auth_valid_user', 'ValidPass@123')
        assert authenticated is not None
        assert authenticated.id == user.id

    def test_authenticate_user_invalid_credentials_returns_none(self):
        """AuthService.authenticate_user returns None on bad password or non-existent username."""
        service = AuthService()
        assert service.authenticate_user('nonexistent', 'any_pass') is None
        assert service.authenticate_user('', '') is None

    def test_authenticate_user_inactive_account_returns_none(self):
        """AuthService.authenticate_user returns None if account is disabled/inactive."""
        user = User.objects.create(
            username='inactive_user_auth',
            email='inactive@erp.local',
            is_active=False,
        )
        user.set_password('ValidPass@123')
        user.save()

        service = AuthService()
        assert service.authenticate_user('inactive_user_auth', 'ValidPass@123') is None

    def test_generate_tokens_for_user(self):
        """AuthService.generate_tokens_for_user issues valid JWT token pair with custom claims."""
        role, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
        user = User.objects.create(
            username='token_user_admin',
            email='admin@erp.local',
            role=role,
            is_active=True,
        )

        service = AuthService()
        tokens = service.generate_tokens_for_user(user)

        assert 'access' in tokens
        assert 'refresh' in tokens
        assert tokens['token_type'] == 'Bearer'

        # Decode access token to verify claims
        access = AccessToken(tokens['access'])
        assert str(access['user_id']) == str(user.id)
        assert access['role'] == 'Admin'
        assert access['username'] == 'token_user_admin'

    def test_generate_tokens_inactive_user_raises_exception(self):
        """AuthService.generate_tokens_for_user raises AuthenticationFailed for inactive user."""
        user = User.objects.create(
            username='inactive_token_user',
            email='inactive_token@erp.local',
            is_active=False,
        )
        service = AuthService()
        with pytest.raises(AuthenticationFailed):
            service.generate_tokens_for_user(user)

    def test_validate_password_strength(self):
        """AuthService.validate_password_strength catches weak passwords and accepts strong ones."""
        service = AuthService()
        # Weak password (too short)
        errors = service.validate_password_strength('123')
        assert len(errors) > 0

        # Strong password
        valid_errors = service.validate_password_strength('SuperSecureP@ssw0rd2026!')
        assert len(valid_errors) == 0

    def test_get_user_by_id(self):
        """AuthService.get_user_by_id safely looks up user by UUID or returns None."""
        user = User.objects.create(
            username='uuid_lookup_user',
            email='uuid@erp.local',
        )
        service = AuthService()
        assert service.get_user_by_id(user.id) == user
        assert service.get_user_by_id(uuid.uuid4()) is None
        assert service.get_user_by_id("invalid-uuid-string") is None


# ============================================================================
# 4. Serializer Security Tests
# ============================================================================
@pytest.mark.django_db
class TestAuthenticationSerializers:
    """Verifies that serializers never expose password, hashes, or security secrets."""

    def test_current_user_profile_serializer_does_not_expose_password(self):
        """CurrentUserProfileSerializer must not contain password or password_hash fields."""
        role, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
        user = User.objects.create(
            username='stu_sec_test',
            email='stu_sec@erp.local',
            first_name='Ananya',
            last_name='Iyer',
            role=role,
        )
        user.set_password('MySecretPass@123')
        user.save()

        serializer = CurrentUserProfileSerializer(user)
        data = serializer.data

        assert 'id' in data
        assert 'username' in data
        assert 'role_name' in data
        assert data['role_name'] == 'Student'
        # Crucial security invariants:
        assert 'password' not in data
        assert 'password_hash' not in data
        assert 'secret' not in data

    def test_user_summary_serializer_does_not_expose_password(self):
        """UserSummarySerializer must not include password fields."""
        serializer = UserSummarySerializer()
        assert 'password' not in serializer.fields
        assert 'password_hash' not in serializer.fields

    def test_login_credentials_serializer_password_write_only(self):
        """LoginCredentialsSerializer marks password as write_only."""
        serializer = LoginCredentialsSerializer()
        password_field = serializer.fields['password']
        assert password_field.write_only is True

    def test_auth_token_response_serializer_fields(self):
        """AuthTokenResponseSerializer defines access, refresh, token_type."""
        serializer = AuthTokenResponseSerializer(data={'access': 'acc_xyz', 'refresh': 'ref_abc'})
        assert serializer.is_valid()
        data = serializer.data
        assert data['token_type'] == 'Bearer'
        assert data['access'] == 'acc_xyz'
        assert data['refresh'] == 'ref_abc'


# ============================================================================
# 5. Role Foundation Tests
# ============================================================================
@pytest.mark.django_db
class TestRoleFoundation:
    """Verifies that exactly five approved roles remain supported."""

    def test_exactly_five_approved_roles(self):
        """Approved roles must match ALL_ROLES constant exactly."""
        expected_roles = {ROLE_ADMIN, ROLE_PRINCIPAL, ROLE_FACULTY, ROLE_STUDENT, ROLE_PARENT}
        assert set(ALL_ROLES) == expected_roles
        assert len(expected_roles) == 5

    def test_role_creation_and_assignment(self):
        """Roles can be assigned to User models."""
        for role_name in ALL_ROLES:
            role, _ = Role.objects.get_or_create(name=role_name)
            assert role.name == role_name

        admin_role = Role.objects.get(name=ROLE_ADMIN)
        user = User.objects.create(username='admin_role_test', role=admin_role)
        assert user.role.name == ROLE_ADMIN


# ============================================================================
# 6. Authentication API Routing & Endpoint Tests
# ============================================================================
@pytest.mark.django_db
class TestAuthenticationEndpointsRouting:
    """Verifies URL dispatching and endpoint responses under /api/v1/auth/."""

    def test_auth_url_resolution(self):
        """All auth routes must resolve within the accounts namespace."""
        login_match = resolve('/api/v1/auth/login/')
        assert login_match.func.view_class.__name__ == 'TokenObtainPairView'

        refresh_match = resolve('/api/v1/auth/refresh/')
        assert refresh_match.func.view_class.__name__ == 'TokenRefreshView'

        me_match = resolve('/api/v1/auth/me/')
        assert me_match.func.view_class.__name__ == 'CurrentUserProfileView'

    def test_me_endpoint_unauthenticated_returns_401(self):
        """GET /api/v1/auth/me/ without credentials returns 401 with standard error envelope."""
        client = APIClient()
        response = client.get('/api/v1/auth/me/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        res_data = response.json()
        assert res_data['success'] is False
        assert 'error' in res_data
        assert res_data['error']['status_code'] == 401

    def test_me_endpoint_with_valid_jwt_returns_200(self):
        """GET /api/v1/auth/me/ with valid JWT Bearer token returns 200 with user profile."""
        role, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL)
        user = User.objects.create(
            username='principal_sharma',
            email='principal@erp.local',
            first_name='Sunita',
            last_name='Sharma',
            role=role,
            is_active=True,
        )

        service = AuthService()
        tokens = service.generate_tokens_for_user(user)

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = client.get('/api/v1/auth/me/')

        assert response.status_code == status.HTTP_200_OK
        res_data = response.json()
        assert res_data['success'] is True
        assert 'data' in res_data
        assert res_data['data']['username'] == 'principal_sharma'
        assert res_data['data']['role'] == 'Principal'
        assert res_data['data']['first_name'] == 'Sunita'
        assert res_data['data']['last_name'] == 'Sharma'
        assert 'password' not in res_data['data']

    def test_me_endpoint_with_invalid_jwt_returns_401(self):
        """GET /api/v1/auth/me/ with malformed token returns 401 error envelope."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer invalid.malformed.jwt.token")
        response = client.get('/api/v1/auth/me/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        res_data = response.json()
        assert res_data['success'] is False
        assert 'error' in res_data

    def test_login_endpoint_scaffold_with_invalid_credentials(self):
        """POST /api/v1/auth/login/ with invalid credentials returns 401."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'non_existent_user', 'password': 'wrong_password'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_endpoint_with_valid_credentials(self):
        """POST /api/v1/auth/login/ with valid credentials returns 200 with token pair."""
        role, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
        user = User.objects.create(
            username='faculty_user_auth',
            email='faculty_auth@erp.local',
            role=role,
            is_active=True,
        )
        user.set_password('FacultyPass@2026')
        user.save()

        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'faculty_user_auth', 'password': 'FacultyPass@2026'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'access' in data
        assert 'refresh' in data

    def test_refresh_endpoint_with_valid_and_invalid_tokens(self):
        """POST /api/v1/auth/refresh/ exchanges refresh token for new access token."""
        user = User.objects.create(
            username='refresh_test_user',
            email='refresh@erp.local',
            is_active=True,
        )
        service = AuthService()
        tokens = service.generate_tokens_for_user(user)

        client = APIClient()
        # Valid refresh
        res_valid = client.post(
            '/api/v1/auth/refresh/',
            {'refresh': tokens['refresh']},
            format='json',
        )
        assert res_valid.status_code == status.HTTP_200_OK
        assert 'access' in res_valid.json()

        # Invalid refresh
        res_invalid = client.post(
            '/api/v1/auth/refresh/',
            {'refresh': 'totally.invalid.refresh.token'},
            format='json',
        )
        assert res_invalid.status_code == status.HTTP_401_UNAUTHORIZED
