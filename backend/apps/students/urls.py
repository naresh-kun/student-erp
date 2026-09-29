"""
Student ERP — Students URL Routing
Namespace: /api/v1/students/
"""

from django.urls import path
from apps.students.views import StudentListView, StudentDetailView

app_name = 'students'

urlpatterns = [
    path('', StudentListView.as_view(), name='student_list'),
    path('<str:pk>/', StudentDetailView.as_view(), name='student_detail'),
]
