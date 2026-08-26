# Manual Testing Fix: Legal Review Draft Fields Not Persisting

## Issue

The Legal Review form showed the same draft-save problem seen in several other
artifact-backed forms: values entered on the screen did not persist after save
and reopen.

## Root Cause

[`frontend/src/components/LegalReviewForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/LegalReviewForm/index.jsx)
was reading via the artifact endpoint but still saving the old prefixed payload
shape:

- `legal_review_form_*`

The artifact detail endpoint expects direct model field names instead.

## Fix

- switched the save payload to direct artifact field names
- normalized boolean handling for:
  - `positive_netting_opinion`
  - `positive_collateral_opinion`
  - `has_csa`
  - `iosco_compliant`
- normalized decimal handling for CSA numeric fields
- normalized `form_started_at` serialization

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
