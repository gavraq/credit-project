# Sprint 4: Frontend Action Discovery

## Purpose

After adding artifact action descriptors to the payload, the next step was to move an actual frontend consumer onto that contract.

The first target was climate scorecard generation, because it previously depended on a hardcoded helper route even though the backend now exposes the operation through artifact action discovery.

## Implemented

Updated:

- `frontend/src/services/api.js`
- `frontend/src/components/ClimateScorecard/index.jsx`

## What Changed

### Generic frontend action invoker

The frontend API layer now exposes:

- `invokeArtifactAction(action, payload?)`

This helper executes an artifact action descriptor directly using the path and HTTP method advertised by the backend.

### Climate scorecard screen now uses artifact actions

The climate scorecard screen now:

- reads the `climate_scorecard` artifact from the credit application payload
- finds the `remote_generate` action descriptor
- invokes that action through the generic frontend helper

instead of calling the hardcoded:

- `generateClimateScorecard(id)`

route helper.

### UI behavior

The user-facing wording remains:

- `Generate with AI`

because that is still the product behavior.

But the technical contract is now generic:

- the screen depends on `remote_generate`
- the screen reads the endpoint/method from the artifact payload
- the button disables if that action is not available

## Why This Matters

This is the first live frontend consumer of the new action-discovery model.

Before:

- the backend advertised capabilities and actions
- the frontend still hardcoded the climate generation route

After:

- the frontend consumes the action descriptor directly
- the climate scorecard becomes one configured instance of generic remote generation behavior

This is the right direction for future domain actions as well.

## Validation

Passed:

- `npm run lint`
- `npm run build`

The only remaining notice is the existing `Browserslist` data staleness message from the toolchain.

## Recommended Next Step

The next useful generalization would be to add frontend-side helpers for selecting artifact actions by capability or action key so future screens can adopt the same pattern with less component-specific lookup code.
