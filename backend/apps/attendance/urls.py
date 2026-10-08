"""
Student ERP — Attendance URL Routing
Namespace: /api/v1/attendance/
"""

from django.urls import path
from apps.attendance.views import (
    AttendanceOverviewView,
    AttendanceSummaryOversightView,
    AttendanceAnalyticsView,
    AttendanceNotEnteredView,
    BulkAttendanceCreateView,
    AttendanceDetailView,
    StudentAbsenteesView,
    LeaveApplicationListView,
    LeaveApplicationDetailView,
)

app_name = 'attendance'

urlpatterns = [
    path('', AttendanceOverviewView.as_view(), name='attendance_overview'),
    path('summary/', AttendanceSummaryOversightView.as_view(), name='attendance_summary'),
    path('analytics/', AttendanceAnalyticsView.as_view(), name='attendance_analytics'),
    path('absentees/', StudentAbsenteesView.as_view(), name='student_absentees'),
    path('not-entered/', AttendanceNotEnteredView.as_view(), name='attendance_not_entered'),
    path('bulk/', BulkAttendanceCreateView.as_view(), name='bulk_attendance'),
    path('leaves/', LeaveApplicationListView.as_view(), name='leave_applications'),
    path('leaves/<uuid:pk>/', LeaveApplicationDetailView.as_view(), name='leave_application_detail'),
    path('<uuid:pk>/', AttendanceDetailView.as_view(), name='attendance_detail'),
]
