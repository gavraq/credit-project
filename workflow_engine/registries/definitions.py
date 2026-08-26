import logging

logger = logging.getLogger(__name__)

_ARTIFACT_DEFINITION_PROVIDERS = {}


def register_artifact_definition_provider(model_name, provider):
    """Register an artifact-definition provider for a workflow content object model."""
    _ARTIFACT_DEFINITION_PROVIDERS[model_name] = provider


def get_artifact_definition_provider(model_name):
    """Return the registered artifact-definition provider for the given model."""
    provider = _ARTIFACT_DEFINITION_PROVIDERS.get(model_name)
    if not provider:
        logger.debug("No artifact definition provider registered for model '%s'", model_name)
    return provider
