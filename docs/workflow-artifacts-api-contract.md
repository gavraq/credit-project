# Workflow Artifacts API Contract

## Purpose

`workflow_artifacts` is now the preferred generic API representation of workflow-owned credit forms.

It exists to provide a workflow-oriented collection field that is less tightly coupled to named serializer fields such as:

- `credit_request_form`
- `credit_review_form`
- `business_sponsorship_form`
- `legal_review_form`
- `credit_questionnaire_form`
- `credit_analysis_form`
- `credit_compilation_form`
- `credit_approval_form`
- `climate_scorecard`

Those named fields remain for backward compatibility.

## Location

`workflow_artifacts` is returned on the credit application serializer payload.

## Shape

Each artifact entry currently has this shape:

```json
{
  "artifact_key": "credit_request_form",
  "artifact_kind": "form",
  "form_name": "Credit Request Form",
  "form_key": "credit_request_form",
  "form_title": "Credit Request Form",
  "data": {},
  "can_edit": true
}
```

## Field meanings

- `artifact_key`
  Stable workflow artifact identifier

- `artifact_kind`
  Current artifact type. Right now this is always `form`

- `form_name`
  Human-readable artifact label from metadata

- `form_key`
  Frontend-facing metadata key

- `form_title`
  Display title, which may come from the instance if supported

- `data`
  Serialized form payload when an instance exists, otherwise `null`

- `can_edit`
  Whether the current user can edit or create that artifact

## Current intention

Short term:

- preserve named form fields for compatibility
- encourage new consumers to use `workflow_artifacts`

Medium term:

- migrate frontend workflow rendering toward `workflow_artifacts`
- reduce direct dependence on named form fields

Long term:

- align this contract with a true engine-level `WorkflowArtifact` model

## Current limitations

- `artifact_kind` is not yet backed by an engine-level artifact type system
- `data` still contains form-specific serializer payloads
- artifact persistence is still implemented through named credit models

This means `workflow_artifacts` is currently a stable projection layer, not yet a fully generic persistence abstraction.

## Recommendation

Any new generic workflow consumer in this codebase should prefer:

- `workflow_artifacts`

instead of binding directly to the named per-form fields.
