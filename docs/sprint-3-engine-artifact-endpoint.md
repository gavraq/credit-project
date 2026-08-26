# Sprint 3: Dedicated Engine Artifact Endpoint

## Objective

Add a dedicated engine-native artifact endpoint so generic consumers can retrieve workflow-owned artifact records without fetching the full workflow instance payload.

## Implemented

Updated:

- `backend/users/views.py`
- `backend/urls.py`
- `tests/api/utils/api_client.py`

Added:

- `workflow_engine/tests/test_api_views.py`

## New endpoint

The engine API now exposes:

- `GET /api/workflow-instances/:id/artifacts/`

The endpoint:

- requires authentication
- uses the same role-based permission wrapper as the other workflow instance endpoints
- returns the serialized `WorkflowArtifact` records for the workflow instance

## Why this matters

Before this step:

- generic artifact records were visible through the workflow instance detail payload
- but there was no focused engine-native endpoint for artifact retrieval

After this step:

- the engine has a dedicated artifact read surface
- generic consumers can retrieve artifact references without coupling to the full workflow instance payload

## Current shape

The endpoint returns engine-level artifact records only:

- artifact identity
- artifact type
- title
- linked content type and object id
- metadata

It does not yet resolve domain payloads such as the full credit form content.

## Recommended next step

The next step should be to decide whether generic consumers need:

1. artifact record retrieval only, or
2. artifact record retrieval plus resolved domain payload expansion

The safer default is `1`, and let domain-specific endpoints continue to own rich form payloads.
