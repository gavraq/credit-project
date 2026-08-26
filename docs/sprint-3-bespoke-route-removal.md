# Sprint 3: Bespoke Route Removal

## Purpose

After introducing the generic domain artifact detail endpoint, the remaining bespoke form routes became unnecessary.

This step removes the first of those routes:

- `legal-review-form`

## Implemented

Updated:

- `credit_applications/views.py`
- `credit_applications/tests.py`

## Change

Removed the bespoke route:

- `GET/POST /api/credit/credit-applications/:id/legal-review-form/`

The supported path for legal review content is now:

- `GET/PATCH /api/credit/credit-applications/:id/artifacts/legal_review_form/`

## Why this matters

Before this step:

- the API still had overlapping legacy form routes
- consumers had more than one way to retrieve domain form content

After this step:

- the generic artifact detail endpoint is the canonical path
- the route surface is simpler and more consistent

## Recommended next step

The same cleanup should be applied to any other bespoke form routes that remain, so all domain form access goes through the generic artifact detail endpoint.
