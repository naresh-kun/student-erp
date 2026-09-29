"""
Student ERP — Marks URL Routing
Namespace: /api/v1/marks/
"""

from django.urls import path
from apps.marks.views import MarkListView, ExamTypeListView

app_name = 'marks'

urlpatterns = [
    path('', MarkListView.as_view(), name='mark_list'),
    path('exam-types/', ExamTypeListView.as_view(), name='exam_type_list'),
]
