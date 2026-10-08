"""
Student ERP — Allocation URL Routing
Namespace: /api/v1/allocation/
"""

from django.urls import path

from apps.allocation.views import (
    AllocationOverviewView,
    StudentAllocationListView,
    StudentAllocationDetailView,
    ClassTeacherAllocationListView,
    ClassTeacherAllocationDetailView,
)

app_name = 'allocation'

urlpatterns = [
    path('', AllocationOverviewView.as_view(), name='allocation_overview'),
    path('students/', StudentAllocationListView.as_view(), name='student_allocation_list'),
    path('students/<str:student_id>/', StudentAllocationDetailView.as_view(), name='student_allocation_detail'),
    path('class-teachers/', ClassTeacherAllocationListView.as_view(), name='class_teacher_allocation_list'),
    path('class-teachers/<uuid:section_id>/', ClassTeacherAllocationDetailView.as_view(), name='class_teacher_allocation_detail'),
]
