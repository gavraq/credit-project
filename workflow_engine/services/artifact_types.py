from workflow_engine.registries.artifact_types import get_artifact_type
from workflow_engine.services.definitions import (
    get_artifact_action_definitions,
    get_artifact_capability_overrides,
)


def get_artifact_type_config(artifact_kind):
    """Return a normalized artifact-type configuration."""
    artifact_type = get_artifact_type(artifact_kind)
    if artifact_type is not None:
        return artifact_type

    if artifact_kind == "form":
        return {
            "kind": "form",
            "capabilities": ["detail_endpoint", "writable", "workflow_reference"],
        }

    return {
        "kind": artifact_kind,
        "capabilities": [],
    }


def get_artifact_capabilities(model_name, artifact_key, artifact_kind):
    """Return the merged capability set for an artifact."""
    base_capabilities = list(get_artifact_type_config(artifact_kind).get("capabilities", []))
    artifact_capabilities = get_artifact_capability_overrides(model_name, artifact_key)

    merged = []
    for capability in [*base_capabilities, *artifact_capabilities]:
        if capability not in merged:
            merged.append(capability)

    return merged


def get_artifact_actions(model_name, artifact_key, context=None):
    """Return resolved action descriptors for an artifact."""
    context = context or {}
    actions = []
    for action in get_artifact_action_definitions(model_name, artifact_key):
        resolved = dict(action)
        path = resolved.get("path")
        if path:
            try:
                resolved["path"] = path.format(**context)
            except KeyError:
                pass
        actions.append(resolved)
    return actions
