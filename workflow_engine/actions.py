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

def handle_submit_credit_request(workflow_instance, user, transition_obj):
    """
    Metadata-driven handler for credit request submission.
    Uses transition metadata to determine parent workflow actions.
    """
    logger.info(
        f"System action 'handle_submit_credit_request' triggered for "
        f"sub-workflow instance {workflow_instance.id} (State: {workflow_instance.current_state.code})"
    )
    
    # Check if there's metadata defining parent workflow behavior
    metadata = transition_obj.metadata or {}
    parent_workflow_config = metadata.get('parent_workflow')
    
    if not parent_workflow_config:
        logger.warning(f"No parent_workflow metadata found for transition {transition_obj.code}")
        return
    
    # Use metadata-driven approach for parent workflow transition
    try:
        # Get the parent workflow instance through the content object
        content_object = workflow_instance.content_object
        if not content_object or not hasattr(content_object, 'credit_application'):
            logger.error(f"Cannot find parent CreditApplication for workflow instance {workflow_instance.id}")
            return
            
        parent_credit_application = content_object.credit_application
        parent_workflow_instance = parent_credit_application.workflow_instance
        
        if not parent_workflow_instance:
            logger.error(f"No parent workflow instance found for CreditApplication {parent_credit_application.id}")
            return
        
        # Extract transition information from metadata
        target_transition_code = parent_workflow_config.get('transition_code')
        required_from_state = parent_workflow_config.get('from_state')
        
        if not target_transition_code:
            logger.error(f"No transition_code specified in parent_workflow metadata for {transition_obj.code}")
            return
            
        # Verify parent is in correct state (if specified)
        if required_from_state and parent_workflow_instance.current_state.code != required_from_state:
            logger.warning(
                f"Parent workflow {parent_workflow_instance.id} is not in required state "
                f"{required_from_state} (current: {parent_workflow_instance.current_state.code}). "
                f"Skipping parent transition."
            )
            return
        
        # Perform the parent workflow transition
        logger.info(f"Executing parent workflow transition {target_transition_code}")
        parent_workflow_instance.perform_transition(
            transition_code=target_transition_code,
            user=user,
            comments=f"System: Auto-transitioned after {transition_obj.name}"
        )
        
        logger.info(
            f"Successfully transitioned parent workflow {parent_workflow_instance.id} "
            f"to {parent_workflow_instance.current_state.code}"
        )
        
    except Exception as e:
        logger.error(f"Error in metadata-driven parent workflow transition: {e}", exc_info=True)

def handle_perform_legal_review(workflow_instance, user, transition_obj):
    """
    Placeholder system action for legal review transitions.
    Currently, this action performs no specific operations beyond logging.
    'workflow_instance' is the instance of the LegalReviewForm's workflow.
    'user' is the user who triggered the original sub-workflow transition.
    'transition_obj' is the Transition object that was just performed on the sub-workflow.
    """
    logger.info(
        f"System action 'handle_perform_legal_review' triggered for "
        f"sub-workflow instance {workflow_instance.id} (State: {workflow_instance.current_state.code}) "
        f"by user {user.username} via transition {transition_obj.code}."
    )
    # Future logic for legal review system actions can be added here.
    pass

def handle_submit_credit_analysis(workflow_instance, user, transition_obj):
    """
    Handles the system action when the analysis phase is complete.
    Checks if all analysis forms (Credit Questionnaire, Legal Review, Credit Analysis) are submitted,
    and if so, transitions the parent workflow from Analysis Pending to Compilation.
    """
    from credit_applications.models import CreditApplication # Delayed import
    
    logger.info(
        f"System action 'handle_submit_credit_analysis' triggered for "
        f"sub-workflow instance {workflow_instance.id} (State: {workflow_instance.current_state.code})"
    )

    # Get the parent credit application through the content object
    content_object = workflow_instance.content_object
    if not content_object or not hasattr(content_object, 'credit_application'):
        logger.error(f"Cannot find parent CreditApplication for workflow instance {workflow_instance.id}")
        return

    parent_credit_application = content_object.credit_application
    if not parent_credit_application:
        logger.error(f"Parent CreditApplication not found for form {content_object.id}")
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

    # Check if parent is in Analysis Pending state
    if parent_workflow_instance.current_state.code != 'CREDIT_PAPER_ANALYSIS_PENDING':
        logger.warning(
            f"Parent workflow {parent_workflow_instance.id} is not in "
            f"CREDIT_PAPER_ANALYSIS_PENDING state (current: {parent_workflow_instance.current_state.code}). "
            f"Skipping analysis completion check."
        )
        return

    # Check if all analysis forms are submitted
    analysis_forms_completed = []
    
    # Check Credit Questionnaire Form
    if hasattr(parent_credit_application, 'credit_questionnaire_form'):
        cq_form = parent_credit_application.credit_questionnaire_form
        if cq_form.workflow_instance:
            is_submitted = cq_form.workflow_instance.current_state.code == 'CREDIT_QUESTIONNAIRE_SUBMITTED'
            analysis_forms_completed.append(('Credit Questionnaire', is_submitted))
        else:
            logger.warning(f"Credit Questionnaire form exists but has no workflow instance")
            return
    else:
        logger.warning(f"Credit Questionnaire form not found for application {parent_credit_application.id}")
        return
    
    # Check Legal Review Form
    if hasattr(parent_credit_application, 'legal_review_form'):
        lr_form = parent_credit_application.legal_review_form
        if lr_form.workflow_instance:
            is_submitted = lr_form.workflow_instance.current_state.code == 'LEGAL_REVIEW_SUBMITTED'
            analysis_forms_completed.append(('Legal Review', is_submitted))
        else:
            logger.warning(f"Legal Review form exists but has no workflow instance")
            return
    else:
        logger.warning(f"Legal Review form not found for application {parent_credit_application.id}")
        return
    
    # Check Credit Analysis Form
    if hasattr(parent_credit_application, 'credit_analysis_form'):
        ca_form = parent_credit_application.credit_analysis_form
        if ca_form.workflow_instance:
            is_submitted = ca_form.workflow_instance.current_state.code == 'CREDIT_ANALYSIS_SUBMITTED'
            analysis_forms_completed.append(('Credit Analysis', is_submitted))
        else:
            logger.warning(f"Credit Analysis form exists but has no workflow instance")
            return
    else:
        logger.warning(f"Credit Analysis form not found for application {parent_credit_application.id}")
        return

    # Check if all forms are submitted
    all_submitted = all(form_status[1] for form_status in analysis_forms_completed)
    
    logger.info(f"Analysis forms completion status:")
    for form_name, is_submitted in analysis_forms_completed:
        logger.info(f"  - {form_name}: {'SUBMITTED' if is_submitted else 'NOT SUBMITTED'}")

    if all_submitted and len(analysis_forms_completed) == 3:
        try:
            # Use system user for automated parent workflow transitions
            from django.contrib.auth import get_user_model
            User = get_user_model()
            system_user = User.objects.filter(username='system').first()
            
            if not system_user:
                logger.error("System user not found for automated parent workflow transition")
                return
            
            logger.info(f"All analysis forms submitted. Attempting to perform PP_TR_5 on parent workflow {parent_workflow_instance.id} using system user")
            parent_workflow_instance.perform_transition(
                transition_code='PP_TR_5',
                user=system_user, 
                comments="System: Auto-transitioned after all analysis forms submitted."
            )
            logger.info(
                f"Successfully transitioned parent workflow {parent_workflow_instance.id} "
                f"to {parent_workflow_instance.current_state.code}"
            )
        except Exception as e:
            logger.error(f"Error transitioning parent workflow {parent_workflow_instance.id} using PP_TR_5: {e}", exc_info=True)
    else:
        logger.info(
            f"Not all analysis forms are submitted yet "
            f"({len([f for f in analysis_forms_completed if f[1]])}/{len(analysis_forms_completed)} completed). "
            f"Waiting for remaining forms."
        )


def handle_submit_credit_approval(workflow_instance, user, transition_obj):
    """
    Handles the system action when the approval phase is complete.
    Triggers the parent workflow transition from Approval Pending to Approved/Rejected
    based on the approval decision.
    
    'workflow_instance' is the instance of the CreditApprovalForm's workflow.
    'user' is the user who triggered the original sub-workflow transition.
    'transition_obj' is the Transition object that was just performed on the sub-workflow.
    """
    logger.info(f"handle_submit_credit_approval called for workflow instance {workflow_instance.id}")
    
    # Get the parent credit application
    try:
        approval_form = workflow_instance.content_object
        if not approval_form:
            logger.error(f"Content object (CreditApprovalForm) not found for workflow instance {workflow_instance.id}")
            return
            
        credit_application = approval_form.credit_application
        parent_workflow_instance = credit_application.workflow_instance
        logger.info(f"Found parent workflow instance {parent_workflow_instance.id} in state {parent_workflow_instance.current_state.code}")
    except Exception as e:
        logger.error(f"Error accessing parent workflow from approval form workflow {workflow_instance.id}: {e}", exc_info=True)
        return

    # Check the approval decision to determine which parent transition to trigger
    try:
        approval_decision = approval_form.approval_decision
        logger.info(f"Approval decision: {approval_decision}")
        
        # Determine the parent transition based on approval decision
        if approval_decision in ['approved', 'approved_with_conditions']:
            parent_transition_code = 'PP_TR_8'  # Approve Credit Paper
            auto_comment = f"System: Auto-approved after approval decision: {approval_decision}"
        elif approval_decision == 'rejected':
            parent_transition_code = 'PP_TR_9'  # Reject Credit Paper  
            auto_comment = f"System: Auto-rejected after approval decision: {approval_decision}"
        else:
            logger.warning(f"Unhandled approval decision '{approval_decision}'. No parent transition will be triggered.")
            return
            
        # Use system user for automated parent workflow transitions
        from django.contrib.auth import get_user_model
        User = get_user_model()
        system_user = User.objects.filter(username='system').first()
        
        if not system_user:
            logger.error("System user not found for automated parent workflow transition")
            return
        
        logger.info(f"Approval submitted with decision '{approval_decision}'. Attempting to perform {parent_transition_code} on parent workflow {parent_workflow_instance.id} using system user")
        parent_workflow_instance.perform_transition(
            transition_code=parent_transition_code,
            user=system_user, 
            comments=auto_comment
        )
        logger.info(
            f"Successfully transitioned parent workflow {parent_workflow_instance.id} "
            f"to {parent_workflow_instance.current_state.code} based on approval decision '{approval_decision}'"
        )
        
    except Exception as e:
        logger.error(f"Error transitioning parent workflow {parent_workflow_instance.id} after approval submission: {e}", exc_info=True)


# Registry for all system actions
SYSTEM_ACTIONS_REGISTRY = {
    'submit_business_sponsorship': handle_submit_business_sponsorship,
    'submit_credit_request': handle_submit_credit_request,
    'perform_legal_review': handle_perform_legal_review,
    'submit_credit_analysis': handle_submit_credit_analysis,
    'submit_credit_approval': handle_submit_credit_approval,
}

def get_system_action_handler(action_code):
    """Retrieves a handler function from the registry."""
    return SYSTEM_ACTIONS_REGISTRY.get(action_code)
