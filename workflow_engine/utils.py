import logging
from .models import Workflow, State

logger = logging.getLogger(__name__)

class FormMetadataError(Exception):
    """Exception raised when form metadata is not found."""
    pass

def get_form_metadata(form_name):
    """
    Get metadata for a specific form from workflow models.
    Checks if the form metadata exists in the Workflow model's metadata.
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
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
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
    except Workflow.DoesNotExist:
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
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        
        # Get the state object
        state = State.objects.get(
            workflow=parent_workflow,
            code=parent_state_code
        )
        
        # Check if the state has relevant_sub_processes in its metadata
        if state.metadata and 'relevant_sub_processes' in state.metadata:
            logger.info(f"Found relevant_sub_processes in metadata for state {parent_state_code}: {state.metadata['relevant_sub_processes']}")
            return state.metadata['relevant_sub_processes']
        
        # Fall back to default mapping if not found in metadata
        logger.info(f"No relevant_sub_processes found in metadata for state {parent_state_code}, using default")
        return ['credit_request_form']
        
    except (Workflow.DoesNotExist, State.DoesNotExist) as e:
        # Default to credit_request_form if state not found
        logger.warning(f"Error getting relevant sub-processes for state {parent_state_code}: {e}")
        return ['credit_request_form']

def get_dynamic_form_model_map():
    """
    Dynamically generate form model mapping based on workflow metadata.
    This avoids hard-coding form types and makes the system truly metadata-driven.
    
    Returns:
        Dict mapping form names to model classes
    """
    try:
        # Get all form metadata from the workflow
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        if not parent_workflow.metadata or 'form_metadata' not in parent_workflow.metadata:
            logger.warning("No form_metadata found in workflow definition, using empty mapping")
            return {}
        
        form_metadata = parent_workflow.metadata['form_metadata']
        
        # Import form models dynamically
        from credit_applications.models import (
            CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm,
            LegalReviewForm, CreditQuestionnaireForm, CreditAnalysisForm,
            CreditCompilationForm, CreditApprovalForm
        )
        
        # Create mapping based on form_key in metadata (matching frontend prefix pattern)
        model_class_map = {
            'credit_request_form': CreditRequestForm,
            'credit_review_form': CreditReviewForm,
            'business_sponsorship_form': BusinessSponsorshipForm,
            'legal_review_form': LegalReviewForm,
            'credit_questionnaire_form': CreditQuestionnaireForm,
            'credit_analysis_form': CreditAnalysisForm,
            'credit_compilation_form': CreditCompilationForm,
            'credit_approval_form': CreditApprovalForm,
        }
        
        # Only include forms that exist in the metadata
        dynamic_mapping = {}
        for form_name, form_config in form_metadata.items():
            form_key = form_config.get('form_key', form_name)
            if form_key in model_class_map:
                dynamic_mapping[form_name] = model_class_map[form_key]
            else:
                logger.warning(f"No model class found for form_key '{form_key}' (form_name: '{form_name}')")
        
        logger.info(f"Generated dynamic form mapping for {len(dynamic_mapping)} forms: {list(dynamic_mapping.keys())}")
        return dynamic_mapping
        
    except Workflow.DoesNotExist:
        logger.error("Parent workflow 'CREDIT_PAPER' not found for dynamic form mapping")
        return {}
    except Exception as e:
        logger.error(f"Error generating dynamic form model map: {e}", exc_info=True)
        return {}

def get_dynamic_form_prefixes():
    """
    Dynamically generate form prefix mapping based on workflow metadata.
    This avoids hard-coding form prefixes and makes the system truly metadata-driven.
    
    Returns:
        Dict mapping prefixes to form names
    """
    try:
        # Get all form metadata from the workflow
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        if not parent_workflow.metadata or 'form_metadata' not in parent_workflow.metadata:
            logger.warning("No form_metadata found in workflow definition, using empty prefix mapping")
            return {}
        
        form_metadata = parent_workflow.metadata['form_metadata']
        
        # Generate prefix mapping dynamically
        prefix_map = {}
        for form_name, form_config in form_metadata.items():
            # Use form_key to create prefix, or fall back to form_name
            form_key = form_config.get('form_key', form_name)
            prefix = f"{form_key}_"
            prefix_map[prefix] = form_name
        
        logger.info(f"Generated dynamic prefix mapping for {len(prefix_map)} forms: {list(prefix_map.keys())}")
        return prefix_map
        
    except Workflow.DoesNotExist:
        logger.error("Parent workflow 'CREDIT_PAPER' not found for dynamic prefix mapping")
        return {}
    except Exception as e:
        logger.error(f"Error generating dynamic form prefix map: {e}", exc_info=True)
        return {}

def get_dynamic_field_mappings():
    """
    Dynamically generate field mappings (boolean, user, datetime) based on workflow metadata.
    This avoids hard-coding field types and makes the system truly metadata-driven.
    
    Returns:
        Dict containing 'boolean_fields', 'user_fields', 'datetime_fields' mappings
    """
    try:
        # Get all form metadata from the workflow
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        if not parent_workflow.metadata or 'form_metadata' not in parent_workflow.metadata:
            logger.warning("No form_metadata found in workflow definition, using empty field mappings")
            return {'boolean_fields': {}, 'user_fields': {}, 'datetime_fields': {}}
        
        form_metadata = parent_workflow.metadata['form_metadata']
        
        # Initialize mappings
        boolean_fields_map = {}
        user_fields_map = {}
        datetime_fields_map = {}
        
        # Extract field mappings from metadata
        for form_name, form_config in form_metadata.items():
            # Get field configurations if they exist
            field_config = form_config.get('field_mappings', {})
            
            if 'boolean_fields' in field_config:
                boolean_fields_map[form_name] = field_config['boolean_fields']
            
            if 'user_fields' in field_config:
                user_fields_map[form_name] = field_config['user_fields']
                
            if 'datetime_fields' in field_config:
                datetime_fields_map[form_name] = field_config['datetime_fields']
        
        logger.info(f"Generated dynamic field mappings - Boolean: {len(boolean_fields_map)}, User: {len(user_fields_map)}, DateTime: {len(datetime_fields_map)}")
        
        return {
            'boolean_fields': boolean_fields_map,
            'user_fields': user_fields_map,
            'datetime_fields': datetime_fields_map
        }
        
    except Workflow.DoesNotExist:
        logger.error("Parent workflow 'CREDIT_PAPER' not found for dynamic field mappings")
        return {'boolean_fields': {}, 'user_fields': {}, 'datetime_fields': {}}
    except Exception as e:
        logger.error(f"Error generating dynamic field mappings: {e}", exc_info=True)
        return {'boolean_fields': {}, 'user_fields': {}, 'datetime_fields': {}}

def auto_initialize_forms_for_state(credit_application, state_code=None):
    """
    Auto-initialize forms based on the current workflow state or the provided state code.
    This ensures that all required forms for a given state exist and have workflow instances.
    
    Args:
        credit_application: CreditApplication instance
        state_code: Optional state code to use instead of current state
        
    Returns:
        Dict mapping form names to their created/existing instances
    """
    from django.contrib.contenttypes.models import ContentType
    from workflow_engine.models import WorkflowInstance, Workflow, State
    from django.utils import timezone
    
    # Get dynamic form model mapping from workflow metadata
    form_model_map = get_dynamic_form_model_map()
    if not form_model_map:
        logger.warning(f"No dynamic form mapping available for application {credit_application.id}")
        return {}
    
    # Determine which state to use
    if state_code:
        target_state_code = state_code
    elif hasattr(credit_application, 'workflow_instance') and credit_application.workflow_instance:
        target_state_code = credit_application.workflow_instance.current_state.code
    else:
        logger.warning(f"No workflow state found for application {credit_application.id}, using default")
        target_state_code = 'DRAFT'  # Default state
    
    # Get relevant forms for this state
    relevant_forms = get_relevant_sub_processes_for_state(target_state_code)
    logger.info(f"Auto-initializing forms for state {target_state_code}: {relevant_forms}")
    
    initialized_forms = {}
    
    for form_name in relevant_forms:
        if form_name not in form_model_map:
            logger.warning(f"Form {form_name} not found in model map, skipping")
            continue
            
        model_class = form_model_map[form_name]
        
        try:
            # Create or get the form instance
            form_instance, created = model_class.objects.get_or_create(
                credit_application=credit_application,
                defaults={
                    'form_started_at': timezone.now()
                }
            )
            
            if created:
                logger.info(f"Auto-created {form_name} for application {credit_application.id}")
            
            # Ensure the form has a workflow instance
            if not hasattr(form_instance, 'workflow_instance') or not form_instance.workflow_instance:
                try:
                    # Get workflow code from form metadata instead of generating it
                    try:
                        form_metadata = get_form_metadata(form_name)
                        workflow_code = form_metadata.get('workflow_code')
                        if not workflow_code:
                            logger.warning(f"No workflow_code found in metadata for {form_name}")
                            continue
                    except FormMetadataError:
                        logger.warning(f"No metadata found for {form_name}, skipping workflow instance creation")
                        continue
                    
                    logger.info(f"Creating sub-workflow '{workflow_code}' for {form_name}")
                    
                    sub_workflow = Workflow.objects.get(code=workflow_code)
                    initial_state = State.objects.get(workflow=sub_workflow, is_initial=True)
                    
                    sub_wf_instance = WorkflowInstance.objects.create(
                        workflow=sub_workflow,
                        current_state=initial_state,
                        content_type=ContentType.objects.get_for_model(form_instance),
                        object_id=form_instance.id
                    )
                    
                    form_instance.workflow_instance = sub_wf_instance
                    form_instance.save(update_fields=['workflow_instance'])
                    
                    logger.info(f"Created sub-workflow instance {sub_wf_instance.id} for {form_name}")
                    
                except (Workflow.DoesNotExist, State.DoesNotExist) as e:
                    logger.warning(f"Could not create workflow for {form_name}: {e}")
                except Exception as e:
                    logger.error(f"Error creating workflow for {form_name}: {e}", exc_info=True)
            
            initialized_forms[form_name] = form_instance
            
        except Exception as e:
            logger.error(f"Error auto-initializing {form_name} for application {credit_application.id}: {e}", exc_info=True)
    
    return initialized_forms

def get_form_permissions(form_name):
    """
    Get role permissions for a specific form from workflow metadata.
    
    Args:
        form_name: Name of the form to get permissions for
        
    Returns:
        Dict containing 'editable_by_roles', 'viewable_by_roles', and 'ownership_required'
    """
    try:
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        if not parent_workflow.metadata or 'form_metadata' not in parent_workflow.metadata:
            logger.warning(f"No form_metadata found in workflow definition for form {form_name}")
            return {'editable_by_roles': [], 'viewable_by_roles': [], 'ownership_required': False}
        
        form_metadata = parent_workflow.metadata['form_metadata']
        if form_name not in form_metadata:
            logger.warning(f"Form {form_name} not found in workflow form_metadata")
            return {'editable_by_roles': [], 'viewable_by_roles': [], 'ownership_required': False}
        
        permissions = form_metadata[form_name]
        return {
            'editable_by_roles': permissions.get('editable_by_roles', []),
            'viewable_by_roles': permissions.get('viewable_by_roles', []),
            'ownership_required': permissions.get('ownership_required', False)
        }
        
    except Workflow.DoesNotExist:
        logger.error("Parent workflow 'CREDIT_PAPER' not found for form permissions")
        return {'editable_by_roles': [], 'viewable_by_roles': [], 'ownership_required': False}
    except Exception as e:
        logger.error(f"Error getting form permissions for {form_name}: {e}", exc_info=True)
        return {'editable_by_roles': [], 'viewable_by_roles': [], 'ownership_required': False}

def can_user_edit_form(user, credit_app, form_name, form_instance=None):
    """
    Metadata-driven function to determine if a user can edit a specific form.
    
    Args:
        user: The user requesting access
        credit_app: The CreditApplication instance
        form_name: Name of the form
        form_instance: The form instance (optional)
        
    Returns:
        Boolean indicating if user can edit the form
    """
    if not user or not hasattr(user, 'role') or not user.role:
        return False
    
    # Get form permissions from metadata
    permissions = get_form_permissions(form_name)
    
    # Normalize user role for comparison
    user_role = user.role.name.lower().replace(' ', '_')
    
    # Check if user's role can edit this form type
    editable_roles = [role.lower().replace(' ', '_') for role in permissions['editable_by_roles']]
    
    # Check if user role matches any editable role
    can_edit = any(
        role in user_role or user_role in role 
        for role in editable_roles
    )
    
    if not can_edit:
        return False
    
    # Additional ownership check for forms that require it
    if permissions.get('ownership_required', False):
        # Check if user is the relationship manager for this application
        if credit_app.relationship_manager and credit_app.relationship_manager.id == user.id:
            return True
        # Also allow if user created the application
        if credit_app.created_by and credit_app.created_by.id == user.id:
            return True
        return False
    
    # System administrators can edit any form
    if 'admin' in user_role or user.is_superuser:
        return True
    
    # Special DA-level authorization check for Credit Approval Forms
    if form_name == 'credit_approval_form' and user_role == 'credit_analyst':
        # Check if user has sufficient DA level for this application
        if hasattr(credit_app, 'credit_review_form') and credit_app.credit_review_form:
            required_da_level = credit_app.credit_review_form.delegated_authority_level
            user_da_level = getattr(user, 'da_level', None)
            
            if required_da_level and user_da_level:
                # Extract numeric levels for comparison
                def extract_da_number(da_level):
                    if not da_level:
                        return None
                    if da_level.startswith('DA'):
                        return int(da_level[2:])
                    return int(da_level)
                
                try:
                    user_level = extract_da_number(user_da_level)
                    required_level = extract_da_number(required_da_level)
                    
                    # Lower number = higher authority (DA1 > DA3)
                    if user_level and required_level and user_level > required_level:
                        logger.warning(f"User {user.username} (DA{user_level}) insufficient authority for application requiring DA{required_level}")
                        return False
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error comparing DA levels for user {user.username}: {e}")
                    return False
    
    return can_edit
