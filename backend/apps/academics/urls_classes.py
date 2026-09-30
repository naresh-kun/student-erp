"""
Student ERP — Classes URL Routing
Namespace: /api/v1/classes/
"""

from django.urls import path
from apps.academics.views import ClassListView, ClassDetailView, ClassSectionsView

app_name = 'classes'

urlpatterns = [
    path('', ClassListView.as_view(), name='class_list'),
    path('<uuid:pk>/', ClassDetailView.as_view(), name='class_detail'),
    path('<uuid:pk>/sections/', ClassSectionsView.as_view(), name='class_sections'),
]
