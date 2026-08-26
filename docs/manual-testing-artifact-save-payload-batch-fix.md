# Manual Testing Fix: Batch Cleanup of Artifact Save Payloads

## Issue

After fixing Credit Review, the remaining artifact-backed forms were checked for
the same migration gap:

- artifact-native read path
- old prefixed save payload

This pattern was still present in:

- `CreditQuestionnaireForm`
- `CreditAnalysisForm`
- `CreditCompilationForm`
- `CreditApprovalForm`

## Root Cause

These screens had been migrated onto the artifact detail endpoint for reads, but
their save payload builders still used the older parent-serializer field format
such as:

- `credit_analysis_form_industry_analysis`
- `credit_approval_form_approver`

The artifact detail endpoint expects direct serializer/model field names
instead.

## Fix

Updated the following components to send direct artifact field names:

- [`frontend/src/components/CreditQuestionnaireForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/CreditQuestionnaireForm/index.jsx)
- [`frontend/src/components/CreditAnalysisForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/CreditAnalysisForm/index.jsx)
- [`frontend/src/components/CreditCompilationForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/CreditCompilationForm/index.jsx)
- [`frontend/src/components/CreditApprovalForm/index.jsx`](/Volumes/DockSSD/projects/credit-project/frontend/src/components/CreditApprovalForm/index.jsx)

Also cleaned related field handling where needed:

- direct `form_started_at` usage instead of legacy `*_start_date`
- ISO datetime conversion for datetime-backed fields
- boolean normalization for compilation flags
- fixed `CreditCompilationForm` save handling to use the artifact response shape

## Validation

- search confirms no remaining prefixed save payloads for those four forms
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
