# Sprint 3: Engine Artifact API Surface

## Objective

Expose engine-level artifact records directly through workflow instance APIs so generic consumers can read workflow-owned artifacts without going through the credit application serializer.

## Implemented

### Serializer support

Updated:

- `backend/users/serializers.py`

Changes:

- added `WorkflowArtifactSerializer`
- added `artifacts` to `WorkflowInstanceSerializer`

This means `GET /api/workflow-instances/:id/` now exposes the generic artifact records attached to that workflow instance.

## Why this matters

Before this step:

- generic artifact persistence existed
- but the generic artifact read path was still mostly indirect

After this step:

- workflow instance APIs can expose generic artifact records directly
- the engine now has a real generic read surface

## Current role of this API

This API is not yet the complete replacement for credit-specific application payloads.

It is the first engine-native artifact retrieval surface that generic consumers can rely on.

## Next possible step

The next step could be:

1. add a dedicated `/api/workflow-instances/:id/artifacts/` endpoint, or
2. enrich engine artifact records with resolved content payloads when appropriate

The safer next move is usually `1`, because it keeps the engine record layer and domain payload layer separate.
