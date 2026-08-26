from workflow_engine.registries.artifacts import get_artifact_adapter


def _get_adapter_for_workflow_instance(workflow_instance):
    content_type = getattr(workflow_instance, "content_type", None)
    if not content_type:
        return None
    return get_artifact_adapter(content_type.model)


def provision_artifacts_for_workflow_instance(workflow_instance, state_code=None):
    """Provision domain artifacts for the workflow instance content object."""
    adapter = _get_adapter_for_workflow_instance(workflow_instance)
    content_object = getattr(workflow_instance, "content_object", None)
    if not adapter or not content_object:
        return {}

    provision = getattr(adapter, "provision_artifacts", None)
    if not provision:
        return {}

    return provision(content_object, state_code=state_code)


def sync_artifacts_for_workflow_instance(workflow_instance, artifact_keys=None):
    """Synchronize persisted artifact records for the workflow instance content object."""
    adapter = _get_adapter_for_workflow_instance(workflow_instance)
    content_object = getattr(workflow_instance, "content_object", None)
    if not adapter or not content_object:
        return {}

    sync = getattr(adapter, "sync_artifacts", None)
    if not sync:
        return {}

    return sync(content_object, artifact_keys=artifact_keys)
