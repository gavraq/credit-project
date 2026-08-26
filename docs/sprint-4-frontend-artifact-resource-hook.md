# Sprint 4: Frontend Artifact Resource Hook

## Purpose

After adding a shared frontend hook for action resolution, the next step was to combine:

- artifact detail loading
- artifact action resolution

into one reusable abstraction for action-driven screens.

## Implemented

Added:

- `frontend/src/hooks/useCreditArtifactResource.js`

Updated:

- `frontend/src/components/ClimateScorecard/index.jsx`

## What Changed

### Shared artifact resource hook

The frontend now has:

- `useCreditArtifactResource(applicationId, application, artifactKey, { actionKey, capability, refreshKey })`

This hook:

- resolves the artifact from the application payload
- resolves the requested action by key or capability
- fetches artifact detail through the generic artifact endpoint
- returns:
  - `artifact`
  - `action`
  - `detail`
  - `loading`
  - `error`

### Climate screen now uses generic artifact detail loading

The climate scorecard screen no longer depends on:

- `creditApplication.climate_scorecard`

as its primary data source.

Instead it now:

- fetches the parent application
- resolves the `climate_scorecard` artifact and `remote_generate` action
- loads the scorecard detail through the generic artifact endpoint via the shared hook

That is a materially cleaner use of the artifact-native contract.

## Why This Matters

This is the first frontend screen that now consumes both:

- artifact content
- artifact actions

through shared abstractions instead of mixing generic and legacy access patterns.

Before:

- action resolution was generic
- detail loading still relied on the credit-application payload shape

After:

- both action resolution and detail loading are artifact-native
- the screen is closer to the generic workflow/artifact model

## Validation

Passed:

- `npm run lint`
- `npm run build`

The only remaining notice is the existing `Browserslist` data staleness message from the frontend toolchain.

## Recommended Next Step

The next useful step would be to apply this hook pattern to another artifact-driven screen or extract a slightly more general hook name once more screens adopt it and the pattern is stable.
