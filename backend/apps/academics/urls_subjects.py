"""
Student ERP — Subjects URL Routing
Namespace: /api/v1/subjects/
"""

from django.urls import path
from apps.academics.views import SubjectListView, SubjectDetailView

app_name = 'subjects'

urlpatterns = [
    path('', SubjectListView.as_view(), name='subject_list'),
    path('<uuid:pk>/', SubjectDetailView.as_view(), name='subject_detail'),
]
