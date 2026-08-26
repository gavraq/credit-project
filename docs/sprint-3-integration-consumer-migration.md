# Sprint 3: Integration Consumer Migration

## Purpose

The backend contract is now artifact-based, but the API integration tests were still written as if top-level form fields existed on the credit application payload.

This step moves the shared API test consumers onto the same pattern as the backend:

- application payload for parent workflow state
- artifact list for discovery
- generic artifact detail endpoint for form detail and sub-workflow state

## Implemented

Updated:

- `tests/api/utils/api_client.py`
- `tests/api/conftest.py`
- `tests/api/test_credit_applications.py`
- `tests/api/test_workflow_transitions.py`
- `tests/api/test_full_workflow.py`

## Changes

Added generic API test helpers:

- `get_credit_artifact(app_id, artifact_key)`
- `save_credit_artifact(app_id, artifact_key, data)`

Updated workflow tests so they:

- fetch form detail from `/api/credit/credit-applications/:id/artifacts/:artifact_key/`
- read sub-workflow state from the artifact detail payload
- stop assuming top-level form fields exist on the application response

## Validation

Local validation completed:

- Python bytecode compilation for the updated `tests/api` files

Not executed in this session:

- the external `tests/api` integration suite itself

Reason:

- those tests target the configured API URL rather than the local Django test runner

## Recommended next step

The same migration should be applied to the remaining frontend components that still read top-level form fields directly from the credit application payload.
