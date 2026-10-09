"""
Student ERP — Marks URL Routing
Namespace: /api/v1/marks/
"""

from django.urls import path
from apps.marks.views import (
    MarkListView,
    BulkMarkCreateView,
    ExamTypeListView,
    ExamTypeDetailView,
    ReportCardView,
    MarkDetailView,
    MarksSummaryOversightView,
    AcademicAnalyticsView,
)

app_name = 'marks'

urlpatterns = [
    path('', MarkListView.as_view(), name='mark_list'),
    path('summary/', MarksSummaryOversightView.as_view(), name='marks_summary'),
    path('analytics/', AcademicAnalyticsView.as_view(), name='academic_analytics'),
    path('bulk/', BulkMarkCreateView.as_view(), name='bulk_marks'),
    path('exam-types/', ExamTypeListView.as_view(), name='exam_type_list'),
    path('exam-types/<uuid:pk>/', ExamTypeDetailView.as_view(), name='exam_type_detail'),
    path('report-card/<str:student_id>/', ReportCardView.as_view(), name='report_card'),
    path('<uuid:pk>/', MarkDetailView.as_view(), name='mark_detail'),
]
