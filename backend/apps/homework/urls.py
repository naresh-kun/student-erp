"""
Student ERP — Homework URL Configuration (MOD_001)
Routes /api/v1/homework/ and /api/v1/homework/<id>/
"""

from django.urls import path
from apps.homework.views import HomeworkListView, HomeworkDetailView, HomeworkTeachingScopeView

app_name = 'homework'

urlpatterns = [
    path('', HomeworkListView.as_view(), name='homework-list'),
    path('scope/', HomeworkTeachingScopeView.as_view(), name='homework-scope'),
    path('<uuid:pk>/', HomeworkDetailView.as_view(), name='homework-detail'),
]
