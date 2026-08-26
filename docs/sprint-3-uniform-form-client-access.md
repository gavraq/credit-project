# Sprint 3: Uniform Form Client Access

## Purpose

All credit forms should follow the same client access pattern.

The only thing that should differ between forms is the artifact key, not the route shape or client workflow.

## Implemented

Updated:

- `tests/api/utils/api_client.py`
- `frontend/src/services/api.js`

## Client pattern

Credit forms now use the generic artifact detail endpoint for read/write:

- `GET /api/credit/credit-applications/:id/artifacts/:artifact_key/`
- `PATCH /api/credit/credit-applications/:id/artifacts/:artifact_key/`

Shared client helpers now expose that pattern directly.

Examples:

- `get_credit_artifact(app_id, artifact_key)`
- `save_credit_artifact(app_id, artifact_key, data)`
- `fetchCreditArtifact(id, artifactKey)`
- `saveCreditArtifact(id, artifactKey, formData)`

The form-specific helpers are now thin wrappers over the generic artifact helper.

## Important distinction

This does not change parent credit application creation/update.

Creating or updating the `CreditApplication` itself is still different from saving a workflow form artifact.

That distinction is correct:

- parent entity operations use the credit application endpoints
- form artifact operations use the generic artifact detail endpoint

## Allowed exception

`climate_scorecard` can still expose an extra AI-generation action because that is a domain capability difference, not a different base access pattern.
