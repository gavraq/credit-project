# Family Office Files Implementation Plan

## Purpose

This plan combines three inputs:

1. the Family Office Files codebase as it exists today
2. the workflow-engine assessment/design/gap notes
3. the earlier `FOF Workflow Architecture Proposal`

The goal is to produce a practical implementation plan that:

- fits the actual FOF codebase
- adopts the generic workflow-engine direction
- preserves the strongest ideas from the earlier proposal

## What from the earlier proposal should be kept

The earlier proposal contains several strong concepts that should remain central.

### 1. Explicit object hierarchy

This is the right conceptual model:

- `Document` = evidence
- `Opportunity` = inbound candidate
- `Theme` = strategic lens / funnel
- `Deal` = approved pursuit
- `Co-Investment` = execution workflow

This is better than the current live structure of:

- `themes -> deals -> documents`

because it reflects the real process more accurately.

### 2. Opportunity vs deal distinction

This is the single most important concept and should remain unchanged:

- `Opportunity` is early-stage and may never progress
- `Deal` is a formal pursuit after approval

This matches both the meeting notes and the current codebase reality, where `Deal` already exists and should remain the later-stage object.

### 3. Explicit sharing

This is correct and should remain a hard rule:

- nothing is shared automatically
- theme match does not widen access
- hierarchy and sharing are separate concerns

That fits the current FOF permission model well.

### 4. Theme criteria as operational logic

This is an important idea from the proposal and should be preserved:

- themes should not remain just descriptive buckets
- themes should hold criteria that support routing and triggers

### 5. Stage-aware AI handling

This is also correct and should be kept:

- early-stage opportunities can use broader AI support
- NDA-sensitive diligence/execution stages need stricter AI policy

That now needs to be represented explicitly in the workflow/domain model.

### 6. Navigation model

The proposed navigation is useful and should guide the eventual UX:

- `Vault`
- `Themes`
- `Opportunities`
- `Deals`
- `Co-Investment`

This is a good product structure.

## What needs to change from the earlier proposal

The earlier proposal predates the decision to use the generic workflow approach and predates inspection of the live FOF codebase.

So these adjustments are needed.

### 1. Add generic workflow concepts explicitly

The proposal talked about workflow, but not yet through the generic-engine model.

The implementation should now use:

- workflow definitions
- artifact definitions
- artifact capabilities/actions
- trigger rules
- promotion from one workflow into another

### 2. Respect the actual current FOF codebase

The live codebase already has:

- `Deal`
- `Theme`
- `File`
- `Artifact`

It does **not** have:

- `Opportunity`
- workflow infrastructure in-app

So the clean path is:

- add `Opportunity`
- keep `Deal`
- do not try to rename `Deal` to mean “opportunity”

### 3. Make confidentiality first-class

The earlier proposal discussed sensitivity tier and stage-aware AI, which was useful.

That now needs to become explicit in the implementation model:

- confidentiality level
- NDA status
- AI handling policy

This is not just a security note. It is part of workflow behavior.

## Current FOF codebase implications

From the current codebase:

- backend is FastAPI + SQLAlchemy + Alembic
- frontend is Next.js
- current live model is deal-centric

Relevant files:

- [deal.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/deal.py)
- [theme.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/theme.py)
- [file.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/file.py)
- [artifact.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/artifact.py)
- [deals.py](/Volumes/DockSSD/projects/family-office-files/backend/app/routers/deals.py)
- [themes.py](/Volumes/DockSSD/projects/family-office-files/backend/app/routers/themes.py)
- [api.ts](/Volumes/DockSSD/projects/family-office-files/frontend/lib/api.ts)

This means the implementation plan should not assume a Django-style integration.

## Recommended target architecture for FOF

## Immediate delivery adjustment

The implementation should now treat document upload as the primary opportunity entry path.

Practical implication:

- manual `Create Opportunity` remains as a fallback
- primary user action should be `Upload Opportunity Document`
- opportunity creation should happen at upload time
- the classifier should enrich the opportunity from the uploaded material

This aligns better with the actual user workflow for pitch decks, CIMs, teasers, and term sheets.

## Domain objects

### Keep

- `Theme`
- `Deal`
- `File`
- existing published `Artifact`

### Add

- `Opportunity`
- `OpportunityShare`
- `ThemeCriteria`
- `OpportunityThemeAssessment`
- optional later:
  - `OpportunityDecision`
  - `DealDecision`

## Workflow model

### Workflow 1: Opportunity workflow

New workflow attached to `Opportunity`.

Suggested path:

- `captured`
- `vaulted`
- `shared`
- `theme_matched`
- `under_review`
- `committee_approval_pending`
- `approved_for_deal`
- `rejected`
- `archived`

### Workflow 2: Deal workflow

Attached to existing `Deal`.

Suggested path:

- `deal_room_opened`
- `due_diligence`
- `committee_pack_ready`
- `deal_committee_approval_pending`
- `approved`
- `declined`
- `execution`
- `closed`

This preserves the key two-stage approval structure:

- approval to move opportunity into deal
- separate approval within deal

## Artifact model for FOF

The earlier proposal’s ideas should be reframed into workflow artifacts.

### Opportunity artifacts

- `opportunity_record`
- `source_documents`
- `theme_assessment`
- `criteria_assessment`
- `review_pack`
- `opportunity_decision_record`
- `confidentiality_assessment`

### Deal artifacts

- `deal_record`
- `due_diligence_documents`
- `committee_pack`
- `deal_decision_record`
- `execution_documents`
- `confidentiality_controls_record`

## Sharing model

Keep the earlier proposal’s principle:

- hierarchy is for organisation
- sharing is for permission

Concrete rule set:

- opportunity visibility is private by default
- opportunity sharing is explicit
- deal sharing remains explicit
- theme membership does not imply access widening

This aligns well with the current FOF sharing pattern already present in the deal/file model.

## Confidentiality / NDA model

The earlier proposal mentioned sensitivity tier. This should now be implemented explicitly.

Recommended fields on `Opportunity`:

- `confidentiality_level`
- `nda_required`
- `nda_status`
- `ai_handling_policy`

Recommended values:

`confidentiality_level`
- `public`
- `internal`
- `confidential`
- `nda_restricted`

`ai_handling_policy`
- `public_llm_allowed`
- `private_gateway_only`
- `local_models_only`
- `no_ai_processing`

Key rule:

- NDA-sensitive opportunities and deals must not be sent to public/shared LLM routes

## Trigger model

The earlier proposal’s trigger idea is correct and should be implemented in stages.

### Initial trigger set

- classify opportunity into theme
- compare opportunity to theme criteria
- if matched:
  - mark `theme_matched`
  - create review prompt/task

### Important implementation rule

Do not begin with AI-only automation.

Phase 1 should use:

- explicit user classification
- rule-based matching
- deterministic criteria evaluation

AI can assist later, but the workflow must not depend on it.

## Product/navigation plan

The earlier proposal’s navigation model is strong and should guide frontend changes.

Recommended target navigation:

- `Vault`
- `Themes`
- `Opportunities`
- `Deals`
- `Co-Investment`

How that maps to current FOF:

- keep current `Themes`
- keep current `Deals`
- keep current `Co-Investment` as later execution area
- add:
  - `Vault`
  - `Opportunities`

## Recommended implementation sequence

## Phase 1: introduce Opportunity

Backend:

- add `Opportunity` model
- add schemas
- add routers
- attach documents to opportunities
- add confidentiality fields
- add explicit share model if needed

Frontend:

- add `Vault`
- add `Opportunities`
- add create/view/edit opportunity flows

Workflow:

- implement the first opportunity states:
  - `captured`
  - `vaulted`
  - `shared`

## Phase 2: themes become operational

Backend:

- add theme criteria model/config
- add opportunity-theme assessment

Frontend:

- show matched opportunities on theme pages
- show criteria fit / review prompts

Workflow:

- add:
  - `theme_matched`
  - `under_review`

## Phase 3: opportunity committee gate

Backend:

- add opportunity decision artifact / record
- add committee approval transition

Workflow:

- add:
  - `committee_approval_pending`
  - `approved_for_deal`
  - `rejected`

## Phase 4: promotion to Deal

Backend:

- on approval, create `Deal`
- attach deal workflow to the existing `Deal` object

Workflow:

- create `deal_room_opened`

This is the clean point where current FOF `Deal` begins.

## Phase 5: deal workflow and co-investment

Backend:

- add deal-level committee artifact
- add due diligence and execution states

Frontend:

- make `Co-Investment` the true execution / deal room layer

## Phase 6: AI and confidentiality hardening

Backend:

- enforce AI handling policy
- support local-model-only or no-AI paths

Frontend:

- display confidentiality classification clearly
- show AI restrictions on sensitive opportunities/deals

## Practical conclusion

The earlier proposal was directionally right.

The most useful concepts to carry forward are:

- opportunity vs deal separation
- explicit sharing
- theme criteria
- trigger-based progression
- stage-aware AI
- confidentiality sensitivity
- navigation model

What changes now is the implementation method:

- use the generic workflow approach
- introduce `Opportunity` as a new first-class object
- keep current `Deal` as the later-stage formal pursuit object
- let workflow and artifacts govern the progression between them

## Recommendation

Use this merged plan as the implementation baseline.

It keeps the best parts of the earlier proposal, but grounds them in:

- the actual FOF codebase
- the generic workflow-engine direction
- the newly clarified confidentiality/NDA requirements
