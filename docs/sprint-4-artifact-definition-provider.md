# Sprint 4: Artifact Definition Provider

## Purpose

After introducing a generic engine artifact adapter seam for provisioning and synchronization, the next remaining generalization target was artifact metadata ownership.

Before this step, `credit_workflow/metadata.py` still owned too much implicit domain knowledge:

- artifact definition lookup
- model mapping lookup
- field prefix lookup
- field-type mapping lookup
- permission lookup

Those concerns were still bundled together as helper logic instead of being expressed as an explicit domain-owned artifact definition provider.

## Implemented

Added:

- `workflow_engine/registries/definitions.py`
- `workflow_engine/services/definitions.py`
- `workflow_engine/tests/test_definition_services.py`
- `credit_workflow/definitions.py`

Updated:

- `credit_workflow/metadata.py`
- `credit_workflow/registry.py`

## What Changed

### Engine-side definition provider registry

The engine now has a dedicated registry for artifact definition providers keyed by workflow content object model.

This is separate from the artifact adapter registry:

- artifact adapters handle provisioning and synchronization
- artifact definition providers handle definition metadata

### Credit-domain definition provider

The credit domain now registers an explicit artifact definition provider for `creditapplication`.

That provider owns:

- artifact definition lookup by key
- all configured artifact definitions
- concrete model mapping
- field prefix mapping
- field-type mappings
- permission-related metadata lookup

### Metadata helpers now delegate to the provider

The public credit metadata helpers remain in place for compatibility, but their implementation is now thinner.

They now delegate to the credit artifact definition provider for:

- `get_form_metadata()`
- `get_dynamic_form_model_map()`
- `get_dynamic_form_prefixes()`
- `get_dynamic_field_mappings()`
- `get_form_permissions()`

So `credit_workflow/metadata.py` is now more of a compatibility/service wrapper and less of a domain knowledge container.

## Why This Matters

This makes the domain ownership model more explicit.

Before:

- artifact metadata lived behind ad hoc helper functions

After:

- artifact metadata is exposed through a registered provider
- the provider is the domain-owned definition source
- the engine now has matching registry seams for:
  - actions
  - conditions
  - hooks
  - artifact adapters
  - artifact definition providers

That is a cleaner platform shape for adding additional workflow domains later.

## Current Limitation

The credit definition provider still reads its definitions from the credit parent workflow metadata stored in the workflow definition.

So this step does not yet replace credit-specific definition storage.

What it does do is make the ownership and extension seam explicit, which is the prerequisite for replacing that storage model later if needed.

## Validation

Passed:

- `python manage.py test --keepdb workflow_engine.tests.test_definition_services workflow_engine.tests.test_artifact_services credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils`
- `python manage.py check`

## Recommended Next Step

The next useful generalization would be to stop treating artifact kinds as implicitly `"form"` in the credit domain and start registering artifact types/capabilities explicitly.

That would move the platform from:

- generic artifact seams with credit-form-backed definitions

toward:

- generic artifact seams with explicit artifact-type semantics
