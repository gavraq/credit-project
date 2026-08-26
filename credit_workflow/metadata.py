import logging

from django.core.exceptions import ObjectDoesNotExist

from credit_workflow.definitions import (
    get_credit_artifact_definition,
    get_credit_artifact_field_mappings,
    get_credit_artifact_model_map,
    get_credit_artifact_permissions,
    get_credit_artifact_prefixes,
)
from credit_workflow.workflow_context import (
    FormMetadataError,
    PARENT_WORKFLOW_CODE,
    get_parent_workflow,
)
from workflow_engine.models import State, Workflow

logger = logging.getLogger(__name__)


def get_artifact_metadata(artifact_key):
    """Get metadata for a specific credit workflow artifact."""
    try:
        artifact_definition = get_credit_artifact_definition(artifact_key)
        logger.info("Found metadata for artifact %s in registered artifact definitions", artifact_key)
        return artifact_definition
    except (Workflow.DoesNotExist, ObjectDoesNotExist):
        error_msg = (
            f"Parent workflow '{PARENT_WORKFLOW_CODE}' not found when getting form metadata "
            f"for '{artifact_key}'"
        )
        logger.error(error_msg)
        raise FormMetadataError(error_msg)
    except FormMetadataError:
        raise
    except Exception as exc:
        error_msg = f"Error getting artifact metadata for '{artifact_key}': {exc}"
        logger.error(error_msg)
        raise FormMetadataError(error_msg)


def get_form_metadata(form_name):
    """Compatibility alias for the artifact metadata helper."""
    return get_artifact_metadata(form_name)


def get_relevant_artifacts_for_state(parent_state_code):
    """Get the credit workflow artifacts relevant to a parent workflow state."""
    try:
        parent_workflow = get_parent_workflow()
        state = State.objects.get(workflow=parent_workflow, code=parent_state_code)

        if state.metadata and "relevant_artifacts" in state.metadata:
            logger.info(
                "Found relevant_artifacts in metadata for state %s: %s",
                parent_state_code,
                state.metadata["relevant_artifacts"],
            )
            return state.metadata["relevant_artifacts"]

        if state.metadata and "relevant_sub_processes" in state.metadata:
            logger.info(
                "Found legacy relevant_sub_processes in metadata for state %s: %s",
                parent_state_code,
                state.metadata["relevant_sub_processes"],
            )
            return state.metadata["relevant_sub_processes"]

        logger.info(
            "No relevant_artifacts found in metadata for state %s, using default",
            parent_state_code,
        )
        return ["credit_request_form"]
    except (Workflow.DoesNotExist, State.DoesNotExist, ObjectDoesNotExist) as exc:
        logger.warning(
            "Error getting relevant artifacts for state %s: %s",
            parent_state_code,
            exc,
        )
        return ["credit_request_form"]

def get_dynamic_artifact_model_map():
    """Generate the model mapping for configured credit workflow artifacts."""
    try:
        dynamic_mapping = get_credit_artifact_model_map()
        logger.info(
            "Generated dynamic artifact mapping for %s artifacts: %s",
            len(dynamic_mapping),
            list(dynamic_mapping.keys()),
        )
        return dynamic_mapping
    except Workflow.DoesNotExist:
        logger.error("Parent workflow '%s' not found for dynamic form mapping", PARENT_WORKFLOW_CODE)
        return {}
    except Exception as exc:
        logger.error("Error generating dynamic form model map: %s", exc, exc_info=True)
        return {}


def get_dynamic_form_model_map():
    """Compatibility alias for the artifact model-map helper."""
    return get_dynamic_artifact_model_map()


def get_dynamic_artifact_prefixes():
    """Generate configured credit workflow artifact prefixes."""
    try:
        prefix_map = get_credit_artifact_prefixes()
        logger.info(
            "Generated dynamic artifact prefix mapping for %s artifacts: %s",
            len(prefix_map),
            list(prefix_map.keys()),
        )
        return prefix_map
    except Workflow.DoesNotExist:
        logger.error("Parent workflow '%s' not found for dynamic prefix mapping", PARENT_WORKFLOW_CODE)
        return {}
    except Exception as exc:
        logger.error("Error generating dynamic form prefix map: %s", exc, exc_info=True)
        return {}


def get_dynamic_form_prefixes():
    """Compatibility alias for the artifact prefix helper."""
    return get_dynamic_artifact_prefixes()


def get_dynamic_artifact_field_mappings():
    """Generate configured field type mappings for credit workflow artifacts."""
    try:
        field_mappings = get_credit_artifact_field_mappings()
        logger.info(
            "Generated dynamic artifact field mappings - Boolean: %s, User: %s, DateTime: %s",
            len(field_mappings["boolean_fields"]),
            len(field_mappings["user_fields"]),
            len(field_mappings["datetime_fields"]),
        )
        return field_mappings
    except Workflow.DoesNotExist:
        logger.error(
            "Parent workflow '%s' not found for dynamic artifact field mappings",
            PARENT_WORKFLOW_CODE,
        )
        return {"boolean_fields": {}, "user_fields": {}, "datetime_fields": {}}
    except Exception as exc:
        logger.error("Error generating dynamic artifact field mappings: %s", exc, exc_info=True)
        return {"boolean_fields": {}, "user_fields": {}, "datetime_fields": {}}


def get_dynamic_field_mappings():
    """Compatibility alias for the artifact field-mapping helper."""
    return get_dynamic_artifact_field_mappings()


def provision_artifacts_for_state(credit_application, state_code=None):
    """Provision configured credit workflow artifacts for the given parent workflow state."""
    from django.contrib.contenttypes.models import ContentType
    from django.utils import timezone

    from workflow_engine.models import State, Workflow, WorkflowInstance

    artifact_model_map = get_dynamic_artifact_model_map()
    if not artifact_model_map:
        logger.warning("No dynamic artifact mapping available for application %s", credit_application.id)
        return {}

    if state_code:
        target_state_code = state_code
    elif hasattr(credit_application, "workflow_instance") and credit_application.workflow_instance:
        target_state_code = credit_application.workflow_instance.current_state.code
    else:
        logger.warning("No workflow state found for application %s, using default", credit_application.id)
        target_state_code = "DRAFT"

    relevant_forms = get_relevant_artifacts_for_state(target_state_code)
    logger.info("Provisioning artifacts for state %s: %s", target_state_code, relevant_forms)

    initialized_forms = {}
    for form_name in relevant_forms:
        if form_name not in artifact_model_map:
            logger.warning("Artifact %s not found in model map, skipping", form_name)
            continue

        model_class = artifact_model_map[form_name]
        try:
            form_instance, created = model_class.objects.get_or_create(
                credit_application=credit_application,
                defaults={"form_started_at": timezone.now()},
            )
            if created:
                logger.info("Auto-created %s for application %s", form_name, credit_application.id)

            if not hasattr(form_instance, "workflow_instance") or not form_instance.workflow_instance:
                try:
                    artifact_metadata = get_artifact_metadata(form_name)
                    workflow_code = artifact_metadata.get("workflow_code")
                    if not workflow_code:
                        logger.warning("No workflow_code found in metadata for %s", form_name)
                        continue

                    sub_workflow = Workflow.objects.get(code=workflow_code)
                    initial_state = State.objects.get(workflow=sub_workflow, is_initial=True)
                    sub_wf_instance = WorkflowInstance.objects.create(
                        workflow=sub_workflow,
                        current_state=initial_state,
                        content_type=ContentType.objects.get_for_model(form_instance),
                        object_id=form_instance.id,
                    )
                    form_instance.workflow_instance = sub_wf_instance
                    form_instance.save(update_fields=["workflow_instance"])
                    logger.info("Created sub-workflow instance %s for %s", sub_wf_instance.id, form_name)
                except FormMetadataError:
                    logger.warning(
                        "No metadata found for %s, skipping workflow instance creation",
                        form_name,
                    )
                    continue
                except (Workflow.DoesNotExist, State.DoesNotExist) as exc:
                    logger.warning("Could not create workflow for %s: %s", form_name, exc)
                except Exception as exc:
                    logger.error("Error creating workflow for %s: %s", form_name, exc, exc_info=True)

            initialized_forms[form_name] = form_instance
        except Exception as exc:
            logger.error(
                "Error auto-initializing %s for application %s: %s",
                form_name,
                credit_application.id,
                exc,
                exc_info=True,
            )

    return initialized_forms


def auto_initialize_forms_for_state(credit_application, state_code=None):
    """Compatibility alias for artifact provisioning by state."""
    return provision_artifacts_for_state(credit_application, state_code=state_code)


def get_artifact_permissions(artifact_key):
    """Get configured credit workflow artifact permissions."""
    try:
        return get_credit_artifact_permissions(artifact_key)
    except Workflow.DoesNotExist:
        logger.error("Parent workflow '%s' not found for artifact permissions", PARENT_WORKFLOW_CODE)
        return {"editable_by_roles": [], "viewable_by_roles": [], "ownership_required": False}
    except Exception as exc:
        logger.error("Error getting artifact permissions for %s: %s", artifact_key, exc, exc_info=True)
        return {"editable_by_roles": [], "viewable_by_roles": [], "ownership_required": False}


def get_form_permissions(form_name):
    """Compatibility alias for the artifact permissions helper."""
    return get_artifact_permissions(form_name)


def can_user_edit_artifact(user, credit_app, artifact_key, artifact_instance=None):
    """Determine whether a user can edit a configured credit workflow artifact."""
    if not user or not hasattr(user, "role") or not user.role:
        return False

    permissions = get_artifact_permissions(artifact_key)
    user_role = user.role.name.lower().replace(" ", "_")
    editable_roles = [role.lower().replace(" ", "_") for role in permissions["editable_by_roles"]]

    can_edit = any(role in user_role or user_role in role for role in editable_roles)
    if not can_edit:
        return False

    if permissions.get("ownership_required", False):
        if credit_app.relationship_manager and credit_app.relationship_manager.id == user.id:
            return True
        if credit_app.created_by and credit_app.created_by.id == user.id:
            return True
        return False

    if "admin" in user_role or user.is_superuser:
        return True

    if artifact_key == "credit_approval_form" and user_role == "credit_analyst":
        if hasattr(credit_app, "credit_review_form") and credit_app.credit_review_form:
            required_da_level = credit_app.credit_review_form.delegated_authority_level
            user_da_level = getattr(user, "da_level", None)

            if required_da_level and user_da_level:
                def extract_da_number(da_level):
                    if not da_level:
                        return None
                    if da_level.startswith("DA"):
                        return int(da_level[2:])
                    return int(da_level)

                try:
                    user_level = extract_da_number(user_da_level)
                    required_level = extract_da_number(required_da_level)
                    if user_level and required_level and user_level > required_level:
                        logger.warning(
                            "User %s (DA%s) insufficient authority for application requiring DA%s",
                            user.username,
                            user_level,
                            required_level,
                        )
                        return False
                except (ValueError, TypeError) as exc:
                    logger.warning("Error comparing DA levels for user %s: %s", user.username, exc)
                    return False

    return can_edit


def can_user_edit_form(user, credit_app, form_name, form_instance=None):
    """Compatibility alias for artifact editability checks."""
    return can_user_edit_artifact(user, credit_app, form_name, form_instance=form_instance)
