from django.contrib import admin

from .models import DocumentType, Document

@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name',)

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'document_type', 'original_filename', 'uploaded_at', 'status', 'size', 'extension')
    list_filter = ('document_type', 'status', 'uploaded_at')
    search_fields = ('original_filename', 'user__username')
