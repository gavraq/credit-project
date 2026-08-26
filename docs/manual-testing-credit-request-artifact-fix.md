# Manual Testing Fix: Missing Credit Request Artifact on Draft Reopen

## Issue

During manual testing, reopening a saved draft credit application showed:

- blank `counterparty_cif`
- blank `guarantor_name`
- blank `guarantor_cif`
- frontend error: `Failed to load credit request form data. Please try again.`

## Root Cause

The parent `CreditApplication` row was created successfully, but the related
`credit_request_form` row was never created.

That happened because artifact auto-provisioning was broken by a `NameError` in
[`credit_workflow/definitions.py`](/Volumes/DockSSD/projects/credit-project/credit_workflow/definitions.py):

- `get_credit_artifact_model_map()` called `get_parent_workflow()`
- `get_parent_workflow()` was no longer imported in that function after the
  lazy-import refactor
- the resulting exception caused the dynamic form model map to be empty
- the serializer create/update path and artifact fallback path therefore skipped
  `credit_request_form` creation

## Fix

- added the missing lazy import inside `get_credit_artifact_model_map()`
- added regression coverage in
  [`credit_workflow/tests/test_definitions.py`](/Volumes/DockSSD/projects/credit-project/credit_workflow/tests/test_definitions.py)
- manually provisioned the missing `credit_request_form` for draft
  `CR-2026-0003`
- backfilled recoverable counterparty fields from the parent application:
  - `counterparty_name`
  - `counterparty_cif`

## Limitation

The guarantor fields for draft `CR-2026-0003` could not be reconstructed:

- `guarantor_name`
- `guarantor_cif`

Those values were never persisted while the bug was active, so they must be
re-entered once for that draft.

## Validation

- `./.venv/bin/python manage.py test credit_workflow.tests.test_definitions workflow_engine.tests.test_definition_services`
- `./.venv/bin/python manage.py check`
