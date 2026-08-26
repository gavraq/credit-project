import logging

logger = logging.getLogger(__name__)

_ARTIFACT_TYPES = {}


def register_artifact_type(artifact_kind, config):
    """Register configuration for an artifact kind."""
    _ARTIFACT_TYPES[artifact_kind] = config


def get_artifact_type(artifact_kind):
    """Return configuration for an artifact kind."""
    artifact_type = _ARTIFACT_TYPES.get(artifact_kind)
    if not artifact_type:
        logger.debug("No artifact type registered for kind '%s'", artifact_kind)
    return artifact_type
