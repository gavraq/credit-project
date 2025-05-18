from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import DocumentType, Document
from .serializers import DocumentTypeSerializer, DocumentSerializer
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
import os

class DocumentTypeListView(generics.ListAPIView):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DocumentRetrieveView(generics.RetrieveAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

class DocumentDownloadView(generics.GenericAPIView):
    queryset = Document.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        doc = get_object_or_404(Document, pk=pk, user=request.user)
        file_handle = doc.file.open()
        response = HttpResponse(file_handle.read(), content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(doc.file.name)}"'
        file_handle.close()
        return response

# Test strategy outline (to be implemented in tests.py):
# - Model tests for file size/extension validation
# - API tests for upload, retrieval, download
# - Edge cases: oversized/invalid files, unauthorized access
