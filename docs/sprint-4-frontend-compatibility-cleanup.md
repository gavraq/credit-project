# Sprint 4 - Frontend Compatibility Cleanup

## Summary

The first unused frontend compatibility helper has now been removed.

`fetchCreditArtifactBundle(...)` has been deleted from `frontend/src/services/api.js` because no active screen still depends on the older "application plus artifact bundle" fetch pattern.

## What Changed

- `frontend/src/services/api.js`
  - removed `fetchCreditArtifactBundle(id, artifactKeys)`

## Why This Matters

During the form migration, the active frontend screens were moved onto a cleaner split:

- parent application via `fetchCreditRequest(id)`
- primary artifact detail via `useCreditArtifactResource(...)`
- explicit secondary lookups only where genuinely needed

That made `fetchCreditArtifactBundle(...)` dead code.

Removing it is a useful cleanup milestone because it confirms the old convenience path is no longer part of the active frontend contract.

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`

Both passed. The only remaining notice is the existing `Browserslist` staleness message from the frontend toolchain.
