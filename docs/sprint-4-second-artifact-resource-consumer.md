# Sprint 4 - Second Artifact Resource Hook Consumer

## Summary

The shared frontend artifact resource hook is now exercised by multiple ordinary form screens, not just `ClimateScorecard`.

`LegalReviewForm`, `CreditQuestionnaireForm`, `BusinessSponsorshipForm`, `CreditAnalysisForm`, `CreditCompilationForm`, `CreditApprovalForm`, `CreditReviewForm`, and `CreditRequestForm` now use `useCreditArtifactResource(applicationId, application, artifactKey, ...)` for their primary artifact-detail read paths, while preserving their existing transition and save behavior.

## What Changed

- `frontend/src/components/LegalReviewForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['legal_review_form'])` for the read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the form detail through `useCreditArtifactResource(id, creditApplication, 'legal_review_form', { refreshKey })`
  - keeps the existing save flow through `saveLegalReviewForm(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`
- `frontend/src/components/CreditQuestionnaireForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['credit_questionnaire_form'])` for the read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the form detail through `useCreditArtifactResource(id, creditApplication, 'credit_questionnaire_form', { refreshKey })`
  - keeps the existing save flow through `saveCreditQuestionnaireForm(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`
- `frontend/src/components/BusinessSponsorshipForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['business_sponsorship_form', 'credit_request_form'])` for the primary read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the main form detail through `useCreditArtifactResource(id, creditApplication, 'business_sponsorship_form', { refreshKey })`
  - still fetches `credit_request_form` explicitly as a supporting artifact because sponsor defaults depend on it
  - keeps the existing save flow through `saveBusinessSponsorshipForm(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`
- `frontend/src/components/CreditAnalysisForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['credit_analysis_form'])` for the read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the form detail through `useCreditArtifactResource(id, creditApplication, 'credit_analysis_form', { refreshKey })`
  - keeps the existing analyst lookup through `fetchUsersByRole(...)`
  - keeps the existing save flow through `saveCreditAnalysisForm(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`
- `frontend/src/components/CreditCompilationForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['credit_compilation_form'])` for the read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the form detail through `useCreditArtifactResource(id, creditApplication, 'credit_compilation_form', { refreshKey })`
  - keeps the existing analyst lookup through `fetchUsersByRole(...)`
  - keeps the existing save flow through `saveCreditCompilationForm(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`
- `frontend/src/components/CreditApprovalForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['credit_approval_form', 'credit_review_form'])` for the primary read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the main form detail through `useCreditArtifactResource(id, creditApplication, 'credit_approval_form', { refreshKey })`
  - still fetches `credit_review_form` explicitly as a supporting artifact because DA authorization and default approval metadata depend on it
  - keeps the existing save flow through `saveCreditApprovalForm(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`
- `frontend/src/components/CreditReviewForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['credit_review_form'])` for the read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the form detail through `useCreditArtifactResource(id, creditApplication, 'credit_review_form', { refreshKey })`
  - keeps the existing analyst lookup through `fetchUsersByRole(...)`
  - keeps the existing save flow through `submitCreditReview(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`
- `frontend/src/components/CreditRequestForm/index.jsx`
  - replaced `fetchCreditArtifactBundle(id, ['credit_request_form'])` for the artifact read path
  - now fetches the parent application with `fetchCreditRequest(id)`
  - now loads the request-form detail through `useCreditArtifactResource(id, creditApplication, 'credit_request_form', { refreshKey })`
  - keeps the existing reference-data lookups through `fetchUsersByRole(...)`, `fetchCounterpartyList()`, and `fetchLimitTypes()`
  - keeps the existing create/update flow through `submitCreditRequest(...)` and `updateCreditRequest(...)`
  - keeps the existing workflow transition flow through `performWorkflowTransition(...)`

## Why This Matters

Up to this point, the new hook pattern had only one live consumer with a non-standard extra action:

- `ClimateScorecard`

That was useful, but it left one architectural ambiguity:

- was `useCreditArtifactResource(...)` a genuinely reusable artifact-native abstraction, or just a climate-scorecard convenience wrapper?

Moving `LegalReviewForm`, `CreditQuestionnaireForm`, `BusinessSponsorshipForm`, `CreditAnalysisForm`, `CreditCompilationForm`, `CreditApprovalForm`, `CreditReviewForm`, and `CreditRequestForm` onto the same read pattern answers that directly.

The hook is now proven against:

1. a generated artifact with a discovered remote action (`ClimateScorecard`)
2. a standard writable form artifact with no extra action (`LegalReviewForm`)
3. another standard writable form artifact with no extra action (`CreditQuestionnaireForm`)
4. a standard writable form artifact with one explicit supporting-artifact dependency (`BusinessSponsorshipForm`)
5. a standard writable form artifact with an additional non-artifact analyst lookup (`CreditAnalysisForm`)
6. another standard writable form artifact with an additional non-artifact analyst lookup (`CreditCompilationForm`)
7. a standard writable form artifact with one explicit supporting-artifact dependency for authorization/defaults (`CreditApprovalForm`)
8. another standard writable form artifact with an additional non-artifact analyst lookup (`CreditReviewForm`)
9. the foundational request form, which still combines artifact detail with broader reference-data lookups and create/update application behavior (`CreditRequestForm`)

## Architectural Outcome

The frontend now has a shared artifact-native read abstraction that works for both:

- ordinary form artifacts
- form artifacts with extra discovered actions
- ordinary form artifacts that still depend on a second explicitly fetched artifact
- ordinary form artifacts that still depend on separate non-artifact reference data

`CreditApprovalForm` also confirms that the pattern still holds when the supporting artifact is used for authorization decisions rather than just display defaults.

That makes the pattern strong enough to reuse further without treating it as climate-specific infrastructure.

At this point, all active credit workflow form screens use the same artifact-resource read pattern for their primary artifact data.

## Validation

- `cd frontend && npm run lint`
- `cd frontend && npm run build`

Both passed. The only remaining notice is the existing `Browserslist` staleness message from the frontend toolchain.
