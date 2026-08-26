import logging

from workflow_engine.services.artifacts import (
    provision_artifacts_for_workflow_instance,
    sync_artifacts_for_workflow_instance,
)

logger = logging.getLogger(__name__)


def auto_initialize_credit_forms(workflow_instance, transition, user, system_context=None):
    """Credit-domain compatibility hook for parent workflow state entry."""
    if not workflow_instance.content_type or workflow_instance.content_type.model != "creditapplication":
        return

    credit_app = workflow_instance.content_object
    if not credit_app:
        return

    initialized_artifacts = provision_artifacts_for_workflow_instance(
        workflow_instance,
        state_code=workflow_instance.current_state.code,
    )
    sync_artifacts_for_workflow_instance(workflow_instance)
    if initialized_artifacts:
        logger.info(
            "Auto-provisioned %s artifacts for application %s in state %s",
            len(initialized_artifacts),
            credit_app.id,
            workflow_instance.current_state.code,
        )
