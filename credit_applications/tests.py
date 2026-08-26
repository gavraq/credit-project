from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

from backend.users.models import Role
from credit_applications.models import Counterparty, CreditApplication, CreditRequestForm
from credit_applications.serializers import CreditApplicationSerializer
from workflow_engine.models import State, Workflow, WorkflowInstance


class CreditApplicationSerializerContractTest(TestCase):
    def test_exposes_engine_aligned_artifacts_field(self):
        serializer = CreditApplicationSerializer()

        self.assertIn('artifacts', serializer.fields)
        self.assertNotIn('workflow_artifacts', serializer.fields)
        self.assertNotIn('sub_processes', serializer.fields)
        self.assertNotIn('credit_request_form', serializer.fields)
        self.assertNotIn('credit_review_form', serializer.fields)
        self.assertNotIn('business_sponsorship_form', serializer.fields)
        self.assertNotIn('legal_review_form', serializer.fields)
        self.assertNotIn('credit_questionnaire_form', serializer.fields)
        self.assertNotIn('credit_analysis_form', serializer.fields)
        self.assertNotIn('credit_compilation_form', serializer.fields)
        self.assertNotIn('credit_approval_form', serializer.fields)

    @patch(
        'credit_applications.serializers._get_credit_workflow_artifacts',
        return_value=[
            {
                'id': 'artifact-1',
                'key': 'credit_request_form',
                'kind': 'form',
                'capabilities': ['detail_endpoint', 'writable', 'workflow_reference'],
                'actions': [],
                'title': 'Credit Request Form',
                'editable': True,
                'object_id': 'form-1',
                'workflow_code': 'CREDIT_REQUEST',
                'resource': {
                    'type': 'domain_artifact_endpoint',
                    'path': '/api/credit/credit-applications/test-id/artifacts/credit_request_form/',
                    'methods': ['GET', 'PATCH'],
                },
            }
        ],
    )
    def test_serialized_payload_uses_artifacts_only(self, _mock_artifacts):
        role = Role.objects.create(name='relationship_manager')
        user = get_user_model().objects.create_user(
            username='serializer_contract_user',
            password='pass',
            role=role,
        )
        counterparty = Counterparty.objects.create(
            name='Serializer Counterparty',
            cif_number='CIF-SERIALIZER-001',
        )
        workflow = Workflow.objects.create(code='CREDIT_PAPER', name='Credit Paper')
        state = State.objects.create(
            workflow=workflow,
            code='CREDIT_PAPER_CREDIT_REQUEST',
            name='Credit Request',
            is_initial=True,
        )
        application = CreditApplication.objects.create(
            title='Serializer Contract',
            counterparty=counterparty,
            created_by=user,
        )
        content_type = ContentType.objects.get_for_model(CreditApplication)
        workflow_instance = WorkflowInstance.objects.create(
            workflow=workflow,
            current_state=state,
            content_type=content_type,
            object_id=application.id,
        )
        application.workflow_instance = workflow_instance
        application.save(update_fields=['workflow_instance'])
        CreditRequestForm.objects.create(
            credit_application=application,
            workflow_instance=workflow_instance,
        )

        data = CreditApplicationSerializer(application).data

        self.assertIn('artifacts', data)
        self.assertNotIn('sub_processes', data)
        self.assertEqual(len(data['artifacts']), 1)
        artifact = data['artifacts'][0]
        self.assertEqual(artifact['key'], 'credit_request_form')
        self.assertEqual(artifact['kind'], 'form')
        self.assertEqual(
            artifact['capabilities'],
            ['detail_endpoint', 'writable', 'workflow_reference'],
        )
        self.assertEqual(artifact['actions'], [])
        self.assertEqual(artifact['resource']['path'], '/api/credit/credit-applications/test-id/artifacts/credit_request_form/')
        self.assertEqual(artifact['resource']['methods'], ['GET', 'PATCH'])
        self.assertNotIn('form_name', artifact)
        self.assertNotIn('data', artifact)


class CreditApplicationArtifactEndpointTest(APITestCase):
    def setUp(self):
        role = Role.objects.create(name='relationship_manager')
        self.user = get_user_model().objects.create_user(
            username='artifact_domain_user',
            password='pass',
            role=role,
        )
        refresh = RefreshToken.for_user(self.user)
        self.auth_header = {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}

        counterparty = Counterparty.objects.create(
            name='Test Counterparty',
            cif_number='CIF-ARTIFACT-001',
        )
        workflow = Workflow.objects.create(code='CREDIT_PAPER', name='Credit Paper')
        state = State.objects.create(
            workflow=workflow,
            code='CREDIT_PAPER_CREDIT_REQUEST',
            name='Credit Request',
            is_initial=True,
        )
        self.application = CreditApplication.objects.create(
            title='Artifact API Test',
            counterparty=counterparty,
            created_by=self.user,
        )
        content_type = ContentType.objects.get_for_model(CreditApplication)
        workflow_instance = WorkflowInstance.objects.create(
            workflow=workflow,
            current_state=state,
            content_type=content_type,
            object_id=self.application.id,
        )
        self.application.workflow_instance = workflow_instance
        self.application.save(update_fields=['workflow_instance'])

        self.credit_request_form = CreditRequestForm.objects.create(
            credit_application=self.application,
            workflow_instance=workflow_instance,
        )

    def test_gets_artifact_detail_via_generic_endpoint(self):
        url = reverse(
            'creditapplication-artifact-detail',
            args=[self.application.id, 'credit_request_form'],
        )
        response = self.client.get(url, **self.auth_header)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data['id']), str(self.credit_request_form.id))

    def test_returns_not_found_for_unknown_artifact(self):
        url = reverse(
            'creditapplication-artifact-detail',
            args=[self.application.id, 'unknown_form'],
        )
        response = self.client.get(url, **self.auth_header)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_legacy_legal_review_route_is_removed(self):
        response = self.client.get(
            f'/api/credit/credit-applications/{self.application.id}/legal-review-form/',
            **self.auth_header,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch(
        'credit_applications.serializers._get_credit_workflow_artifacts',
        return_value=[
            {
                'id': 'artifact-1',
                'key': 'credit_request_form',
                'kind': 'form',
                'capabilities': ['detail_endpoint', 'writable', 'workflow_reference'],
                'actions': [],
                'title': 'Credit Request Form',
                'editable': True,
                'object_id': 'form-1',
                'workflow_code': 'CREDIT_REQUEST',
                'resource': {
                    'type': 'domain_artifact_endpoint',
                    'path': '/api/credit/credit-applications/test-id/artifacts/credit_request_form/',
                    'methods': ['GET', 'PATCH'],
                },
            }
        ],
    )
    def test_application_payload_exposes_artifacts_only(self, _mock_artifacts):
        url = reverse('creditapplication-detail', args=[self.application.id])
        response = self.client.get(url, **self.auth_header)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('artifacts', response.data)
        self.assertNotIn('sub_processes', response.data)
        self.assertEqual(len(response.data['artifacts']), 1)
        artifact = response.data['artifacts'][0]
        self.assertEqual(artifact['key'], 'credit_request_form')
        self.assertEqual(
            artifact['capabilities'],
            ['detail_endpoint', 'writable', 'workflow_reference'],
        )
        self.assertEqual(artifact['actions'], [])
        self.assertEqual(artifact['resource']['path'], '/api/credit/credit-applications/test-id/artifacts/credit_request_form/')
