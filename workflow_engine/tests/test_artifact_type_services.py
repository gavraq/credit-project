from django.test import SimpleTestCase

from unittest.mock import patch

from workflow_engine.services.artifact_types import (
    get_artifact_actions,
    get_artifact_capabilities,
    get_artifact_type_config,
)


class WorkflowArtifactTypeServiceTests(SimpleTestCase):
    def test_get_artifact_type_config_returns_registered_form_type(self):
        config = get_artifact_type_config("form")

        self.assertEqual(config["kind"], "form")
        self.assertIn("detail_endpoint", config["capabilities"])
        self.assertIn("writable", config["capabilities"])

    def test_get_artifact_type_config_returns_normalized_fallback(self):
        config = get_artifact_type_config("unsupported")

        self.assertEqual(config, {"kind": "unsupported", "capabilities": []})

    @patch("workflow_engine.services.artifact_types.get_artifact_capability_overrides")
    def test_get_artifact_capabilities_merges_base_and_definition_capabilities(self, mock_overrides):
        mock_overrides.return_value = ["ai_generate", "writable"]

        capabilities = get_artifact_capabilities("creditapplication", "climate_scorecard", "form")

        self.assertEqual(
            capabilities,
            ["detail_endpoint", "writable", "workflow_reference", "ai_generate"],
        )

    @patch("workflow_engine.services.artifact_types.get_artifact_action_definitions")
    def test_get_artifact_actions_formats_contextual_paths(self, mock_get_actions):
        mock_get_actions.return_value = [
            {
                "key": "remote_generate",
                "type": "http_request",
                "path": "/api/credit/credit-applications/{id}/climate-scorecard/generate/",
                "method": "POST",
            }
        ]

        actions = get_artifact_actions(
            "creditapplication",
            "climate_scorecard",
            context={"id": "credit-app-1"},
        )

        self.assertEqual(
            actions,
            [
                {
                    "key": "remote_generate",
                    "type": "http_request",
                    "path": "/api/credit/credit-applications/credit-app-1/climate-scorecard/generate/",
                    "method": "POST",
                }
            ],
        )
