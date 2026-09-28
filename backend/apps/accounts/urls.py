"""
Student ERP — Accounts & Authentication URL Routing
Namespace: /api/v1/auth/
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.accounts.views import CurrentUserProfileView

app_name = 'accounts'

urlpatterns = [
    # JWT Authentication Endpoints (SimpleJWT)
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile & Identity
    path('me/', CurrentUserProfileView.as_view(), name='current_user_profile'),
]
