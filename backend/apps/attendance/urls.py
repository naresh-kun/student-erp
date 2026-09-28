"""
Student ERP — Attendance URL Routing
Namespace: /api/v1/attendance/
"""

from django.urls import path
from apps.attendance.views import AttendanceOverviewView, StudentAbsenteesView

app_name = 'attendance'

urlpatterns = [
    path('', AttendanceOverviewView.as_view(), name='attendance_overview'),
    path('absentees/', StudentAbsenteesView.as_view(), name='student_absentees'),
]
