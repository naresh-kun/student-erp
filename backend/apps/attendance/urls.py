"""
Student ERP — Attendance URL Routing
Namespace: /api/v1/attendance/
"""

from django.urls import path
from apps.attendance.views import (
    AttendanceOverviewView,
    BulkAttendanceCreateView,
    AttendanceDetailView,
    StudentAbsenteesView,
    LeaveApplicationListView,
)

app_name = 'attendance'

urlpatterns = [
    path('', AttendanceOverviewView.as_view(), name='attendance_overview'),
    path('bulk/', BulkAttendanceCreateView.as_view(), name='bulk_attendance'),
    path('absentees/', StudentAbsenteesView.as_view(), name='student_absentees'),
    path('leaves/', LeaveApplicationListView.as_view(), name='leave_applications'),
    path('<uuid:pk>/', AttendanceDetailView.as_view(), name='attendance_detail'),
]
