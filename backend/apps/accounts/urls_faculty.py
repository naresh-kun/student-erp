"""
Student ERP — Faculty URL Routing
Namespace: /api/v1/faculty/
"""

from django.urls import path
from apps.accounts.views import FacultyListView, FacultyDetailView, FacultyClassesView

app_name = 'faculty'

urlpatterns = [
    path('', FacultyListView.as_view(), name='faculty_list'),
    path('me/', FacultyDetailView.as_view(), {'pk': 'me'}, name='faculty_me'),
    path('me/classes/', FacultyClassesView.as_view(), {'pk': 'me'}, name='faculty_me_classes'),
    path('<str:pk>/classes/', FacultyClassesView.as_view(), name='faculty_classes'),
    path('<str:pk>/', FacultyDetailView.as_view(), name='faculty_detail'),
]
