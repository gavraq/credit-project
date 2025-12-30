# Feature Request: Document Management Enhancement

## Overview

The current document management implementation is a basic file picker without backend integration. This feature request covers enhancing it to a full document management system that links documents to credit applications, supports versioning, and provides preview capabilities.

## Current State

### Backend Implementation
| Component | Status | Description |
|-----------|--------|-------------|
| DocumentType model | Basic | name, description fields only |
| Document model | Basic | User-linked only, no application linking |
| GenericForeignKey | Missing | Cannot link documents to credit applications |
| Versioning | Missing | No document version tracking |
| Preview generation | Missing | No preview capabilities |

### Frontend Implementation
| Component | Status | Description |
|-----------|--------|-------------|
| DocumentsSection | Basic | Client-side file picker only |
| Backend integration | Missing | No API calls to save/retrieve documents |
| Document list | Missing | No display of previously uploaded documents |
| Preview | Missing | No PDF/image preview functionality |
| Progress indicator | Missing | No upload progress tracking |

### Current Code

**Backend (`documents/models.py`):**
```python
class DocumentType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

class Document(models.Model):
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=32, default='pending')
    original_filename = models.CharField(max_length=255)
    size = models.PositiveIntegerField()
    extension = models.CharField(max_length=16)
```

**Frontend (`DocumentsSection.jsx`):**
- Simple file input with local state management
- No API integration
- Files only stored in React state, not persisted

---

## Proposed Changes

### Phase 1: Backend Model Enhancement

#### 1.1 Update DocumentType Model
Add configuration fields for validation:

```python
class DocumentType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)  # NEW
    description = models.TextField(blank=True)
    allowed_extensions = models.JSONField(default=list)  # NEW: ['.pdf', '.jpg', '.png']
    max_size_mb = models.PositiveIntegerField(default=10)  # NEW
    is_required = models.BooleanField(default=False)  # NEW: Required for application
    is_active = models.BooleanField(default=True)  # NEW
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### 1.2 Update Document Model
Add application linking and versioning:

```python
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Document(models.Model):
    # Generic foreign key to link to any model (CreditApplication, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()  # UUID to match CreditApplication.id
    content_object = GenericForeignKey('content_type', 'object_id')

    # Document metadata
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)

    # File storage
    file = models.FileField(upload_to='documents/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=100)

    # Versioning
    version = models.PositiveIntegerField(default=1)
    is_current = models.BooleanField(default=True)
    previous_version = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)

    # Audit
    uploaded_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]
```

### Phase 2: Backend API Enhancement

#### 2.1 Enhanced Serializers

```python
class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    document_type_name = serializers.CharField(source='document_type.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'document_type', 'document_type_name',
            'file', 'file_url', 'original_filename', 'file_size', 'file_size_formatted',
            'mime_type', 'version', 'is_current', 'uploaded_by', 'uploaded_by_name',
            'created_at', 'updated_at'
        ]
```

#### 2.2 Enhanced ViewSet

```python
class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = Document.objects.filter(is_current=True)

        # Filter by linked object
        content_type_id = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        if content_type_id and object_id:
            queryset = queryset.filter(
                content_type_id=content_type_id,
                object_id=object_id
            )

        return queryset

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download document file."""
        document = self.get_object()
        return FileResponse(document.file, as_attachment=True, filename=document.original_filename)

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Get all versions of a document."""
        document = self.get_object()
        versions = Document.objects.filter(
            content_type=document.content_type,
            object_id=document.object_id,
            document_type=document.document_type
        ).order_by('-version')
        serializer = self.get_serializer(versions, many=True)
        return Response(serializer.data)
```

#### 2.3 URL Configuration

```python
# documents/urls.py
router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-types', DocumentTypeViewSet, basename='document-type')

urlpatterns = [
    path('', include(router.urls)),
]
```

### Phase 3: Frontend Integration

#### 3.1 Document Service

Create `frontend/src/services/documentService.js`:

```javascript
import api from './api';

const documentService = {
  // Get documents for a credit application
  getDocuments: async (creditApplicationId) => {
    const response = await api.get('/api/documents/', {
      params: {
        content_type: 'credit_applications.creditapplication',
        object_id: creditApplicationId
      }
    });
    return response.data;
  },

  // Upload document
  uploadDocument: async (creditApplicationId, file, documentTypeId, title, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentTypeId);
    formData.append('title', title || file.name);
    formData.append('content_type', 'credit_applications.creditapplication');
    formData.append('object_id', creditApplicationId);

    const response = await api.post('/api/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return response.data;
  },

  // Download document
  downloadDocument: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}/download/`, {
      responseType: 'blob'
    });
    return response;
  },

  // Delete document
  deleteDocument: async (documentId) => {
    await api.delete(`/api/documents/${documentId}/`);
  },

  // Get document types
  getDocumentTypes: async () => {
    const response = await api.get('/api/document-types/');
    return response.data;
  }
};

export default documentService;
```

#### 3.2 Enhanced DocumentsSection Component

Update `frontend/src/components/CreditRequestForm/DocumentsSection.jsx`:

```javascript
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, LinearProgress, Alert, Select, MenuItem,
  FormControl, InputLabel, Typography
} from '@mui/material';
import { Upload, Download, Delete, Visibility } from '@mui/icons-material';
import documentService from '../../services/documentService';

const DocumentsSection = ({ creditApplicationId, readOnly = false }) => {
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    loadData();
  }, [creditApplicationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, types] = await Promise.all([
        documentService.getDocuments(creditApplicationId),
        documentService.getDocumentTypes()
      ]);
      setDocuments(docs);
      setDocumentTypes(types);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedType) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      await documentService.uploadDocument(
        creditApplicationId,
        file,
        selectedType,
        file.name,
        setUploadProgress
      );
      await loadData();
      setSelectedType('');
    } catch (err) {
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.original_filename;
      link.click();
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentService.deleteDocument(doc.id);
      await loadData();
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  // ... render JSX
};
```

### Phase 4: Document Preview (Optional Enhancement)

#### 4.1 Preview Component

For PDF and image preview without server-side conversion:

```javascript
const DocumentPreview = ({ document, open, onClose }) => {
  const isPDF = document?.mime_type === 'application/pdf';
  const isImage = document?.mime_type?.startsWith('image/');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{document?.title}</DialogTitle>
      <DialogContent>
        {isPDF && (
          <iframe
            src={document.file_url}
            width="100%"
            height="600px"
            title="PDF Preview"
          />
        )}
        {isImage && (
          <img src={document.file_url} alt={document.title} style={{ maxWidth: '100%' }} />
        )}
        {!isPDF && !isImage && (
          <Typography>Preview not available for this file type</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

---

## Acceptance Criteria

### Phase 1: Backend Model Enhancement
- [ ] DocumentType model updated with allowed_extensions, max_size_mb, is_required, is_active
- [ ] Document model updated with GenericForeignKey for application linking
- [ ] Document model includes versioning fields (version, is_current, previous_version)
- [ ] Migrations created and applied successfully
- [ ] Existing data migrated (if any)

### Phase 2: Backend API Enhancement
- [ ] DocumentSerializer includes all new fields
- [ ] DocumentViewSet supports filtering by content_type and object_id
- [ ] Download endpoint returns file with correct filename
- [ ] Versions endpoint returns document history
- [ ] File validation enforces DocumentType constraints
- [ ] Version auto-increment on re-upload of same document type

### Phase 3: Frontend Integration
- [ ] documentService.js created with all CRUD operations
- [ ] DocumentsSection fetches and displays documents from backend
- [ ] Upload shows progress indicator
- [ ] Document type selection required before upload
- [ ] Download button triggers file download
- [ ] Delete button with confirmation
- [ ] Error handling with user-friendly messages
- [ ] Loading states displayed appropriately

### Phase 4: Document Preview (Optional)
- [ ] Preview modal for PDF files
- [ ] Preview modal for image files
- [ ] Graceful handling of unsupported file types

### Phase 5: Documentation Update
- [ ] Update `documentation/implementation/backend/` with document management API
- [ ] Update `documentation/implementation/frontend/UI-Implementation-Guide.md` with DocumentsSection details
- [ ] Archive old `documentation/implementation/features/Credit-Risk-Documents-Implementation.md` to oldfiles
- [ ] Sync all documentation changes to Raspberry Pi

---

## API Endpoints (Final)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/` | GET | List documents (filterable by content_type, object_id) |
| `/api/documents/` | POST | Upload new document |
| `/api/documents/{id}/` | GET | Retrieve document metadata |
| `/api/documents/{id}/` | DELETE | Delete document |
| `/api/documents/{id}/download/` | GET | Download document file |
| `/api/documents/{id}/versions/` | GET | Get all versions of document |
| `/api/document-types/` | GET | List available document types |

---

## Testing Requirements

### Backend Tests
- [ ] Model validation tests (file size, extension)
- [ ] API tests for upload, retrieve, download, delete
- [ ] Permission tests (user can only access own application's documents)
- [ ] Version increment tests

### Frontend Tests
- [ ] Component renders document list correctly
- [ ] Upload flow works with progress
- [ ] Download triggers file save
- [ ] Delete removes document from list
- [ ] Error states displayed correctly

---

## Priority and Effort

| Phase | Priority | Effort | Dependencies |
|-------|----------|--------|--------------|
| Phase 1: Backend Models | High | Medium | None |
| Phase 2: Backend API | High | Medium | Phase 1 |
| Phase 3: Frontend Integration | High | Medium | Phase 2 |
| Phase 4: Preview | Low | Low | Phase 3 |
| Phase 5: Documentation | Medium | Low | Phase 3 |

---

## Related Documentation

- [UI Implementation Guide](../implementation/frontend/UI-Implementation-Guide.md) - Current frontend documentation
- [Frontend-Backend Integration Patterns](../implementation/backend/Frontend-Backend-Integration-Patterns.md) - API integration patterns
- [Credit-Risk-Documents-Implementation.md](../implementation/features/Credit-Risk-Documents-Implementation.md) - Original design spec (to be archived)
