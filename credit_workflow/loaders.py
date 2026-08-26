import json
from pathlib import Path

from django.db import transaction

from backend.users.models import Role, User
from workflow_engine.models import State, Transition, Workflow


DEFAULT_CONFIG_PATH = (
    Path(__file__).resolve().parent.parent
    / "config"
    / "workflows"
    / "credit"
    / "credit_workflows.json"
)


class WorkflowConfigError(Exception):
    """Raised when workflow configuration is invalid."""


def normalize_state_metadata(metadata):
    """Return canonical artifact-oriented metadata for workflow states."""
    normalized = dict(metadata or {})
    legacy_artifacts = normalized.pop("relevant_sub_processes", None)
    if "relevant_artifacts" not in normalized and legacy_artifacts is not None:
        normalized["relevant_artifacts"] = legacy_artifacts
    return normalized


def load_credit_workflow_config(config_path=None):
    path = Path(config_path or DEFAULT_CONFIG_PATH)
    with path.open("r", encoding="utf-8") as config_file:
        payload = json.load(config_file)

    workflows = payload.get("workflows")
    if not isinstance(workflows, list):
        raise WorkflowConfigError("Config must contain a top-level 'workflows' list")

    validate_credit_workflow_config(workflows)
    return workflows


def validate_credit_workflow_config(workflows):
    if not workflows:
        raise WorkflowConfigError("At least one workflow definition is required")

    for workflow in workflows:
        definition = workflow.get("definition", {})
        if not definition.get("code"):
            raise WorkflowConfigError("Each workflow definition must include 'definition.code'")
        if not definition.get("name"):
            raise WorkflowConfigError(
                f"Workflow '{definition.get('code', '<missing>')}' is missing 'definition.name'"
            )

        states = workflow.get("states", [])
        transitions = workflow.get("transitions", [])
        if not states:
            raise WorkflowConfigError(f"Workflow '{definition['code']}' must define states")

        state_codes = {state["code"] for state in states if state.get("code")}
        initial_states = [state for state in states if state.get("is_initial")]
        if len(initial_states) != 1:
            raise WorkflowConfigError(
                f"Workflow '{definition['code']}' must define exactly one initial state"
            )

        for state in states:
            metadata = normalize_state_metadata(state.get("metadata", {}))
            if definition["code"] == "CREDIT_PAPER" and "relevant_artifacts" not in metadata:
                raise WorkflowConfigError(
                    f"Workflow '{definition['code']}' state '{state.get('code')}' "
                    "must define 'relevant_artifacts'"
                )

        for transition in transitions:
            if transition.get("from_code") not in state_codes:
                raise WorkflowConfigError(
                    f"Workflow '{definition['code']}' transition '{transition.get('code')}' "
                    f"references unknown from_code '{transition.get('from_code')}'"
                )
            if transition.get("to_code") not in state_codes:
                raise WorkflowConfigError(
                    f"Workflow '{definition['code']}' transition '{transition.get('code')}' "
                    f"references unknown to_code '{transition.get('to_code')}'"
                )


def setup_system_user_and_role():
    system_role, _ = Role.objects.get_or_create(
        name="system",
        defaults={"description": "A role for automated system actions."},
    )
    system_user, created_user = User.objects.get_or_create(
        username="system",
        defaults={
            "email": "system@example.com",
            "first_name": "System",
            "last_name": "User",
            "employee_id": "SYSTEM001",
        },
    )
    if created_user:
        system_user.set_unusable_password()
        system_user.save()

    if system_user.role != system_role:
        system_user.role = system_role
        system_user.save()


@transaction.atomic
def sync_credit_workflow_config(workflows):
    setup_system_user_and_role()

    for workflow_payload in workflows:
        definition = workflow_payload["definition"]
        workflow, _ = Workflow.objects.update_or_create(
            code=definition["code"],
            defaults={
                "name": definition["name"],
                "description": definition.get("description", ""),
                "metadata": definition.get("metadata", {}),
            },
        )

        state_map = {}
        for state_payload in workflow_payload["states"]:
            state, _ = State.objects.update_or_create(
                workflow=workflow,
                code=state_payload["code"],
                defaults={
                    "name": state_payload["name"],
                    "description": state_payload.get("description", ""),
                    "is_initial": state_payload.get("is_initial", False),
                    "is_terminal": state_payload.get("is_terminal", False),
                    "metadata": normalize_state_metadata(state_payload.get("metadata", {})),
                },
            )
            state_map[state.code] = state

        for transition_payload in workflow_payload.get("transitions", []):
            Transition.objects.update_or_create(
                workflow=workflow,
                code=transition_payload["code"],
                defaults={
                    "name": transition_payload["name"],
                    "description": transition_payload.get("description", ""),
                    "from_state": state_map[transition_payload["from_code"]],
                    "to_state": state_map[transition_payload["to_code"]],
                    "allowed_roles": transition_payload.get("allowed_roles", []),
                    "conditions": transition_payload.get("conditions", {}),
                    "system_action": transition_payload.get("system_action"),
                    "metadata": transition_payload.get("metadata", {}),
                },
            )
