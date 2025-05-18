from django.test import TestCase

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import DocumentType, Document
from django.contrib.auth import get_user_model

class DocumentTypeModelTest(TestCase):
    def test_create_document_type(self):
        dt = DocumentType.objects.create(name='ID Card', description='Government-issued ID')
        self.assertEqual(dt.name, 'ID Card')
        self.assertEqual(str(dt), 'ID Card')

class DocumentModelValidationTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create(username='testuser')
        self.doc_type = DocumentType.objects.create(name='Passport')

    def test_valid_file_upload(self):
        file = SimpleUploadedFile('test.pdf', b'filecontent', content_type='application/pdf')
        doc = Document(
            user=self.user,
            document_type=self.doc_type,
            file=file,
            original_filename='test.pdf',
            size=file.size,
            extension='.pdf',
        )
        doc.full_clean()  # Should not raise

    def test_invalid_extension(self):
        file = SimpleUploadedFile('test.exe', b'filecontent', content_type='application/octet-stream')
        doc = Document(
            user=self.user,
            document_type=self.doc_type,
            file=file,
            original_filename='test.exe',
            size=file.size,
            extension='.exe',
        )
        with self.assertRaises(Exception):
            doc.full_clean()

    def test_oversized_file(self):
        big_content = b'x' * (10 * 1024 * 1024 + 1)  # 10MB + 1 byte
        file = SimpleUploadedFile('big.pdf', big_content, content_type='application/pdf')
        doc = Document(
            user=self.user,
            document_type=self.doc_type,
            file=file,
            original_filename='big.pdf',
            size=file.size,
            extension='.pdf',
        )
        with self.assertRaises(Exception):
            doc.full_clean()

from rest_framework_simplejwt.tokens import RefreshToken

class DocumentAPITest(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='apiuser', password='pass')
        self.doc_type = DocumentType.objects.create(name='Bank Statement')
        # Obtain JWT token
        refresh = RefreshToken.for_user(self.user)
        self.jwt_token = str(refresh.access_token)
        self.auth_header = {'HTTP_AUTHORIZATION': f'Bearer {self.jwt_token}'}

    def test_upload_valid_document(self):
        url = reverse('document-list-create')
        file = SimpleUploadedFile('test.pdf', b'filecontent', content_type='application/pdf')
        data = {'document_type': self.doc_type.id, 'file': file}
        response = self.client.post(url, data, format='multipart', **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_upload_invalid_extension(self):
        url = reverse('document-list-create')
        file = SimpleUploadedFile('test.exe', b'filecontent', content_type='application/octet-stream')
        data = {'document_type': self.doc_type.id, 'file': file}
        response = self.client.post(url, data, format='multipart', **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_oversized_file(self):
        url = reverse('document-list-create')
        big_content = b'x' * (10 * 1024 * 1024 + 1)
        file = SimpleUploadedFile('big.pdf', big_content, content_type='application/pdf')
        data = {'document_type': self.doc_type.id, 'file': file}
        response = self.client.post(url, data, format='multipart', **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_documents(self):
        # Upload a document first
        file = SimpleUploadedFile('test.pdf', b'filecontent', content_type='application/pdf')
        doc = Document.objects.create(user=self.user, document_type=self.doc_type, file=file, original_filename='test.pdf', size=12, extension='.pdf')
        url = reverse('document-list-create')
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(d['id'] == doc.id for d in response.data))

    def test_download_document(self):
        file = SimpleUploadedFile('test.pdf', b'filecontent', content_type='application/pdf')
        doc = Document.objects.create(user=self.user, document_type=self.doc_type, file=file, original_filename='test.pdf', size=12, extension='.pdf')
        url = reverse('document-download', args=[doc.id])
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get('Content-Disposition'), f'attachment; filename="{doc.file.name.split('/')[-1]}"')

    def test_unauthorized_access(self):
        url = reverse('document-list-create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
