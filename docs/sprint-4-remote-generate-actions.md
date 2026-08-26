# Sprint 4: Remote Generate Action Discovery

## Purpose

The previous step made `climate_scorecard` advertise an extra capability, but that capability was still named too narrowly and did not expose the concrete operation that implements it.

This step does two things:

1. renames the capability from `ai_generate` to the more generic `remote_generate`
2. exposes concrete action descriptors in the artifact payload so clients can discover the endpoint and method instead of hardcoding them

## Implemented

Updated:

- `config/workflows/credit/credit_workflows.json`
- `credit_workflow/definitions.py`
- `workflow_engine/services/definitions.py`
- `workflow_engine/services/artifact_types.py`
- `credit_workflow/artifacts.py`
- `backend/users/serializers.py`
- `workflow_engine/tests/test_artifact_type_services.py`
- `workflow_engine/tests/test_definition_services.py`
- `credit_workflow/tests/test_artifacts.py`
- `credit_applications/tests.py`
- `workflow_engine/tests/test_api_serializers.py`

## What Changed

### Capability rename

The climate scorecard definition no longer advertises:

- `ai_generate`

It now advertises:

- `remote_generate`

That is a better abstraction because the generic behavior is:

- make a remote request
- receive structured data
- populate the artifact

The fact that the remote service happens to use AI internally is an implementation detail, not the platform capability.

### Definition-level action descriptors

The climate scorecard definition now also declares:

- `artifact_actions`

with a concrete action descriptor for remote generation:

- key: `remote_generate`
- type: `http_request`
- path: `/api/credit/credit-applications/{id}/climate-scorecard/generate/`
- method: `POST`

### Resolved action discovery

The engine now resolves artifact actions from the definition provider and formats contextual paths using runtime values such as the credit application ID.

That resolution is exposed in:

- credit application artifact descriptors
- engine workflow artifact serializers

So clients can discover both:

- what an artifact can do
- which endpoint implements that behavior

without hardcoding climate-scorecard-specific routes.

## Payload Effect

For `climate_scorecard`, the payload now exposes:

- `capabilities`
  - `detail_endpoint`
  - `writable`
  - `workflow_reference`
  - `remote_generate`
- `actions`
  - one `remote_generate` HTTP action pointing to the generation endpoint

Ordinary form artifacts continue to expose:

- the base form capabilities
- an empty `actions` list

## Why This Matters

This is the first point where artifact operations become discoverable rather than merely descriptive.

Before:

- capabilities described behavior
- clients still needed domain knowledge to know which route to call

After:

- capabilities describe behavior
- actions describe how to invoke that behavior

This is a better foundation for future generic operations such as:

- regeneration
- document extraction
- approval submission
- task claim/complete

## Validation

Passed:

- `python manage.py test --keepdb workflow_engine.tests.test_artifact_type_services workflow_engine.tests.test_definition_services workflow_engine.tests.test_artifact_services credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils`
- `python manage.py load_credit_workflows --validate-only`
- `python manage.py check`

## Recommended Next Step

The next useful generalization would be to move more bespoke domain actions onto this action-discovery model, starting with climate scorecard generation on the frontend so the UI uses the artifact action descriptor rather than the hardcoded helper route.
