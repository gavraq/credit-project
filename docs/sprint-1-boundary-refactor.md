# Sprint 1: Workflow Engine Boundary Refactor

## Objective

Establish a clean boundary between the generic workflow engine and the credit-risk domain without changing the external credit workflow behavior.

This sprint does not attempt to complete the full platform extraction. Its job is to:

- introduce the structural seams required for that extraction
- remove the highest-value credit-specific runtime logic from the engine core
- centralize workflow transition execution
- preserve current credit workflow behavior

## Scope

### In scope

- create a new `credit_workflow` module
- introduce generic condition and action registries in `workflow_engine`
- introduce a transition service in `workflow_engine`
- move credit-specific authorization logic out of the engine model layer
- move credit-specific system action handlers out of the engine module
- route existing workflow transitions through the new service
- document the new dependency direction

### Out of scope

- converting all workflow definitions to YAML
- introducing generic workflow artifacts
- redesigning frontend workflow rendering
- removing all `CREDIT_PAPER` references from utility code
- broad serializer redesign

Those are later phases.

## Target Dependency Direction

After this sprint, the intended dependency direction is:

`workflow_engine <- credit_workflow <- credit_applications`

Rules:

- `workflow_engine` must not import from `credit_applications`
- `workflow_engine` must not import from `credit_workflow`
- `credit_workflow` may import from `workflow_engine`
- `credit_applications` may import from both

## Design Changes

### 1. Transition service

Current issue:

- transition execution logic sits inside `WorkflowInstance.perform_transition()`
- view code also contains duplicate transition mutation logic

Target change:

- add `workflow_engine/services/transitions.py`
- make the engine model delegate transition execution to this service
- use the same service from application-facing endpoints

Benefits:

- one path for transition execution
- easier testing
- easier to swap in generic condition and action execution

### 2. Condition registry

Current issue:

- `WorkflowInstance.get_allowed_transitions()` contains hardcoded DA-level and business sponsor authorization logic

Target change:

- add `workflow_engine/registries/conditions.py`
- condition evaluation becomes pluggable
- credit-specific checks move to `credit_workflow/conditions.py`

Benefits:

- engine no longer contains domain logic
- conditions become reusable and testable

### 3. Action registry

Current issue:

- `workflow_engine/actions.py` is a registry of credit-specific handlers

Target change:

- keep a generic action registry in `workflow_engine`
- move credit-specific action handlers to `credit_workflow/actions.py`
- let the engine call handlers by symbolic action code

Benefits:

- engine owns execution framework
- credit domain owns credit orchestration

### 4. Credit domain module

Target module:

- `credit_workflow`

Initial responsibilities:

- credit-specific condition handlers
- credit-specific action handlers
- one registration entrypoint

This module is the first step toward a clean domain package layered on top of the engine.

## Files To Introduce

### Engine

- `workflow_engine/registries/conditions.py`
- `workflow_engine/registries/actions.py`
- `workflow_engine/services/transitions.py`

### Credit workflow domain

- `credit_workflow/__init__.py`
- `credit_workflow/apps.py`
- `credit_workflow/conditions.py`
- `credit_workflow/actions.py`
- `credit_workflow/registry.py`

## Existing Files To Refactor

- `workflow_engine/models.py`
- `workflow_engine/actions.py`
- `credit_applications/views.py`
- `backend/settings.py`

## Expected Behavior After Sprint 1

The system should still support:

- current role-based transitions
- DA-level approval checks
- assigned sponsor checks
- credit form submission handlers
- parent workflow auto-transitions
- existing API consumers

But the code path should change to:

1. user requests transition
2. engine transition service resolves transition
3. engine evaluates base role checks
4. engine evaluates plugin-based conditions
5. engine applies transition
6. engine writes audit log
7. engine executes plugin-based action handler
8. credit workflow logic runs only through the domain plugin layer

## Deliverables

### Code

- new registry modules
- new transition service
- new credit workflow domain module
- updated settings to load the new app
- updated transition callers to use the service

### Documentation

- architecture note
- sprint refactor note
- mirrored copy in Obsidian vault

## Validation

Target validations for this sprint:

- Django imports cleanly
- transition code still resolves through model methods
- credit-specific action handlers are now located outside the engine
- no direct DA-level or sponsor authorization logic remains in `workflow_engine/models.py`

## Next Phase After Sprint 1

Sprint 2 should externalize workflow definitions into source-controlled config under:

- `config/workflows/credit/`

That phase should build on the boundaries established here rather than trying to refactor both concerns at once.
