# Credit Risk Workflow States

> **Note**: This document reflects the current implementation. See `Feature-Request-SubProcess-Rejection-States.md` for planned rejection state enhancements.

## Parent Process States

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| CREDIT_PAPER_CREDIT_REQUEST | Credit Request | Initial state when a credit request is created | Yes | No |
| CREDIT_PAPER_CREDIT_REVIEW_PENDING | Credit Review Pending | Credit paper waiting for review by Credit Analyst | No | No |
| CREDIT_PAPER_BUSINESS_SPONSOR_PENDING | Business Sponsor Pending | Credit paper waiting for business sponsorship | No | No |
| CREDIT_PAPER_ANALYSIS_PENDING | Analysis Pending | Credit paper in analysis phase (Credit Questionnaire, Legal Review, Credit Analysis) | No | No |
| CREDIT_PAPER_COMPILATION | Credit Compilation | Credit paper in compilation phase | No | No |
| CREDIT_PAPER_APPROVAL_PENDING | Approval Pending | Credit paper waiting for final approval | No | No |
| CREDIT_PAPER_APPROVED | Approved | Credit paper approved (terminal state) | No | Yes |
| CREDIT_PAPER_REJECTED | Rejected | Credit paper rejected (terminal state) | No | Yes |

## Sub-Process States

All sub-processes follow a consistent 3-state pattern: DRAFT → IN_PROGRESS → SUBMITTED

### Credit Request Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| CREDIT_REQUEST_DRAFT | Draft | Credit request in draft mode | Yes | No |
| CREDIT_REQUEST_IN_PROGRESS | In Progress | Credit request being worked on | No | No |
| CREDIT_REQUEST_SUBMITTED | Submitted | Credit request submitted for review | No | Yes |

### Credit Review Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| CREDIT_REVIEW_DRAFT | Draft | Credit review in draft mode | Yes | No |
| CREDIT_REVIEW_IN_PROGRESS | In Progress | Credit review being worked on | No | No |
| CREDIT_REVIEW_SUBMITTED | Submitted | Credit review submitted | No | Yes |

### Business Sponsorship Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| BUSINESS_SPONSOR_DRAFT | Draft | Business sponsorship in draft mode | Yes | No |
| BUSINESS_SPONSOR_IN_PROGRESS | In Progress | Business sponsorship being worked on | No | No |
| BUSINESS_SPONSOR_SUBMITTED | Submitted | Business sponsorship approved and submitted | No | Yes |

### Credit Questionnaire Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| CREDIT_QUESTIONNAIRE_DRAFT | Draft | Credit questionnaire in draft mode | Yes | No |
| CREDIT_QUESTIONNAIRE_IN_PROGRESS | In Progress | Credit questionnaire being worked on | No | No |
| CREDIT_QUESTIONNAIRE_SUBMITTED | Submitted | Credit questionnaire submitted | No | Yes |

### Legal Review Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| LEGAL_REVIEW_DRAFT | Draft | Legal review in draft mode | Yes | No |
| LEGAL_REVIEW_IN_PROGRESS | In Progress | Legal review being worked on | No | No |
| LEGAL_REVIEW_SUBMITTED | Submitted | Legal review submitted | No | Yes |

### Credit Analysis Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| CREDIT_ANALYSIS_DRAFT | Draft | Credit analysis in draft mode | Yes | No |
| CREDIT_ANALYSIS_IN_PROGRESS | In Progress | Credit analysis being worked on | No | No |
| CREDIT_ANALYSIS_SUBMITTED | Submitted | Credit analysis submitted | No | Yes |

### Credit Compilation Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| CREDIT_COMPILATION_DRAFT | Draft | Credit compilation in draft mode | Yes | No |
| CREDIT_COMPILATION_IN_PROGRESS | In Progress | Credit compilation being worked on | No | No |
| CREDIT_COMPILATION_SUBMITTED | Submitted | Credit compilation submitted for approval | No | Yes |

### Credit Approval Sub-Process

| State Code | Name | Description | Is Initial | Is Terminal |
|---|---|---|---|---|
| CREDIT_APPROVAL_DRAFT | Draft | Credit approval in draft mode | Yes | No |
| CREDIT_APPROVAL_IN_PROGRESS | In Progress | Credit approval being worked on | No | No |
| CREDIT_APPROVAL_SUBMITTED | Submitted | Approval decision submitted | No | Yes |

# Credit Risk Workflow Role Permissions

## Role Definitions

| Role Code | Role Name | Description |
|---|---|---|
| relationship_manager | Relationship Manager | Front Office user who initiates credit limit requests and provides business information |
| credit_analyst | Credit Analyst | Credit Risk user who reviews requests, performs analysis, and creates credit papers |
| business_sponsor | Business Sponsor | Senior Front Office stakeholder who supports credit limit requests |
| legal_reviewer | Legal Reviewer | Legal department user who reviews legal documentation |
| credit_approver | Credit Approver | Credit Analyst with delegated authority levels (DA3-DA8) |
| committee_approver | Committee Approver | Facilitates approval for higher-risk requests through committees (DA1-DA2) |
| system | System | Automated system user for workflow transitions |

## Permission Matrix

| Permission Code | Description | RM | CA | BS | LR | Approver | Admin |
|---|---|---|---|---|---|---|---|
| view_dashboard | View main dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| create_credit_request | Create new credit request | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| view_own_requests | View own credit requests | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_department_requests | View department credit requests | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_all_requests | View all credit requests | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| edit_credit_request | Edit credit request details | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| submit_credit_request | Submit credit request for review | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| perform_credit_review | Perform credit review | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| submit_credit_review | Submit credit review | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| provide_business_sponsorship | Provide business sponsorship | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| submit_business_sponsorship | Submit business sponsorship | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| complete_credit_questionnaire | Complete credit questionnaire | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| submit_credit_questionnaire | Submit credit questionnaire | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| perform_legal_review | Perform legal review | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| submit_legal_review | Submit legal review | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| perform_credit_analysis | Perform credit analysis | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| submit_credit_analysis | Submit credit analysis | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| compile_credit_paper | Compile credit paper | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| submit_credit_compilation | Submit credit compilation | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| approve_credit_paper | Approve credit paper | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| upload_documents | Upload documents to credit paper | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_documents | View documents attached to credit paper | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Legend:
- ✓: Has permission
- ✗: Does not have permission

# Credit Risk Workflow Transitions

## Parent Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Conditions |
|---|---|---|---|---|---|---|
| PP_TR_1 | Submit for Credit Review | CREDIT_PAPER_CREDIT_REQUEST | CREDIT_PAPER_CREDIT_REVIEW_PENDING | relationship_manager, system | submit_credit_request | Credit Request sub-process must be in CREDIT_REQUEST_SUBMITTED state |
| PP_TR_2 | Submit for Business Sponsorship | CREDIT_PAPER_CREDIT_REVIEW_PENDING | CREDIT_PAPER_BUSINESS_SPONSOR_PENDING | credit_analyst | submit_credit_review | Credit Review sub-process must be in CREDIT_REVIEW_SUBMITTED state |
| PP_TR_4 | Submit for Analysis | CREDIT_PAPER_BUSINESS_SPONSOR_PENDING | CREDIT_PAPER_ANALYSIS_PENDING | business_sponsor | submit_business_sponsorship | Business Sponsorship sub-process must be in BUSINESS_SPONSOR_SUBMITTED state |
| PP_TR_5 | Move to Compilation | CREDIT_PAPER_ANALYSIS_PENDING | CREDIT_PAPER_COMPILATION | system | submit_credit_analysis | All required analysis sub-processes must be in SUBMITTED state |
| PP_TR_7 | Submit for Approval | CREDIT_PAPER_COMPILATION | CREDIT_PAPER_APPROVAL_PENDING | credit_analyst | submit_credit_compilation | Credit Compilation sub-process must be in CREDIT_COMPILATION_SUBMITTED state |
| PP_TR_8 | Approve Credit Paper | CREDIT_PAPER_APPROVAL_PENDING | CREDIT_PAPER_APPROVED | credit_approver, committee_approver, credit_analyst, system | approve_credit_paper | Credit Approval sub-process must be in CREDIT_APPROVAL_SUBMITTED state |
| PP_TR_9 | Reject Credit Paper | CREDIT_PAPER_APPROVAL_PENDING | CREDIT_PAPER_REJECTED | credit_approver, committee_approver, credit_analyst, system | reject_credit_paper | None |

## Credit Request Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| CR_TR_1 | Save as Draft | CREDIT_REQUEST_DRAFT | CREDIT_REQUEST_DRAFT | relationship_manager | edit_credit_request | Relationship Manager saves form as draft |
| CR_TR_2 | Submit for In Progress | CREDIT_REQUEST_DRAFT | CREDIT_REQUEST_IN_PROGRESS | relationship_manager | edit_credit_request | Relationship Manager submits draft for progress |
| CR_TR_3 | Save as Draft from In Progress | CREDIT_REQUEST_IN_PROGRESS | CREDIT_REQUEST_DRAFT | relationship_manager | edit_credit_request | Relationship Manager saves form as draft from in progress |
| CR_TR_4 | Submit | CREDIT_REQUEST_IN_PROGRESS | CREDIT_REQUEST_SUBMITTED | relationship_manager | submit_credit_request | Relationship Manager submits Credit Request (triggers PP_TR_1) |

## Credit Review Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| CRV_TR_1 | Save as Draft | CREDIT_REVIEW_DRAFT | CREDIT_REVIEW_DRAFT | credit_analyst | edit_credit_review | Credit Analyst saves form as draft |
| CRV_TR_2 | Update Credit Paper | CREDIT_REVIEW_DRAFT | CREDIT_REVIEW_IN_PROGRESS | credit_analyst | edit_credit_review | Credit Analyst updates Credit Paper |
| CRV_TR_3 | Save as Draft from In Progress | CREDIT_REVIEW_IN_PROGRESS | CREDIT_REVIEW_DRAFT | credit_analyst | edit_credit_review | Credit Analyst saves form as draft |
| CRV_TR_4 | Submit | CREDIT_REVIEW_IN_PROGRESS | CREDIT_REVIEW_SUBMITTED | credit_analyst | submit_credit_review | Credit Analyst submits Credit Review (triggers PP_TR_2) |

## Business Sponsorship Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| BS_TR_1 | Save as Draft | BUSINESS_SPONSOR_DRAFT | BUSINESS_SPONSOR_DRAFT | business_sponsor | edit_business_sponsorship | Business Sponsor saves form as draft |
| BS_TR_2 | Submit for In Progress | BUSINESS_SPONSOR_DRAFT | BUSINESS_SPONSOR_IN_PROGRESS | business_sponsor | edit_business_sponsorship | Business Sponsor submits draft for progress |
| BS_TR_3 | Save as Draft from In Progress | BUSINESS_SPONSOR_IN_PROGRESS | BUSINESS_SPONSOR_DRAFT | business_sponsor | edit_business_sponsorship | Business Sponsor saves form as draft from in progress |
| BS_TR_4 | Submit | BUSINESS_SPONSOR_IN_PROGRESS | BUSINESS_SPONSOR_SUBMITTED | business_sponsor | submit_business_sponsorship | Business Sponsor submits (triggers PP_TR_4) |

## Credit Questionnaire Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| CQ_TR_1 | Save as Draft | CREDIT_QUESTIONNAIRE_DRAFT | CREDIT_QUESTIONNAIRE_DRAFT | credit_analyst, relationship_manager | edit_credit_questionnaire | User saves form as draft |
| CQ_TR_2 | Submit for In Progress | CREDIT_QUESTIONNAIRE_DRAFT | CREDIT_QUESTIONNAIRE_IN_PROGRESS | credit_analyst, relationship_manager | edit_credit_questionnaire | User submits draft for progress |
| CQ_TR_3 | Save as Draft from In Progress | CREDIT_QUESTIONNAIRE_IN_PROGRESS | CREDIT_QUESTIONNAIRE_DRAFT | credit_analyst, relationship_manager | edit_credit_questionnaire | User saves form as draft from in progress |
| CQ_TR_4 | Submit | CREDIT_QUESTIONNAIRE_IN_PROGRESS | CREDIT_QUESTIONNAIRE_SUBMITTED | credit_analyst, relationship_manager | submit_credit_questionnaire | User submits Credit Questionnaire |

## Legal Review Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| LR_TR_1 | Save as Draft | LEGAL_REVIEW_DRAFT | LEGAL_REVIEW_DRAFT | legal_reviewer | edit_legal_review | Legal Reviewer saves form as draft |
| LR_TR_2 | Submit for In Progress | LEGAL_REVIEW_DRAFT | LEGAL_REVIEW_IN_PROGRESS | legal_reviewer | edit_legal_review | Legal Reviewer submits draft for progress |
| LR_TR_3 | Save as Draft from In Progress | LEGAL_REVIEW_IN_PROGRESS | LEGAL_REVIEW_DRAFT | legal_reviewer | edit_legal_review | Legal Reviewer saves form as draft from in progress |
| LR_TR_4 | Submit | LEGAL_REVIEW_IN_PROGRESS | LEGAL_REVIEW_SUBMITTED | legal_reviewer | submit_legal_review | Legal Reviewer submits Legal Review |

## Credit Analysis Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| CAN_TR_1 | Save as Draft | CREDIT_ANALYSIS_DRAFT | CREDIT_ANALYSIS_DRAFT | credit_analyst | edit_credit_analysis | Credit Analyst saves form as draft |
| CAN_TR_2 | Submit for In Progress | CREDIT_ANALYSIS_DRAFT | CREDIT_ANALYSIS_IN_PROGRESS | credit_analyst | edit_credit_analysis | Credit Analyst submits draft for progress |
| CAN_TR_3 | Save as Draft from In Progress | CREDIT_ANALYSIS_IN_PROGRESS | CREDIT_ANALYSIS_DRAFT | credit_analyst | edit_credit_analysis | Credit Analyst saves form as draft from in progress |
| CAN_TR_4 | Submit | CREDIT_ANALYSIS_IN_PROGRESS | CREDIT_ANALYSIS_SUBMITTED | credit_analyst | submit_credit_analysis | Credit Analyst submits Credit Analysis |

## Credit Compilation Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| CC_TR_1 | Save as Draft | CREDIT_COMPILATION_DRAFT | CREDIT_COMPILATION_DRAFT | credit_analyst | edit_credit_compilation | Credit Analyst saves form as draft |
| CC_TR_2 | Submit for In Progress | CREDIT_COMPILATION_DRAFT | CREDIT_COMPILATION_IN_PROGRESS | credit_analyst | edit_credit_compilation | Credit Analyst submits draft for progress |
| CC_TR_3 | Save as Draft from In Progress | CREDIT_COMPILATION_IN_PROGRESS | CREDIT_COMPILATION_DRAFT | credit_analyst | edit_credit_compilation | Credit Analyst saves form as draft from in progress |
| CC_TR_4 | Submit | CREDIT_COMPILATION_IN_PROGRESS | CREDIT_COMPILATION_SUBMITTED | credit_analyst | submit_credit_compilation | Credit Analyst submits (triggers PP_TR_7) |

## Credit Approval Sub-Process Transitions

| Transition ID | Name | From State | To State | Allowed Roles | System Action | Description |
|---|---|---|---|---|---|---|
| CAP_TR_1 | Save as Draft | CREDIT_APPROVAL_DRAFT | CREDIT_APPROVAL_DRAFT | credit_approver, committee_approver, credit_analyst | edit_credit_approval | Approver saves form as draft |
| CAP_TR_2 | Submit for In Progress | CREDIT_APPROVAL_DRAFT | CREDIT_APPROVAL_IN_PROGRESS | credit_approver, committee_approver, credit_analyst | edit_credit_approval | Approver submits draft for progress |
| CAP_TR_3 | Save as Draft from In Progress | CREDIT_APPROVAL_IN_PROGRESS | CREDIT_APPROVAL_DRAFT | credit_approver, committee_approver, credit_analyst | edit_credit_approval | Approver saves form as draft from in progress |
| CAP_TR_4 | Submit | CREDIT_APPROVAL_IN_PROGRESS | CREDIT_APPROVAL_SUBMITTED | credit_approver, committee_approver, credit_analyst | submit_credit_approval | Approver submits (triggers PP_TR_8) |

# Workflow Transition Notes

## Parent Process Flow

### PP_TR_1: Credit Request to Credit Review Pending

- **Trigger**: CR_TR_4 (Credit Request Submit)
- **Action**: Relationship Manager submits completed Credit Request form
- **System Response**:
    - Auto-initializes Credit Review form in CREDIT_REVIEW_DRAFT state
    - Locks the Credit Request form from further editing

### PP_TR_2: Credit Review Pending to Business Sponsor Pending

- **Trigger**: CRV_TR_4 (Credit Review Submit)
- **Action**: Credit Analyst submits completed Credit Review form
- **System Response**:
    - Auto-initializes Business Sponsorship form in BUSINESS_SPONSOR_DRAFT state
    - Records the assigned DA level for later approval routing
    - Records whether a Credit Questionnaire will be required in the Analysis phase

### PP_TR_4: Business Sponsor Pending to Analysis Pending

- **Trigger**: BS_TR_4 (Business Sponsorship Submit)
- **Action**: Business Sponsor approves and submits
- **System Response**:
    - Auto-initializes three parallel sub-processes:
        1. Legal Review form in LEGAL_REVIEW_DRAFT state
        2. Credit Analysis form in CREDIT_ANALYSIS_DRAFT state
        3. Credit Questionnaire form in CREDIT_QUESTIONNAIRE_DRAFT state (if required per Credit Review)

### PP_TR_5: Analysis Pending to Compilation

- **Trigger**: System-triggered when all required analysis sub-processes complete
- **System Response**:
    - Verifies all required sub-processes are in SUBMITTED state:
        1. Legal Review must be in LEGAL_REVIEW_SUBMITTED state
        2. Credit Analysis must be in CREDIT_ANALYSIS_SUBMITTED state
        3. If Credit Questionnaire was required, it must be in CREDIT_QUESTIONNAIRE_SUBMITTED state
    - Auto-initializes Credit Compilation form in CREDIT_COMPILATION_DRAFT state

### PP_TR_7: Compilation to Approval Pending

- **Trigger**: CC_TR_4 (Credit Compilation Submit)
- **Action**: Credit Analyst submits compiled credit paper
- **System Response**:
    - Auto-initializes Credit Approval form in CREDIT_APPROVAL_DRAFT state
    - Routes to appropriate approver based on DA level specified in Credit Review

### PP_TR_8: Approval Pending to Approved

- **Trigger**: CAP_TR_4 (Credit Approval Submit with approval)
- **Action**: Approver submits approval decision
- **System Response**:
    - Moves parent process to terminal APPROVED state
    - Records approval details including approver, timestamp, and any comments

### PP_TR_9: Approval Pending to Rejected

- **Trigger**: Approver submits rejection at approval stage
- **Action**: Approver rejects application
- **System Response**:
    - Moves parent process to terminal REJECTED state
    - Records rejection reason

## Sub-Process Transition Pattern

All sub-processes follow the same 4-transition pattern:

1. **TR_1: Save as Draft** (DRAFT → DRAFT) - Save work without changing state
2. **TR_2: Submit for In Progress** (DRAFT → IN_PROGRESS) - Make form visible to others
3. **TR_3: Save as Draft from In Progress** (IN_PROGRESS → DRAFT) - Return to private draft
4. **TR_4: Submit** (IN_PROGRESS → SUBMITTED) - Finalize and trigger next phase

## Business Sponsor Authorization

The Business Sponsorship workflow has special authorization rules:
- User must be assigned as either `senior_business_sponsor` or `second_business_sponsor` on the form
- Sponsors are copied from the Credit Request Form when Business Sponsorship is initialized
- This ensures only designated sponsors can approve/submit the sponsorship

## Delegated Authority (DA) Level Authorization

Credit Approval transitions check the user's DA level against the required DA level:
- DA level is set during Credit Review (delegated_authority_level field)
- User's DA level is stored on their User profile (da_level field)
- Approval is only allowed if user's DA level meets or exceeds the required level

## Form Visibility by Workflow State

Each parent workflow state has metadata defining which forms are relevant:

| Parent State | Visible Forms |
|---|---|
| CREDIT_PAPER_CREDIT_REQUEST | credit_request_form |
| CREDIT_PAPER_CREDIT_REVIEW_PENDING | credit_request_form, credit_review_form |
| CREDIT_PAPER_BUSINESS_SPONSOR_PENDING | credit_request_form, credit_review_form, business_sponsorship_form |
| CREDIT_PAPER_ANALYSIS_PENDING | All above + credit_questionnaire_form, legal_review_form, credit_analysis_form |
| CREDIT_PAPER_COMPILATION | All above + credit_compilation_form |
| CREDIT_PAPER_APPROVAL_PENDING | All forms |
| CREDIT_PAPER_APPROVED | All forms (read-only) |
| CREDIT_PAPER_REJECTED | All forms (read-only) |

## Audit Trail

All transitions are logged with:
- User who performed the action
- Timestamp
- From and to states
- Any comments provided
- System context information
