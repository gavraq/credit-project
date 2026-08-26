from workflow_engine.registries.actions import register_action_handler
from workflow_engine.registries.artifacts import register_artifact_adapter
from workflow_engine.registries.artifact_types import register_artifact_type
from workflow_engine.registries.conditions import register_condition_handler
from workflow_engine.registries.definitions import register_artifact_definition_provider
from workflow_engine.registries.hooks import register_post_transition_hook

from .actions import (
    handle_submit_analysis_form,
    handle_submit_business_sponsorship,
    handle_submit_credit_approval,
    handle_submit_credit_compilation,
    handle_submit_credit_request,
    handle_submit_credit_review,
)
from .definitions import credit_workflow_artifact_definition_provider
from .artifacts import credit_workflow_artifact_adapter
from .conditions import credit_da_authorization_condition, business_sponsor_assignment_condition
from .hooks import auto_initialize_credit_forms


def register():
    register_artifact_type(
        "form",
        {
            "kind": "form",
            "capabilities": ["detail_endpoint", "writable", "workflow_reference"],
        },
    )
    register_artifact_adapter("creditapplication", credit_workflow_artifact_adapter)
    register_artifact_definition_provider(
        "creditapplication",
        credit_workflow_artifact_definition_provider,
    )

    register_condition_handler("credit.da_authorization", credit_da_authorization_condition)
    register_condition_handler("credit.business_sponsor_assignment", business_sponsor_assignment_condition)

    register_action_handler("submit_credit_request", handle_submit_credit_request)
    register_action_handler("submit_credit_review", handle_submit_credit_review)
    register_action_handler("submit_business_sponsorship", handle_submit_business_sponsorship)
    register_action_handler("submit_legal_review", handle_submit_analysis_form)
    register_action_handler("submit_credit_questionnaire", handle_submit_analysis_form)
    register_action_handler("submit_credit_analysis", handle_submit_analysis_form)
    register_action_handler("submit_credit_compilation", handle_submit_credit_compilation)
    register_action_handler("submit_credit_approval", handle_submit_credit_approval)

    register_post_transition_hook("credit.auto_initialize_forms", auto_initialize_credit_forms)
