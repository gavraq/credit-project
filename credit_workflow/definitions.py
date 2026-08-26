from types import SimpleNamespace

from credit_workflow.workflow_context import FormMetadataError, get_parent_workflow


def _get_form_metadata_map():
    parent_workflow = get_parent_workflow()
    metadata = parent_workflow.metadata or {}
    workflow_form_metadata = metadata.get("form_metadata")
    if workflow_form_metadata is None:
        raise FormMetadataError("No form_metadata found in workflow definition")
    return workflow_form_metadata


def get_credit_artifact_definition(artifact_key):
    """Return the configured artifact definition for a credit artifact key."""
    workflow_form_metadata = _get_form_metadata_map()
    artifact_definition = workflow_form_metadata.get(artifact_key)
    if artifact_definition is None:
        raise FormMetadataError(
            f"Form metadata for '{artifact_key}' not found in workflow definition metadata"
        )
    return artifact_definition


def get_credit_artifact_definitions():
    """Return all configured credit artifact definitions."""
    return _get_form_metadata_map()


def get_credit_artifact_model_map():
    """Generate the concrete model mapping for configured credit artifacts."""
    parent_workflow = get_parent_workflow()
    if not parent_workflow.metadata or "form_metadata" not in parent_workflow.metadata:
        return {}

    from credit_applications.models import (
        BusinessSponsorshipForm,
        ClimateScorecard,
        CreditAnalysisForm,
        CreditApprovalForm,
        CreditCompilationForm,
        CreditQuestionnaireForm,
        CreditRequestForm,
        CreditReviewForm,
        LegalReviewForm,
    )

    model_class_map = {
        "credit_request_form": CreditRequestForm,
        "credit_review_form": CreditReviewForm,
        "business_sponsorship_form": BusinessSponsorshipForm,
        "legal_review_form": LegalReviewForm,
        "credit_questionnaire_form": CreditQuestionnaireForm,
        "credit_analysis_form": CreditAnalysisForm,
        "credit_compilation_form": CreditCompilationForm,
        "credit_approval_form": CreditApprovalForm,
        "climate_scorecard": ClimateScorecard,
    }

    dynamic_mapping = {}
    for artifact_key, artifact_definition in get_credit_artifact_definitions().items():
        form_key = artifact_definition.get("form_key", artifact_key)
        if form_key in model_class_map:
            dynamic_mapping[artifact_key] = model_class_map[form_key]

    return dynamic_mapping


def get_credit_artifact_prefixes():
    """Generate configured credit artifact field prefixes."""
    prefix_map = {}
    for artifact_key, artifact_definition in get_credit_artifact_definitions().items():
        form_key = artifact_definition.get("form_key", artifact_key)
        prefix_map[f"{form_key}_"] = artifact_key
    return prefix_map


def get_credit_artifact_field_mappings():
    """Generate configured field type mappings for credit artifacts."""
    boolean_fields_map = {}
    user_fields_map = {}
    datetime_fields_map = {}

    for artifact_key, artifact_definition in get_credit_artifact_definitions().items():
        field_config = artifact_definition.get("field_mappings", {})
        if "boolean_fields" in field_config:
            boolean_fields_map[artifact_key] = field_config["boolean_fields"]
        if "user_fields" in field_config:
            user_fields_map[artifact_key] = field_config["user_fields"]
        if "datetime_fields" in field_config:
            datetime_fields_map[artifact_key] = field_config["datetime_fields"]

    return {
        "boolean_fields": boolean_fields_map,
        "user_fields": user_fields_map,
        "datetime_fields": datetime_fields_map,
    }


def get_credit_artifact_permissions(artifact_key):
    """Return permission-related fields from the configured artifact definition."""
    artifact_definition = get_credit_artifact_definition(artifact_key)
    return {
        "editable_by_roles": artifact_definition.get("editable_by_roles", []),
        "viewable_by_roles": artifact_definition.get("viewable_by_roles", []),
        "ownership_required": artifact_definition.get("ownership_required", False),
    }


def get_credit_artifact_kind(artifact_key):
    """Return the configured artifact kind for a credit artifact."""
    artifact_definition = get_credit_artifact_definition(artifact_key)
    return artifact_definition.get("artifact_kind", "form")


def get_credit_artifact_capabilities(artifact_key):
    """Return capability overrides/extensions for a credit artifact."""
    artifact_definition = get_credit_artifact_definition(artifact_key)
    return artifact_definition.get("artifact_capabilities", [])


def get_credit_artifact_actions(artifact_key):
    """Return action descriptors configured for a credit artifact."""
    artifact_definition = get_credit_artifact_definition(artifact_key)
    return artifact_definition.get("artifact_actions", [])


credit_workflow_artifact_definition_provider = SimpleNamespace(
    get_definition=get_credit_artifact_definition,
    get_definitions=get_credit_artifact_definitions,
    get_model_map=get_credit_artifact_model_map,
    get_prefix_map=get_credit_artifact_prefixes,
    get_field_mappings=get_credit_artifact_field_mappings,
    get_permissions=get_credit_artifact_permissions,
    get_kind=get_credit_artifact_kind,
    get_capabilities=get_credit_artifact_capabilities,
    get_actions=get_credit_artifact_actions,
)
