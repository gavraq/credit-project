# Manual Testing Fix: Draft Opened in View Mode from Application Hub

## Issue

A newly created draft credit application could be reopened from the dashboard,
but fields such as `Counterparty` and `Guarantor` were no longer editable even
though the application was still in draft.

## Root Cause

The application hub was reading the wrong permission property from the artifact
payload.

The backend artifact descriptor exposes:

- `editable`

But the frontend hub in
[`frontend/src/components/ApplicationDetails/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/ApplicationDetails/index.jsx)
was still checking:

- `can_edit`

Because `can_edit` was always `undefined`, every artifact navigation action
fell back to:

- `mode=view`

That caused the draft credit request form to open in read-only mode.

## Fix

Updated the hub to use the live artifact contract:

- `process.editable ? 'edit' : 'view'`

and to label the button from the same property.

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
