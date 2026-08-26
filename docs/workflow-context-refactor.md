# Workflow Context Refactor

## Why

`credit_workflow/metadata.py` and `credit_workflow/definitions.py` both needed the
same workflow-level primitives:

- `PARENT_WORKFLOW_CODE`
- `FormMetadataError`
- `get_parent_workflow()`

Those items were originally defined in `metadata.py`, which forced
`definitions.py` to import from `metadata.py`. At the same time, `metadata.py`
already imported definition helpers from `definitions.py`.

That created a circular dependency risk and led to the earlier lazy-import
workaround.

## Proper Fix

The shared workflow primitives were extracted into:

- [`credit_workflow/workflow_context.py`](/Volumes/DockSSD/projects/credit-project/credit_workflow/workflow_context.py)

`metadata.py` and `definitions.py` now both import from that neutral module
instead of importing those primitives from each other.

## Result

- no module cycle between `metadata.py` and `definitions.py`
- no need for ad hoc lazy imports for shared workflow primitives
- simpler dependency direction inside `credit_workflow`
- lower risk of import-time regressions like the missing `get_parent_workflow()`
  issue found during manual testing

## Validation

- `./.venv/bin/python manage.py test credit_workflow.tests.test_definitions workflow_engine.tests.test_definition_services workflow_engine.tests.test_utils`
- `./.venv/bin/python manage.py check`
