from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from backend.users.models import Role
from workflow_engine.models import State, Workflow, WorkflowArtifact, WorkflowInstance


class WorkflowArtifactAPITest(APITestCase):
    def setUp(self):
        role = Role.objects.create(name='credit_analyst')
        self.user = get_user_model().objects.create_user(
            username='artifact_api_user',
            password='pass',
            role=role,
        )
        refresh = RefreshToken.for_user(self.user)
        self.auth_header = {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}

        workflow = Workflow.objects.create(code='TEST_WORKFLOW', name='Test Workflow')
        state = State.objects.create(
            workflow=workflow,
            code='TEST_DRAFT',
            name='Draft',
            is_initial=True,
        )
        content_type = ContentType.objects.get_for_model(get_user_model())
        self.instance = WorkflowInstance.objects.create(
            workflow=workflow,
            current_state=state,
            content_type=content_type,
            object_id=self.user.id,
        )
        WorkflowArtifact.objects.create(
            workflow_instance=self.instance,
            artifact_key='credit_request_form',
            artifact_kind='form',
            title='Credit Request Form',
            content_type=content_type,
            object_id=self.user.id,
            metadata={'source': 'test'},
        )

    def test_lists_workflow_artifacts_for_instance(self):
        url = reverse('workflow_instance_artifacts', args=[self.instance.id])
        response = self.client.get(url, **self.auth_header)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['artifact_key'], 'credit_request_form')
        self.assertEqual(response.data[0]['artifact_kind'], 'form')
        self.assertEqual(
            response.data[0]['capabilities'],
            ['detail_endpoint', 'writable', 'workflow_reference'],
        )
        self.assertEqual(response.data[0]['metadata']['source'], 'test')

    def test_requires_authentication(self):
        url = reverse('workflow_instance_artifacts', args=[self.instance.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_workflow_instance_detail_includes_artifacts(self):
        url = reverse('workflow_instance_detail', args=[self.instance.id])
        response = self.client.get(url, **self.auth_header)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('artifacts', response.data)
        self.assertEqual(len(response.data['artifacts']), 1)
        artifact = response.data['artifacts'][0]
        self.assertEqual(artifact['artifact_key'], 'credit_request_form')
        self.assertEqual(artifact['artifact_kind'], 'form')
        self.assertEqual(
            artifact['capabilities'],
            ['detail_endpoint', 'writable', 'workflow_reference'],
        )
