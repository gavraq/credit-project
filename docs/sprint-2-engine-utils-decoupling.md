# Sprint 2: Engine Utils Decoupling

## Objective

Remove the remaining credit-workflow hardcoding from `workflow_engine/utils.py` without breaking current application imports.

## Implemented

### Credit metadata module

Added:

- `credit_workflow/metadata.py`

This module now owns the credit-specific metadata helpers for:

- form metadata lookup
- state subprocess lookup
- dynamic model/prefix/field mapping
- form auto-initialization
- form permissions
- form edit checks

### Engine compatibility layer

Updated:

- `workflow_engine/utils.py`

It is now a compatibility wrapper that re-exports the credit-specific helpers from `credit_workflow.metadata`.

This preserves existing imports while removing direct `CREDIT_PAPER` assumptions from the engine utility layer.

## Architectural effect

Before:

- `workflow_engine/utils.py` was effectively a credit-domain module living inside the engine

After:

- the credit domain owns the credit metadata logic
- the engine utility module is only a compatibility surface

## Why this matters

This is the next step in making the dependency direction real:

- engine mechanics stay in `workflow_engine`
- credit metadata and credit workflow conventions live in `credit_workflow`

That is a cleaner base for the later move toward generic artifacts/tasks.
