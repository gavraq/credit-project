from rest_framework import serializers
from .models import DocumentType, Document

class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ['id', 'name', 'description']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'user', 'document_type', 'file', 'uploaded_at', 'status', 'original_filename', 'size', 'extension']
        read_only_fields = ['user', 'uploaded_at', 'original_filename', 'size', 'extension', 'status']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        file = validated_data.get('file')
        if file:
            validated_data['original_filename'] = file.name
            validated_data['size'] = file.size
            validated_data['extension'] = file.name.split('.')[-1].lower()
        return super().create(validated_data)
