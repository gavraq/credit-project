# Sprint 1: Implementation Status

## Status

Initial boundary refactor completed.

This is not the end of Sprint 1, but it establishes the first working extraction seam between the engine and the credit-risk domain.

## Implemented

### New engine extension points

Added generic registries:

- `workflow_engine/registries/actions.py`
- `workflow_engine/registries/conditions.py`

Added transition execution service:

- `workflow_engine/services/transitions.py`

### New credit workflow domain module

Added:

- `credit_workflow/apps.py`
- `credit_workflow/registry.py`
- `credit_workflow/conditions.py`
- `credit_workflow/actions.py`

This module now owns:

- DA-level approval authorization plugin
- business sponsor assignment authorization plugin
- credit-specific submit/action handlers for parent workflow progression

### Refactored engine integration

Updated:

- `workflow_engine/models.py`

Changes:

- `get_allowed_transitions()` now delegates to the engine transition service
- `perform_transition()` now delegates to the engine transition service
- credit-specific permission branches were removed from the model layer

### Generic lifecycle hook

Added:

- `workflow_engine/registries/hooks.py`
- `credit_workflow/hooks.py`

Changes:

- post-transition lifecycle hooks are now generic engine extension points
- credit form auto-initialization moved out of the engine service into the credit domain hook layer

### Compatibility wrapper

Updated:

- `workflow_engine/actions.py`

It is now only a compatibility wrapper around the generic action registry.

### App registration

Updated:

- `backend/settings.py`

Changes:

- added `credit_workflow` to `INSTALLED_APPS`

### Transition endpoint cleanup

Updated:

- `backend/users/views.py`

Changes:

- removed duplicate post-transition credit form auto-initialization logic from the view
- transition side effects now flow through the central transition execution path

## Validation Completed

### Django system check

Passed:

- `manage.py check`

### Targeted tests

Passed:

- `manage.py test workflow_engine.tests.test_utils`

### Bytecode compilation

Passed:

- compile check across `workflow_engine`, `credit_workflow`, `backend`, and `credit_applications`

## What This Achieves

The system now has a real plugin seam.

Before this change:

- the engine itself contained credit-specific permission logic
- the engine itself contained credit-specific action routing

After this change:

- the engine owns execution and registration mechanics
- the credit domain owns credit-specific conditions and actions

This is the first concrete step toward:

- a generic workflow engine
- a domain workflow package layered on top

## What Is Still Outstanding In Sprint 1

### Still engine-coupled

These areas still need follow-up work:

- `workflow_engine/utils.py` is still hardcoded to `CREDIT_PAPER`
- `credit_applications` still exposes named form projections rather than generic artifacts
- workflow setup and metadata loading remain credit-specific and DB-centric

### Still needs cleanup

- stale legacy tests in `workflow_engine/tests.py`
- old field names in some workflow-related views and helper code
- duplicate/legacy management commands around metadata fixes

## Recommended Next Step

Continue Sprint 1 by:

1. moving compatibility auto-initialization behavior behind a credit-domain hook
2. cleaning up duplicate workflow transition code paths
3. documenting the new dependency rules in developer-facing docs
4. preparing Sprint 2 config extraction for workflow definitions
