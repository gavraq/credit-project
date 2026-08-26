# Sprint 2: Artifact Projection Layer

## Objective

Reduce application-layer dependence on a hardcoded list of named credit forms by introducing a domain-level workflow artifact projection service.

## Implemented

### Domain artifact projection

Added:

- `credit_workflow/artifacts.py`

This module now owns:

- serializer mapping for configured credit artifacts
- workflow artifact descriptor construction
- state-aware artifact list generation
- compatibility auto-initialization lookup for configured artifacts

### Serializer integration

Updated:

- `credit_applications/serializers.py`

Changes:

- the legacy workflow projection now delegates to the domain artifact projection layer
- added a new `workflow_artifacts` field with a generic artifact-style payload
- form auto-initialization fallback now routes through the domain artifact helper

## Why this matters

Before this change:

- the serializer itself embedded the workflow structure, serializer map, and subprocess composition logic

After this change:

- the credit domain owns artifact projection
- the serializer consumes a workflow-facing artifact list
- existing named form fields remain for backward compatibility

## Current state

This is still not a fully generic engine artifact model.

However, it creates an intermediate layer that:

- reduces hardcoded workflow structure in the serializer
- makes the future move to true engine-level artifacts/tasks much easier
- gives the API a more generic collection field without breaking the current frontend
