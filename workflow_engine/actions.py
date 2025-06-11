# File: credit-project/workflow_engine/actions.py
import logging
# Note: We use delayed imports for models inside functions to avoid potential circular dependencies.

logger = logging.getLogger(__name__)

def handle_submit_business_sponsorship(workflow_instance, user, transition_obj):
    """
    Handles the system action after a business sponsorship is submitted.
    Attempts to transition the parent CreditApplication workflow.
    'workflow_instance' is the instance of the BusinessSponsorshipForm's workflow.
    'user' is the user who triggered the original sub-workflow transition.
    'transition_obj' is the Transition object that was just performed on the sub-workflow.
    """
    from credit_applications.models import CreditApplication # Delayed import
    
    logger.info(
        f"System action 'handle_submit_business_sponsorship' triggered for "
        f"sub-workflow instance {workflow_instance.id} (State: {workflow_instance.current_state.code})"
    )

    # Ensure this action is for the BusinessSponsorshipForm workflow and it's in the correct terminal state
    if workflow_instance.content_type.model == 'businesssponsorshipform' and \
       workflow_instance.current_state.code == 'BUSINESS_SPONSOR_SUBMITTED':
        
        business_sponsorship_form = workflow_instance.content_object
        if not business_sponsorship_form:
            logger.error(f"BusinessSponsorshipForm (content_object) not found for workflow instance {workflow_instance.id}")
            return

        parent_credit_application = business_sponsorship_form.credit_application
        if not parent_credit_application:
            logger.error(f"Parent CreditApplication not found for BusinessSponsorshipForm {business_sponsorship_form.id}")
            return

        parent_workflow_instance = parent_credit_application.workflow_instance
        if not parent_workflow_instance:
            logger.error(f"Parent workflow instance not found for CreditApplication {parent_credit_application.id}")
            return

        logger.info(
            f"Parent CreditApplication: {parent_credit_application.id}, "
            f"Parent Workflow: {parent_workflow_instance.id}, "
            f"Current State: {parent_workflow_instance.current_state.code}"
        )

        # Check if parent is in the correct state to transition using PP_TR_4
        if parent_workflow_instance.current_state.code == 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING':
            try:
                logger.info(f"Attempting to perform PP_TR_4 on parent workflow {parent_workflow_instance.id}")
                # The user performing this transition. Consider if a dedicated system user is more appropriate.
                parent_workflow_instance.perform_transition(
                    transition_code='PP_TR_4',
                    user=user, 
                    comments="System: Auto-transitioned after Business Sponsorship submission."
                )
                logger.info(
                    f"Successfully transitioned parent workflow {parent_workflow_instance.id} "
                    f"to {parent_workflow_instance.current_state.code}"
                )
            except Exception as e:
                logger.error(f"Error transitioning parent workflow {parent_workflow_instance.id} using PP_TR_4: {e}", exc_info=True)
        else:
            logger.warning(
                f"Parent workflow {parent_workflow_instance.id} is not in "
                f"CREDIT_PAPER_BUSINESS_SPONSOR_PENDING state (current: {parent_workflow_instance.current_state.code}). "
                f"Skipping PP_TR_4."
            )
    else:
        logger.debug(
            f"System action 'handle_submit_business_sponsorship' called but conditions not met for instance "
            f"{workflow_instance.id} (Content Type: {workflow_instance.content_type.model}, "
            f"State: {workflow_instance.current_state.code})"
        )

# Registry for all system actions
SYSTEM_ACTIONS_REGISTRY = {
    'submit_business_sponsorship': handle_submit_business_sponsorship,
    # Example:
    # 'submit_credit_request': handle_submit_credit_request, 
    # 'submit_credit_review': handle_submit_credit_review,
}

def get_system_action_handler(action_code):
    """Retrieves a handler function from the registry."""
    return SYSTEM_ACTIONS_REGISTRY.get(action_code)
