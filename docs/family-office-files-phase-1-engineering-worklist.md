# Family Office Files Phase 1 Engineering Worklist

## Purpose

This is the concrete Phase 1 engineering worklist for onboarding the Family Office Files opportunity workflow into the actual FOF codebase.

This worklist is based on:

- the live FOF codebase at `/Volumes/DockSSD/projects/family-office-files`
- the Family Office Files workflow notes
- the decision to model `Opportunity` as a new first-class object rather than overloading `Deal`

## Phase 1 objective

Deliver the smallest useful workflow slice:

- add `Opportunity`
- support private vault + explicit sharing
- make uploaded documents the primary opportunity capture path
- attach documents to opportunities
- add confidentiality / NDA fields from the start
- expose a basic opportunities UI and API

Phase 1 does **not** yet need:

- deal promotion
- theme criteria matching automation
- committee workflow
- co-investment execution workflow

## Status update

Completed so far:

- backend opportunity model, share model, migration, schemas, permissions, and router
- focused backend opportunity tests passing
- frontend opportunity API client
- frontend opportunities list page
- frontend opportunity detail/edit/share page
- frontend create/share UI
- upload-first opportunity capture endpoint and UI
- opportunity document list/upload/link support

Still pending within Phase 1:

- workflow-state-specific UI beyond the stored `status` field
- opportunity-specific dashboard widgets
- richer inline document interactions beyond the current expandable tray

## Current codebase starting point

Relevant existing backend files:

- [main.py](/Volumes/DockSSD/projects/family-office-files/backend/app/main.py)
- [models/__init__.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/__init__.py)
- [deal.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/deal.py)
- [theme.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/theme.py)
- [file.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/file.py)
- [deals.py](/Volumes/DockSSD/projects/family-office-files/backend/app/routers/deals.py)
- [themes.py](/Volumes/DockSSD/projects/family-office-files/backend/app/routers/themes.py)
- [deal.py](/Volumes/DockSSD/projects/family-office-files/backend/app/schemas/deal.py)

Relevant existing frontend files:

- [api.ts](/Volumes/DockSSD/projects/family-office-files/frontend/lib/api.ts)
- [SidebarNav.tsx](/Volumes/DockSSD/projects/family-office-files/frontend/components/layout/SidebarNav.tsx)
- [deals/page.tsx](/Volumes/DockSSD/projects/family-office-files/frontend/app/deals/page.tsx)
- [themes/page.tsx](/Volumes/DockSSD/projects/family-office-files/frontend/app/themes/page.tsx)
- [co-investment/page.tsx](/Volumes/DockSSD/projects/family-office-files/frontend/app/co-investment/page.tsx)

Key current reality:

- app is currently `Theme -> Deal -> File` centric
- there is no `Opportunity`
- `Deal` already means the later-stage object and should stay that way

## Workstream 1: backend data model

## 1.1 Add `Opportunity` model

Create:

- `backend/app/models/opportunity.py`

Suggested initial fields:

- `id`
- `title`
- `description`
- `status`
- `created_by`
- `org_id`
- `primary_theme_id`
- `confidentiality_level`
- `nda_required`
- `nda_status`
- `ai_handling_policy`
- `created_at`
- `updated_at`

Suggested initial status enum:

- `captured`
- `vaulted`
- `shared`
- `archived`

Keep Phase 1 deliberately small.

## 1.2 Add `OpportunityShare` model

Create:

- `backend/app/models/opportunity_share.py`

Pattern should follow current deal-sharing structure, but at opportunity level.

Suggested fields:

- `id`
- `opportunity_id`
- `target_org_id`
- `permission`
- `status`
- `shared_by`
- `shared_at`
- `responded_by`
- `responded_at`
- `message`

For Phase 1, it is acceptable to support:

- `view`
- `collaborate`

and defer finer granularity if not needed.

## 1.3 Add optional opportunity-file linkage strategy

Decision needed:

- either add `opportunity_id` to `File`
- or create a new join model

Recommendation for Phase 1:

- add nullable `opportunity_id` to `File`

Reason:

- it is the simplest path
- it matches the current pattern where files already attach directly to `Deal` and `Theme`

## 1.4 Register models

Update:

- [models/__init__.py](/Volumes/DockSSD/projects/family-office-files/backend/app/models/__init__.py)

## 1.5 Add Alembic migration

Create migration(s) for:

- `opportunities`
- `opportunity_shares`
- `files.opportunity_id`

## Workstream 2: backend schemas

Create:

- `backend/app/schemas/opportunity.py`

Suggested schemas:

- `OpportunityCreate`
- `OpportunityUpdate`
- `OpportunityResponse`
- `OpportunityListResponse`
- `OpportunityShareCreate`
- `OpportunityShareResponse`

Include confidentiality fields in the API from the start:

- `confidentiality_level`
- `nda_required`
- `nda_status`
- `ai_handling_policy`

## Workstream 3: backend permissions

Current permission logic is deal-centric:

- [permissions.py](/Volumes/DockSSD/projects/family-office-files/backend/app/core/permissions.py)

Add opportunity equivalents for:

- read access
- write access
- create access
- sharing access

Suggested new helpers:

- `can_read_opportunity(...)`
- `can_write_opportunity(...)`
- `can_create_opportunity(...)`
- `can_manage_opportunity_shares(...)`

Important Phase 1 rule:

- opportunity visibility remains private by default
- sharing is explicit
- theme match must not widen access

## Workstream 4: backend routers

## 4.1 Add opportunities router

Create:

- `backend/app/routers/opportunities.py`

Initial endpoints:

- `POST /api/opportunities`
- `GET /api/opportunities`
- `GET /api/opportunities/{id}`
- `PATCH /api/opportunities/{id}`
- `DELETE /api/opportunities/{id}` or archive instead

Recommended for Phase 1:

- use archive rather than hard delete

## 4.2 Add opportunity sharing endpoints

Either:

- extend `opportunities.py`

or create:

- `backend/app/routers/opportunity_shares.py`

Initial endpoints:

- `POST /api/opportunities/{id}/shares`
- `GET /api/opportunities/{id}/shares`
- `POST /api/opportunity-shares/{share_id}/respond`
- `DELETE /api/opportunities/{id}/shares/{share_id}`

## 4.3 Add opportunity file endpoints

Initial endpoints:

- `GET /api/opportunities/{id}/documents`
- `POST /api/opportunities/{id}/documents/upload`
- `POST /api/opportunities/{id}/documents/link`

These can reuse patterns from:

- [files.py](/Volumes/DockSSD/projects/family-office-files/backend/app/routers/files.py)
- [themes.py](/Volumes/DockSSD/projects/family-office-files/backend/app/routers/themes.py)

## 4.4 Register router

Update:

- [main.py](/Volumes/DockSSD/projects/family-office-files/backend/app/main.py)

Add:

- router import
- OpenAPI tag metadata
- `app.include_router(...)`

## Workstream 5: frontend API client

Update:

- [api.ts](/Volumes/DockSSD/projects/family-office-files/frontend/lib/api.ts)

Add:

- `Opportunity` types
- `OpportunityCreate`
- `OpportunityUpdate`
- `OpportunityShare` types
- `opportunitiesApi`
- `opportunitySharesApi`
- `opportunityFilesApi`

Keep the API client shape consistent with current:

- `dealsApi`
- `themesApi`
- `filesApi`

## Workstream 6: frontend navigation and pages

## 6.1 Add navigation entry

Update:

- [SidebarNav.tsx](/Volumes/DockSSD/projects/family-office-files/frontend/components/layout/SidebarNav.tsx)

Add:

- `Opportunities`

Possibly also:

- `Vault`

Recommendation for Phase 1:

- add `Opportunities`
- keep `Vault` as a filtered view inside Opportunities for now

That avoids premature menu sprawl.

## 6.2 Add opportunities list page

Create:

- `frontend/app/opportunities/page.tsx`

Page should support:

- list opportunities
- basic status filter
- confidentiality badges
- create opportunity modal/button

Reuse the deals-page pattern where helpful, but do not copy its language directly.

## 6.3 Add opportunity detail page

Create:

- `frontend/app/opportunities/[id]/page.tsx`

Phase 1 content:

- summary/details
- confidentiality / NDA section
- attached documents
- sharing section
- current status

## 6.4 Add create/edit opportunity UI

Likely components:

- `frontend/components/opportunities/CreateOpportunityModal.tsx`
- `frontend/components/opportunities/EditOpportunityModal.tsx`
- `frontend/components/opportunities/OpportunityCard.tsx`

Fields to expose from the start:

- title
- description
- primary theme
- confidentiality level
- NDA required
- AI handling policy

## Workstream 7: confidentiality / NDA rules

This must be included in Phase 1.

## 7.1 Add explicit domain fields

Required on `Opportunity`:

- `confidentiality_level`
- `nda_required`
- `nda_status`
- `ai_handling_policy`

## 7.2 Add UI visibility

Show clearly on opportunity list/detail:

- confidentiality badge
- NDA badge if applicable
- AI handling policy

## 7.3 Add backend enforcement hooks

Even if full AI enforcement is not implemented in Phase 1, set the domain contract now.

Rule examples:

- if `confidentiality_level = nda_restricted`
  - default `ai_handling_policy` should be `local_models_only`
- if `ai_handling_policy = no_ai_processing`
  - classifier/summariser routes should skip AI actions for that opportunity

If full enforcement is too much for Phase 1, at minimum:

- persist the policy
- surface it in the UI
- block obvious public-LLM actions where they exist

## Workstream 8: workflow-lite implementation for Phase 1

Full generic workflow-engine integration does not need to land all at once inside FOF.

For Phase 1, implement a workflow-lite shape in the FOF app:

- `captured`
- `vaulted`
- `shared`
- `archived`

Recommended rule set:

- new opportunities start in `captured`
- saving into the owner’s pipeline moves to `vaulted`
- explicit sharing moves to `shared`
- archive remains available

This gives you the first real workflow behavior without waiting for the full second-domain engine extraction.

## Workstream 9: tests

Backend tests to add:

- `backend/tests/test_opportunities.py`
- `backend/tests/test_opportunity_shares.py`

Cover:

- create/list/update opportunity
- confidentiality fields roundtrip
- private-by-default visibility
- explicit share flow
- file attachment to opportunity

Frontend tests to add:

- opportunities list page renders
- create modal submits
- confidentiality badges render
- detail page loads document section

## Recommended delivery order

1. backend `Opportunity` model + migration
2. schemas + router
3. permissions
4. API client
5. opportunities list page
6. opportunity detail page
7. opportunity sharing
8. opportunity documents
9. confidentiality enforcement hardening

## Key design decision for Phase 1

Do not try to integrate the full generic workflow engine into FOF on day one.

Instead:

- shape the FOF domain around the future workflow model
- introduce the right objects and states now
- keep the first implementation simple
- then align it more deeply with the generic engine in Phase 2+

That is the safer path because the current FOF app has no workflow substrate yet.

## Deliverable definition for Phase 1 complete

Phase 1 is complete when:

- FOF has a real `Opportunity` object
- opportunities can be created and managed separately from deals
- opportunities are private by default
- opportunities can be explicitly shared
- opportunity documents can be attached
- confidentiality and NDA policy are captured and visible
- the app no longer forces early-stage candidates straight into `Deal`
