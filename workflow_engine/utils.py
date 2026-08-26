"""Compatibility wrappers for domain-specific workflow helpers.

These functions remain import-stable for the existing application layer, but
the underlying credit-specific behavior now lives in `credit_workflow`.
"""

from credit_workflow.metadata import (
    FormMetadataError,
    auto_initialize_forms_for_state,
    get_artifact_metadata,
    get_artifact_permissions,
    can_user_edit_artifact,
    can_user_edit_form,
    get_dynamic_artifact_field_mappings,
    get_dynamic_field_mappings,
    get_dynamic_artifact_model_map,
    get_dynamic_artifact_prefixes,
    get_dynamic_form_model_map,
    get_dynamic_form_prefixes,
    get_form_metadata,
    get_form_permissions,
    provision_artifacts_for_state,
    get_relevant_artifacts_for_state,
)


def get_state_relevant_artifacts(state):
    """Return the canonical relevant artifacts list for a state metadata entry."""
    metadata = state.metadata or {}
    if metadata.get("relevant_artifacts") is not None:
        return metadata["relevant_artifacts"]
    return metadata.get("relevant_sub_processes", [])
