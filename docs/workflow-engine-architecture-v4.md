# Credit Workflow V4: Architecture and Monorepo Approach

## Purpose

This document captures the recommended target architecture for evolving the current credit workflow system into:

1. A configuration-driven workflow platform
2. A reusable workflow engine that is not tightly coupled to credit risk
3. A modular monorepo that supports both shared platform code and domain-specific workflow implementations

## Current Assessment

The current codebase already has a useful workflow core:

- `Workflow`
- `State`
- `Transition`
- `WorkflowInstance`
- `StateLog`

These are the right primitives for a generic state machine.

However, the runtime implementation is still strongly coupled to the credit-risk domain:

- credit-specific authorization logic exists inside the engine
- credit-specific object initialization exists inside the engine
- workflow helpers are hardcoded to `CREDIT_PAPER`
- parent/child workflow orchestration is implemented as credit-specific handlers
- serializers and views expose named credit forms rather than generic workflow artifacts or tasks

The current system is therefore best described as:

- a credit workflow application with a partially generic workflow core

not yet:

- a generic workflow engine with a credit workflow package layered on top

## Strategic Direction

The recommended direction is to retain a monorepo, but restructure it as a modular monorepo with strict dependency boundaries.

The goal is to separate the system into three layers:

1. `workflow_engine`
   Generic workflow platform

2. `credit_workflow`
   Credit-risk workflow package that plugs into the generic engine

3. `credit_applications`
   Credit application domain models, API projections, and application-facing endpoints

This preserves development speed while making it possible to extract the engine later if needed.

## Why a Monorepo Is Appropriate

The workflow engine and the credit workflow are not yet independent products. They still evolve together and share:

- schema and migrations
- runtime behavior
- test setup
- frontend/backend integration changes
- deployment lifecycle

For that reason, a monorepo is the most practical structure at this stage.

The recommendation is:

- keep one repository
- enforce clear internal boundaries
- treat `workflow_engine` as an internal platform package
- allow `credit_workflow` to depend on `workflow_engine`
- allow `credit_applications` to depend on both

The dependency direction should become:

`workflow_engine <- credit_workflow <- credit_applications`

The reverse must not happen.

## Recommended Target Repository Structure

```text
repo/
  apps/
    workflow_engine/
      models.py
      api/
        serializers.py
        views.py
        urls.py
      services/
        transitions.py
        conditions.py
        actions.py
        artifacts.py
      registries/
        conditions.py
        actions.py
        artifacts.py
      management/
      migrations/

    credit_workflow/
      apps.py
      conditions.py
      actions.py
      artifacts.py
      loaders.py
      management/
      migrations/

    credit_applications/
      models.py
      serializers.py
      views.py
      services.py
      migrations/

    documents/
    users/

  config/
    workflows/
      credit/
        credit_paper.yaml
        credit_request.yaml
        credit_review.yaml
        business_sponsorship.yaml
        legal_review.yaml
        credit_questionnaire.yaml
        credit_analysis.yaml
        credit_compilation.yaml
        credit_approval.yaml

  tests/
    engine/
    credit/
    integration/

  frontend/
  documentation/
```

This structure can be introduced progressively. It does not need to be created all at once.

## Architectural Responsibilities

### 1. `workflow_engine`

This is the generic platform layer. It should own:

- workflow graph models
- workflow instance state transitions
- audit logging
- condition evaluation
- action execution
- generic artifact and task abstractions
- generic API endpoints for workflow instances
- generic tests

It must not contain:

- credit-specific workflow codes
- `CreditApplication` knowledge
- DA-level approval logic
- sponsor assignment rules
- named credit form orchestration

### 2. `credit_workflow`

This is the domain workflow package for credit risk. It should own:

- credit workflow definitions
- YAML loaders and seed logic
- DA-level condition plugins
- sponsor-assignment condition plugins
- credit-specific action plugins
- artifact mapping for credit forms
- any credit workflow conventions

This layer depends on `workflow_engine`, but the engine must not depend on it.

### 3. `credit_applications`

This remains the application/domain layer and should own:

- `CreditApplication` and related business models
- form models
- domain serializers and views
- frontend-facing projections
- adapters that expose workflow state in credit-specific API shapes

This layer should stop implementing workflow orchestration directly and instead call engine/domain services.

## Target Workflow Model

The current workflow model is broadly correct and should be retained:

- `Workflow`
- `State`
- `Transition`
- `WorkflowInstance`
- `StateLog`

To make the platform reusable, the next abstraction to add is a generic artifact layer.

### Recommended New Concept: `WorkflowArtifact`

Instead of hardcoding named form relationships for every workflow implementation, introduce a generic attached object model such as:

- `workflow_instance`
- `key`
- `kind`
- `content_type`
- `object_id`
- `metadata`

Examples of artifact kinds:

- form
- document
- checklist
- approval
- task

This allows the engine to provision and manage workflow-owned objects generically.

Credit forms then become one specific artifact family, rather than the core engine design.

## Configuration-Driven Workflow Design

The current system is metadata-assisted but not fully configuration-driven.

To become configuration-driven, the following concerns should move out of code and into workflow definition metadata:

- permissions
- transition conditions
- post-transition actions
- related-instance transitions
- child artifact provisioning
- UI labels and navigation hints
- validation requirements
- approval policies
- ownership checks
- completion gates for parallel subprocesses

## Transition Configuration

Each transition should become declarative.

Example:

```json
{
  "permissions": {
    "roles": ["credit_analyst"],
    "conditions": [
      { "type": "plugin", "name": "has_sufficient_da_level" }
    ]
  },
  "actions": [
    {
      "type": "transition_related_workflow",
      "relation": "parent",
      "when_parent_state": "CREDIT_PAPER_CREDIT_REVIEW_PENDING",
      "transition_code": "PP_TR_2"
    }
  ],
  "ui": {
    "button_text": "Submit Review",
    "button_style": "primary"
  }
}
```

This is preferable to hardcoded Python branching for each credit step.

## State Configuration

States should define the required workflow-owned artifacts or tasks for that stage.

Example:

```json
{
  "artifacts": [
    {
      "key": "credit_review_form",
      "kind": "form",
      "model_alias": "credit_review_form",
      "workflow_code": "CREDIT_REVIEW"
    }
  ]
}
```

This allows state entry behavior to be configuration-driven rather than hand-coded around `CreditApplication`.

## Generic Runtime Pattern

The generic runtime should work like this:

1. A transition is requested on a `WorkflowInstance`
2. The engine loads the transition definition for the current state
3. The engine evaluates permissions and conditions
4. The engine applies the state transition
5. The engine records an audit log
6. The engine executes configured post-transition actions
7. The engine optionally provisions artifacts or tasks for the new state

The engine should execute this sequence without knowing anything about the credit domain.

## Condition Framework

The existing implementation has a `conditions` field but does not use it as a true rule engine.

That should change.

### Recommended Condition Types

- `role_in`
- `field_equals`
- `field_in`
- `artifact_state`
- `all_artifacts_in_state`
- `related_instance_state`
- `plugin`

### Condition Responsibility

The engine should:

- iterate condition definitions
- dispatch them to generic evaluators or plugins
- combine results deterministically

Credit-specific rules such as delegated authority checks should be implemented as plugins in `credit_workflow`, not inside engine models.

## Action Framework

The current system action approach should be replaced with a generic action execution pipeline.

### Recommended Generic Action Types

- `transition_related_instance`
- `create_artifact`
- `emit_event`
- `set_metadata`
- `create_task`
- `plugin`

This means the engine owns the execution framework, while the credit domain only contributes specific plugin implementations where necessary.

## Workflow Definition Source of Truth

The recommended configuration model is hybrid:

- workflow definitions stored in source-controlled YAML or JSON
- definitions loaded into database tables for runtime execution

This approach gives:

- reviewable diffs
- environment promotion discipline
- reproducibility
- runtime queryability

### Recommended Location

`config/workflows/credit/`

### Recommended Loader

Introduce a domain loader command, for example:

`load_credit_workflows`

This command should validate config schema and synchronize the DB representation.

## Dependency Rules

These are the architectural rules that should govern the modular monorepo:

### Allowed

- `credit_workflow` imports `workflow_engine`
- `credit_applications` imports `workflow_engine`
- `credit_applications` imports `credit_workflow`

### Not Allowed

- `workflow_engine` imports `credit_workflow`
- `workflow_engine` imports `credit_applications`

These rules are more important than physical folder names.

## Migration Approach

The recommended approach is incremental.

Do not attempt to genericize every view, serializer, and model at once.

### Phase 1: Establish the Engine Boundary

Objective:

- remove credit-specific execution logic from the engine core

Key changes:

- create `credit_workflow`
- introduce condition registry in `workflow_engine`
- introduce action registry in `workflow_engine`
- move DA-level logic out of the engine
- move sponsor checks out of the engine
- move parent workflow transition handlers out of the engine
- centralize transition execution in a service
- remove duplicate transition mutation logic from credit views

Success criteria:

- engine has no direct credit-specific permission branching
- credit workflow still functions
- current API remains usable

### Phase 2: Externalize Workflow Definitions

Objective:

- move workflow graph and workflow metadata into source-controlled config

Key changes:

- create YAML definitions under `config/workflows/credit/`
- implement loader commands
- replace ad hoc metadata patch/fix commands with reproducible config loading
- add tests for config loading and workflow validation

Success criteria:

- credit workflows are reproducible from config
- workflow changes become code-reviewed config diffs

### Phase 3: Introduce Generic Workflow Artifacts

Objective:

- reduce dependence on named credit form relationships

Key changes:

- add `WorkflowArtifact`
- convert state-driven form initialization into generic artifact provisioning
- keep compatibility adapters in `credit_applications`

Success criteria:

- engine is capable of supporting workflows other than credit forms

### Phase 4: Add Generic Workflow APIs

Objective:

- expose the engine as a generic runtime service

Recommended endpoints:

- `GET /workflow-instances/:id`
- `GET /workflow-instances/:id/transitions`
- `POST /workflow-instances/:id/transition`
- `GET /workflow-instances/:id/artifacts`
- `GET /workflow-instances/:id/tasks`

Credit application endpoints can continue to exist as application-specific projections.

## Recommended First Two Sprints

### Sprint 1

Focus:

- registries
- service extraction
- credit logic moved out of engine

Expected outputs:

- `workflow_engine/services/transitions.py`
- `workflow_engine/registries/conditions.py`
- `workflow_engine/registries/actions.py`
- `credit_workflow/conditions.py`
- `credit_workflow/actions.py`

### Sprint 2

Focus:

- config-backed workflow definitions

Expected outputs:

- `config/workflows/credit/*.yaml`
- `credit_workflow/loaders.py`
- management command to load workflows
- tests validating the loaded workflow graph

## Testing Strategy

The tests should be split by layer.

### Engine tests

- transition execution
- condition evaluation
- action execution
- artifact provisioning
- audit behavior

### Credit workflow tests

- DA-level approval rules
- sponsor ownership rules
- credit happy path
- credit rejection path

### Integration tests

- API-level transition requests
- workflow-to-frontend contracts

This is preferable to relying mostly on one large credit-journey test suite.

## Practical Guidance

Do not start by making the entire credit serializer layer generic.

Start with the engine heart:

- transition evaluation
- condition execution
- action execution

Once those are generic, the rest of the system can be adapted around them much more safely.

## Bottom Line

The recommended end state is:

- one modular monorepo
- one generic `workflow_engine`
- one credit-specific `credit_workflow`
- one `credit_applications` layer that consumes both
- workflow definitions stored as source-controlled config and loaded into the database
- generic conditions/actions/artifacts in the engine
- credit-specific plugins layered on top

This approach balances practicality and long-term platform value.
