from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from workflow_engine.services.definitions import (
    get_artifact_capability_overrides,
    get_artifact_definition,
    get_artifact_definitions,
    get_artifact_kind,
)


class WorkflowDefinitionServiceTests(SimpleTestCase):
    @patch("workflow_engine.services.definitions.get_artifact_definition_provider")
    def test_get_artifact_definition_uses_registered_provider(self, mock_get_provider):
        provider = SimpleNamespace(get_definition=MagicMock(return_value={"title": "Credit Request Form"}))
        mock_get_provider.return_value = provider

        result = get_artifact_definition("creditapplication", "credit_request_form")

        self.assertEqual(result, {"title": "Credit Request Form"})
        provider.get_definition.assert_called_once_with("credit_request_form")

    @patch("workflow_engine.services.definitions.get_artifact_definition_provider")
    def test_get_artifact_definitions_uses_registered_provider(self, mock_get_provider):
        provider = SimpleNamespace(get_definitions=MagicMock(return_value={"credit_request_form": {"title": "Credit Request Form"}}))
        mock_get_provider.return_value = provider

        result = get_artifact_definitions("creditapplication")

        self.assertEqual(
            result,
            {"credit_request_form": {"title": "Credit Request Form"}},
        )
        provider.get_definitions.assert_called_once_with()

    @patch("workflow_engine.services.definitions.get_artifact_definition_provider", return_value=None)
    def test_get_artifact_definition_returns_none_without_provider(self, mock_get_provider):
        self.assertIsNone(get_artifact_definition("unknownmodel", "artifact"))

    @patch("workflow_engine.services.definitions.get_artifact_definition_provider", return_value=None)
    def test_get_artifact_definitions_returns_empty_without_provider(self, mock_get_provider):
        self.assertEqual(get_artifact_definitions("unknownmodel"), {})

    @patch("workflow_engine.services.definitions.get_artifact_definition_provider")
    def test_get_artifact_kind_uses_registered_provider(self, mock_get_provider):
        provider = SimpleNamespace(get_kind=MagicMock(return_value="form"))
        mock_get_provider.return_value = provider

        result = get_artifact_kind("creditapplication", "credit_request_form")

        self.assertEqual(result, "form")
        provider.get_kind.assert_called_once_with("credit_request_form")

    @patch("workflow_engine.services.definitions.get_artifact_definition_provider", return_value=None)
    def test_get_artifact_kind_returns_default_without_provider(self, mock_get_provider):
        self.assertEqual(get_artifact_kind("unknownmodel", "artifact"), "form")

    @patch("workflow_engine.services.definitions.get_artifact_definition_provider")
    def test_get_artifact_capability_overrides_uses_registered_provider(self, mock_get_provider):
        provider = SimpleNamespace(get_capabilities=MagicMock(return_value=["ai_generate"]))
        mock_get_provider.return_value = provider

        result = get_artifact_capability_overrides("creditapplication", "climate_scorecard")

        self.assertEqual(result, ["ai_generate"])
        provider.get_capabilities.assert_called_once_with("climate_scorecard")

    @patch("workflow_engine.services.definitions.get_artifact_definition_provider", return_value=None)
    def test_get_artifact_capability_overrides_returns_empty_without_provider(self, mock_get_provider):
        self.assertEqual(get_artifact_capability_overrides("unknownmodel", "artifact"), [])
