"""
Student ERP — Timetable URL Routing (Phase 6 Task 6.1)
Namespace: /api/v1/timetable/
"""

from django.urls import path
from apps.timetable.views import TimetableListView, TimetableDetailView

app_name = 'timetable'

urlpatterns = [
    path('', TimetableListView.as_view(), name='timetable_list'),
    path('<uuid:pk>/', TimetableDetailView.as_view(), name='timetable_detail'),
]
