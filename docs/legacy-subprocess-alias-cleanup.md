# Legacy Subprocess Alias Cleanup

## Goal

Continue reducing compatibility-oriented runtime surfaces now that the active
workflow contract is artifact-native.

## Change

Removed the legacy runtime helper alias:

- `get_relevant_sub_processes_for_state(...)`

from the live modules:

- [`credit_workflow/metadata.py`](/Volumes/DockSSD/projects/credit-project/credit_workflow/metadata.py)
- [`workflow_engine/utils.py`](/Volumes/DockSSD/projects/credit-project/workflow_engine/utils.py)

Updated the focused utility tests to use the canonical helper directly:

- `get_relevant_artifacts_for_state(...)`

## What Remains Compatible

Old workflow config payloads using:

- `relevant_sub_processes`

are still normalized by the loader layer. So configuration compatibility remains
where it is useful, but the runtime helper surface is now cleaner.

## Validation

- `./.venv/bin/python manage.py test workflow_engine.tests.test_utils credit_workflow.tests.test_loaders credit_workflow.tests.test_definitions`
- `./.venv/bin/python manage.py check`
