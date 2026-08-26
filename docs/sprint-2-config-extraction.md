# Sprint 2: Source-Controlled Workflow Configuration

## Objective

Move credit workflow definitions out of hardcoded management-command data and into source-controlled configuration that can be validated and loaded repeatably.

## Implemented

### Source-controlled config

Added:

- `config/workflows/credit/credit_workflows.json`

This file now holds the credit workflow graph and metadata for:

- `CREDIT_PAPER`
- all current credit subprocess workflows
- `CLIMATE_SCORECARD`

### Loader

Added:

- `credit_workflow/loaders.py`

Responsibilities:

- load config from disk
- validate structure
- create or update workflows, states, and transitions
- ensure the `system` role/user exists

### Management command

Added:

- `credit_workflow/management/commands/load_credit_workflows.py`

Supports:

- normal load into the database
- `--validate-only` for config validation without DB writes

### Backward compatibility

Updated:

- `workflow_engine/management/commands/load_workflow_states.py`

This command now delegates to the new config-backed loader so existing operational usage does not break immediately.

## Validation approach

Recommended validation command:

`python manage.py load_credit_workflows --validate-only`

This confirms the source-controlled config parses and satisfies structural checks before any DB changes are attempted.

## Current limitation

The config format is JSON in this first step, not YAML.

This was chosen to avoid introducing a new parser dependency during the initial extraction. The structure is intentionally compatible with a later move to YAML if desired.

## Why this matters

This changes the workflow definition from:

- code embedded inside a management command

to:

- versioned configuration loaded by a management command

That is the key enabling step for:

- code-reviewed workflow changes
- reproducible environment setup
- clearer workflow ownership
- future schema validation and config promotion
