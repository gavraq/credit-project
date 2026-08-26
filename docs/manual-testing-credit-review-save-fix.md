# Manual Testing Fix: Credit Review Draft Fields Not Persisting

## Issue

During manual testing, the Credit Review form could be populated and saved as a
draft, but reopening the application showed that the entered values had not been
persisted.

## Root Cause

The Credit Review screen had already been moved onto the artifact detail save
endpoint:

- `PATCH /api/credit/credit-applications/:id/artifacts/credit_review_form/`

But the frontend was still building the old parent-serializer payload shape with
prefixed keys such as:

- `credit_review_form_assigned_credit_analyst`
- `credit_review_form_delegated_authority_level`

The artifact detail serializer expects direct model field names instead:

- `assigned_credit_analyst`
- `delegated_authority_level`

The component also mixed questionnaire values as both:

- `'yes'/'no'`
- `'true'/'false'`

which made reload behavior inconsistent.

## Fix

Updated
[`frontend/src/components/CreditReviewForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/CreditReviewForm/index.jsx)
to:

- send direct artifact field names
- normalize `questionnaire_required` to `'true'/'false'` in component state
- serialize `form_started_at` and `form_completed_at` as ISO datetimes

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
