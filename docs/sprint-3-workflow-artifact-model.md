# Sprint 3: WorkflowArtifact Model Introduction

## Objective

Introduce an engine-level `WorkflowArtifact` persistence model without breaking the existing credit form model structure.

## Approach

The chosen approach is additive:

- keep the existing credit form models
- keep the existing artifact projection API
- add a generic engine-owned artifact record that references those concrete form instances

This creates a bridge from:

- generic artifact API projection

to:

- generic artifact persistence

without requiring an immediate rewrite of the credit application model.

## Implemented

### New engine model

Added:

- `workflow_engine.models.WorkflowArtifact`

The model stores:

- parent `workflow_instance`
- `artifact_key`
- `artifact_kind`
- generic reference to a concrete content object
- metadata

### Sync strategy

Added sync behavior in:

- `credit_workflow/artifacts.py`

The credit domain now persists generic `WorkflowArtifact` records for configured form artifacts when artifact descriptors are generated or when post-transition hooks run.

### Hook integration

Updated:

- `credit_workflow/hooks.py`

The post-transition hook now also synchronizes the generic artifact registry for the parent credit workflow instance.

## Why this matters

This is the first point where the system stores a generic workflow-owned artifact record in the engine itself.

That means the architecture now has:

1. generic runtime seams
2. source-controlled workflow definitions
3. generic artifact API projection
4. generic artifact persistence

The remaining work is to decide how far to push that abstraction into:

- frontend consumption
- engine APIs
- eventual replacement of hardcoded named-form relationships

## Current limitation

`WorkflowArtifact` is currently a mirrored reference model, not the primary source of truth.

The primary data still lives in the existing credit form models.

That is intentional for this stage, because it lowers migration risk.
