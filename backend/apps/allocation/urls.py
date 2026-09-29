"""
Student ERP — Allocation URL Routing
Namespace: /api/v1/allocation/
"""

from django.urls import path
from apps.allocation.views import AllocationListView

app_name = 'allocation'

urlpatterns = [
    path('', AllocationListView.as_view(), name='allocation_list'),
]
