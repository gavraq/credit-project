# Configure Django settings before importing any Django modules
import django
from django.conf import settings

if not settings.configured:
    settings.configure(
        DEBUG=True,
        USE_TZ=True,
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
        INSTALLED_APPS=[
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.sites",
            "workflow_engine",
            "backend.users",
        ],
        AUTH_USER_MODEL="users.User",
        SITE_ID=1,
        MIDDLEWARE_CLASSES=(),
    )
    django.setup()

from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from backend.users.serializers import WorkflowArtifactSerializer


class WorkflowInstanceSerializerTests(TestCase):
    def test_serializes_artifact_record_payload(self):
        content_type = SimpleNamespace(app_label="credit_applications", model="creditrequestform")
        artifact = SimpleNamespace(
            id="artifact-1",
            artifact_key="credit_request_form",
            artifact_kind="form",
            title="Credit Request Form",
            content_type=content_type,
            object_id="form-1",
            metadata={"form_key": "credit_request_form"},
            created_at=None,
            updated_at=None,
        )
        serializer = WorkflowArtifactSerializer(artifact)
        data = serializer.data

        self.assertEqual(data["artifact_key"], "credit_request_form")
        self.assertEqual(data["artifact_kind"], "form")
        self.assertEqual(
            data["capabilities"],
            ["detail_endpoint", "writable", "workflow_reference"],
        )
        self.assertEqual(data["actions"], [])
        self.assertEqual(data["content_type"]["app_label"], "credit_applications")
        self.assertEqual(data["content_type"]["model"], "creditrequestform")

    @patch("backend.users.serializers.get_artifact_actions")
    @patch("backend.users.serializers.get_artifact_capabilities")
    def test_serializes_merged_artifact_capabilities(self, mock_get_capabilities, mock_get_actions):
        mock_get_capabilities.return_value = [
            "detail_endpoint",
            "writable",
            "workflow_reference",
            "remote_generate",
        ]
        mock_get_actions.return_value = [
            {
                "key": "remote_generate",
                "type": "http_request",
                "path": "/api/credit/credit-applications/credit-app-1/climate-scorecard/generate/",
                "method": "POST",
            }
        ]
        content_type = SimpleNamespace(app_label="credit_applications", model="climatescorecard")
        workflow_instance = SimpleNamespace(
            content_type=SimpleNamespace(model="creditapplication"),
            object_id="credit-app-1",
        )
        artifact = SimpleNamespace(
            id="artifact-2",
            artifact_key="climate_scorecard",
            artifact_kind="form",
            title="Climate Scorecard",
            content_type=content_type,
            object_id="scorecard-1",
            metadata={"form_key": "climate_scorecard"},
            created_at=None,
            updated_at=None,
            workflow_instance=workflow_instance,
        )

        serializer = WorkflowArtifactSerializer(artifact)
        data = serializer.data

        self.assertEqual(
            data["capabilities"],
            ["detail_endpoint", "writable", "workflow_reference", "remote_generate"],
        )
        self.assertEqual(
            data["actions"],
            [
                {
                    "key": "remote_generate",
                    "type": "http_request",
                    "path": "/api/credit/credit-applications/credit-app-1/climate-scorecard/generate/",
                    "method": "POST",
                }
            ],
        )
