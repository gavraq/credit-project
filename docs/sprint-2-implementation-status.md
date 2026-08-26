# Sprint 2: Implementation Status

## Status

Initial source-controlled workflow configuration is now in place.

This does not complete the full configuration-driven architecture, but it replaces the most brittle part of the current setup:

- hardcoded workflow graph data inside a management command

with:

- source-controlled workflow configuration loaded by a dedicated domain loader

## Implemented

### Source-controlled workflow definition

Added:

- `config/workflows/credit/credit_workflows.json`

This file now contains:

- parent credit workflow definition
- subprocess workflow definitions
- climate scorecard workflow definition
- workflow metadata
- state metadata
- transition metadata

### Config loader

Added:

- `credit_workflow/loaders.py`

The loader now:

- reads workflow config from disk
- validates workflow structure
- validates transition state references
- enforces exactly one initial state per workflow
- syncs workflows, states, and transitions into the DB
- ensures the `system` role and user exist

### Domain command

Added:

- `credit_workflow/management/commands/load_credit_workflows.py`

Supported modes:

- full load
- `--validate-only`

### Backward compatibility path

Updated:

- `workflow_engine/management/commands/load_workflow_states.py`

It now delegates to the new credit-domain config loader rather than embedding workflow data directly.

### Engine utility decoupling

Added:

- `credit_workflow/metadata.py`

Updated:

- `workflow_engine/utils.py`

Changes:

- credit-specific metadata lookup logic now lives in `credit_workflow`
- `workflow_engine/utils.py` is now a compatibility wrapper
- direct `CREDIT_PAPER` assumptions were removed from the engine utility module

### Artifact projection layer

Added:

- `credit_workflow/artifacts.py`

Updated:

- `credit_applications/serializers.py`

Changes:

- workflow artifact projection now lives in the credit domain layer
- the legacy workflow projection delegates to the artifact projection service
- added a `workflow_artifacts` field with a more generic artifact-style payload
- serializer-level workflow structure mapping is reduced

### API contract documentation

Added:

- `docs/workflow-artifacts-api-contract.md`

This documents `workflow_artifacts` as the preferred generic application-facing workflow collection.

## Validation Completed

Passed:

- `python manage.py load_credit_workflows --validate-only`
- `python manage.py load_workflow_states --validate-only`
- `python manage.py test workflow_engine.tests.test_utils`
- `python manage.py test credit_workflow.tests.test_artifacts`
- `python manage.py check`
- compile validation for `credit_workflow` and `workflow_engine`

## What This Changes Architecturally

Before this step:

- workflow definition was primarily embedded in Python command code

After this step:

- workflow definition is versioned configuration
- command code is now a loader, not the source of truth

This is the critical architectural shift required for:

- repeatable environment setup
- reviewable workflow changes
- migration toward generic workflow packages

## Current Limitations

The new config layer is still domain-specific and still JSON-based.

Open items:

- config schema is validated structurally, but not yet semantically against engine plugin/action availability
- the format is JSON rather than YAML
- named credit forms still exist as compatibility fields on the application serializer
- there is still no engine-level `WorkflowArtifact` model

## Recommended Next Step

The next step should be to decide whether to introduce a true engine-level `WorkflowArtifact` model now or preserve the current compatibility layer for longer.

That means:

1. choose the target artifact/task model
2. decide whether to migrate the frontend onto `workflow_artifacts`
3. align metadata config with the chosen generic artifact abstraction
