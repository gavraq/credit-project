# Sprint 3: Implementation Status

## Status

The system now has an engine-level generic artifact persistence model.

This is the first step beyond:

- generic artifact projection

into:

- generic artifact persistence

## Implemented

### New model

Added:

- `workflow_engine.models.WorkflowArtifact`

Migration:

- `workflow_engine/migrations/0003_workflowartifact.py`

The model stores:

- parent workflow instance
- stable artifact key
- artifact kind
- generic reference to a concrete form object
- artifact metadata

### Admin registration

Updated:

- `workflow_engine/admin.py`

`WorkflowArtifact` is now registered in Django admin.

### Domain sync layer

Updated:

- `credit_workflow/artifacts.py`
- `credit_workflow/hooks.py`

The credit domain now synchronizes `WorkflowArtifact` records:

- when workflow artifact descriptors are generated
- when post-transition credit hooks run

### Engine API read surface

Updated:

- `backend/users/serializers.py`
- `backend/users/views.py`
- `backend/urls.py`
- `credit_applications/serializers.py`

Changes:

- workflow instance serialization now includes generic artifact records
- engine-level workflow instance APIs now expose artifact references directly
- a dedicated engine artifact endpoint is available at `/api/workflow-instances/:id/artifacts/`
- the credit application serializer now exposes a single `artifacts` collection instead of legacy per-form workflow projections
- the credit application artifact items now use artifact-oriented keys instead of legacy form-oriented keys
- the credit application artifact items are now reference-only and no longer embed full form payloads
- the credit application artifact items now include explicit domain navigation metadata for retrieving and updating form content
- bespoke form routes are starting to be removed in favor of the generic domain artifact detail endpoint
- dead serializer compatibility methods for removed per-form fields have been cleaned out of the backend
- shared test and frontend API clients now use the generic artifact detail endpoint as the standard form access path
- the shared API integration test helpers and workflow tests now use artifact detail endpoints instead of removed top-level form fields
- a first set of active frontend form screens now fetch artifact detail explicitly instead of reading removed top-level form fields from the application payload
- the remaining active frontend form screens and `MyTasks` have now been migrated to the same artifact-based access pattern
- frontend lint and production build both pass, and an unreferenced legacy backup form file has been removed
- a focused warning-reduction pass has cleaned the shared API layer and key active artifact-based screens, reducing frontend lint warnings from `308` to `185` while keeping build success
- `CreditApprovalForm` has now been cleaned of temporary diagnostic scaffolding as well, reducing the remaining frontend warning count further from `185` to `96` with build success preserved
- the remaining active workflow forms (`CreditCompilationForm`, `CreditAnalysisForm`, `CreditQuestionnaireForm`) have now been cleaned as well, reducing the remaining frontend warning count from `96` to `44` while keeping build success preserved
- the older dashboard/detail/supporting components and frontend support files have now been cleaned as well, reducing the remaining frontend warning count from `44` to `0`; lint now passes cleanly, build succeeds cleanly, and the detail/loader screens now use the artifact-based contract only, with the `sub_processes` frontend fallback removed
- the backend contract cleanup is now aligned with that frontend state as well: the serializer contract test asserts `artifacts`-only payloads, and the stale backup serializer file carrying the old `sub_processes` shape has been removed from the repository
- focused artifact-contract test hardening is now in place across the credit application serializer/API, the credit artifact descriptor layer, and the engine workflow instance API; the targeted Django suite for those paths passes
- the terminology cleanup is now aligned as well: `relevant_artifacts` is the canonical parent-state metadata key in the source-controlled credit workflow config and the primary maintenance command, the loader normalizes legacy `relevant_sub_processes` input into the canonical shape, and dedicated loader tests now protect both paths
- the fallback metadata maintenance command has also been brought back into line with the source-controlled workflow definition by including `climate_scorecard` in the later parent workflow states

### Test coverage

Updated:

- `credit_workflow/tests/test_artifacts.py`

Coverage now includes:

- artifact descriptor generation
- placeholder artifact generation
- generic artifact record synchronization

## Validation Completed

Passed:

- `python manage.py check`
- `python manage.py test credit_applications.tests`
- `python manage.py test credit_workflow.tests.test_artifacts workflow_engine.tests.test_utils`
- `python manage.py test credit_workflow.tests.test_loaders`
- `python manage.py test workflow_engine.tests.test_api_serializers`
- `python manage.py test workflow_engine.tests.test_api_views`
- `python manage.py test --keepdb credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils`
- compile validation for `workflow_engine`, `credit_workflow`, and `credit_applications`
- `python manage.py migrate workflow_engine`
- `python manage.py showmigrations workflow_engine`
- `python manage.py load_credit_workflows --validate-only`

## Architectural effect

The architecture now has all of the following in place:

1. generic workflow execution seams
2. source-controlled workflow definitions
3. domain-owned metadata access
4. generic workflow artifact API projection
5. generic workflow artifact persistence
6. generic engine artifact provisioning and synchronization services backed by domain-registered artifact adapters
7. generic engine artifact definition provider registration backed by a domain-owned artifact definition provider
8. explicit artifact-type registration with artifact kind derived through the definition-provider seam instead of hardcoded in the credit artifact builder
9. explicit artifact capabilities exposed in both the credit application artifact payload and the engine workflow artifact payload
10. per-artifact capability overrides layered on top of base artifact-type capabilities, with `climate_scorecard` now advertising `remote_generate` explicitly
11. generic action discovery layered on top of artifact capabilities, with `climate_scorecard` now advertising `remote_generate` and exposing the concrete HTTP action descriptor that implements it
12. the first live frontend consumer now uses artifact action discovery directly, with the climate scorecard screen invoking the resolved `remote_generate` action instead of a hardcoded helper route
13. shared frontend artifact/action selection helpers now exist, and the dead hardcoded climate generation helper has been removed from the active frontend path
14. a shared frontend `useArtifactAction` hook now resolves artifact actions declaratively, and the climate screen uses it instead of component-owned action lookup state
15. a shared frontend artifact resource hook now combines generic artifact detail loading with action resolution, and the climate screen now uses the generic artifact endpoint instead of the credit-application payload as its primary scorecard source

## Current limitation

`WorkflowArtifact` is still a mirrored persistence layer.

The source-of-truth business data remains in the existing credit form models.

That means:

- the generic artifact model is present
- but the system is not yet fully artifact-native

This is still the right transition state because it avoids a high-risk rewrite.

## Latest Boundary Improvement

The engine now has a dedicated artifact adapter seam:

- `workflow_engine.registries.artifacts`
- `workflow_engine.services.artifacts`

The credit domain registers an artifact adapter for `creditapplication` content objects, and the credit post-transition provisioning path plus the credit-application workflow creation path now call the generic engine artifact services instead of calling credit-form initialization helpers directly.

That means the remaining runtime boundary is now expressed in artifact terms rather than form terms, even though the credit domain still provisions concrete form models underneath that seam.

The engine now also has a dedicated artifact definition provider seam:

- `workflow_engine.registries.definitions`
- `workflow_engine.services.definitions`

The credit domain registers a definition provider for `creditapplication`, and the compatibility helpers in `credit_workflow.metadata` now delegate artifact-definition lookup, model mapping, prefix generation, field mappings, and permission lookup through that provider.

That means both artifact behavior and artifact metadata are now exposed through explicit domain registration seams rather than ad hoc helper logic.

Artifact kind is now explicit as well:

- `workflow_engine.registries.artifact_types`
- `workflow_engine.services.artifact_types`

The credit definition provider now supplies artifact kind, the credit artifact builder derives kind through the provider seam, and `form` is registered as the first explicit artifact type with capability metadata.

That means the platform no longer treats artifact kind as an implicit hardcoded assumption even though the live credit domain still uses only form artifacts today.

Artifact capabilities are now exposed directly as well:

- credit application artifact descriptors include `capabilities`
- engine workflow artifact serializers include `capabilities`

Those capabilities are derived from the registered artifact type, and the artifact-type service includes a built-in fallback for `form` so the payload remains stable even in minimal test/runtime contexts where full domain registration has not been loaded.

Capability resolution is now layered as well:

- base capabilities come from the registered artifact type
- artifact-specific capability extensions come from the artifact definition provider

The first live example is `climate_scorecard`, which now extends the base `form` capabilities with `remote_generate` through source-controlled workflow configuration rather than through client-side naming assumptions.

Artifact action discovery is now layered on top of that:

- artifact definitions can declare `artifact_actions`
- runtime payloads expose resolved `actions`

So `climate_scorecard` now advertises not just the generic `remote_generate` capability, but also the concrete `POST /api/credit/credit-applications/{id}/climate-scorecard/generate/` action that implements it.

That action-discovery contract is now consumed by the frontend as well:

- the climate scorecard screen reads the `remote_generate` action descriptor from the artifact payload
- the frontend API layer can invoke artifact actions generically
- the climate generation UI no longer depends on a hardcoded route helper

The frontend selection logic is now reusable as well:

- shared helpers can find an artifact by key
- shared helpers can find an action by key or capability

So future screens do not need to reimplement artifact/action lookup inline.

That reuse now extends to a shared hook as well:

- `useArtifactAction(application, artifactKey, { actionKey, capability })`

So action-driven screens can resolve artifact actions declaratively without storing separate action-selection state in the component.

The frontend is now artifact-native one step further:

## Latest Cleanup Progress

The runtime helper surface is continuing to move from form-oriented naming to artifact-oriented naming.

Completed cleanup in the live path:

- removed the live `get_relevant_sub_processes_for_state(...)` runtime alias
- made `get_artifact_metadata(...)` the canonical runtime metadata helper
- made these the canonical dynamic runtime helpers:
  - `get_dynamic_artifact_model_map()`
  - `get_dynamic_artifact_prefixes()`
  - `get_dynamic_artifact_field_mappings()`
  - `get_artifact_permissions()`
- made these the canonical runtime artifact lifecycle helpers:
  - `provision_artifacts_for_state()`
  - `can_user_edit_artifact()`
- renamed the live credit-application serializer helpers to artifact-oriented names:
  - `_extract_artifact_data(...)`
  - `_update_artifact_instance(...)`

Compatibility aliases still exist where they reduce migration risk:

- `get_form_metadata()`
- `get_dynamic_form_model_map()`
- `get_dynamic_form_prefixes()`
- `get_dynamic_field_mappings()`
- `get_form_permissions()`
- `auto_initialize_forms_for_state()`
- `can_user_edit_form()`

The key change is that live runtime callers now use the artifact-oriented helpers, while compatibility stays pushed to the edges instead of remaining in the main path.

The management-command and diagnostic layer is now aligned with that terminology as well:

- active diagnostic commands now import and report artifact-oriented helpers
- command output now refers to artifact provisioning rather than auto-initialization where applicable
- dynamic mapping diagnostics now use artifact terminology
- the command-layer cleanup also fixed a pre-existing indentation error in `diagnose_auto_initialization.py`

- `useCreditArtifactResource(applicationId, application, artifactKey, { ... })`

combines artifact discovery, action resolution, and generic artifact detail loading, and the climate scorecard screen now uses that hook instead of reading `creditApplication.climate_scorecard` as its primary data source.

That shared hook is now exercised by a second live consumer as well:

- `LegalReviewForm`

And by a third live consumer as well:

- `CreditQuestionnaireForm`

And by a fourth live consumer as well:

- `BusinessSponsorshipForm`

And by a fifth live consumer as well:

- `CreditAnalysisForm`

And by a sixth live consumer as well:

- `CreditCompilationForm`

And by a seventh live consumer as well:

- `CreditApprovalForm`

And by an eighth live consumer as well:

- `CreditReviewForm`

And by a ninth live consumer as well:

- `CreditRequestForm`

So the abstraction is no longer climate-scorecard-specific in practice. It now supports standard writable form artifacts, a form artifact with an extra discovered remote action, form artifacts that still have explicit supporting-artifact dependencies, and form artifacts that still depend on separate non-artifact reference data. All active credit workflow form screens now use the shared artifact-resource read pattern for their primary artifact data.

The cleanup phase has now started as well:

- `fetchCreditArtifactBundle(...)` has been removed from the frontend API layer
- all metadata management commands now read/write `relevant_artifacts` via the new `get_state_relevant_artifacts()` helper instead of the legacy `relevant_sub_processes` term

That is the first explicit removal of a no-longer-needed compatibility helper after the form-screen migration.

## Recommended Next Step

The engine now exposes artifact records through both:

1. the workflow instance detail payload, and
2. the dedicated `/api/workflow-instances/:id/artifacts/` endpoint

The next cleanup step is to remove or consolidate any other now-redundant helper paths that only wrap `saveCreditArtifact(...)` without adding real behavior, while preserving the current test/client ergonomics where that still adds value.
