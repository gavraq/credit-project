from django.db import models

class DocumentType(models.Model):
    """
    Represents a type/category of document (e.g., ID, Proof of Address).
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


from django.conf import settings
from django.core.exceptions import ValidationError
import os


def document_file_validator(file):
    # Allowed extensions and max size (10MB)
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    max_size = 10 * 1024 * 1024  # 10 MB
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(f'Unsupported file extension: {ext}.')
    if file.size > max_size:
        raise ValidationError(f'File size exceeds 10MB.')


class Document(models.Model):
    """
    Stores uploaded documents, linked to a user and document type.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    file = models.FileField(upload_to='documents/', validators=[document_file_validator])
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=32, default='pending')
    original_filename = models.CharField(max_length=255)
    size = models.PositiveIntegerField()
    extension = models.CharField(max_length=16)

    def save(self, *args, **kwargs):
        if not self.original_filename:
            self.original_filename = self.file.name
        if not self.size:
            self.size = self.file.size
        if not self.extension:
            self.extension = os.path.splitext(self.file.name)[1].lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.document_type} - {self.original_filename}"

"""
API Endpoints to Implement (scaffold):
- POST   /documents/upload/      # Upload a document
- GET    /documents/             # List user's documents
- GET    /documents/<id>/        # Retrieve document metadata
- GET    /documents/<id>/download/ # Download the file (with permissions)

Test Strategy (outline):
- Model tests for size/extension validation
- API tests for upload, retrieval, and download
- Edge cases: oversized files, unsupported extensions, unauthorized access
"""
