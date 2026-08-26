# Artifact Metadata Helper Rename

## Goal

Reduce remaining helper naming that still referred to "forms" when the live
runtime contract is artifact-oriented.

## Change

Introduced the canonical helper:

- `get_artifact_metadata(...)`

in:

- [`credit_workflow/metadata.py`](/Volumes/DockSSD/projects/credit-project/credit_workflow/metadata.py)

Updated live runtime callers to use the canonical helper:

- [`credit_workflow/artifacts.py`](/Volumes/DockSSD/projects/credit-project/credit_workflow/artifacts.py)

Updated focused tests to use the canonical helper:

- [`workflow_engine/tests/test_utils.py`](/Volumes/DockSSD/projects/credit-project/workflow_engine/tests/test_utils.py)
- [`credit_workflow/tests/test_artifacts.py`](/Volumes/DockSSD/projects/credit-project/credit_workflow/tests/test_artifacts.py)

## Compatibility

The older helper name:

- `get_form_metadata(...)`

still exists as a narrow compatibility alias, but the live runtime path now uses
the artifact-oriented name.

## Validation

- `./.venv/bin/python manage.py test workflow_engine.tests.test_utils credit_workflow.tests.test_artifacts credit_workflow.tests.test_definitions`
- `./.venv/bin/python manage.py check`
