from workflow_engine.models import Workflow


PARENT_WORKFLOW_CODE = "CREDIT_PAPER"


class FormMetadataError(Exception):
    """Exception raised when form metadata is not found."""


def get_parent_workflow():
    return Workflow.objects.get(code=PARENT_WORKFLOW_CODE)
