# Sprint 3: Frontend Artifact Consumer Migration

## Purpose

The backend contract is now artifact-based, so frontend form screens should no longer assume that the credit application payload contains top-level form objects.

This step moves the active form screens onto explicit artifact fetches.

## Implemented

Updated:

- `frontend/src/services/api.js`
- `frontend/src/components/CreditRequestForm/index.jsx`
- `frontend/src/components/CreditReviewForm/index.jsx`
- `frontend/src/components/BusinessSponsorshipForm/index.jsx`
- `frontend/src/components/CreditQuestionnaireForm/index.jsx`
- `frontend/src/components/LegalReviewForm/index.jsx`
- `frontend/src/components/CreditAnalysisForm/index.jsx`
- `frontend/src/components/CreditCompilationForm/index.jsx`
- `frontend/src/components/CreditApprovalForm/index.jsx`
- `frontend/src/components/MyTasks.js`

## Changes

Added a shared frontend fetch helper:

- `fetchCreditArtifactBundle(id, artifactKeys)`

The migrated form screens now:

1. fetch the parent credit application
2. fetch the required artifact detail payloads explicitly
3. use those artifact payloads for:
   - sub-workflow instance IDs
   - allowed transitions
   - form field values
   - cross-form dependencies such as:
     - `business_sponsorship_form` reading sponsor names from `credit_request_form`
     - `credit_approval_form` reading delegated authority from `credit_review_form`

## Why this matters

Before this step:

- these components still depended on removed top-level fields like `data.credit_review_form`

After this step:

- those screens follow the same artifact-based contract as the backend and shared test clients

## Remaining migration

The active screens listed above now follow the artifact-based pattern.

There may still be additional legacy, backup, or unused files that reference top-level form fields, but the live component set has been migrated in this slice.

## Validation

Completed in this session:

- targeted source inspection of the migrated components
- targeted search confirming the active migrated components no longer read removed top-level form fields
- local Python compilation for the updated API test helpers and test files

Not completed in this session:

- frontend build or runtime validation

## Recommended next step

Run frontend build/runtime validation and then remove any remaining legacy or backup code paths that still reference the old top-level form field contract.
