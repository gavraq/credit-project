from django.urls import path
from .views import (
    DocumentTypeListView,
    DocumentListCreateView,
    DocumentRetrieveView,
    DocumentDownloadView,
)

urlpatterns = [
    path('types/', DocumentTypeListView.as_view(), name='document-type-list'),
    path('', DocumentListCreateView.as_view(), name='document-list-create'),
    path('<int:pk>/', DocumentRetrieveView.as_view(), name='document-detail'),
    path('<int:pk>/download/', DocumentDownloadView.as_view(), name='document-download'),
]
