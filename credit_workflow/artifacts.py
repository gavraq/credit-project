import logging
from types import SimpleNamespace

from django.contrib.contenttypes.models import ContentType

from credit_workflow.metadata import (
    can_user_edit_artifact,
    get_artifact_metadata,
    get_relevant_artifacts_for_state,
    provision_artifacts_for_state,
)
from credit_workflow.workflow_context import FormMetadataError
from workflow_engine.services.artifact_types import get_artifact_actions, get_artifact_capabilities
from workflow_engine.services.definitions import get_artifact_kind
from workflow_engine.models import WorkflowArtifact

logger = logging.getLogger(__name__)


def provision_credit_workflow_artifacts(credit_application, state_code=None):
    """Provision credit-domain artifacts for the current parent workflow state."""
    return provision_artifacts_for_state(credit_application, state_code=state_code)


def get_artifact_serializer_map():
    """Resolve artifact serializers lazily for domain artifact detail endpoints."""
    from credit_applications.serializers import (
        BusinessSponsorshipFormSerializer,
        ClimateScorecardSerializer,
        CreditAnalysisFormSerializer,
        CreditApprovalFormSerializer,
        CreditCompilationFormSerializer,
        CreditQuestionnaireFormSerializer,
        CreditRequestFormSerializer,
        CreditReviewFormSerializer,
        LegalReviewFormSerializer,
    )

    return {
        "credit_request_form": CreditRequestFormSerializer,
        "business_sponsorship_form": BusinessSponsorshipFormSerializer,
        "credit_review_form": CreditReviewFormSerializer,
        "legal_review_form": LegalReviewFormSerializer,
        "credit_questionnaire_form": CreditQuestionnaireFormSerializer,
        "credit_analysis_form": CreditAnalysisFormSerializer,
        "credit_compilation_form": CreditCompilationFormSerializer,
        "credit_approval_form": CreditApprovalFormSerializer,
        "climate_scorecard": ClimateScorecardSerializer,
    }


def build_artifact_resource_metadata(credit_application, artifact_key):
    """Return generic navigation metadata for a domain artifact endpoint."""
    return {
        "type": "domain_artifact_endpoint",
        "path": f"/api/credit/credit-applications/{credit_application.id}/artifacts/{artifact_key}/",
        "methods": ["GET", "PATCH"],
    }


def get_workflow_artifact_descriptors(credit_application, request=None):
    """Return engine-aligned artifact descriptors for the current credit workflow state."""
    current_state_code = None
    if hasattr(credit_application, "workflow_instance") and credit_application.workflow_instance:
        current_state_code = credit_application.workflow_instance.current_state.code

    if current_state_code:
        artifact_keys = get_relevant_artifacts_for_state(current_state_code)
    else:
        artifact_keys = ["credit_request_form"]

    artifact_records = sync_workflow_artifact_records(credit_application, artifact_keys)

    artifacts = []
    model_name = "creditapplication"
    for artifact_key in artifact_keys:
        try:
            artifact_metadata = get_artifact_metadata(artifact_key)
        except FormMetadataError as exc:
            logger.error("Error getting metadata for artifact %s: %s", artifact_key, exc)
            continue

        form_instance = getattr(credit_application, artifact_key, None)
        title = getattr(form_instance, "get_form_title", lambda: artifact_metadata["title"])()

        editable = (
            can_user_edit_artifact(request.user, credit_application, artifact_key, form_instance)
            if request
            else False
        )
        artifact_record = artifact_records.get(artifact_key)
        artifact_kind = get_artifact_kind(model_name, artifact_key)

        artifacts.append(
            {
                "id": str(artifact_record.id) if artifact_record else None,
                "key": artifact_key,
                "kind": artifact_kind,
                "capabilities": get_artifact_capabilities(model_name, artifact_key, artifact_kind),
                "actions": get_artifact_actions(
                    model_name,
                    artifact_key,
                    context={"id": credit_application.id},
                ),
                "title": title,
                "editable": editable,
                "object_id": str(form_instance.id) if form_instance is not None and getattr(form_instance, "id", None) else None,
                "workflow_code": artifact_metadata.get("workflow_code"),
                "resource": build_artifact_resource_metadata(credit_application, artifact_key),
            }
        )

    return artifacts


def get_or_auto_initialize_artifact(credit_application, artifact_key):
    """Ensure a configured artifact exists for the current state when possible."""
    try:
        return getattr(credit_application, artifact_key)
    except Exception:
        initialized_artifacts = provision_credit_workflow_artifacts(credit_application)
        return initialized_artifacts.get(artifact_key)


def sync_workflow_artifact_records(credit_application, artifact_keys=None):
    """Persist generic workflow artifact records for the current credit workflow state."""
    workflow_instance = getattr(credit_application, "workflow_instance", None)
    if not workflow_instance:
        return {}

    if artifact_keys is None:
        current_state_code = workflow_instance.current_state.code if workflow_instance.current_state else None
        artifact_keys = get_relevant_artifacts_for_state(current_state_code) if current_state_code else []

    artifact_records = {}
    model_name = "creditapplication"
    for artifact_key in artifact_keys:
        try:
            artifact_metadata = get_artifact_metadata(artifact_key)
        except FormMetadataError as exc:
            logger.error("Error getting metadata for artifact sync %s: %s", artifact_key, exc)
            continue

        form_instance = getattr(credit_application, artifact_key, None)
        content_type = None
        object_id = None
        if form_instance is not None:
            content_type = ContentType.objects.get_for_model(form_instance)
            object_id = form_instance.id

        artifact_record, _ = WorkflowArtifact.objects.update_or_create(
            workflow_instance=workflow_instance,
            artifact_key=artifact_key,
            defaults={
                "artifact_kind": get_artifact_kind(model_name, artifact_key),
                "title": artifact_metadata["title"],
                "content_type": content_type,
                "object_id": object_id,
                "metadata": {
                    "form_key": artifact_metadata.get("form_key"),
                    "workflow_code": artifact_metadata.get("workflow_code"),
                },
            },
        )
        artifact_records[artifact_key] = artifact_record

    return artifact_records


credit_workflow_artifact_adapter = SimpleNamespace(
    provision_artifacts=provision_credit_workflow_artifacts,
    sync_artifacts=sync_workflow_artifact_records,
)
