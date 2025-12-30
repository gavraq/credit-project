# Feature Request: Sub-Process Rejection States

## Overview

Add REJECTED terminal states to sub-process workflows to enable early rejection at key decision points without completing the full workflow. This aligns the implementation with the original Transition State Model design.

## Business Rationale

Currently, rejections can only occur at the parent workflow level after completing sub-process forms. This forces users to complete forms even when they intend to reject, creating unnecessary work and unclear audit trails.

Adding rejection states to sub-processes allows:
- **Credit Review**: Credit Analyst can reject applications that don't meet basic criteria before involving Business Sponsors
- **Business Sponsorship**: Business Sponsor can formally reject applications lacking business rationale
- **Credit Approval**: Approver can reject at final stage with clear state tracking

## Scope

### Sub-Processes Requiring REJECTED State

| Sub-Process | New State Code | Rejection Role | Parent Transition |
|-------------|----------------|----------------|-------------------|
| Credit Review | `CREDIT_REVIEW_REJECTED` | Credit Analyst | PP_TR_3 |
| Business Sponsorship | `BUSINESS_SPONSOR_REJECTED` | Business Sponsor | PP_TR_5 |
| Credit Approval | `CREDIT_APPROVAL_REJECTED` | Credit Approver | PP_TR_9 |

### New Transitions Required

#### Credit Review Sub-Process
```
CRV_TR_6: Reject Application
  From: CREDIT_REVIEW_IN_PROGRESS
  To: CREDIT_REVIEW_REJECTED
  Role: Credit Analyst
  Conditions: rejection_reason must be provided
  Parent Action: Triggers PP_TR_3 (parent → CREDIT_PAPER_REJECTED)
```

#### Business Sponsorship Sub-Process
```
BS_TR_6: Reject Application
  From: BUSINESS_SPONSOR_IN_PROGRESS
  To: BUSINESS_SPONSOR_REJECTED
  Role: Business Sponsor
  Conditions: rejection comments must be provided
  Parent Action: Triggers PP_TR_5 (parent → CREDIT_PAPER_REJECTED)
```

#### Credit Approval Sub-Process
```
CAP_TR_5: Reject Application
  From: CREDIT_APPROVAL_IN_PROGRESS
  To: CREDIT_APPROVAL_REJECTED
  Role: Credit Approver, Committee Approver, Credit Analyst
  Conditions: approval_decision = 'rejected', comments must be provided
  Parent Action: Triggers PP_TR_9 (parent → CREDIT_PAPER_REJECTED)
```

### Parent Process Transitions to Add

| Code | Name | From State | To State | Trigger |
|------|------|------------|----------|---------|
| PP_TR_3 | Reject at Review Stage | CREDIT_PAPER_CREDIT_REVIEW_PENDING | CREDIT_PAPER_REJECTED | CRV_TR_6 |
| PP_TR_5 | Reject at Sponsorship Stage | CREDIT_PAPER_BUSINESS_SPONSOR_PENDING | CREDIT_PAPER_REJECTED | BS_TR_6 |

Note: PP_TR_9 already exists for approval stage rejection.

## Technical Implementation

### 1. Database Changes

#### Update `load_workflow_states.py`

Add new states to each affected sub-process workflow:

```python
# Credit Review - add state
{'code': 'CREDIT_REVIEW_REJECTED', 'name': 'Rejected', 'description': 'Credit review rejected', 'is_initial': False, 'is_terminal': True}

# Credit Review - add transition
{'code': 'CRV_TR_6', 'name': 'Reject Application', 'from_code': 'CREDIT_REVIEW_IN_PROGRESS', 'to_code': 'CREDIT_REVIEW_REJECTED', 'allowed_roles': ['credit_analyst'], 'system_action': 'reject_credit_review', 'description': 'Credit Analyst rejects application', 'conditions': {'requires_comments': True}, 'metadata': {'ui_behavior': {'navigate_on_success': '/'}, 'parent_workflow': {'transition_code': 'PP_TR_3', 'from_state': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING'}}}
```

Similar additions for Business Sponsorship and Credit Approval.

#### Add Parent Transitions

```python
# In CREDIT_PAPER workflow transitions
{'code': 'PP_TR_3', 'name': 'Reject at Review Stage', 'from_code': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING', 'to_code': 'CREDIT_PAPER_REJECTED', 'allowed_roles': ['credit_analyst', 'system'], 'system_action': 'reject_credit_review', 'description': 'Credit Analyst rejects application during review', 'conditions': {}},
{'code': 'PP_TR_5', 'name': 'Reject at Sponsorship Stage', 'from_code': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING', 'to_code': 'CREDIT_PAPER_REJECTED', 'allowed_roles': ['business_sponsor', 'system'], 'system_action': 'reject_business_sponsorship', 'description': 'Business Sponsor rejects application', 'conditions': {}},
```

### 2. Backend Changes

#### workflow_engine/actions.py

Add rejection action handlers:

```python
def reject_credit_review(workflow_instance, user, comments=''):
    """Handle credit review rejection."""
    # Validate rejection reason provided
    credit_review_form = workflow_instance.content_object
    if not credit_review_form.rejection_reason:
        raise ValidationError("Rejection reason is required")

    # Trigger parent workflow transition
    credit_app = credit_review_form.credit_application
    if credit_app.workflow_instance:
        parent_transition = credit_app.workflow_instance.workflow.transitions.get(code='PP_TR_3')
        credit_app.workflow_instance.perform_transition(parent_transition.code, user, comments)
```

Similar handlers for `reject_business_sponsorship` and `reject_credit_approval`.

### 3. Frontend Changes

#### Form Components

Add rejection UI to affected forms:

1. **CreditReviewForm**: Add "Reject Application" button visible when in IN_PROGRESS state
2. **BusinessSponsorshipForm**: Add rejection option alongside approval
3. **CreditApprovalForm**: Ensure rejection flow triggers correct transition

#### Rejection Modal/Dialog

Create reusable rejection component:
- Required comments/reason field
- Confirmation dialog
- Clear warning about terminal action

### 4. Notification Changes

Add email notifications for rejections:
- Notify Relationship Manager when application rejected
- Include rejection reason and stage
- Include link to view rejected application

## UI/UX Requirements

### Rejection Button Styling
- Use warning/danger color scheme (red/orange)
- Position separately from approval actions
- Include confirmation step

### Rejection Reason Field
- Required text field (minimum 50 characters recommended)
- Predefined reason categories (optional enhancement)
- Visible in read-only mode after rejection

### Dashboard Display
- Rejected applications should show rejection stage
- Filter option for "Rejected" status
- Rejection reason visible in application detail view

## Testing Requirements

### Unit Tests
- Test each rejection transition
- Test parent workflow cascade
- Test validation (comments required)
- Test role permissions for rejection

### E2E Tests
Add to `full-workflow-journey.spec.ts`:
```typescript
test('reject application at credit review stage', async ({ page }) => {
  // Create and submit credit request
  // Switch to Credit Analyst
  // Navigate to Credit Review form
  // Click Reject button
  // Enter rejection reason
  // Verify application moves to REJECTED state
  // Verify parent workflow is CREDIT_PAPER_REJECTED
});
```

### Integration Tests
- Test notification sending on rejection
- Test audit trail logging
- Test dashboard filtering

## Migration Path

1. Run `load_workflow_states` management command to add new states/transitions
2. Existing applications in progress are unaffected (no state migration needed)
3. New rejection paths available immediately for new workflows

## Acceptance Criteria

- [ ] Credit Analyst can reject applications during Credit Review phase
- [ ] Business Sponsor can reject applications during Business Sponsorship phase
- [ ] Approver can reject applications during Credit Approval phase
- [ ] All rejections require comments/reason
- [ ] Rejected applications show correct terminal state
- [ ] Parent workflow correctly transitions to CREDIT_PAPER_REJECTED
- [ ] Rejection reason is visible in application detail view
- [ ] Notifications sent to relevant stakeholders on rejection
- [ ] Audit trail captures rejection with user, timestamp, and reason
- [ ] E2E tests pass for all rejection scenarios

## Future Enhancements (Out of Scope)

- Rejection reason categories/templates
- Rejection appeal workflow
- Bulk rejection capability
- Rejection analytics/reporting
