# Family Office Files Workflow Engine Assessment

## Summary

Family Office Files is a good candidate for the second workflow-engine domain.

It is different enough from the credit workflow to expose remaining credit-specific assumptions, but still simple enough to onboard without redesigning the platform first.

The meeting with Andy clarified that the product should not jump straight from uploaded files to a deal room. There is a real middle workflow that needs to exist between:

- incoming opportunities
- theme alignment
- criteria matching
- formal review
- committee decision
- deal execution

That is exactly the kind of process a generic workflow engine should support.

## Why this is a good second-domain use case

### 1. It is clearly not credit-specific

This is valuable because it will immediately expose any remaining hidden credit assumptions in:

- artifact provisioning
- metadata definitions
- action handling
- condition handling
- API payloads

### 2. The workflow is real but not too large

The process is meaningful enough to prove the engine, but still compact enough to implement as a controlled second-domain pilot.

### 3. It introduces trigger-driven progression

The meeting notes highlighted that the missing link is not file storage but a trigger that says:

- this opportunity fits a selected theme
- it matches agreed criteria
- it should now be reviewed seriously

That is a useful second-domain test because it exercises the engine beyond simple manual approval forms.

It also introduces confidentiality handling as a workflow concern:

- some opportunities are generic and can tolerate broader AI processing
- NDA-restricted opportunities require stricter controls
- those controls should affect workflow behavior, artifact access, and AI handling policy

### 4. It naturally separates opportunity from deal

That distinction is important and should not be collapsed into one oversized workflow.

- `Opportunity` = something interesting that has arrived
- `Deal` = something the group has decided to pursue formally

This gives a clean way to model two related workflows.

It also supports two distinct approval gates:

- committee approval to move an opportunity into the deal workflow
- a separate committee approval within the deal workflow itself

## Recommended workflow model

## Opportunity workflow

Suggested initial states:

1. `new_opportunity`
2. `private_vault`
3. `shared_with_partners`
4. `in_theme_bucket`
5. `criteria_matched`
6. `under_review`
7. `committee_approval_pending`
8. `approved_for_deal_workflow`
8. `rejected`
9. `archived`

Suggested interpretation:

- `new_opportunity`
  - an item has arrived
- `private_vault`
  - stored privately by one family office
- `shared_with_partners`
  - explicitly shared with one or more partners
- `in_theme_bucket`
  - linked to a selected investment theme
- `criteria_matched`
  - meets agreed theme criteria and triggers attention
- `under_review`
  - analysis / due diligence / committee-pack preparation underway
- `committee_approval_pending`
  - the opportunity is waiting for the committee decision on whether it should become a formal deal pursuit
- `approved_for_deal_workflow`
  - committee or equivalent governance decides to proceed
- `rejected`
  - decision not to proceed
- `archived`
  - retained but no longer active

## Deal workflow

Suggested second workflow that begins only after approval to proceed:

1. `deal_room_opened`
2. `due_diligence`
3. `committee_pack_ready`
4. `committee_decision_pending`
5. `approved`
6. `declined`
7. `execution`
8. `closed`

This should be a separate workflow instance, not just a late state in the opportunity workflow.

Important distinction:

- the opportunity workflow committee approval decides whether the group wants to pursue it formally
- the deal workflow committee approval decides whether the deal itself should proceed within execution/governance

## Trigger model

The strongest workflow concept from the meeting is the trigger.

Recommended first implementation:

- allow an opportunity to be linked to:
  - a theme
  - a set of criteria flags
- if theme and criteria conditions are met:
  - set state to `criteria_matched`
  - create a review task or notification

Important recommendation:

Start with manual or rule-based triggers first.

Do not make the first implementation depend on AI-driven auto-classification. AI can help later, but the workflow should be valid without it.

## Suggested artifact model

This use case should help prove that the engine is not just “forms with a new name”.

Recommended artifacts:

- `opportunity_record`
  - the structured opportunity itself
- `source_documents`
  - attached files
- `theme_evaluation`
  - why it fits a theme
- `criteria_assessment`
  - structured criteria match result
- `review_pack`
  - committee / discussion materials
- `decision_record`
  - governance decision outcome
- `confidentiality_assessment`
  - NDA/confidentiality classification and handling rules
- `deal_room_documents`
  - only once the deal workflow starts

That is a good complement to the credit domain because it is document-centric and trigger-centric rather than approval-form-centric.

## Minimum viable second-domain pilot

The safest pilot is:

### Scope

- one domain module: `family_office_workflow`
- one primary object type: `Opportunity`
- one simple artifact type to start:
  - `opportunity_record`
- one optional document artifact collection
- one trigger condition:
  - theme selected + criteria matched
- one handoff into a second workflow:
  - create `Deal` workflow when approved

### Minimal state path

For the first pilot, keep it even smaller:

1. `private_vault`
2. `shared_with_partners`
3. `in_theme_bucket`
4. `under_review`
5. `committee_approval_pending`
6. `approved_for_deal_workflow`
6. `rejected`

Then add richer stages after the engine fit is proven.

## What still needs to be generalized first

The main refactor is materially complete, but a few things should be treated carefully before starting this second domain:

### 1. Prove engine/domain isolation

The second domain must depend on `workflow_engine` only.

It must not depend on:

- `credit_workflow`
- `credit_applications`

### 2. Keep credit compatibility aliases from leaking into the new domain

The new domain should use only the canonical artifact-oriented seams:

- artifact definitions
- artifact adapters
- artifact types
- actions
- conditions
- provisioning

### 3. Expect document artifacts to stress the current model

The current platform is much closer to “artifact-backed forms”.

Family Office Files will test:

- document collections
- document-triggered review
- artifact bundles rather than single form records

That is useful. It is exactly the kind of pressure that will tell us what remains too credit-shaped.

## Recommendation

Yes, Family Office Files should be the second-domain pilot.

It is a better proving ground than another approval-heavy workflow because it exercises:

- opportunity lifecycle
- sharing
- theme routing
- criteria-based triggering
- document-centric review
- handoff into a separate execution workflow

That is enough to validate whether the current engine is truly reusable or still too shaped by credit-risk assumptions.

## Suggested next step

Create a short design package for Family Office Files containing:

1. domain model
2. workflow definitions
3. artifact definitions
4. trigger rules
5. minimum implementation plan

That should be the basis for onboarding `family_office_workflow` as the second domain in the monorepo.
