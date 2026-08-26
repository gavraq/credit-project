# Family Office Files Workflow Design

## Purpose

This note turns the workflow assessment into a concrete onboarding design for a second workflow domain:

- `family_office_workflow`

The aim is to prove that the workflow engine can support a non-credit domain without relying on credit-specific concepts.

## Design goal

Model the Family Office Files process as two related workflows:

1. `Opportunity Workflow`
2. `Deal Workflow`

This matches the meeting outcome:

- an opportunity is not yet a deal
- an opportunity may be shared and reviewed without becoming a formal pursuit
- committee approval is required to move from opportunity into deal
- the deal itself has a separate governance process and committee approval

## Domain model

## Core domain objects

### Opportunity

Represents something that has come in the door and may or may not become investable.

Suggested fields:

- `id`
- `title`
- `source`
- `originating_family_office`
- `owner`
- `summary`
- `sector`
- `geography`
- `opportunity_type`
- `confidentiality_level`
- `nda_required`
- `nda_status`
- `ai_handling_policy`
- `is_shared`
- `shared_with`
- `created_at`
- `updated_at`
- `workflow_instance`

### InvestmentTheme

Represents a shared investment focus area.

Suggested fields:

- `id`
- `name`
- `description`
- `active`
- `criteria_definition`
- `family_office_group`

Examples:

- `AI`
- `Real Estate`

### OpportunityThemeAssessment

Structured evaluation of whether an opportunity fits a theme and its criteria.

Suggested fields:

- `opportunity`
- `theme`
- `fits_theme`
- `matches_criteria`
- `criteria_notes`
- `assessment_source`
- `assessed_at`

### Deal

Represents a formal pursuit after the opportunity committee has approved progression.

Suggested fields:

- `id`
- `opportunity`
- `title`
- `deal_owner`
- `deal_status`
- `confidentiality_level`
- `nda_required`
- `ai_handling_policy`
- `workflow_instance`
- `created_at`
- `updated_at`

## Relationship model

- one `Opportunity` may have zero or many theme assessments
- one `Opportunity` may lead to zero or one active `Deal`
- `Deal` is created only after the opportunity workflow committee approval

## Confidentiality model

Confidentiality needs to be explicit in the domain, not treated as an afterthought.

Suggested values:

- `public`
- `internal`
- `confidential`
- `nda_restricted`

Suggested AI handling policies:

- `public_llm_allowed`
- `private_gateway_only`
- `local_models_only`
- `no_ai_processing`

Important rule:

- `nda_restricted` opportunities and deals must not use public/shared LLM routes
- those items should be limited to:
  - `local_models_only`
  - or `no_ai_processing`

This should be carried at both:

- opportunity level
- deal level

because the confidentiality posture may tighten as a case moves into formal diligence.

## Workflow model

## Opportunity workflow

Suggested workflow code:

- `FAMILY_OFFICE_OPPORTUNITY`

Suggested states:

1. `OPPORTUNITY_NEW`
2. `OPPORTUNITY_PRIVATE_VAULT`
3. `OPPORTUNITY_SHARED`
4. `OPPORTUNITY_IN_THEME_BUCKET`
5. `OPPORTUNITY_CRITERIA_MATCHED`
6. `OPPORTUNITY_UNDER_REVIEW`
7. `OPPORTUNITY_COMMITTEE_APPROVAL_PENDING`
8. `OPPORTUNITY_APPROVED_FOR_DEAL`
9. `OPPORTUNITY_REJECTED`
10. `OPPORTUNITY_ARCHIVED`

### State meaning

`OPPORTUNITY_NEW`
- raw intake

`OPPORTUNITY_PRIVATE_VAULT`
- retained privately by a family office

`OPPORTUNITY_SHARED`
- shared with selected partners

`OPPORTUNITY_IN_THEME_BUCKET`
- routed into one or more relevant themes

`OPPORTUNITY_CRITERIA_MATCHED`
- satisfies configured criteria and triggers further attention

`OPPORTUNITY_UNDER_REVIEW`
- deeper analysis and review work is underway

`OPPORTUNITY_COMMITTEE_APPROVAL_PENDING`
- waiting for the committee decision on whether to formally pursue this as a deal

`OPPORTUNITY_APPROVED_FOR_DEAL`
- approved to create a deal workflow

`OPPORTUNITY_REJECTED`
- not progressing

`OPPORTUNITY_ARCHIVED`
- retained but inactive

### Opportunity transitions

Suggested transition set:

- `capture_to_private_vault`
  - `NEW -> PRIVATE_VAULT`
- `share_opportunity`
  - `PRIVATE_VAULT -> SHARED`
- `route_to_theme`
  - `SHARED -> IN_THEME_BUCKET`
- `mark_criteria_matched`
  - `IN_THEME_BUCKET -> CRITERIA_MATCHED`
- `start_review`
  - `CRITERIA_MATCHED -> UNDER_REVIEW`
- `submit_to_committee`
  - `UNDER_REVIEW -> COMMITTEE_APPROVAL_PENDING`
- `approve_for_deal`
  - `COMMITTEE_APPROVAL_PENDING -> APPROVED_FOR_DEAL`
- `reject_opportunity`
  - `COMMITTEE_APPROVAL_PENDING -> REJECTED`
- `archive_opportunity`
  - `REJECTED -> ARCHIVED`
- `archive_from_vault`
  - `PRIVATE_VAULT -> ARCHIVED`

## Confidentiality-specific opportunity behavior

The workflow should capture NDA-sensitive opportunities explicitly.

Suggested rules:

- an opportunity can be marked `nda_required`
- once NDA material is present:
  - confidentiality becomes `nda_restricted`
  - AI handling policy must switch to `local_models_only` or `no_ai_processing`
  - document artifacts must enforce restricted access

Optional additional state if you want the workflow to express this operationally:

- `OPPORTUNITY_NDA_RESTRICTED`

That state is not mandatory for Phase 1, but the confidentiality classification is mandatory.

## Deal workflow

Suggested workflow code:

- `FAMILY_OFFICE_DEAL`

Suggested states:

1. `DEAL_ROOM_OPENED`
2. `DEAL_DUE_DILIGENCE`
3. `DEAL_COMMITTEE_PACK_PREP`
4. `DEAL_COMMITTEE_APPROVAL_PENDING`
5. `DEAL_APPROVED`
6. `DEAL_DECLINED`
7. `DEAL_EXECUTION`
8. `DEAL_CLOSED`

### State meaning

`DEAL_ROOM_OPENED`
- formal deal pursuit begins

`DEAL_DUE_DILIGENCE`
- diligence in progress

`DEAL_COMMITTEE_PACK_PREP`
- execution-level committee material being prepared

`DEAL_COMMITTEE_APPROVAL_PENDING`
- deal-level approval gate

`DEAL_APPROVED`
- approved to proceed

`DEAL_DECLINED`
- deal does not proceed

`DEAL_EXECUTION`
- signatures, term sheets, execution documents, completion tasks

`DEAL_CLOSED`
- process complete

## Confidentiality-specific deal behavior

At deal stage, confidentiality becomes more important because this is where:

- due diligence material
- term sheets
- legal documents
- execution documents

are likely to appear.

Suggested rules:

- if `nda_required = true`, default deal AI handling policy should be `local_models_only`
- deal document artifacts should support restricted visibility
- deal-level committee pack generation should respect the AI handling policy

### Deal transitions

- `open_deal_room`
  - initial state on deal creation
- `start_due_diligence`
  - `DEAL_ROOM_OPENED -> DEAL_DUE_DILIGENCE`
- `prepare_committee_pack`
  - `DEAL_DUE_DILIGENCE -> DEAL_COMMITTEE_PACK_PREP`
- `submit_deal_committee`
  - `DEAL_COMMITTEE_PACK_PREP -> DEAL_COMMITTEE_APPROVAL_PENDING`
- `approve_deal`
  - `DEAL_COMMITTEE_APPROVAL_PENDING -> DEAL_APPROVED`
- `decline_deal`
  - `DEAL_COMMITTEE_APPROVAL_PENDING -> DEAL_DECLINED`
- `start_execution`
  - `DEAL_APPROVED -> DEAL_EXECUTION`
- `close_deal`
  - `DEAL_EXECUTION -> DEAL_CLOSED`

## Approval gates

This domain must support two distinct approval gates.

### Approval gate 1: opportunity committee

Question:

- should this opportunity become a formal pursuit?

Transition:

- `approve_for_deal`

Effect:

- update opportunity workflow to `OPPORTUNITY_APPROVED_FOR_DEAL`
- create `Deal`
- create `FAMILY_OFFICE_DEAL` workflow instance

### Approval gate 2: deal committee

Question:

- should this deal proceed into execution?

Transition:

- `approve_deal`

Effect:

- update deal workflow to `DEAL_APPROVED`
- allow progression into execution

## Artifact design

This domain should use artifacts that are not just renamed credit forms.

## Opportunity artifacts

Suggested first set:

- `opportunity_record`
  - structured opportunity data
- `source_documents`
  - uploaded files linked to the opportunity
- `theme_assessment`
  - rationale for theme alignment
- `criteria_assessment`
  - structured yes/no criteria analysis
- `review_pack`
  - preparation for committee review
- `opportunity_decision_record`
  - committee decision for progression into deal
- `confidentiality_assessment`
  - structured record of NDA/confidentiality handling

## Deal artifacts

Suggested first set:

- `deal_record`
  - structured deal metadata
- `due_diligence_documents`
  - diligence materials
- `committee_pack`
  - deal committee paper
- `deal_decision_record`
  - deal approval outcome
- `execution_documents`
  - term sheets, signatures, closing docs
- `confidentiality_controls_record`
  - record of NDA and AI-processing restrictions

## Artifact types and capabilities

This domain should be used to prove more than just `form`.

Suggested artifact types:

- `record`
- `document_bundle`
- `decision`

Suggested capabilities by type:

`record`
- `detail_endpoint`
- `writable`
- `workflow_reference`

`document_bundle`
- `detail_endpoint`
- `upload`
- `list_documents`
- `workflow_reference`

`decision`
- `detail_endpoint`
- `writable`
- `workflow_reference`

Suggested capability extensions:

`document_bundle`
- `restricted_access`

`record`
- `confidentiality_controls`

This is useful because it tests the engine with something more document-centric than the credit domain.

## Trigger model

## Trigger 1: theme routing

Condition:

- opportunity is tagged or classified to a chosen theme

Effect:

- move into `OPPORTUNITY_IN_THEME_BUCKET`

## Trigger 2: criteria match

Condition:

- opportunity satisfies configured theme criteria

Effect:

- move into `OPPORTUNITY_CRITERIA_MATCHED`
- optionally create a task / alert for further review

## Trigger 3: approval to pursue

Condition:

- committee approves progression

Effect:

- move opportunity to `OPPORTUNITY_APPROVED_FOR_DEAL`
- create deal workflow

## Trigger 4: confidentiality escalation

Condition:

- NDA is signed
- or NDA-restricted material is uploaded

Effect:

- set confidentiality level to `nda_restricted`
- set AI handling policy to `local_models_only` or `no_ai_processing`
- enforce restricted artifact access

## Important implementation note

For the first version, keep triggers simple:

- manual
- rule-based
- deterministic

Do not start by depending on AI classification. AI can assist later, but the workflow must be correct without it.

The same applies to confidentiality handling:

- do not infer NDA sensitivity using AI
- set and enforce it through explicit domain rules and user actions

## Roles

Suggested initial roles:

- `family_office_owner`
- `partner_viewer`
- `theme_reviewer`
- `committee_member`
- `deal_lead`
- `admin`

These are deliberately generic and should be configured through the same role/condition mechanisms already used in the engine.

## Source-controlled workflow config

Suggested config location:

- `config/workflows/family_office/`

Suggested files:

- `opportunity_workflow.json`
- `deal_workflow.json`

The first version can follow the same source-controlled config pattern used for credit workflow definitions.

## Minimum implementation plan

## Phase 1: second-domain proof

Goal:

prove the engine can run a non-credit workflow

Deliverables:

- add `family_office_workflow` module
- define `FAMILY_OFFICE_OPPORTUNITY`
- define one simple artifact:
  - `opportunity_record`
- implement private vault -> shared -> theme bucket -> under review -> committee approval pending -> approved/rejected
- create one basic committee decision artifact

## Phase 2: deal handoff

Goal:

prove cross-workflow creation and separation

Deliverables:

- create `Deal` model
- define `FAMILY_OFFICE_DEAL`
- on opportunity approval:
  - create `Deal`
  - create deal workflow instance

## Phase 3: document-centric artifacts

Goal:

prove artifact model beyond simple form/record editing

Deliverables:

- add `source_documents`
- add `due_diligence_documents`
- expose upload/list capabilities
- add confidentiality metadata and restricted-access handling

## Phase 4: rule-driven triggers

Goal:

prove trigger-based routing

Deliverables:

- theme criteria config
- criteria match rule evaluation
- automatic move or suggested transition into `CRITERIA_MATCHED`
- confidentiality escalation trigger for NDA-restricted material

## Minimum bar before implementation

Before starting this domain, verify:

1. `workflow_engine` does not import `credit_workflow`
2. new domain uses canonical artifact-oriented seams only
3. new domain does not use credit compatibility aliases

## Recommendation

This is the right second-domain pilot.

It is:

- meaningfully different from credit workflow
- simple enough to implement incrementally
- rich enough to prove trigger-driven progression
- well aligned with the actual business conversation from the Andy meeting

If implemented in phases, it should be a safe and high-value test of whether the workflow engine is ready for broader reuse.
