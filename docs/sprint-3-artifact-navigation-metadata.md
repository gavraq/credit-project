# Sprint 3: Artifact Navigation Metadata

## Purpose

Once the credit application `artifacts` collection became reference-only, consumers still needed a way to discover which domain endpoint to call for a given artifact.

This step adds explicit navigation metadata and a generic domain artifact detail endpoint so consumers no longer need to hardcode form-name-to-route mappings.

## Implemented

Updated:

- `credit_workflow/artifacts.py`
- `credit_applications/views.py`
- `credit_workflow/tests/test_artifacts.py`
- `credit_applications/tests.py`

## New artifact navigation contract

Each item in the credit application `artifacts` collection now includes:

- `resource.type`
- `resource.path`
- `resource.methods`

Current values:

- `type`: `domain_artifact_endpoint`
- `path`: `/api/credit/credit-applications/:application_id/artifacts/:artifact_key/`
- `methods`: `GET`, `PATCH`

## New endpoint

The credit application API now exposes:

- `GET /api/credit/credit-applications/:application_id/artifacts/:artifact_key/`
- `PATCH /api/credit/credit-applications/:application_id/artifacts/:artifact_key/`

This endpoint:

- resolves the correct form model from the artifact key
- auto-initializes the artifact when appropriate
- returns or updates the domain form payload

## Why this matters

Before this step:

- the artifact list was generic and reference-only
- but consumers still had to know which domain endpoint matched each artifact key

After this step:

- artifact items tell consumers exactly where to navigate for domain content
- the route mapping is discoverable instead of hardcoded in clients

## Architectural effect

This is a cleaner generic-engine boundary:

- engine and application artifact lists expose workflow navigation
- domain artifact endpoints expose form content and writes
- consumers can discover the handoff point directly from artifact metadata

## Recommended next step

The next step should be to move any remaining frontend or integration consumers away from bespoke form routes and onto the generic artifact navigation contract.
