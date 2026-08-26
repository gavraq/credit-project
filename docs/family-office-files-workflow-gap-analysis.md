# Family Office Files Workflow Gap Analysis

## Purpose

This note assesses the current workflow platform against the Family Office Files workflow design.

It answers two questions:

1. what is already in place and usable now
2. what still needs to be generalized or added before implementation starts

## Overall conclusion

The platform is close enough to begin a second-domain pilot.

The core workflow engine is now strong enough for:

- workflow definitions
- state transitions
- artifact registration
- artifact capabilities
- artifact actions
- separate domain adapters

But Family Office Files will stress areas that are still more credit-shaped:

- document-centric artifacts
- trigger-driven routing
- non-form artifact types
- cross-workflow creation between opportunity and deal
- confidentiality-sensitive AI handling

So the answer is:

- enough is already built to start
- a small amount of additional generalization should happen as part of onboarding the second domain

## What is already sufficient

## 1. Generic workflow graph and runtime

Already available:

- `Workflow`
- `State`
- `Transition`
- `WorkflowInstance`
- `StateLog`

This is sufficient for:

- opportunity lifecycle states
- deal lifecycle states
- transition audit history

## 2. Source-controlled workflow definitions

Already available:

- source-controlled workflow config
- loader path
- runtime definition lookup

This is sufficient for:

- `FAMILY_OFFICE_OPPORTUNITY`
- `FAMILY_OFFICE_DEAL`

## 3. Domain registration seams

Already available:

- action registry
- condition registry
- hook registry
- artifact adapter registry
- artifact definition provider registry
- artifact type registry

This is the main reason the second domain can start now.

## 4. Artifact-oriented API shape

Already available:

- engine artifact endpoint
- credit application artifact-native pattern
- artifact capability and action discovery

This gives the right platform direction for Family Office Files:

- discover artifacts
- navigate to resource endpoints
- invoke domain-specific actions through generic action descriptors

## 5. Cross-workflow architecture pattern

Already available in concept:

- parent and child workflows
- transition-side actions
- workflow-triggered side effects

This is enough to model:

- opportunity approval creating a deal workflow

## What is partially sufficient

## 1. Artifact provisioning

Current state:

- provisioning exists
- naming is now artifact-oriented
- domain adapters are in place

Gap:

- provisioning still assumes single-object artifacts more naturally than grouped document artifacts

Assessment:

- good enough for `opportunity_record`
- may need light extension for `source_documents` and `due_diligence_documents`

## 2. Artifact types

Current state:

- artifact type registry exists
- `form` is explicit
- capabilities and actions can be attached

Gap:

- current usage is still strongly centered on form-like records

Assessment:

- technically ready
- needs its first non-form real implementation

This is exactly where Family Office Files is valuable.

## 3. Trigger model

Current state:

- transition actions exist
- conditions exist
- capability/action discovery exists

Gap:

- rule-driven trigger evaluation for “theme + criteria match” is not yet demonstrated in a live second domain

Assessment:

- the engine is close
- this will likely need a small explicit service or condition pattern for rule-based routing

## What still needs work before or during implementation

## 1. Introduce non-form artifact types

This is the most important platform gap.

Family Office Files should not model everything as a form.

Recommended additions:

- `record`
- `document_bundle`
- `decision`

This is not a major redesign. The type registry already exists.

What is needed is the first real domain implementation using those types.

## 2. Support document-bundle artifacts properly

Current artifact shape is strongest where one artifact maps to one object.

Family Office Files needs artifacts like:

- `source_documents`
- `due_diligence_documents`
- `execution_documents`

Those are closer to collections than single records.

Minimum required work:

- define how a `document_bundle` artifact references multiple document objects
- define list/upload/read capabilities
- expose those capabilities through artifact metadata

## 3. Add rule-based trigger evaluation

The meeting notes rely on this concept:

- opportunity fits theme
- opportunity matches criteria
- trigger discussion / review

Minimum required work:

- define theme criteria structure
- evaluate criteria deterministically
- create either:
  - a state transition recommendation
  - or an automatic transition to `CRITERIA_MATCHED`

This should be built without AI dependency first.

## 4. Add confidentiality-aware processing rules

The meeting notes make this a real domain requirement, not just an infrastructure preference.

Needed:

- confidentiality classification on opportunities and deals
- explicit AI handling policy
- restricted-access behavior for NDA-sensitive document artifacts
- rule-driven confidentiality escalation when NDA material appears

This is especially important because it proves the engine can carry operational policy alongside workflow state.

## 5. Add clean workflow-creation action for opportunity -> deal handoff

Current engine patterns support this conceptually, but Family Office Files should make it explicit.

Needed:

- generic action or domain action to create a related workflow instance
- ability to create a `Deal` domain object from an approved `Opportunity`
- ability to bind the new deal workflow instance to that domain object

This is a natural next proof of genericity.

## 6. Add engine-level tests that are domain-neutral

This is no longer a platform design gap, but it is a readiness gap.

Before or during Family Office Files implementation, add engine-only tests for:

- artifact-type capability resolution
- artifact action resolution
- provisioning through a non-credit domain adapter
- cross-workflow creation
- rule-based trigger evaluation

## Recommended implementation posture

Do not try to eliminate every remaining credit compatibility alias before starting.

Instead:

1. start `family_office_workflow`
2. use only canonical artifact-oriented seams
3. let the new domain expose any remaining real platform gaps

That is the most efficient way to finish the generalization.

## Minimum work required before coding the domain

The smallest sensible pre-implementation checklist is:

1. confirm `workflow_engine` does not import `credit_workflow`
2. define new artifact types:
   - `record`
   - `document_bundle`
   - `decision`
3. define how `document_bundle` artifacts are represented
4. define confidentiality classification and AI handling policy
5. define the action for opportunity approval creating a deal workflow
6. define deterministic criteria evaluation for trigger routing

If those five items are clear, implementation can begin.

## Suggested sequencing

### Step 1

Create `family_office_workflow` and onboard:

- `Opportunity`
- `FAMILY_OFFICE_OPPORTUNITY`
- `opportunity_record`

### Step 2

Add opportunity review/committee approval state path.

### Step 3

Implement opportunity approval creating:

- `Deal`
- `FAMILY_OFFICE_DEAL`

### Step 4

Introduce `document_bundle` artifacts.

### Step 5

Add trigger logic for theme + criteria matching.

### Step 6

Add confidentiality-aware controls for NDA-restricted opportunities and deals.

## Recommendation

Family Office Files is ready to start as a second-domain pilot.

The engine does not need a major pre-refactor before that begins.

What it does need is a disciplined implementation that uses the second domain to prove:

- non-form artifact types
- trigger-driven routing
- document-bundle artifacts
- related workflow creation

Those are the real remaining generalization steps.
