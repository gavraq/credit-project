# Manual Testing Fix: Workflow Actions UI Cleanup

## Issue

All form screens showed a comments box inside the shared `Workflow Actions`
section, but that input was not being persisted as a reusable form field and
made the bottom action area look cluttered. The action area also had cramped
button text and visual overlap.

## Root Cause

The shared workflow action component
[`frontend/src/components/common/WorkflowActions.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/common/WorkflowActions.jsx)
still carried an older comments input pattern even though the current form
design does not use that free-text field as part of the saved artifact data.

## Fix

- removed the shared comments input from `WorkflowActions`
- simplified transition invocation to pass an empty comment by default
- cleaned up the action bar presentation:
  - removed icon-heavy labels
  - tightened button spacing and sizing
  - simplified the helper copy

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
