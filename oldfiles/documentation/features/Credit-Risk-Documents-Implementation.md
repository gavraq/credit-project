# Credit Risk Workflow System - Documents Implementation

This document details the implementation of the Documents app for the Credit Risk Workflow System. The Documents app manages document uploads, storage, and retrieval for credit applications and other entities in the system.

## 1. Documents App Overview

The Documents app is designed to:

1. Handle secure document uploads and storage
2. Support different document types with validation
3. Generate document previews for web viewing
4. Manage document versioning and metadata

## 2. Models

### 2.1 DocumentType Model

```python
# documents/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

class DocumentType(models.Model):
    """
    Document types with validation rules and metadata.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    allowed_extensions = models.JSONField(default=list)
    max_size_mb = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
```

### 2.2 Document Model

```python
class Document(models.Model):
    """
    Document model for storing uploaded files with metadata.
    """
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='documents/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()  # Size in bytes
    file_type = models.CharField(max_length=100)  # MIME type
    document_type = models.ForeignKey(
        DocumentType, 
        on_delete=models.PROTECT,
        related_name='documents'
    )
    
    # Generic foreign key to associate with any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Metadata
    version = models.PositiveIntegerField(default=1)
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='uploaded_documents'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def file_extension(self):
        """Get the file extension from the file name."""
        return self.file_name.split('.')[-1] if '.' in self.file_name else ''
    
    @property
    def file_size_formatted(self):
        """Format file size for display."""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024
```

### 2.3 DocumentPreview Model

```python
class DocumentPreview(models.Model):
    """
    Document preview for web viewing.
    """
    document = models.OneToOneField(
        Document, 
        on_delete=models.CASCADE,
        related_name='preview'
    )
    preview_file = models.FileField(upload_to='document_previews/%Y/%m/%d/')
    preview_type = models.CharField(max_length=50)  # e.g., 'pdf', 'image', 'html'
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preview for {self.document.title}"
```

## 3. Serializers

### 3.1 DocumentType Serializer

```python
# documents/serializers.py
from rest_framework import serializers
from .models import DocumentType, Document, DocumentPreview

class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = [
            'id', 'name', 'description', 'allowed_extensions',
            'max_size_mb', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### 3.2 DocumentPreview Serializer

```python
class DocumentPreviewSerializer(serializers.ModelSerializer):
    preview_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentPreview
        fields = [
            'id', 'document', 'preview_type', 
            'preview_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_preview_url(self, obj):
        request = self.context.get('request')
        if request and obj.preview_file:
            return request.build_absolute_uri(obj.preview_file.url)
        return None
```

### 3.3 Document Serializer

```python
class DocumentSerializer(serializers.ModelSerializer):
    document_type_name = serializers.CharField(source='document_type.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    preview = DocumentPreviewSerializer(read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'file', 'file_name',
            'file_size', 'file_size_formatted', 'file_type',
            'document_type', 'document_type_name',
            'content_type', 'object_id', 'version',
            'uploaded_by', 'uploaded_by_name',
            'file_url', 'preview',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'file_size_formatted', 
            'file_type', 'version', 'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def create(self, validated_data):
        # Extract file from request
        file_obj = validated_data.get('file')
        
        # Set file metadata
        if file_obj:
            validated_data['file_name'] = file_obj.name
            validated_data['file_size'] = file_obj.size
            validated_data['file_type'] = file_obj.content_type
        
        # Set uploaded_by to current user if not provided
        if 'uploaded_by' not in validated_data:
            validated_data['uploaded_by'] = self.context['request'].user
        
        # Check for existing documents with same content_type and object_id
        content_type = validated_data.get('content_type')
        object_id = validated_data.get('object_id')
        
        if content_type and object_id:
            existing_docs = Document.objects.filter(
                content_type=content_type,
                object_id=object_id,
                title=validated_data.get('title')
            ).order_by('-version')
            
            if existing_docs.exists():
                # Set version to latest + 1
                validated_data['version'] = existing_docs.first().version + 1
        
        return super().create(validated_data)
```

## 4. Views

### 4.1 DocumentType ViewSet

```python
# documents/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse
from .models import DocumentType, Document, DocumentPreview
from .serializers import DocumentTypeSerializer, DocumentSerializer, DocumentPreviewSerializer
from .permissions import IsDocumentOwnerOrAdmin
from .utils import generate_preview

class DocumentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentType.objects.filter(is_active=True)
    serializer_class = DocumentTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
```

### 4.2 Document ViewSet

```python
class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocumentOwnerOrAdmin]
    
    def get_queryset(self):
        queryset = Document.objects.all()
        
        # Filter by content_type and object_id
        content_type_id = self.request.query_params.get('content_type_id', None)
        object_id = self.request.query_params.get('object_id', None)
        
        if content_type_id and object_id:
            try:
                content_type = ContentType.objects.get(id=content_type_id)
                queryset = queryset.filter(
                    content_type=content_type,
                    object_id=object_id
                )
            except ContentType.DoesNotExist:
                queryset = Document.objects.none()
        
        # Filter by document_type
        document_type_id = self.request.query_params.get('document_type_id', None)
        if document_type_id:
            queryset = queryset.filter(document_type_id=document_type_id)
        
        # Filter by uploaded_by
        uploaded_by_id = self.request.query_params.get('uploaded_by_id', None)
        if uploaded_by_id:
            queryset = queryset.filter(uploaded_by_id=uploaded_by_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
        
        # Generate preview after saving
        document = serializer.instance
        generate_preview(document)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        document = self.get_object()
        return FileResponse(
            document.file,
            as_attachment=True,
            filename=document.file_name
        )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        document = self.get_object()
        
        try:
            preview = document.preview
            serializer = DocumentPreviewSerializer(
                preview,
                context={'request': request}
            )
            return Response(serializer.data)
        except DocumentPreview.DoesNotExist:
            # Try to generate preview if it doesn't exist
            preview = generate_preview(document)
            
            if preview:
                serializer = DocumentPreviewSerializer(
                    preview,
                    context={'request': request}
                )
                return Response(serializer.data)
            
            return Response(
                {'error': 'Preview not available for this document'},
                status=status.HTTP_404_NOT_FOUND
            )
```

## 5. Permissions

```python
# documents/permissions.py
from rest_framework import permissions

class IsDocumentOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of a document or admins to modify it.
    """
    def has_object_permission(self, request, view, obj):
        # Allow GET, HEAD, OPTIONS requests
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Allow if user is admin or staff
        if request.user.is_staff or request.user.has_role('admin'):
            return True
        
        # Allow if user is the document owner
        return obj.uploaded_by == request.user
```

## 6. Utilities

```python
# documents/utils.py
import os
import subprocess
from django.conf import settings
from .models import DocumentPreview

def generate_preview(document):
    """
    Generate a preview for the document based on its type.
    Returns the created DocumentPreview object or None if preview generation failed.
    """
    file_extension = document.file_extension.lower()
    
    # Handle different file types
    if file_extension in ['pdf']:
        # PDF documents can be previewed directly
        preview_type = 'pdf'
        preview_file = document.file
        
    elif file_extension in ['jpg', 'jpeg', 'png', 'gif']:
        # Image files can be previewed directly
        preview_type = 'image'
        preview_file = document.file
        
    elif file_extension in ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']:
        # Office documents need conversion
        # This is a placeholder for actual conversion logic
        # In a real implementation, you might use a service like LibreOffice or a cloud API
        preview_type = 'pdf'
        preview_file = None
        
        # Example conversion using LibreOffice (would need to be installed)
        try:
            input_path = document.file.path
            output_dir = os.path.join(settings.MEDIA_ROOT, 'document_previews', str(document.id))
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, f"{document.id}.pdf")
            
            # Convert to PDF using LibreOffice
            subprocess.run([
                'libreoffice', '--headless', '--convert-to', 'pdf',
                '--outdir', output_dir, input_path
            ], check=True)
            
            # Set the preview file path relative to MEDIA_ROOT
            relative_path = os.path.relpath(output_path, settings.MEDIA_ROOT)
            preview_file = relative_path
            
        except Exception as e:
            print(f"Error converting document: {e}")
            return None
    
    else:
        # Unsupported file type
        return None
    
    # Create or update the preview
    if preview_file:
        preview, created = DocumentPreview.objects.update_or_create(
            document=document,
            defaults={
                'preview_type': preview_type,
                'preview_file': preview_file
            }
        )
        return preview
    
    return None
```

## 7. URL Configuration

```python
# documents/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentTypeViewSet, DocumentViewSet

router = DefaultRouter()
router.register(r'document-types', DocumentTypeViewSet)
router.register(r'', DocumentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

## 8. Frontend Integration

### 8.1 Document Service

```jsx
// frontend/src/services/documentService.js
import { get, post, del } from './api';

const documentService = {
  getDocuments: async (contentTypeId, objectId) => {
    const response = await get('/api/documents/', {
      params: { content_type_id: contentTypeId, object_id: objectId }
    });
    return response.data;
  },
  
  getDocumentTypes: async () => {
    const response = await get('/api/documents/document-types/');
    return response.data;
  },
  
  uploadDocument: async (formData, onProgressCallback = null) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    if (onProgressCallback) {
      config.onUploadProgress = onProgressCallback;
    }
    
    const response = await post('/api/documents/', formData, config);
    return response.data;
  },
  
  downloadDocument: async (documentId) => {
    const response = await get(`/api/documents/${documentId}/download/`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  getDocumentPreview: async (documentId) => {
    const response = await get(`/api/documents/${documentId}/preview/`);
    return response.data;
  },
  
  deleteDocument: async (documentId) => {
    const response = await del(`/api/documents/${documentId}/`);
    return response.data;
  }
};

export default documentService;
```

### 8.2 Document Upload Component

```jsx
// frontend/src/components/DocumentUpload/index.jsx
import React, { useState, useEffect } from 'react';
import documentService from '../../services/documentService';

const DocumentUpload = ({
  contentTypeId,
  objectId,
  onUploadComplete
}) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    async function fetchDocumentTypes() {
      try {
        const types = await documentService.getDocumentTypes();
        setDocumentTypes(types);
        if (types.length > 0) {
          setDocumentType(types[0].id);
        }
      } catch (err) {
        console.error('Error fetching document types:', err);
        setError('Failed to load document types');
      }
    }
    
    fetchDocumentTypes();
  }, []);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Set default title from filename if not already set
    if (!title && selectedFile) {
      setTitle(selectedFile.name);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !documentType) {
      setError('Please select a file and document type');
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('document_type', documentType);
    formData.append('content_type', contentTypeId);
    formData.append('object_id', objectId);
    
    try {
      const uploadedDocument = await documentService.uploadDocument(
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      );
      
      console.log('Document uploaded:', uploadedDocument);
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setProgress(0);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(uploadedDocument);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="document-upload">
      <h3>Upload Document</h3>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file">File</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="documentType">Document Type</label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Select document type</option>
            {documentTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        
        {loading && (
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            />
            <span>{progress}%</span>
          </div>
        )}
        
        <button 
          type="submit" 
          className="upload-button"
          disabled={loading || !file}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload;
```

### 8.3 Document List Component

```jsx
// frontend/src/components/DocumentList/index.jsx
import React, { useState, useEffect } from 'react';
import documentService from '../../services/documentService';

const DocumentList = ({
  contentTypeId,
  objectId,
  onDocumentSelected
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDocuments = async () => {
    if (!contentTypeId || !objectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const docs = await documentService.getDocuments(contentTypeId, objectId);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, [contentTypeId, objectId]);
  
  const handleDownload = async (documentId) => {
    try {
      await documentService.downloadDocument(documentId);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document');
    }
  };
  
  const handlePreview = async (documentId) => {
    try {
      const preview = await documentService.getDocumentPreview(documentId);
      
      if (onDocumentSelected) {
        onDocumentSelected(preview);
      }
    } catch (err) {
      console.error('Error getting document preview:', err);
      alert('Failed to preview document');
    }
  };
  
  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await documentService.deleteDocument(documentId);
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document');
    }
  };
  
  if (loading) {
    return <div>Loading documents...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (documents.length === 0) {
    return <div>No documents found</div>;
  }
  
  return (
    <div className="document-list">
      <h3>Documents</h3>
      
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Size</th>
            <th>Uploaded By</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id}>
              <td>{doc.title}</td>
              <td>{doc.document_type_name}</td>
              <td>{doc.file_size_formatted}</td>
              <td>{doc.uploaded_by_name}</td>
              <td>{new Date(doc.created_at).toLocaleDateString()}</td>
              <td>
                <button 
                  onClick={() => handlePreview(doc.id)}
                  className="preview-button"
                >
                  Preview
                </button>
                <button 
                  onClick={() => handleDownload(doc.id)}
                  className="download-button"
                >
                  Download
                </button>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList;
```

### 8.4 Document Preview Component

```jsx
// frontend/src/components/DocumentPreview/index.jsx
import React from 'react';

const DocumentPreview = ({ preview }) => {
  if (!preview) {
    return <div>No preview available</div>;
  }
  
  const renderPreview = () => {
    switch (preview.preview_type) {
      case 'pdf':
        return (
          <iframe
            src={preview.preview_url}
            title="PDF Preview"
            width="100%"
            height="600px"
            style={{ border: 'none' }}
          />
        );
      
      case 'image':
        return (
          <img
            src={preview.preview_url}
            alt="Document Preview"
            style={{ maxWidth: '100%' }}
          />
        );
      
      default:
        return <div>Preview not available for this document type</div>;
    }
  };
  
  return (
    <div className="document-preview">
      <h3>Document Preview</h3>
      {renderPreview()}
    </div>
  );
};

export default DocumentPreview;
```

### 8.5 Documents Section in Credit Request Form

```jsx
// frontend/src/components/CreditRequestForm/DocumentsSection.jsx
import React, { useState, useEffect } from 'react';
import DocumentUpload from '../DocumentUpload';
import DocumentList from '../DocumentList';
import DocumentPreview from '../DocumentPreview';

const DocumentsSection = ({
  creditApplicationId,
  contentTypeId,
  colors
}) => {
  const [selectedPreview, setSelectedPreview] = useState(null);
  
  const handleUploadComplete = () => {
    // Refresh document list
    setSelectedPreview(null);
  };
  
  const handleDocumentSelected = (preview) => {
    setSelectedPreview(preview);
  };
  
  return (
    <div className="documents-section">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <DocumentUpload
            contentTypeId={contentTypeId}
            objectId={creditApplicationId}
            onUploadComplete={handleUploadComplete}
          />
          
          <DocumentList
            contentTypeId={contentTypeId}
            objectId={creditApplicationId}
            onDocumentSelected={handleDocumentSelected}
          />
        </div>
        
        <div>
          <DocumentPreview preview={selectedPreview} />
        </div>
      </div>
    </div>
  );
};

export default DocumentsSection;
```

## 9. Implementation Notes

1. The Documents app provides a flexible system for document management
2. All API endpoints use the `/api/` prefix for consistency
3. Document previews are generated automatically for supported file types
4. The system supports document versioning to track changes
5. The frontend components provide a complete document management interface
6. Document uploads show progress indicators for better user experience
7. The system integrates with the Credit Request Form for document management
