from unittest.mock import patch

from django.test import SimpleTestCase

from credit_workflow.definitions import get_credit_artifact_model_map


class CreditWorkflowDefinitionsTests(SimpleTestCase):
    @patch("credit_workflow.definitions.get_credit_artifact_definitions")
    @patch("credit_workflow.definitions.get_parent_workflow")
    def test_get_credit_artifact_model_map_uses_shared_workflow_context(
        self,
        mock_get_parent_workflow,
        mock_get_credit_artifact_definitions,
    ):
        mock_get_parent_workflow.return_value = type(
            "WorkflowStub",
            (),
            {"metadata": {"form_metadata": {"credit_request_form": {"form_key": "credit_request_form"}}}},
        )()
        mock_get_credit_artifact_definitions.return_value = {
            "credit_request_form": {"form_key": "credit_request_form"}
        }

        model_map = get_credit_artifact_model_map()

        self.assertIn("credit_request_form", model_map)
