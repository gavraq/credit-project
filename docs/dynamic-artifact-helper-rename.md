# Dynamic Artifact Helper Rename

## Summary

The live runtime helper surface is moving from form-oriented naming to artifact-oriented naming.

This change keeps compatibility aliases in place where needed, but the main runtime path now uses artifact terminology.

## Changes

Updated canonical helpers in [credit_workflow/metadata.py](/Volumes/DockSSD/projects/credit-project/credit_workflow/metadata.py):

- `get_dynamic_artifact_model_map()`
- `get_dynamic_artifact_prefixes()`
- `get_dynamic_artifact_field_mappings()`
- `get_artifact_permissions()`
- `provision_artifacts_for_state()`
- `can_user_edit_artifact()`

Compatibility aliases remain available for now:

- `get_dynamic_form_model_map()`
- `get_dynamic_form_prefixes()`
- `get_dynamic_field_mappings()`
- `get_form_permissions()`
- `auto_initialize_forms_for_state()`
- `can_user_edit_form()`

## Runtime callers updated

Updated live callers to use the canonical artifact-oriented helpers:

- [credit_workflow/metadata.py](/Volumes/DockSSD/projects/credit-project/credit_workflow/metadata.py)
- [credit_workflow/artifacts.py](/Volumes/DockSSD/projects/credit-project/credit_workflow/artifacts.py)
- [credit_applications/serializers.py](/Volumes/DockSSD/projects/credit-project/credit_applications/serializers.py)
- [workflow_engine/utils.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/utils.py)

The serializer-side helper methods were also renamed to match the artifact model:

- `_extract_form_data(...)` -> `_extract_artifact_data(...)`
- `_update_sub_form(...)` -> `_update_artifact_instance(...)`

The credit-domain runtime callers now also use the artifact-oriented provisioning and editability helpers in [credit_workflow/artifacts.py](/Volumes/DockSSD/projects/credit-project/credit_workflow/artifacts.py).

## Architectural effect

This continues the same cleanup pattern as:

- `relevant_sub_processes` -> `relevant_artifacts`
- `get_form_metadata()` -> `get_artifact_metadata()`

The important distinction is:

- compatibility remains at narrow edges
- live runtime paths now use artifact-native names

## Validation

Passed:

- `./.venv/bin/python manage.py check`

Blocked in this sandbox:

- `./.venv/bin/python manage.py test workflow_engine.tests.test_utils credit_workflow.tests.test_artifacts credit_workflow.tests.test_definitions credit_applications.tests`

The test run requires PostgreSQL access on `localhost:5432`, which is denied in the sandbox.
