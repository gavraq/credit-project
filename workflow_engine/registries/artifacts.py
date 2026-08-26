import logging

logger = logging.getLogger(__name__)

_ARTIFACT_ADAPTERS = {}


def register_artifact_adapter(model_name, adapter):
    """Register a domain artifact adapter for a workflow content object model."""
    _ARTIFACT_ADAPTERS[model_name] = adapter


def get_artifact_adapter(model_name):
    """Return a registered artifact adapter for the given content object model."""
    adapter = _ARTIFACT_ADAPTERS.get(model_name)
    if not adapter:
        logger.debug("No artifact adapter registered for model '%s'", model_name)
    return adapter
