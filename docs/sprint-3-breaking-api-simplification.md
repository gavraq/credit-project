# Sprint 3: Breaking API Simplification

## Purpose

This step uses the fact that the current environment does not require backward compatibility.

That allows the application-facing API to move directly toward the engine-native artifact contract instead of preserving parallel legacy payload shapes.

## What changed

Updated:

- `credit_applications/serializers.py`

Added:

- `credit_applications/tests.py`

## API contract change

The credit application serializer now exposes:

- `artifacts`

and no longer exposes the legacy workflow projection fields:

- `workflow_artifacts`
- `sub_processes`
- per-form top-level fields such as `credit_request_form`, `credit_review_form`, `business_sponsorship_form`, and the other workflow form fields

## Why this matters

Before this step:

- the application API carried multiple overlapping workflow representations
- the engine had a generic artifact surface, but the application serializer still emitted legacy credit-specific projections

After this step:

- the application API aligns with the engine-native artifact model
- there is one primary workflow artifact collection for consumers to use

## What this does not mean

This is not a migration of the underlying business data into a new storage model.

The source-of-truth form data still lives in the existing credit form tables.

This change is about:

- API contract simplification
- removal of backward-compatibility payloads
- pushing consumers toward the generic artifact model

## Recommended next step

The next step should be to migrate any remaining frontend or integration consumers from the removed legacy fields to:

1. `artifacts` on the credit application payload, or
2. `GET /api/workflow-instances/:id/artifacts/`

The second option is the cleaner long-term engine-native path.
