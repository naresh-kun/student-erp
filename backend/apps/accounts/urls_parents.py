"""
Student ERP — Parents URL Routing
Namespace: /api/v1/parents/
"""

from django.urls import path
from apps.accounts.views import ParentListView, ParentDetailView, ParentChildrenView

app_name = 'parents'

urlpatterns = [
    path('', ParentListView.as_view(), name='parent_list'),
    path('me/', ParentDetailView.as_view(), {'pk': 'me'}, name='parent_me'),
    path('me/children/', ParentChildrenView.as_view(), {'pk': 'me'}, name='parent_me_children'),
    path('<uuid:pk>/', ParentDetailView.as_view(), name='parent_detail'),
    path('<uuid:pk>/children/', ParentChildrenView.as_view(), name='parent_children'),
]
