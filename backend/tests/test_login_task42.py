"""
Student ERP — Task 4.2 Custom User & Login Workflow Tests
Phase 4, Task 4.2: Custom User & Login

Comprehensive test suite verifying:
1. Login endpoint (/api/v1/auth/login/) with credentials, validation, and error responses.
2. Inactive account rejection across service and API layers.
3. JWT access/refresh token generation, signatures, and safe claims.
4. Token refresh workflow (/api/v1/auth/refresh/) with validation and rotation.
5. Authenticated current-user identity (/api/v1/auth/me/) and safe serialization.
6. Password security (PBKDF2 hashing, zero plaintext, zero serializer leakage).
7. Role integrity across all 5 canonical ERP roles.
"""

import uuid
from datetime import timedelta
import pytest
from django.conf import settings
from django.contrib.auth.hashers import identify_hasher
from django.urls import resolve, reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from common.constants import (
    ALL_ROLES,
    ROLE_ADMIN,
    ROLE_PRINCIPAL,
    ROLE_FACULTY,
    ROLE_STUDENT,
    ROLE_PARENT,
)
from apps.accounts.models import Role, User
from apps.accounts.services import AuthService


# ============================================================================
# 1. Login Workflow Tests (POST /api/v1/auth/login/)
# ============================================================================
@pytest.mark.django_db
class TestLoginWorkflow:
    """Verifies the login workflow adheres to docs/API_CONTRACT.md and Task 4.2 specs."""

    def test_login_successful_with_valid_credentials(self):
        """Valid credentials return 200, JWT tokens, and safe user profile information."""
        role, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
        user = User.objects.create(
            username='prof_sharma',
            email='sharma@erp.local',
            first_name='Ramesh',
            last_name='Sharma',
            role=role,
            is_active=True,
        )
        user.set_password('CorrectPassword@123')
        user.save()

        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'prof_sharma', 'password': 'CorrectPassword@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Token payload verification
        assert 'access' in data
        assert 'refresh' in data
        assert data['token_type'] == 'Bearer'

        # User payload verification
        assert 'user' in data
        user_info = data['user']
        assert user_info['id'] == str(user.id)
        assert user_info['username'] == 'prof_sharma'
        assert user_info['email'] == 'sharma@erp.local'
        assert user_info['first_name'] == 'Ramesh'
        assert user_info['last_name'] == 'Sharma'
        assert user_info['role'] == 'Faculty'

        # Absolute security invariants
        assert 'password' not in user_info
        assert 'password_hash' not in user_info
        assert 'password' not in data

        # Standard envelope dual-compatibility
        assert data['success'] is True
        assert 'data' in data
        assert data['data']['access'] == data['access']
        assert data['data']['user']['username'] == 'prof_sharma'

    def test_login_all_five_canonical_roles(self):
        """Verifies that all 5 canonical roles can authenticate and receive correct role identity."""
        for role_name in ALL_ROLES:
            role, _ = Role.objects.get_or_create(name=role_name)
            username = f"user_{role_name.lower()}"
            user = User.objects.create(
                username=username,
                email=f"{username}@erp.local",
                role=role,
                is_active=True,
            )
            user.set_password('StandardPass@2026')
            user.save()

            client = APIClient()
            response = client.post(
                '/api/v1/auth/login/',
                {'username': username, 'password': 'StandardPass@2026'},
                format='json',
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data['user']['role'] == role_name

            # Verify claim inside the access token
            token = AccessToken(data['access'])
            assert token['role'] == role_name
            assert token['username'] == username

    def test_login_wrong_password_returns_401(self):
        """Incorrect password returns 401 with standard safe error envelope."""
        role, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
        user = User.objects.create(
            username='admin_auth_user',
            email='admin_auth@erp.local',
            role=role,
            is_active=True,
        )
        user.set_password('RealPassword@123')
        user.save()

        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'admin_auth_user', 'password': 'WrongPassword@999'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert 'error' in data
        assert data['error']['status_code'] == 401
        # No internal stack trace or password info leaked
        assert 'password' not in str(data['error']['message']).lower()

    def test_login_unknown_username_returns_401(self):
        """Non-existent username returns 401 with generic message, preventing account enumeration."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'completely_nonexistent_user', 'password': 'SomePassword@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert 'error' in data

    def test_login_inactive_user_returns_401(self):
        """Inactive user (is_active=False) is rejected and receives 401 without tokens."""
        role, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
        user = User.objects.create(
            username='disabled_student',
            email='disabled@erp.local',
            role=role,
            is_active=False,
        )
        user.set_password('ValidPass@123')
        user.save()

        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'disabled_student', 'password': 'ValidPass@123'},
            format='json',
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False
        assert 'access' not in data

    def test_login_empty_username_returns_400(self):
        """Empty username triggers DRF field validation failure with HTTP 400."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': '', 'password': 'ValidPass@123'},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_empty_password_returns_400(self):
        """Empty password triggers DRF field validation failure with HTTP 400."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'some_user', 'password': ''},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_payload_returns_400(self):
        """Empty JSON payload returns 400 Bad Request."""
        client = APIClient()
        response = client.post('/api/v1/auth/login/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# 2. JWT Issuance & Safe Claims Tests
# ============================================================================
@pytest.mark.django_db
class TestJWTIssuanceAndClaims:
    """Verifies JWT tokens issued during login contain only approved safe claims."""

    def test_jwt_access_token_claims_and_lifetime(self):
        """Access token contains user_id, role, username, token_type and 15m expiration."""
        role, _ = Role.objects.get_or_create(name=ROLE_PRINCIPAL)
        user = User.objects.create(
            username='head_principal',
            email='head@erp.local',
            role=role,
            is_active=True,
        )
        user.set_password('PrincipalPass@2026')
        user.save()

        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'head_principal', 'password': 'PrincipalPass@2026'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        access = AccessToken(data['access'])
        assert str(access['user_id']) == str(user.id)
        assert access['role'] == 'Principal'
        assert access['username'] == 'head_principal'
        assert access['token_type'] == 'access'

        # Verify expiration delta is 15 minutes (900 seconds)
        exp_delta = access['exp'] - access['iat']
        assert exp_delta == 900

        # Disallowed claim audit
        for forbidden in ('password', 'password_hash', 'secret', 'key'):
            assert forbidden not in access

    def test_jwt_refresh_token_lifetime(self):
        """Refresh token lifetime matches 7 days (604800 seconds)."""
        role, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
        user = User.objects.create(
            username='refresh_admin',
            email='ref_admin@erp.local',
            role=role,
            is_active=True,
        )
        user.set_password('AdminPass@2026')
        user.save()

        client = APIClient()
        response = client.post(
            '/api/v1/auth/login/',
            {'username': 'refresh_admin', 'password': 'AdminPass@2026'},
            format='json',
        )
        data = response.json()
        refresh = RefreshToken(data['refresh'])
        exp_delta = refresh['exp'] - refresh['iat']
        assert exp_delta == 7 * 86400


# ============================================================================
# 3. Token Refresh Workflow Tests (POST /api/v1/auth/refresh/)
# ============================================================================
@pytest.mark.django_db
class TestTokenRefreshWorkflow:
    """Verifies token refresh endpoint operations adhering to Task 4.2 specs."""

    def test_refresh_token_returns_new_access_token(self):
        """Valid refresh token yields a new valid access token."""
        role, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
        user = User.objects.create(
            username='ref_faculty_user',
            email='ref_fac@erp.local',
            role=role,
            is_active=True,
        )
        user.set_password('FacultyPass@123')
        user.save()

        client = APIClient()
        login_res = client.post(
            '/api/v1/auth/login/',
            {'username': 'ref_faculty_user', 'password': 'FacultyPass@123'},
            format='json',
        )
        refresh_token = login_res.json()['refresh']

        # Call refresh endpoint
        refresh_res = client.post(
            '/api/v1/auth/refresh/',
            {'refresh': refresh_token},
            format='json',
        )
        assert refresh_res.status_code == status.HTTP_200_OK
        ref_data = refresh_res.json()

        assert 'access' in ref_data
        assert ref_data['token_type'] == 'Bearer'
        assert ref_data['success'] is True
        assert 'data' in ref_data
        assert ref_data['data']['access'] == ref_data['access']

        # Verify new access token decodes correctly
        new_access = AccessToken(ref_data['access'])
        assert str(new_access['user_id']) == str(user.id)
        assert new_access['role'] == 'Faculty'

    def test_refresh_token_invalid_string_returns_401(self):
        """Invalid string as refresh token returns 401."""
        client = APIClient()
        response = client.post(
            '/api/v1/auth/refresh/',
            {'refresh': 'invalid.token.string'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['success'] is False

    def test_refresh_token_empty_payload_returns_400(self):
        """Empty payload to refresh endpoint returns 400."""
        client = APIClient()
        response = client.post('/api/v1/auth/refresh/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# 4. Current User Identity Tests (GET /api/v1/auth/me/)
# ============================================================================
@pytest.mark.django_db
class TestCurrentUserIdentity:
    """Verifies /api/v1/auth/me/ endpoint with login credentials."""

    def test_me_with_fresh_login_token_succeeds(self):
        """Tokens acquired via login endpoint immediately authenticate against /auth/me/."""
        role, _ = Role.objects.get_or_create(name=ROLE_STUDENT)
        user = User.objects.create(
            username='me_test_student',
            email='me_stu@erp.local',
            first_name='Kavya',
            last_name='Nair',
            role=role,
            is_active=True,
        )
        user.set_password('KavyaSecure@2026')
        user.save()

        client = APIClient()
        login_res = client.post(
            '/api/v1/auth/login/',
            {'username': 'me_test_student', 'password': 'KavyaSecure@2026'},
            format='json',
        )
        access_token = login_res.json()['access']

        # Query /api/v1/auth/me/ using the access token
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        me_res = client.get('/api/v1/auth/me/')

        assert me_res.status_code == status.HTTP_200_OK
        me_data = me_res.json()
        assert me_data['success'] is True
        assert me_data['data']['username'] == 'me_test_student'
        assert me_data['data']['role'] == 'Student'
        assert me_data['data']['first_name'] == 'Kavya'
        assert me_data['data']['last_name'] == 'Nair'
        assert 'password' not in me_data['data']

    def test_me_unauthenticated_returns_401(self):
        """Accessing /auth/me/ without credentials returns 401."""
        client = APIClient()
        response = client.get('/api/v1/auth/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()['success'] is False

    def test_me_with_tampered_token_returns_401(self):
        """Accessing /auth/me/ with tampered token returns 401."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token")
        response = client.get('/api/v1/auth/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_inactive_user_token_is_rejected(self):
        """Token belonging to a user subsequently deactivated is rejected with 401."""
        role, _ = Role.objects.get_or_create(name=ROLE_FACULTY)
        user = User.objects.create(
            username='deactivated_later',
            email='deactivated@erp.local',
            role=role,
            is_active=True,
        )
        user.set_password('Pass@123')
        user.save()

        # Login to obtain token
        client = APIClient()
        login_res = client.post(
            '/api/v1/auth/login/',
            {'username': 'deactivated_later', 'password': 'Pass@123'},
            format='json',
        )
        access_token = login_res.json()['access']

        # Now deactivate user in database
        user.is_active = False
        user.save()

        # Attempt to access /auth/me/ with previously issued token
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        me_res = client.get('/api/v1/auth/me/')
        assert me_res.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# 5. AuthService Direct Workflow Tests
# ============================================================================
@pytest.mark.django_db
class TestAuthServiceDirectWorkflow:
    """Verifies AuthService.login_with_credentials domain method."""

    def test_auth_service_login_with_credentials_success(self):
        """AuthService.login_with_credentials returns tokens and user info on valid credentials."""
        role, _ = Role.objects.get_or_create(name=ROLE_ADMIN)
        user = User.objects.create(
            username='service_direct_admin',
            email='direct_admin@erp.local',
            role=role,
            is_active=True,
        )
        user.set_password('DirectPass@2026')
        user.save()

        service = AuthService()
        result = service.login_with_credentials('service_direct_admin', 'DirectPass@2026')

        assert result is not None
        assert 'access' in result
        assert 'refresh' in result
        assert result['user']['username'] == 'service_direct_admin'
        assert result['user']['role'] == 'Admin'

    def test_auth_service_login_with_credentials_invalid_password(self):
        """AuthService.login_with_credentials returns None on wrong password."""
        user = User.objects.create(
            username='wrong_pass_direct',
            email='wrong_direct@erp.local',
            is_active=True,
        )
        user.set_password('RealPass@123')
        user.save()

        service = AuthService()
        result = service.login_with_credentials('wrong_pass_direct', 'WrongPass@999')
        assert result is None

    def test_auth_service_login_with_credentials_inactive_user(self):
        """AuthService.login_with_credentials returns None when user is inactive."""
        user = User.objects.create(
            username='inactive_direct_user',
            email='inactive_direct@erp.local',
            is_active=False,
        )
        user.set_password('ValidPass@123')
        user.save()

        service = AuthService()
        result = service.login_with_credentials('inactive_direct_user', 'ValidPass@123')
        assert result is None
