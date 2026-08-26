# Sprint 3: Reference-Only Artifacts

## Purpose

The credit application `artifacts` collection still embedded full serialized form payloads.

That blurred the boundary between:

- workflow navigation
- domain data retrieval

This step removes that coupling.

## Implemented

Updated:

- `credit_workflow/artifacts.py`
- `credit_workflow/tests/test_artifacts.py`

## Contract change

The credit application `artifacts` collection is now reference-only.

Each artifact item contains workflow navigation metadata such as:

- `id`
- `key`
- `kind`
- `title`
- `editable`
- `object_id`
- `workflow_code`

It no longer contains:

- `payload`

## Why this matters

Before this step:

- the artifact envelope was generic
- but the collection still embedded rich credit-form content

After this step:

- artifact lists are used for workflow navigation and orchestration
- form content remains the responsibility of dedicated domain endpoints

## Architectural effect

This is a cleaner boundary:

- engine and application artifact surfaces provide workflow-owned references
- credit form endpoints provide domain-specific content

That is the right shape for a generic workflow engine with domain adapters.

## Recommended next step

The next step should be to migrate any remaining consumers that expect embedded form payloads so they:

1. read artifact references from the `artifacts` collection, then
2. call the relevant domain form endpoint for form content and persistence
