# Credit Request Hybrid Save Reduction

## Goal

Reduce the remaining hybrid behavior in `CreditRequestForm` without disrupting
new-application creation.

## Change

Updated
[`frontend/src/components/CreditRequestForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/CreditRequestForm/index.jsx)
so that existing applications now save through two explicit paths:

- parent application payload via `updateCreditRequest(...)`
- credit request artifact payload via `saveCreditRequestForm(...)`

This applies to:

- normal save for existing applications
- transition flow for existing applications

## Why

`CreditRequestForm` is the main architectural outlier because it owns both:

- parent application fields
- credit-request artifact fields

The previous implementation pushed both back through the legacy combined parent
payload for edits. That kept the active edit path more coupled to the old
serializer contract than the rest of the refactor.

## Current Boundary

For existing applications:

- parent fields are updated through the application endpoint
- artifact fields are updated through the artifact endpoint

For new application creation:

- the combined bootstrap payload is still used intentionally

That keeps creation practical while moving the edit/update path much closer to
the target artifact-native architecture.

## Additional Correction

`detailedCommentsOnLimits` is now carried on the parent application payload as
`description`, which is the real parent-model field behind that concept.

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
