# Sprint 4: Frontend Artifact Action Hook

## Purpose

After extracting shared frontend helpers for artifact and action lookup, the next step was to move that pattern into a reusable hook so action-driven screens do not need to manage artifact/action selection state themselves.

## Implemented

Added:

- `frontend/src/hooks/useArtifactAction.js`

Updated:

- `frontend/src/components/ClimateScorecard/index.jsx`

## What Changed

### Shared hook

The frontend now has:

- `useArtifactAction(application, artifactKey, { actionKey, capability })`

This hook:

- finds the artifact in the application payload
- resolves the requested action by key or capability
- returns both the artifact and the resolved action

### Climate screen simplification

The climate scorecard screen now uses:

- `useArtifactAction(creditApplication, 'climate_scorecard', { capability: 'remote_generate' })`

instead of:

- storing the resolved action separately in component state
- performing inline artifact/action lookup during payload population

That makes the screen narrower and keeps artifact action resolution in one reusable place.

## Why This Matters

This is the next step in making action-driven screens generic.

Before:

- transport was generic
- action selection helpers were shared
- component state still owned the final resolution pattern

After:

- transport is generic
- selection helpers are shared
- action resolution is available as a reusable hook

That reduces repeated wiring for future screens that need to invoke artifact-driven actions.

## Validation

Passed:

- `npm run lint`
- `npm run build`

The only remaining notice is the existing `Browserslist` data staleness message from the frontend toolchain.

## Recommended Next Step

The next useful step would be to migrate another action-driven screen or introduce a small hook for loading artifact detail plus action resolution together, so components can consume both the artifact content and the action contract from one place.
