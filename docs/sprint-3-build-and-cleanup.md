# Sprint 3: Build Validation and Legacy Cleanup

## Purpose

After migrating the active backend, test clients, and frontend consumers to the artifact-based contract, the next step was to validate the live frontend build and remove obvious legacy files that still embodied the old pattern.

## Implemented

Updated / executed:

- frontend lint
- frontend production build

Removed:

- `frontend/src/components/CreditRequestForm/index_old.jsx`

## Results

### Frontend lint

`npm run lint` completed without errors.

Current state:

- warnings only
- no lint failures that block the build

The warnings are mostly:

- existing `console` usage
- unused imports/variables
- a small number of hook dependency warnings

## Warning Reduction Pass

After the initial build validation, a focused warning-reduction pass was applied to the active artifact-based path.

Updated:

- `frontend/src/App.js`
- `frontend/src/services/api.js`
- `frontend/src/components/common/FormPageWrapper.jsx`
- `frontend/src/components/common/WorkflowActions.jsx`
- `frontend/src/components/MyTasks.js`
- `frontend/src/components/BusinessSponsorshipForm/index.jsx`
- `frontend/src/components/CreditReviewForm/index.jsx`
- `frontend/src/components/CreditRequestForm/index.jsx`
- `frontend/src/components/LegalReviewForm/index.jsx`

Changes:

- removed unused imports left behind by the artifact migration
- removed debug-heavy `console` logging from shared workflow UI components and active form screens
- simplified `frontend/src/services/api.js` so service wrappers return response data directly instead of rethrow-only `try/catch` blocks
- fixed the `CreditRequestForm` hook dependency warning by including the `counterparties` lookup dependency

Validation after this pass:

- `npm run lint` passes with warnings only
- `npm run build` passes again

Measured effect:

- lint warnings reduced from `308` to `185`
- lint/build blocking errors reduced to `0`

## Credit Approval Cleanup

The next focused cleanup pass targeted the noisiest remaining active workflow screen:

- `frontend/src/components/CreditApprovalForm/index.jsx`

Changes:

- removed unused approval-fetch scaffolding and unused local state
- removed temporary DA authorization and approver debug logging
- kept the actual DA gating behavior and approver UUID normalization
- simplified the transition path so only business behavior remains

Validation after this pass:

- `npm run lint` passes with warnings only
- `npm run build` passes again

Measured effect:

- lint warnings reduced from `185` to `96`
- active artifact-based workflow path is substantially quieter

## Remaining Active Workflow Forms

The next cleanup pass covered the remaining active workflow forms:

- `frontend/src/components/CreditCompilationForm/index.jsx`
- `frontend/src/components/CreditAnalysisForm/index.jsx`
- `frontend/src/components/CreditQuestionnaireForm/index.jsx`

Changes:

- removed debug-heavy transition logging
- removed unused form metadata state
- removed unused questionnaire save scaffolding
- preserved explicit save and workflow transition behavior for compilation and analysis

Validation after this pass:

- `npm run lint` passes with warnings only
- `npm run build` passes again

Measured effect:

- lint warnings reduced from `96` to `44`
- active workflow forms are now effectively clean of the temporary migration diagnostics

## Dashboard and Support Cleanup

The final cleanup pass targeted the remaining dashboard/detail/supporting components:

- `frontend/src/components/ApplicationDetails/index.jsx`
- `frontend/src/components/ApplicationLoader.jsx`
- `frontend/src/components/RequestTrackingDashboard.js`
- `frontend/src/components/PrioritizationDashboard.js`
- `frontend/src/components/TopNavBar.js`
- `frontend/src/components/ClimateScorecard/index.jsx`
- `frontend/src/components/CreditRequestForm/CounterpartySection.jsx`
- `frontend/src/components/CreditRequestForm/LegalSection.jsx`
- `frontend/src/components/CreditRequestForm/RelationshipSection.jsx`
- `frontend/src/components/CreditRequestForm/LimitsSection.jsx`
- `frontend/src/serviceWorkerRegistration.js`
- `frontend/src/store/authSlice.js`
- `frontend/src/components/common/VersionControlHeader.jsx`

Changes:

- removed the remaining debug logging and unused imports/state
- made `ApplicationDetails` read `artifacts` only
- made `ApplicationLoader` read artifact keys only
- cleaned the climate scorecard exception path while preserving its AI-generation behavior
- removed the remaining support-file lint issues in the service worker and auth bootstrap code

Validation after this pass:

- `npm run lint` passes cleanly
- `npm run build` passes cleanly

Measured effect:

- lint warnings reduced from `44` to `0`
- production build now compiles successfully without ESLint warnings

## Legacy Contract Removal

Because backward compatibility is not required for this environment, the final compatibility branch was removed from the frontend.

Updated:

- `frontend/src/components/ApplicationDetails/index.jsx`
- `frontend/src/components/ApplicationLoader.jsx`

Changes:

- removed the `sub_processes` fallback path from the detail screen
- removed the `sub_processes` fallback path from the form loader
- made the frontend artifact-native rather than artifact-preferred

Validation after this pass:

- `npm run lint` passes cleanly
- `npm run build` passes cleanly

Architectural effect:

- `artifacts` is now the only active workflow collection contract in the frontend
- `sub_processes` is no longer part of the active frontend read path

## Backend Contract Cleanup

The final backend compatibility cleanup removed the last stale `sub_processes`-era serializer artifact from the repository.

Updated:

- `credit_applications/tests.py`

Removed:

- `credit_applications/serializers.py.bak`

Changes:

- strengthened the serializer contract test so it asserts the serialized payload exposes `artifacts` and does not expose `sub_processes`
- removed the stale backup serializer file that still carried the old `sub_processes` payload shape

Validation after this pass:

- `python manage.py check` passes
- the focused Django test run is blocked in this sandbox because PostgreSQL access to `localhost:5432` is denied

Architectural effect:

- the live backend contract remains artifact-only
- the repository no longer contains the stale serializer backup that represented the old `sub_processes` payload

## Artifact Contract Test Hardening

After the artifact-only frontend and backend cleanup, the next step was to harden the test suite around the new steady-state contract.

Updated:

- `credit_applications/tests.py`
- `credit_workflow/tests/test_artifacts.py`
- `workflow_engine/tests/test_api_views.py`

Changes:

- added serializer payload assertions for the artifact item shape on the credit application payload
- added API assertions that the credit application detail endpoint exposes `artifacts` and not `sub_processes`
- added artifact descriptor assertions that legacy keys like `form_name` and nested `data` are absent
- added engine API coverage that workflow instance detail includes its artifact list
- kept the application serializer contract tests scoped to contract shape by stubbing artifact descriptor generation instead of requiring full workflow metadata seeding

Validation after this pass:

- `python manage.py test --keepdb credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils` passes
- `python manage.py check` passes

Architectural effect:

- the artifact-only contract is now protected at three layers:
  - credit application payload
  - credit artifact descriptor generation
  - engine workflow instance API

## Artifact Metadata Terminology Cleanup

The next cleanup pass removed the last important terminology drift between the runtime, the source-controlled workflow config, and the supporting maintenance tooling.

Updated:

- `credit_workflow/loaders.py`
- `config/workflows/credit/credit_workflows.json`
- `workflow_engine/management/commands/update_workflow_metadata.py`
- `credit_workflow/tests/test_loaders.py`

Changes:

- made `relevant_artifacts` the canonical state metadata key in the source-controlled credit workflow definition
- added loader normalization so legacy `relevant_sub_processes` state metadata is still accepted on import and rewritten into the canonical artifact-oriented shape
- added loader tests to lock down both the canonical path and the legacy import alias
- updated the main workflow metadata maintenance command so it now writes `relevant_artifacts`
- fixed drift in that maintenance command so `climate_scorecard` is included in the later parent workflow states just as it is in the source-controlled credit workflow config

Validation after this pass:

- `python manage.py test --keepdb credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils` passes
- `python manage.py load_credit_workflows --validate-only` passes

Architectural effect:

- the runtime, config, and maintenance tooling now all use artifact-oriented state metadata terminology
- legacy `relevant_sub_processes` input remains supported only as a loader/runtime compatibility alias, not as the canonical model
- the source-controlled workflow definition and the fallback metadata maintenance command no longer drift on `climate_scorecard`

### Frontend build

`npm run build` completed successfully.

Current state:

- production bundle builds successfully
- compile-time integration of the artifact-based frontend changes is valid

### Legacy cleanup

Removed the unreferenced backup file:

- `frontend/src/components/CreditRequestForm/index_old.jsx`

That file still used the old top-level form-field model and was not part of the active code path.

## What remains

The remaining work is cleanup quality, not architectural migration:

- reduce frontend lint warnings
- remove or archive any other clearly unused legacy files
- optionally run browser/E2E validation against the live flows

The only remaining frontend notice is external to the app code:

- the `Browserslist` data warning from the toolchain, which suggests running `npx update-browserslist-db@latest`
