# Sprint 3: Artifact Payload Normalization

## Purpose

After removing the old per-form fields from the credit application serializer, the remaining compatibility leak was the payload shape produced by `credit_workflow.artifacts`.

It still used form-centric keys such as:

- `form_name`
- `form_title`
- `form_key`
- `data`
- `can_edit`

This step normalizes that payload to artifact-oriented terms.

## Implemented

Updated:

- `credit_workflow/artifacts.py`
- `credit_workflow/tests/test_artifacts.py`

## New artifact shape

The credit application `artifacts` collection now uses keys aligned to the engine model:

- `id`
- `key`
- `kind`
- `title`
- `editable`
- `payload`
- `object_id`
- `workflow_code`

## Why this matters

Before this step:

- the application serializer used the field name `artifacts`
- but the items inside that collection still looked like legacy form descriptors

After this step:

- both the collection name and the item shape use artifact terminology
- consumers can treat the payload as a generic workflow artifact list instead of a renamed form list

## Important limitation

This is still a domain-enriched artifact payload.

The `payload` field contains serialized credit-form content when a concrete form instance exists.

That means:

- the item envelope is generic
- the resolved payload body is still domain-specific

## Recommended next step

The next step should be to decide whether to keep `payload` expansion in the credit application endpoint or push consumers to the engine-native artifact endpoint plus domain-specific form endpoints.
