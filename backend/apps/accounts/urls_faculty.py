"""
Student ERP — Faculty URL Routing
Namespace: /api/v1/faculty/
"""

from django.urls import path
from apps.accounts.views import FacultyListView, FacultyDetailView

app_name = 'faculty'

urlpatterns = [
    path('', FacultyListView.as_view(), name='faculty_list'),
    path('<uuid:pk>/', FacultyDetailView.as_view(), name='faculty_detail'),
]
