"""
Student ERP — Academics URL Routing
Namespace: /api/v1/academics/
"""

from django.urls import path
from apps.academics.views import ClassListView, SubjectListView

app_name = 'academics'

urlpatterns = [
    path('classes/', ClassListView.as_view(), name='class_list'),
    path('subjects/', SubjectListView.as_view(), name='subject_list'),
]
