"""
Student ERP — Notifications URL Routing
Namespace: /api/v1/notifications/
"""

from django.urls import path
from apps.notifications.views import NotificationListView

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
]
