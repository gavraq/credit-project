import logging

logger = logging.getLogger(__name__)


def credit_da_authorization_condition(workflow_instance, transition, user):
    """Credit approval authorization based on delegated authority."""
    user_role_name = getattr(getattr(user, "role", None), "name", None)
    if user_role_name != "Credit Analyst":
        return True

    if "approve" not in transition.code.lower():
        return True

    if not workflow_instance.content_type or workflow_instance.content_type.model != "creditapplication":
        return True

    try:
        from workflow_engine.da_authorization import can_user_approve_credit_application

        credit_app = workflow_instance.content_object
        if credit_app:
            return can_user_approve_credit_application(user, credit_app)
        return False
    except Exception as exc:
        logger.error("Error checking DA authorization: %s", exc, exc_info=True)
        return False


def business_sponsor_assignment_condition(workflow_instance, transition, user):
    """Ensure only assigned sponsors can action business sponsorship workflows."""
    if workflow_instance.workflow.code != "BUSINESS_SPONSORSHIP":
        return True

    try:
        bsf = workflow_instance.business_sponsorship_forms.first()
        if not bsf:
            return True

        senior_sponsor = getattr(bsf, "senior_business_sponsor", None) or getattr(
            bsf, "senior_business_sponsor_id", None
        )
        second_sponsor = getattr(bsf, "second_business_sponsor", None) or getattr(
            bsf, "second_business_sponsor_id", None
        )

        is_senior_sponsor = senior_sponsor and senior_sponsor.id == user.id
        is_second_sponsor = second_sponsor and second_sponsor.id == user.id
        permitted = is_senior_sponsor or is_second_sponsor
        if not permitted:
            logger.debug("User %s is not an assigned sponsor", user.username)
        return permitted
    except Exception as exc:
        logger.error("Error checking sponsor authorization: %s", exc, exc_info=True)
        return False
