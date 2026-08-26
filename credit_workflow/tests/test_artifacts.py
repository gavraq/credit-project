from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import MagicMock, patch

from credit_workflow.artifacts import get_workflow_artifact_descriptors, sync_workflow_artifact_records


class CreditWorkflowArtifactTests(TestCase):
    @patch("credit_workflow.artifacts.can_user_edit_form")
    @patch("credit_workflow.artifacts.sync_workflow_artifact_records")
    @patch("credit_workflow.artifacts.get_artifact_metadata")
    @patch("credit_workflow.artifacts.get_relevant_artifacts_for_state")
    def test_returns_artifact_descriptors_for_current_state(
        self,
        mock_get_relevant,
        mock_get_metadata,
        mock_sync_artifacts,
        mock_can_edit,
    ):
        mock_get_relevant.return_value = ["credit_request_form"]
        mock_get_metadata.return_value = {
            "title": "Credit Request Form",
            "form_key": "credit_request_form",
        }
        mock_sync_artifacts.return_value = {
            "credit_request_form": SimpleNamespace(id="artifact-record-1")
        }
        mock_can_edit.return_value = True

        form_instance = SimpleNamespace(id="form-1", name="credit-request")
        credit_application = SimpleNamespace(
            id="credit-app-1",
            workflow_instance=SimpleNamespace(current_state=SimpleNamespace(code="CREDIT_PAPER_CREDIT_REQUEST")),
            credit_request_form=form_instance,
        )
        request = SimpleNamespace(user=SimpleNamespace(username="rm_test"))

        artifacts = get_workflow_artifact_descriptors(credit_application, request=request)

        self.assertEqual(len(artifacts), 1)
        artifact = artifacts[0]
        self.assertEqual(artifact["id"], "artifact-record-1")
        self.assertEqual(artifact["key"], "credit_request_form")
        self.assertEqual(artifact["kind"], "form")
        self.assertEqual(
            artifact["capabilities"],
            ["detail_endpoint", "writable", "workflow_reference"],
        )
        self.assertEqual(artifact["actions"], [])
        self.assertEqual(artifact["title"], "Credit Request Form")
        self.assertEqual(artifact["object_id"], "form-1")
        self.assertTrue(artifact["editable"])
        self.assertIsNone(artifact["workflow_code"])
        self.assertEqual(
            artifact["resource"]["path"],
            "/api/credit/credit-applications/credit-app-1/artifacts/credit_request_form/",
        )
        self.assertEqual(artifact["resource"]["methods"], ["GET", "PATCH"])
        self.assertNotIn("form_name", artifact)
        self.assertNotIn("data", artifact)

    @patch("credit_workflow.artifacts.can_user_edit_form")
    @patch("credit_workflow.artifacts.sync_workflow_artifact_records")
    @patch("credit_workflow.artifacts.get_artifact_metadata")
    @patch("credit_workflow.artifacts.get_relevant_artifacts_for_state")
    def test_returns_placeholder_artifact_when_instance_missing(
        self,
        mock_get_relevant,
        mock_get_metadata,
        mock_sync_artifacts,
        mock_can_edit,
    ):
        mock_get_relevant.return_value = ["credit_review_form"]
        mock_get_metadata.return_value = {
            "title": "Credit Review Form",
            "form_key": "credit_review_form",
        }
        mock_sync_artifacts.return_value = {
            "credit_review_form": SimpleNamespace(id="artifact-record-2")
        }
        mock_can_edit.return_value = False

        credit_application = MagicMock()
        credit_application.id = "credit-app-2"
        credit_application.workflow_instance = SimpleNamespace(
            current_state=SimpleNamespace(code="CREDIT_PAPER_CREDIT_REVIEW_PENDING")
        )
        setattr(credit_application, "credit_review_form", None)
        request = SimpleNamespace(user=SimpleNamespace(username="ca_test"))

        artifacts = get_workflow_artifact_descriptors(credit_application, request=request)

        self.assertEqual(len(artifacts), 1)
        artifact = artifacts[0]
        self.assertEqual(artifact["id"], "artifact-record-2")
        self.assertEqual(artifact["key"], "credit_review_form")
        self.assertEqual(
            artifact["capabilities"],
            ["detail_endpoint", "writable", "workflow_reference"],
        )
        self.assertEqual(artifact["actions"], [])
        self.assertEqual(artifact["title"], "Credit Review Form")
        self.assertIsNone(artifact["object_id"])
        self.assertFalse(artifact["editable"])
        self.assertEqual(
            artifact["resource"]["path"],
            "/api/credit/credit-applications/credit-app-2/artifacts/credit_review_form/",
        )

    @patch("credit_workflow.artifacts.WorkflowArtifact.objects.update_or_create")
    @patch("credit_workflow.artifacts.ContentType.objects.get_for_model")
    @patch("credit_workflow.artifacts.get_artifact_metadata")
    def test_sync_workflow_artifact_records_persists_generic_artifact_reference(
        self,
        mock_get_metadata,
        mock_get_for_model,
        mock_update_or_create,
    ):
        form_instance = SimpleNamespace(id="form-1")
        credit_application = SimpleNamespace(
            workflow_instance=SimpleNamespace(id="wf-1", current_state=SimpleNamespace(code="CREDIT_PAPER_CREDIT_REQUEST")),
            credit_request_form=form_instance,
        )
        mock_get_metadata.return_value = {
            "title": "Credit Request Form",
            "form_key": "credit_request_form",
            "workflow_code": "CREDIT_REQUEST",
        }
        mock_get_for_model.return_value = "ct-form"
        mock_update_or_create.return_value = (SimpleNamespace(id="artifact-db-1"), True)

        result = sync_workflow_artifact_records(credit_application, ["credit_request_form"])

        self.assertIn("credit_request_form", result)
        mock_update_or_create.assert_called_once()
        _, kwargs = mock_update_or_create.call_args
        self.assertEqual(kwargs["workflow_instance"], credit_application.workflow_instance)
        self.assertEqual(kwargs["artifact_key"], "credit_request_form")
        self.assertEqual(kwargs["defaults"]["artifact_kind"], "form")
        self.assertEqual(kwargs["defaults"]["title"], "Credit Request Form")
        self.assertEqual(kwargs["defaults"]["content_type"], "ct-form")
        self.assertEqual(kwargs["defaults"]["object_id"], "form-1")
        self.assertEqual(kwargs["defaults"]["metadata"]["workflow_code"], "CREDIT_REQUEST")

    @patch("credit_workflow.artifacts.can_user_edit_form")
    @patch("credit_workflow.artifacts.sync_workflow_artifact_records")
    @patch("credit_workflow.artifacts.get_artifact_metadata")
    @patch("credit_workflow.artifacts.get_relevant_artifacts_for_state")
    def test_climate_scorecard_extends_form_capabilities(
        self,
        mock_get_relevant,
        mock_get_metadata,
        mock_sync_artifacts,
        mock_can_edit,
    ):
        mock_get_relevant.return_value = ["climate_scorecard"]
        mock_get_metadata.return_value = {
            "title": "Climate Scorecard",
            "form_key": "climate_scorecard",
        }
        mock_sync_artifacts.return_value = {
            "climate_scorecard": SimpleNamespace(id="artifact-record-3")
        }
        mock_can_edit.return_value = True

        credit_application = SimpleNamespace(
            id="credit-app-3",
            workflow_instance=SimpleNamespace(current_state=SimpleNamespace(code="CREDIT_PAPER_ANALYSIS_PENDING")),
            climate_scorecard=SimpleNamespace(id="scorecard-1"),
        )
        request = SimpleNamespace(user=SimpleNamespace(username="ca_test"))

        with patch(
            "credit_workflow.artifacts.get_artifact_capabilities",
            return_value=["detail_endpoint", "writable", "workflow_reference", "remote_generate"],
        ), patch(
            "credit_workflow.artifacts.get_artifact_actions",
            return_value=[
                {
                    "key": "remote_generate",
                    "type": "http_request",
                    "path": "/api/credit/credit-applications/credit-app-3/climate-scorecard/generate/",
                    "method": "POST",
                }
            ],
        ):
            artifacts = get_workflow_artifact_descriptors(credit_application, request=request)

        self.assertEqual(
            artifacts[0]["capabilities"],
            ["detail_endpoint", "writable", "workflow_reference", "remote_generate"],
        )
        self.assertEqual(
            artifacts[0]["actions"],
            [
                {
                    "key": "remote_generate",
                    "type": "http_request",
                    "path": "/api/credit/credit-applications/credit-app-3/climate-scorecard/generate/",
                    "method": "POST",
                }
            ],
        )
