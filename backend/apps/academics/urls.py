"""
Student ERP — Academics URL Routing
Namespace: /api/v1/academics/
"""

from django.urls import path
from apps.academics.views import (
    ClassListView,
    ClassDetailView,
    ClassSectionsView,
    SubjectListView,
    SubjectDetailView,
    AcademicYearListView,
    SectionListView,
    SectionDetailView,
    EnrollmentListView,
    EnrollmentDetailView,
)

app_name = 'academics'

urlpatterns = [
    path('classes/', ClassListView.as_view(), name='class_list'),
    path('classes/<uuid:pk>/', ClassDetailView.as_view(), name='class_detail'),
    path('classes/<uuid:pk>/sections/', ClassSectionsView.as_view(), name='class_sections'),
    path('sections/', SectionListView.as_view(), name='section_list'),
    path('sections/<uuid:pk>/', SectionDetailView.as_view(), name='section_detail'),
    path('subjects/', SubjectListView.as_view(), name='subject_list'),
    path('subjects/<uuid:pk>/', SubjectDetailView.as_view(), name='subject_detail'),
    path('years/', AcademicYearListView.as_view(), name='year_list'),
    path('enrollments/', EnrollmentListView.as_view(), name='enrollment_list'),
    path('enrollments/<uuid:pk>/', EnrollmentDetailView.as_view(), name='enrollment_detail'),
]
