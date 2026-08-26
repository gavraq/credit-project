from workflow_engine.registries.definitions import get_artifact_definition_provider


def get_artifact_definition(model_name, artifact_key):
    """Return a registered artifact definition for a content object model."""
    provider = get_artifact_definition_provider(model_name)
    if not provider:
        return None

    get_definition = getattr(provider, "get_definition", None)
    if not get_definition:
        return None

    return get_definition(artifact_key)


def get_artifact_definitions(model_name):
    """Return all registered artifact definitions for a content object model."""
    provider = get_artifact_definition_provider(model_name)
    if not provider:
        return {}

    get_definitions = getattr(provider, "get_definitions", None)
    if not get_definitions:
        return {}

    return get_definitions()


def get_artifact_kind(model_name, artifact_key, default="form"):
    """Return the registered artifact kind for a content object model and artifact key."""
    provider = get_artifact_definition_provider(model_name)
    if not provider:
        return default

    get_kind = getattr(provider, "get_kind", None)
    if not get_kind:
        return default

    try:
        artifact_kind = get_kind(artifact_key)
    except Exception:
        return default

    return artifact_kind or default


def get_artifact_capability_overrides(model_name, artifact_key):
    """Return artifact-specific capability extensions or overrides from the definition provider."""
    provider = get_artifact_definition_provider(model_name)
    if not provider:
        return []

    get_capabilities = getattr(provider, "get_capabilities", None)
    if not get_capabilities:
        return []

    try:
        capabilities = get_capabilities(artifact_key)
    except Exception:
        return []

    return capabilities or []


def get_artifact_action_definitions(model_name, artifact_key):
    """Return artifact action descriptors from the definition provider."""
    provider = get_artifact_definition_provider(model_name)
    if not provider:
        return []

    get_actions = getattr(provider, "get_actions", None)
    if not get_actions:
        return []

    try:
        actions = get_actions(artifact_key)
    except Exception:
        return []

    return actions or []
