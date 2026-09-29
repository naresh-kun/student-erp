"""
Student ERP — Timetable URL Routing
Namespace: /api/v1/timetable/
"""

from django.urls import path
from apps.timetable.views import TimetableListView

app_name = 'timetable'

urlpatterns = [
    path('', TimetableListView.as_view(), name='timetable_list'),
]
