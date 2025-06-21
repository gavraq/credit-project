import logging
from .models import WorkflowDefinition, State

logger = logging.getLogger(__name__)

class FormMetadataError(Exception):
    """Exception raised when form metadata is not found."""
    pass

def get_form_metadata(form_name):
    """
    Get metadata for a specific form from workflow models.
    Checks if the form metadata exists in the WorkflowDefinition model's metadata.
    Raises FormMetadataError if metadata is not found.
    
    Args:
        form_name: The name of the form to get metadata for
        
    Returns:
        Dictionary containing form metadata (title, form_key, etc.)
        
    Raises:
        FormMetadataError: If form metadata is not found
    """
    try:
        # Try to get form metadata from the parent workflow definition
        parent_workflow = WorkflowDefinition.objects.get(code='CREDIT_PAPER')
        if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
            workflow_form_metadata = parent_workflow.metadata['form_metadata']
            if form_name in workflow_form_metadata:
                logger.info(f"Found metadata for form {form_name} in workflow definition")
                return workflow_form_metadata[form_name]
            else:
                error_msg = f"Form metadata for '{form_name}' not found in workflow definition metadata"
                logger.error(error_msg)
                raise FormMetadataError(error_msg)
        else:
            error_msg = f"No form_metadata found in workflow definition for '{form_name}'"
            logger.error(error_msg)
            raise FormMetadataError(error_msg)
    except WorkflowDefinition.DoesNotExist:
        error_msg = f"Parent workflow 'CREDIT_PAPER' not found when getting form metadata for '{form_name}'"
        logger.error(error_msg)
        raise FormMetadataError(error_msg)
    except FormMetadataError:
        # Re-raise FormMetadataError exceptions
        raise
    except Exception as e:
        error_msg = f"Error getting form metadata for '{form_name}': {e}"
        logger.error(error_msg)
        raise FormMetadataError(error_msg)

def get_relevant_sub_processes_for_state(parent_state_code):
    """
    Get the list of relevant sub-processes for a given parent state code
    by querying the State model's metadata.
    
    Args:
        parent_state_code: The code of the parent workflow state
        
    Returns:
        List of sub-process form names relevant to this state
    """
    try:
        # Get the parent workflow definition
        parent_workflow = WorkflowDefinition.objects.get(code='CREDIT_PAPER')
        
        # Get the state object
        state = State.objects.get(
            workflow_definition=parent_workflow,
            code=parent_state_code
        )
        
        # Check if the state has relevant_sub_processes in its metadata
        if state.metadata and 'relevant_sub_processes' in state.metadata:
            logger.info(f"Found relevant_sub_processes in metadata for state {parent_state_code}: {state.metadata['relevant_sub_processes']}")
            return state.metadata['relevant_sub_processes']
        
        # Fall back to default mapping if not found in metadata
        logger.info(f"No relevant_sub_processes found in metadata for state {parent_state_code}, using default")
        return ['credit_request_form']
        
    except (WorkflowDefinition.DoesNotExist, State.DoesNotExist) as e:
        # Default to credit_request_form if state not found
        logger.warning(f"Error getting relevant sub-processes for state {parent_state_code}: {e}")
        return ['credit_request_form']
