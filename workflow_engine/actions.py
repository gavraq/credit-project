# File: credit-project/workflow_engine/actions.py
"""
System Action Handlers for Workflow Transitions

Naming Convention:
- submit_* : Terminal transitions that submit a form (may trigger parent workflow)
- edit_* / save_* : Non-terminal transitions for saving drafts (no handler needed)

Each handler receives:
- workflow_instance: The WorkflowInstance that just transitioned
- user: The user who performed the transition
- transition_obj: The Transition object that was executed
"""
import logging

logger = logging.getLogger(__name__)


def _get_parent_workflow_context(workflow_instance):
    """
    Helper to get parent credit application and workflow from a sub-form workflow instance.
    Returns (credit_application, parent_workflow_instance) or (None, None) if not found.
    """
    content_object = workflow_instance.content_object
    if not content_object or not hasattr(content_object, 'credit_application'):
        logger.error(f"Cannot find parent CreditApplication for workflow instance {workflow_instance.id}")
        return None, None

    parent_credit_application = content_object.credit_application
    if not parent_credit_application:
        logger.error(f"Parent CreditApplication not found for form {content_object.id}")
        return None, None

    parent_workflow_instance = parent_credit_application.workflow_instance
    if not parent_workflow_instance:
        logger.error(f"Parent workflow instance not found for CreditApplication {parent_credit_application.id}")
        return None, None

    return parent_credit_application, parent_workflow_instance


def _get_system_user():
    """Helper to get the system user for automated transitions."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    system_user = User.objects.filter(username='system').first()
    if not system_user:
        logger.error("System user not found for automated parent workflow transition")
    return system_user


def _perform_parent_transition(parent_workflow_instance, transition_code, user, comment):
    """Helper to perform a parent workflow transition with proper error handling."""
    try:
        logger.info(f"Attempting parent transition {transition_code} on workflow {parent_workflow_instance.id}")
        parent_workflow_instance.perform_transition(
            transition_code=transition_code,
            user=user,
            comments=comment
        )
        logger.info(
            f"Successfully transitioned parent workflow {parent_workflow_instance.id} "
            f"to {parent_workflow_instance.current_state.code}"
        )
        return True
    except Exception as e:
        logger.error(f"Error performing parent transition {transition_code}: {e}", exc_info=True)
        return False


# =============================================================================
# CREDIT REQUEST FORM HANDLERS
# =============================================================================

def handle_submit_credit_request(workflow_instance, user, transition_obj):
    """
    Handles Credit Request form submission (CR_TR_4).
    Triggers parent workflow transition PP_TR_1 (Credit Request -> Credit Review Pending).
    """
    logger.info(f"handle_submit_credit_request triggered for workflow {workflow_instance.id}")

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    # Only transition if parent is in the expected state
    if parent_wf.current_state.code != 'CREDIT_PAPER_CREDIT_REQUEST':
        logger.warning(
            f"Parent workflow not in CREDIT_PAPER_CREDIT_REQUEST state "
            f"(current: {parent_wf.current_state.code}). Skipping."
        )
        return

    _perform_parent_transition(
        parent_wf, 'PP_TR_1', user,
        "System: Auto-transitioned after Credit Request submission."
    )


# =============================================================================
# CREDIT REVIEW FORM HANDLERS
# =============================================================================

def handle_submit_credit_review(workflow_instance, user, transition_obj):
    """
    Handles Credit Review form submission (CRV_TR_4).
    Triggers parent workflow transition PP_TR_2 (Credit Review Pending -> Business Sponsor Pending).
    """
    logger.info(f"handle_submit_credit_review triggered for workflow {workflow_instance.id}")

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    # Only transition if parent is in the expected state
    if parent_wf.current_state.code != 'CREDIT_PAPER_CREDIT_REVIEW_PENDING':
        logger.warning(
            f"Parent workflow not in CREDIT_PAPER_CREDIT_REVIEW_PENDING state "
            f"(current: {parent_wf.current_state.code}). Skipping."
        )
        return

    _perform_parent_transition(
        parent_wf, 'PP_TR_2', user,
        "System: Auto-transitioned after Credit Review submission."
    )


# =============================================================================
# BUSINESS SPONSORSHIP FORM HANDLERS
# =============================================================================

def handle_submit_business_sponsorship(workflow_instance, user, transition_obj):
    """
    Handles Business Sponsorship form submission (BS_TR_4).
    Triggers parent workflow transition PP_TR_4 (Business Sponsor Pending -> Analysis Pending).
    """
    logger.info(f"handle_submit_business_sponsorship triggered for workflow {workflow_instance.id}")

    # Verify this is a BusinessSponsorshipForm in submitted state
    if workflow_instance.content_type.model != 'businesssponsorshipform':
        logger.debug(f"Not a BusinessSponsorshipForm, skipping")
        return
    if workflow_instance.current_state.code != 'BUSINESS_SPONSOR_SUBMITTED':
        logger.debug(f"Not in SUBMITTED state, skipping")
        return

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    # Only transition if parent is in the expected state
    if parent_wf.current_state.code != 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING':
        logger.warning(
            f"Parent workflow not in CREDIT_PAPER_BUSINESS_SPONSOR_PENDING state "
            f"(current: {parent_wf.current_state.code}). Skipping."
        )
        return

    _perform_parent_transition(
        parent_wf, 'PP_TR_4', user,
        "System: Auto-transitioned after Business Sponsorship submission."
    )


# =============================================================================
# ANALYSIS PHASE HANDLERS (Legal Review, Credit Questionnaire, Credit Analysis)
# =============================================================================

def handle_submit_analysis_form(workflow_instance, user, transition_obj):
    """
    Handles submission of any Analysis phase form (Legal Review, Credit Questionnaire, Credit Analysis).
    Checks if ALL three forms are submitted, and if so, triggers parent workflow transition
    PP_TR_5 (Analysis Pending -> Compilation).

    This handler is called by:
    - submit_legal_review (LR_TR_4)
    - submit_credit_questionnaire (CQ_TR_4)
    - submit_credit_analysis (CA_TR_4)
    """
    logger.info(f"handle_submit_analysis_form triggered for workflow {workflow_instance.id}")

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    # Only check if parent is in Analysis Pending state
    if parent_wf.current_state.code != 'CREDIT_PAPER_ANALYSIS_PENDING':
        logger.info(
            f"Parent workflow not in CREDIT_PAPER_ANALYSIS_PENDING state "
            f"(current: {parent_wf.current_state.code}). Skipping analysis completion check."
        )
        return

    # Check if all three analysis forms are submitted
    forms_status = []

    # Credit Questionnaire
    if hasattr(credit_app, 'credit_questionnaire_form') and credit_app.credit_questionnaire_form:
        cq = credit_app.credit_questionnaire_form
        if cq.workflow_instance:
            is_submitted = cq.workflow_instance.current_state.code == 'CREDIT_QUESTIONNAIRE_SUBMITTED'
            forms_status.append(('Credit Questionnaire', is_submitted))
        else:
            logger.warning("Credit Questionnaire form has no workflow instance")
            return
    else:
        logger.warning(f"Credit Questionnaire form not found for application {credit_app.id}")
        return

    # Legal Review
    if hasattr(credit_app, 'legal_review_form') and credit_app.legal_review_form:
        lr = credit_app.legal_review_form
        if lr.workflow_instance:
            is_submitted = lr.workflow_instance.current_state.code == 'LEGAL_REVIEW_SUBMITTED'
            forms_status.append(('Legal Review', is_submitted))
        else:
            logger.warning("Legal Review form has no workflow instance")
            return
    else:
        logger.warning(f"Legal Review form not found for application {credit_app.id}")
        return

    # Credit Analysis
    if hasattr(credit_app, 'credit_analysis_form') and credit_app.credit_analysis_form:
        ca = credit_app.credit_analysis_form
        if ca.workflow_instance:
            is_submitted = ca.workflow_instance.current_state.code == 'CREDIT_ANALYSIS_SUBMITTED'
            forms_status.append(('Credit Analysis', is_submitted))
        else:
            logger.warning("Credit Analysis form has no workflow instance")
            return
    else:
        logger.warning(f"Credit Analysis form not found for application {credit_app.id}")
        return

    # Log status
    logger.info("Analysis forms completion status:")
    for form_name, is_submitted in forms_status:
        logger.info(f"  - {form_name}: {'SUBMITTED' if is_submitted else 'NOT SUBMITTED'}")

    # Check if all are submitted
    all_submitted = all(status[1] for status in forms_status) and len(forms_status) == 3

    if all_submitted:
        system_user = _get_system_user()
        if system_user:
            _perform_parent_transition(
                parent_wf, 'PP_TR_5', system_user,
                "System: Auto-transitioned after all analysis forms submitted."
            )
    else:
        completed_count = len([s for s in forms_status if s[1]])
        logger.info(f"Not all analysis forms submitted ({completed_count}/3). Waiting for remaining forms.")


# =============================================================================
# CREDIT COMPILATION FORM HANDLERS
# =============================================================================

def handle_submit_credit_compilation(workflow_instance, user, transition_obj):
    """
    Handles Credit Compilation form submission (CC_TR_4).
    Triggers parent workflow transition PP_TR_7 (Compilation -> Approval Pending).
    """
    logger.info(f"handle_submit_credit_compilation triggered for workflow {workflow_instance.id}")

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    # Only transition if parent is in the expected state
    if parent_wf.current_state.code != 'CREDIT_PAPER_COMPILATION':
        logger.warning(
            f"Parent workflow not in CREDIT_PAPER_COMPILATION state "
            f"(current: {parent_wf.current_state.code}). Skipping."
        )
        return

    _perform_parent_transition(
        parent_wf, 'PP_TR_7', user,
        "System: Auto-transitioned after Credit Compilation submission."
    )


# =============================================================================
# CREDIT APPROVAL FORM HANDLERS
# =============================================================================

def handle_submit_credit_approval(workflow_instance, user, transition_obj):
    """
    Handles Credit Approval form submission (CAP_TR_4).
    Triggers parent workflow transition based on approval decision:
    - PP_TR_8 (Approved) if decision is 'approved' or 'approved_with_conditions'
    - PP_TR_9 (Rejected) if decision is 'rejected'
    """
    logger.info(f"handle_submit_credit_approval triggered for workflow {workflow_instance.id}")

    approval_form = workflow_instance.content_object
    if not approval_form:
        logger.error(f"CreditApprovalForm not found for workflow instance {workflow_instance.id}")
        return

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    # Only transition if parent is in the expected state
    if parent_wf.current_state.code != 'CREDIT_PAPER_APPROVAL_PENDING':
        logger.warning(
            f"Parent workflow not in CREDIT_PAPER_APPROVAL_PENDING state "
            f"(current: {parent_wf.current_state.code}). Skipping."
        )
        return

    # Determine transition based on approval decision
    approval_decision = approval_form.approval_decision
    logger.info(f"Approval decision: {approval_decision}")

    if approval_decision in ['approved', 'approved_with_conditions']:
        transition_code = 'PP_TR_8'
        comment = f"System: Auto-approved with decision '{approval_decision}'"
    elif approval_decision == 'rejected':
        transition_code = 'PP_TR_9'
        comment = f"System: Auto-rejected with decision '{approval_decision}'"
    else:
        logger.warning(f"Unhandled approval decision '{approval_decision}'. No parent transition triggered.")
        return

    system_user = _get_system_user()
    if system_user:
        _perform_parent_transition(parent_wf, transition_code, system_user, comment)


# =============================================================================
# SYSTEM ACTIONS REGISTRY
# =============================================================================
# Maps system_action codes (from transition definitions) to handler functions.
#
# Naming convention in transitions:
#   - submit_* : For terminal/final submissions
#   - edit_* : For draft saves (no handler needed, not in registry)

SYSTEM_ACTIONS_REGISTRY = {
    # Credit Request
    'submit_credit_request': handle_submit_credit_request,

    # Credit Review
    'submit_credit_review': handle_submit_credit_review,

    # Business Sponsorship
    'submit_business_sponsorship': handle_submit_business_sponsorship,

    # Analysis Phase (all three call the same handler that checks completion)
    'submit_legal_review': handle_submit_analysis_form,
    'submit_credit_questionnaire': handle_submit_analysis_form,
    'submit_credit_analysis': handle_submit_analysis_form,

    # Credit Compilation
    'submit_credit_compilation': handle_submit_credit_compilation,

    # Credit Approval
    'submit_credit_approval': handle_submit_credit_approval,
}


def get_system_action_handler(action_code):
    """Retrieves a handler function from the registry."""
    handler = SYSTEM_ACTIONS_REGISTRY.get(action_code)
    if not handler:
        logger.debug(f"No handler registered for system action '{action_code}'")
    return handler
