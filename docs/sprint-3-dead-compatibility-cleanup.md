# Sprint 3: Dead Compatibility Cleanup

## Purpose

After the credit application serializer stopped exposing per-form workflow fields, it still contained dead helper methods that existed only to populate those removed fields.

This step removes that stale backend code.

## Implemented

Updated:

- `credit_applications/serializers.py`

## Removed

Removed dead serializer methods for the old per-form projection path, including:

- `_get_or_auto_initialize_form`
- `get_credit_request_form`
- `get_credit_review_form`
- `get_business_sponsorship_form`
- `get_legal_review_form`
- `get_credit_questionnaire_form`
- `get_credit_analysis_form`
- `get_credit_compilation_form`
- `get_credit_approval_form`
- `_can_user_edit_form`

## Why this matters

Before this step:

- the public API had already moved away from top-level form fields
- but the serializer still contained implementation paths for those removed fields

After this step:

- the serializer reflects the current contract more accurately
- there is less dead compatibility code to maintain

## Recommended next step

The remaining cleanup should focus on client code and tests that still assume top-level form fields, so the whole stack aligns to the artifact-based contract.
