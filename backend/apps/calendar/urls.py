"""
Student ERP — Calendar URL Routing
Namespace: /api/v1/calendar/
"""

from django.urls import path
from apps.calendar.views import (
    CalendarEventListView,
    CalendarEventDetailView,
)

app_name = 'calendar'

urlpatterns = [
    path('events/', CalendarEventListView.as_view(), name='event_list'),
    path('events/<uuid:pk>/', CalendarEventDetailView.as_view(), name='event_detail'),
]
