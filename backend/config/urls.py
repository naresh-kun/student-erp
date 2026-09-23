"""
Student ERP — Master URL Dispatcher
Root routing configuration mapping all REST APIs under /api/v1/
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Version 1 Namespace
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/students/', include('apps.students.urls')),
    path('api/v1/academics/', include('apps.academics.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/marks/', include('apps.marks.urls')),
    path('api/v1/timetable/', include('apps.timetable.urls')),
    path('api/v1/calendar/', include('apps.calendar.urls')),
    path('api/v1/allocation/', include('apps.allocation.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
]
