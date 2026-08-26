# Manual Testing Fix: Business Sponsorship Draft Fields Not Persisting

## Issue

The Business Sponsorship form showed the same persistence problem as the Credit
Review form: values entered on the screen did not survive a draft save and
reopen.

## Root Cause

Two issues were present in
[`frontend/src/components/BusinessSponsorshipForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/BusinessSponsorshipForm/index.jsx):

1. The form was saving through the artifact detail endpoint but still using the
   old prefixed payload keys such as `business_sponsorship_form_*`.
2. The component used decision values `approve/reject`, while the backend model
   choices are `approved/rejected`.

## Fix

- switched the save payload to direct artifact field names
- normalized datetime serialization for `form_started_at` and `form_completed_at`
- aligned decision values to the backend model choices:
  - `approved`
  - `rejected`
- updated transition validation to use the corrected decision values

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
