# Sprint 4: Frontend Action Helper Extraction

## Purpose

After moving the climate scorecard screen onto artifact action discovery, the next cleanup was to remove the remaining component-specific lookup logic and make action selection reusable in the shared frontend API layer.

## Implemented

Updated:

- `frontend/src/services/api.js`
- `frontend/src/components/ClimateScorecard/index.jsx`

## What Changed

### Shared artifact lookup helpers

The frontend API layer now exposes:

- `findArtifactByKey(application, artifactKey)`
- `findArtifactActionByKey(artifact, actionKey)`
- `findArtifactActionByCapability(artifact, capability)`

These helpers give screens a single path for locating:

- the relevant artifact in the application payload
- the relevant action in the artifact payload

without repeating array search logic in each component.

### Climate screen cleanup

The climate scorecard screen now uses those shared helpers instead of performing inline artifact/action lookup.

That makes the component narrower:

- it decides which artifact/action it needs
- the shared API layer handles how to find it

### Dead helper removal

The old hardcoded frontend helper:

- `generateClimateScorecard(id)`

has been removed from the shared API layer.

The active frontend path now uses:

- `invokeArtifactAction(action, payload?)`

plus the new shared lookup helpers.

## Why This Matters

This is a small change, but it makes the action-discovery model easier to reuse.

Before:

- the frontend had a generic action invoker
- lookup logic still lived inside the climate component

After:

- the frontend has both:
  - generic action invocation
  - shared action selection helpers

That lowers the cost of moving additional screens onto artifact action discovery.

## Validation

Passed:

- `npm run lint`
- `npm run build`

The only remaining notice is the existing `Browserslist` data staleness message from the frontend toolchain.

## Recommended Next Step

The next useful step would be to add a small frontend hook or utility for loading a specific artifact plus its actions, so action-driven screens can share both discovery and invocation patterns.
