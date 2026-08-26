# Sprint 4: Engine Artifact Adapter Seam

## Purpose

The next step after stabilizing the artifact-based API contract was to remove one of the remaining engine-to-domain assumptions:

- artifact provisioning still meant "auto-initialize credit forms"

That coupling was not in the workflow graph itself anymore, but it still existed in the runtime seam between the engine and the credit domain.

## Implemented

Added:

- `workflow_engine/registries/artifacts.py`
- `workflow_engine/services/artifacts.py`
- `workflow_engine/tests/test_artifact_services.py`

Updated:

- `credit_workflow/artifacts.py`
- `credit_workflow/hooks.py`
- `credit_workflow/registry.py`
- `credit_applications/views.py`

## What Changed

### Engine-side artifact adapter registry

The engine now has a dedicated artifact adapter registry keyed by the workflow instance content object model.

That registry allows the engine to ask:

- how to provision artifacts for this workflow content object
- how to synchronize artifact records for this workflow content object

without importing credit-domain code directly.

### Engine-side artifact services

The engine now exposes two generic services:

- `provision_artifacts_for_workflow_instance()`
- `sync_artifacts_for_workflow_instance()`

These services resolve the registered adapter for the workflow instance content object and then delegate provisioning/synchronization to the domain layer.

### Credit-domain adapter registration

The credit domain now registers itself as the adapter for `creditapplication` workflow content objects.

The credit adapter currently exposes:

- `provision_credit_workflow_artifacts()`
- `sync_workflow_artifact_records()`

So the engine now sees "artifact provisioning" and "artifact synchronization", while the credit domain remains free to implement those operations in terms of its current form model.

### Hook and application wiring

The credit post-transition hook no longer imports or calls the credit form auto-initialization helper directly.

Instead it now:

- calls the engine artifact provisioning service
- calls the engine artifact synchronization service

The credit-application workflow creation path now does the same when a parent workflow instance is created.

## Why This Matters

This is a smaller change than introducing a fully generic artifact/task persistence model, but it is an important boundary improvement.

Before:

- the engine/domain seam still implied credit-form initialization

After:

- the engine/domain seam is expressed in artifact terms
- the engine delegates artifact behavior through a registry
- the credit domain remains the owner of the concrete form implementation

## Current Limitation

The credit adapter still provisions concrete credit form models underneath the generic artifact seam.

So the system is now:

- engine-level artifact-native at the service boundary

but still:

- credit-form-backed in the domain implementation

That is acceptable for this phase because it lowers coupling without forcing a risky storage-model rewrite.

## Validation

Passed:

- `python manage.py test --keepdb workflow_engine.tests.test_artifact_services credit_workflow.tests.test_loaders credit_applications.tests credit_workflow.tests.test_artifacts workflow_engine.tests.test_api_views workflow_engine.tests.test_api_serializers workflow_engine.tests.test_utils`
- `python manage.py check`

## Recommended Next Step

The next useful generalization would be to replace the remaining credit-specific metadata lookup assumptions in `credit_workflow/metadata.py` with an explicit artifact definition registry or artifact-type descriptor model.

That would move the system from:

- generic engine artifact services with credit-specific artifact metadata

toward:

- generic engine artifact services with domain-registered artifact definitions
