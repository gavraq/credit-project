# Sprint 4: Artifact Type Seam

## Purpose

After introducing explicit artifact adapter and artifact definition provider seams, the next remaining implicit assumption was artifact kind.

The system still behaved as though:

- every artifact was a form

even though it already had:

- a generic `artifact_kind` field on `WorkflowArtifact`
- a generic artifact-oriented API contract

This step makes artifact type explicit instead of incidental.

## Implemented

Added:

- `workflow_engine/registries/artifact_types.py`
- `workflow_engine/services/artifact_types.py`
- `workflow_engine/tests/test_artifact_type_services.py`

Updated:

- `workflow_engine/services/definitions.py`
- `credit_workflow/definitions.py`
- `credit_workflow/artifacts.py`
- `credit_workflow/registry.py`
- `workflow_engine/tests/test_definition_services.py`

## What Changed

### Engine-side artifact type registry

The engine now has a dedicated registry for artifact kinds.

The first registered type is:

- `form`

with explicit capabilities:

- `detail_endpoint`
- `writable`
- `workflow_reference`

### Definition-provider support for artifact kind

The credit artifact definition provider now exposes `get_kind()` so artifact kind is read from the domain definition layer rather than being hardcoded in the artifact builder.

For now, the credit provider defaults artifact kind to:

- `form`

unless a definition explicitly declares another kind.

### Credit artifact builder now derives kind

The credit artifact descriptor builder and `WorkflowArtifact` synchronization path no longer hardcode `"form"`.

They now derive artifact kind through the definition-provider seam:

- `get_artifact_kind("creditapplication", artifact_key)`

So the runtime path is now prepared for additional artifact kinds without another structural refactor.

## Technical Note

This refactor surfaced a test fragility:

- some unit tests stub artifact metadata lookup without creating workflow metadata records

Once artifact kind started flowing through the definition-provider seam, kind lookup also tried to resolve workflow metadata in those tests.

The fix was to make `get_artifact_kind()` fall back cleanly to:

- `form`

if the provider cannot resolve a definition.

That is also the correct runtime behavior for this phase because `form` remains the default artifact kind.

## Why This Matters

This is the first point where the platform treats artifact type as a first-class concept rather than a hardcoded assumption.

Before:

- artifact APIs were generic
- artifact persistence was generic
- artifact kind was still effectively fixed

After:

- artifact kind is a registered concept
- artifact kind is resolved from the domain definition layer
- the platform can now evolve toward non-form artifact kinds without reworking the artifact contract again

## Validation

Passed:

- `python manage.py test --keepdb workflow_engine.tests.test_artifact_type_services workflow_engine.tests.test_definition_services workflow_engine.tests.test_artifact_services credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils`
- `python manage.py check`

## Recommended Next Step

The next useful generalization would be to introduce explicit artifact capabilities into the live artifact payload or policy layer, so consumers can distinguish:

- writable form artifacts
- generated artifacts
- read-only reference artifacts
- task-like artifacts

without inferring those semantics indirectly from domain naming.
