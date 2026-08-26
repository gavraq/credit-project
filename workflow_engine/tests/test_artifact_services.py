from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from workflow_engine.services.artifacts import (
    provision_artifacts_for_workflow_instance,
    sync_artifacts_for_workflow_instance,
)


class WorkflowArtifactServiceTests(SimpleTestCase):
    @patch("workflow_engine.services.artifacts.get_artifact_adapter")
    def test_provision_artifacts_for_workflow_instance_uses_registered_adapter(self, mock_get_adapter):
        content_object = SimpleNamespace(id="credit-app-1")
        adapter = SimpleNamespace(provision_artifacts=MagicMock(return_value={"credit_request_form": object()}))
        mock_get_adapter.return_value = adapter
        workflow_instance = SimpleNamespace(
            content_type=SimpleNamespace(model="creditapplication"),
            content_object=content_object,
        )

        result = provision_artifacts_for_workflow_instance(
            workflow_instance,
            state_code="CREDIT_PAPER_CREDIT_REQUEST",
        )

        self.assertEqual(result, adapter.provision_artifacts.return_value)
        adapter.provision_artifacts.assert_called_once_with(
            content_object,
            state_code="CREDIT_PAPER_CREDIT_REQUEST",
        )

    @patch("workflow_engine.services.artifacts.get_artifact_adapter")
    def test_sync_artifacts_for_workflow_instance_uses_registered_adapter(self, mock_get_adapter):
        content_object = SimpleNamespace(id="credit-app-1")
        adapter = SimpleNamespace(sync_artifacts=MagicMock(return_value={"credit_request_form": object()}))
        mock_get_adapter.return_value = adapter
        workflow_instance = SimpleNamespace(
            content_type=SimpleNamespace(model="creditapplication"),
            content_object=content_object,
        )

        result = sync_artifacts_for_workflow_instance(
            workflow_instance,
            artifact_keys=["credit_request_form"],
        )

        self.assertEqual(result, adapter.sync_artifacts.return_value)
        adapter.sync_artifacts.assert_called_once_with(
            content_object,
            artifact_keys=["credit_request_form"],
        )

    @patch("workflow_engine.services.artifacts.get_artifact_adapter", return_value=None)
    def test_provision_artifacts_for_workflow_instance_returns_empty_without_adapter(self, mock_get_adapter):
        workflow_instance = SimpleNamespace(
            content_type=SimpleNamespace(model="unknownmodel"),
            content_object=SimpleNamespace(id="object-1"),
        )

        self.assertEqual(provision_artifacts_for_workflow_instance(workflow_instance), {})

    @patch("workflow_engine.services.artifacts.get_artifact_adapter", return_value=None)
    def test_sync_artifacts_for_workflow_instance_returns_empty_without_adapter(self, mock_get_adapter):
        workflow_instance = SimpleNamespace(
            content_type=SimpleNamespace(model="unknownmodel"),
            content_object=SimpleNamespace(id="object-1"),
        )

        self.assertEqual(sync_artifacts_for_workflow_instance(workflow_instance), {})
