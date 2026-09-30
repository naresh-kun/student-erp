"""
Student ERP — Marks URL Routing
Namespace: /api/v1/marks/
"""

from django.urls import path
from apps.marks.views import (
    MarkListView,
    BulkMarkCreateView,
    ExamTypeListView,
    ReportCardView,
    MarkDetailView,
)

app_name = 'marks'

urlpatterns = [
    path('', MarkListView.as_view(), name='mark_list'),
    path('bulk/', BulkMarkCreateView.as_view(), name='bulk_marks'),
    path('exam-types/', ExamTypeListView.as_view(), name='exam_type_list'),
    path('report-card/<str:student_id>/', ReportCardView.as_view(), name='report_card'),
    path('<uuid:pk>/', MarkDetailView.as_view(), name='mark_detail'),
]
