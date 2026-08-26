import logging

from workflow_engine.registries.actions import get_action_handler
from workflow_engine.registries.conditions import iter_condition_handlers
from workflow_engine.registries.hooks import iter_post_transition_hooks

logger = logging.getLogger(__name__)


def _user_role_name(user):
    role = getattr(user, "role", None)
    return getattr(role, "name", None)


def _normalize_role(value):
    return value.strip().lower().replace(" ", "_")


def user_can_execute_transition(workflow_instance, transition, user):
    """Evaluate whether a user can execute a transition."""
    user_role_name = _user_role_name(user)

    role_permits = False
    if not transition.allowed_roles:
        role_permits = True
    elif user_role_name:
        allowed_roles_norm = [_normalize_role(role) for role in transition.allowed_roles]
        role_permits = _normalize_role(user_role_name) in allowed_roles_norm

    if not role_permits:
        return False

    for condition_code, handler in iter_condition_handlers():
        try:
            permitted = handler(
                workflow_instance=workflow_instance,
                transition=transition,
                user=user,
            )
        except Exception as exc:
            logger.error(
                "Condition handler '%s' failed for workflow instance %s: %s",
                condition_code,
                workflow_instance.id,
                exc,
                exc_info=True,
            )
            return False

        if not permitted:
            logger.debug(
                "Condition handler '%s' rejected transition '%s' for workflow instance %s",
                condition_code,
                transition.code,
                workflow_instance.id,
            )
            return False

    return True


def get_allowed_transitions_for_user(workflow_instance, user):
    """Return transitions the given user is allowed to perform."""
    possible_transitions = workflow_instance.workflow.transitions.filter(
        from_state=workflow_instance.current_state
    )
    return [
        transition
        for transition in possible_transitions
        if user_can_execute_transition(workflow_instance, transition, user)
    ]


def execute_transition(
    workflow_instance,
    transition_code,
    user,
    comments="",
    system_context=None,
):
    """Execute a workflow transition and invoke any registered action handlers."""
    from workflow_engine.models import StateLog, Transition

    system_context = system_context or {}

    try:
        transition = workflow_instance.workflow.transitions.get(
            code=transition_code,
            from_state=workflow_instance.current_state,
        )
    except Transition.DoesNotExist as exc:
        raise ValueError(
            f"Transition '{transition_code}' is not valid from current state "
            f"'{workflow_instance.current_state.code}'"
        ) from exc

    if not user_can_execute_transition(workflow_instance, transition, user):
        allowed_role_codes = transition.allowed_roles or []
        if not (user.username == "system" and "system" in allowed_role_codes):
            raise PermissionError(
                f"User does not have permission to perform transition '{transition_code}'"
            )

    StateLog.objects.create(
        workflow_instance=workflow_instance,
        transition=transition,
        from_state=workflow_instance.current_state,
        to_state=transition.to_state,
        performed_by=user,
        comments=comments,
        system_context=system_context,
    )

    old_state = workflow_instance.current_state
    workflow_instance.current_state = transition.to_state
    workflow_instance.save(update_fields=["current_state", "updated_at"])

    logger.info(
        "Workflow transition: %s -> %s via %s for instance %s",
        old_state.code,
        workflow_instance.current_state.code,
        transition_code,
        workflow_instance.id,
    )

    if transition.system_action:
        handler = get_action_handler(transition.system_action)
        if handler:
            try:
                logger.info(
                    "Executing system action '%s' for instance %s",
                    transition.system_action,
                    workflow_instance.id,
                )
                handler(workflow_instance, user, transition)
            except Exception as exc:
                logger.error(
                    "Error executing system action '%s' for instance %s: %s",
                    transition.system_action,
                    workflow_instance.id,
                    exc,
                    exc_info=True,
                )
        else:
            logger.warning(
                "No handler found for system action '%s' for instance %s",
                transition.system_action,
                workflow_instance.id,
            )

    for hook_code, hook in iter_post_transition_hooks():
        try:
            hook(
                workflow_instance=workflow_instance,
                transition=transition,
                user=user,
                system_context=system_context,
            )
        except Exception as exc:
            logger.error(
                "Post-transition hook '%s' failed for instance %s: %s",
                hook_code,
                workflow_instance.id,
                exc,
                exc_info=True,
            )

    return workflow_instance
