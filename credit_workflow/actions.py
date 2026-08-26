"""
Credit workflow action handlers.

These handlers remain domain-specific and are registered with the generic
workflow engine at app startup.
"""
import logging

logger = logging.getLogger(__name__)


def _get_parent_workflow_context(workflow_instance):
    content_object = workflow_instance.content_object
    if not content_object or not hasattr(content_object, "credit_application"):
        logger.error("Cannot find parent CreditApplication for workflow instance %s", workflow_instance.id)
        return None, None

    parent_credit_application = content_object.credit_application
    if not parent_credit_application:
        logger.error("Parent CreditApplication not found for form %s", content_object.id)
        return None, None

    parent_workflow_instance = parent_credit_application.workflow_instance
    if not parent_workflow_instance:
        logger.error(
            "Parent workflow instance not found for CreditApplication %s",
            parent_credit_application.id,
        )
        return None, None

    return parent_credit_application, parent_workflow_instance


def _get_system_user():
    from django.contrib.auth import get_user_model

    User = get_user_model()
    system_user = User.objects.filter(username="system").first()
    if not system_user:
        logger.error("System user not found for automated parent workflow transition")
    return system_user


def _perform_parent_transition(parent_workflow_instance, transition_code, user, comment):
    try:
        parent_workflow_instance.perform_transition(
            transition_code=transition_code,
            user=user,
            comments=comment,
        )
        return True
    except Exception as exc:
        logger.error(
            "Error performing parent transition %s on workflow %s: %s",
            transition_code,
            parent_workflow_instance.id,
            exc,
            exc_info=True,
        )
        return False


def handle_submit_credit_request(workflow_instance, user, transition_obj):
    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    if parent_wf.current_state.code != "CREDIT_PAPER_CREDIT_REQUEST":
        return

    _perform_parent_transition(
        parent_wf,
        "PP_TR_1",
        user,
        "System: Auto-transitioned after Credit Request submission.",
    )


def handle_submit_credit_review(workflow_instance, user, transition_obj):
    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    if parent_wf.current_state.code != "CREDIT_PAPER_CREDIT_REVIEW_PENDING":
        return

    _perform_parent_transition(
        parent_wf,
        "PP_TR_2",
        user,
        "System: Auto-transitioned after Credit Review submission.",
    )


def handle_submit_business_sponsorship(workflow_instance, user, transition_obj):
    if workflow_instance.content_type.model != "businesssponsorshipform":
        return
    if workflow_instance.current_state.code != "BUSINESS_SPONSOR_SUBMITTED":
        return

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    if parent_wf.current_state.code != "CREDIT_PAPER_BUSINESS_SPONSOR_PENDING":
        return

    _perform_parent_transition(
        parent_wf,
        "PP_TR_4",
        user,
        "System: Auto-transitioned after Business Sponsorship submission.",
    )


def handle_submit_analysis_form(workflow_instance, user, transition_obj):
    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    if parent_wf.current_state.code != "CREDIT_PAPER_ANALYSIS_PENDING":
        return

    forms_status = []

    if hasattr(credit_app, "credit_questionnaire_form") and credit_app.credit_questionnaire_form:
        cq = credit_app.credit_questionnaire_form
        if not cq.workflow_instance:
            return
        forms_status.append(
            ("Credit Questionnaire", cq.workflow_instance.current_state.code == "CREDIT_QUESTIONNAIRE_SUBMITTED")
        )
    else:
        return

    if hasattr(credit_app, "legal_review_form") and credit_app.legal_review_form:
        lr = credit_app.legal_review_form
        if not lr.workflow_instance:
            return
        forms_status.append(("Legal Review", lr.workflow_instance.current_state.code == "LEGAL_REVIEW_SUBMITTED"))
    else:
        return

    if hasattr(credit_app, "credit_analysis_form") and credit_app.credit_analysis_form:
        ca = credit_app.credit_analysis_form
        if not ca.workflow_instance:
            return
        forms_status.append(
            ("Credit Analysis", ca.workflow_instance.current_state.code == "CREDIT_ANALYSIS_SUBMITTED")
        )
    else:
        return

    if all(status[1] for status in forms_status) and len(forms_status) == 3:
        system_user = _get_system_user()
        if system_user:
            _perform_parent_transition(
                parent_wf,
                "PP_TR_5",
                system_user,
                "System: Auto-transitioned after all analysis forms submitted.",
            )


def handle_submit_credit_compilation(workflow_instance, user, transition_obj):
    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    if parent_wf.current_state.code != "CREDIT_PAPER_COMPILATION":
        return

    _perform_parent_transition(
        parent_wf,
        "PP_TR_7",
        user,
        "System: Auto-transitioned after Credit Compilation submission.",
    )


def handle_submit_credit_approval(workflow_instance, user, transition_obj):
    approval_form = workflow_instance.content_object
    if not approval_form:
        return

    credit_app, parent_wf = _get_parent_workflow_context(workflow_instance)
    if not parent_wf:
        return

    if parent_wf.current_state.code != "CREDIT_PAPER_APPROVAL_PENDING":
        return

    approval_decision = approval_form.approval_decision
    if approval_decision in ["approved", "approved_with_conditions"]:
        transition_code = "PP_TR_8"
        comment = f"System: Auto-approved with decision '{approval_decision}'"
    elif approval_decision == "rejected":
        transition_code = "PP_TR_9"
        comment = f"System: Auto-rejected with decision '{approval_decision}'"
    else:
        return

    system_user = _get_system_user()
    if system_user:
        _perform_parent_transition(parent_wf, transition_code, system_user, comment)
