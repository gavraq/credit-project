# Sprint 4: Artifact Capability Overrides

## Purpose

After adding explicit artifact capabilities to the live payload, the next step was to let individual artifact definitions extend the base capability set for their artifact type.

This matters because some artifacts, such as `climate_scorecard`, have extra behavior that should be discoverable from the payload without forcing a new artifact kind.

## Implemented

Updated:

- `config/workflows/credit/credit_workflows.json`
- `credit_workflow/definitions.py`
- `workflow_engine/services/definitions.py`
- `workflow_engine/services/artifact_types.py`
- `credit_workflow/artifacts.py`
- `workflow_engine/tests/test_artifact_type_services.py`
- `workflow_engine/tests/test_definition_services.py`
- `credit_workflow/tests/test_artifacts.py`
- `workflow_engine/tests/test_api_serializers.py`

## What Changed

### Definition-level capability extensions

The credit workflow config now supports:

- `artifact_capabilities`

on individual artifact definitions.

The first live use is:

- `climate_scorecard`

which now declares:

- `ai_generate`

in addition to the base `form` capabilities.

### Merged capability resolution

The engine now resolves artifact capabilities in two layers:

1. base capabilities from the registered artifact type
2. per-artifact capability extensions from the definition provider

That merge is handled in:

- `workflow_engine.services.artifact_types.get_artifact_capabilities()`

with duplicate capability names removed while preserving a stable order.

### Payload effect

For ordinary form artifacts, the payload still exposes:

- `detail_endpoint`
- `writable`
- `workflow_reference`

For `climate_scorecard`, the payload now exposes:

- `detail_endpoint`
- `writable`
- `workflow_reference`
- `ai_generate`

This works on both:

- credit application artifact descriptors
- engine workflow artifact serializers

## Why This Matters

This is the point where capability semantics become precise enough for richer generic clients.

Before:

- capabilities were only type-level
- special-case artifact behavior still had to be inferred from artifact names

After:

- the base type stays simple
- artifact-specific behavior is declared explicitly in configuration
- clients can discover enhanced capabilities like `ai_generate` directly from the payload

That is a better generalization path than creating many narrowly specialized artifact kinds.

## Validation

Passed:

- `python manage.py test --keepdb workflow_engine.tests.test_artifact_type_services workflow_engine.tests.test_definition_services workflow_engine.tests.test_artifact_services credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils`
- `python manage.py load_credit_workflows --validate-only`
- `python manage.py check`

## Recommended Next Step

The next useful generalization would be to align resource/action discovery with capabilities so payloads can expose not just what an artifact can do, but the concrete action endpoints that implement those capabilities.

That would let artifacts advertise operations such as:

- AI generation
- regeneration
- approval submission
- task claim/complete

in a fully generic way.
