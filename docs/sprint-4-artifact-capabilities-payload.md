# Sprint 4: Artifact Capabilities Payload

## Purpose

After introducing explicit artifact-type registration, the next useful step was to expose artifact capabilities directly in the live payload.

Before this step, consumers still had to infer behavior from:

- artifact names
- artifact kind
- endpoint shape

That was workable, but it left too much implicit domain knowledge in clients.

## Implemented

Updated:

- `credit_workflow/artifacts.py`
- `backend/users/serializers.py`
- `workflow_engine/services/artifact_types.py`
- `credit_workflow/tests/test_artifacts.py`
- `credit_applications/tests.py`
- `workflow_engine/tests/test_api_serializers.py`
- `workflow_engine/tests/test_api_views.py`

## What Changed

### Credit application artifact descriptors

The credit application artifact descriptor payload now includes:

- `capabilities`

alongside:

- `key`
- `kind`
- `resource`
- other existing artifact metadata

Those capabilities are derived from the registered artifact type rather than hardcoded in the descriptor builder.

### Engine workflow artifact serializer

The engine-level `WorkflowArtifactSerializer` now also exposes:

- `capabilities`

So both the credit-domain read surface and the generic engine read surface describe artifact behavior explicitly.

### Built-in form fallback

The artifact-type service now has a built-in fallback for:

- `form`

This matters because some focused serializer tests and lightweight runtime contexts do not load the full credit app registration path.

Without that fallback, the `form` artifact type would still work in the main app but would lose its capabilities in minimal contexts.

The service now returns the expected built-in `form` capabilities even if the registry has not yet been populated.

## Current Capability Contract

For the registered `form` artifact type, the live payload now exposes:

- `detail_endpoint`
- `writable`
- `workflow_reference`

This makes the client contract more explicit without changing routes or persistence.

## Why This Matters

This is the first point where consumers can reason about artifact behavior from the payload itself instead of inferring it from domain naming.

Before:

- the system had generic artifacts
- the system had explicit artifact kinds
- behavior was still mostly inferred

After:

- artifacts expose explicit capabilities
- capabilities are derived from artifact type registration
- both the engine and the credit application read surfaces describe artifact behavior consistently

## Validation

Passed:

- `python manage.py test --keepdb workflow_engine.tests.test_artifact_type_services workflow_engine.tests.test_definition_services workflow_engine.tests.test_artifact_services credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils`
- `python manage.py check`

## Recommended Next Step

The next useful generalization would be to let artifact definitions override or extend base type capabilities per artifact.

That would support cases like:

- generated-but-read-only artifacts
- AI-assisted artifacts with an extra generation capability
- task-like artifacts with claim/complete semantics

without making artifact kind itself too granular.
