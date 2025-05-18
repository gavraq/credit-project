

# Credit Risk Workflow States

## Parent Process States

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|CREDIT_PAPER_CREDIT_REQUEST|Credit Request|Initial state when a credit request is created|Yes|No|
|CREDIT_PAPER_CREDIT_REVIEW_PENDING|Credit Review Pending|Credit paper waiting for review by Credit Analyst|No|No|
|CREDIT_PAPER_BUSINESS_SPONSOR_PENDING|Business Sponsor Pending|Credit paper waiting for business sponsorship|No|No|
|CREDIT_PAPER_ANALYSIS_PENDING|Analysis Pending|Credit paper in analysis phase (Credit Questionnaire, Legal Review, Credit Analysis)|No|No|
|CREDIT_PAPER_COMPILATION|Credit Compilation|Credit paper in compilation phase|No|No|
|CREDIT_PAPER_APPROVAL_PENDING|Approval Pending|Credit paper waiting for final approval|No|No|
|CREDIT_PAPER_APPROVED|Approved|Credit paper approved (terminal state)|No|Yes|
|CREDIT_PAPER_REJECTED|Rejected|Credit paper rejected (terminal state)|No|Yes|

## Sub-Process States

### Credit Request Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|CREDIT_REQUEST_DRAFT|Draft|Credit request in draft mode|Yes|No|
|CREDIT_REQUEST_IN_PROGRESS|In Progress|Credit request being worked on|No|No|
|CREDIT_REQUEST_SUBMITTED|Submitted|Credit request submitted for review|No|Yes|

### Credit Review Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|CREDIT_REVIEW_DRAFT|Draft|Credit review in draft mode|Yes|No|
|CREDIT_REVIEW_IN_PROGRESS|In Progress|Credit review being worked on|No|No|
|CREDIT_REVIEW_SUBMITTED|Submitted|Credit review submitted|No|Yes|
|CREDIT_REVIEW_REJECTED|Rejected|Credit review rejected|No|Yes|

### Business Sponsorship Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|BUSINESS_SPONSOR_DRAFT|Draft|Business sponsorship in draft mode|Yes|No|
|BUSINESS_SPONSOR_IN_PROGRESS|In Progress|Business sponsorship being worked on|No|No|
|BUSINESS_SPONSOR_SUBMITTED|Submitted|Business sponsorship approved and submitted|No|Yes|
|BUSINESS_SPONSOR_REJECTED|Rejected|Business sponsorship rejected|No|Yes|

### Credit Questionnaire Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|CREDIT_QUESTIONNAIRE_DRAFT|Draft|Credit questionnaire in draft mode|Yes|No|
|CREDIT_QUESTIONNAIRE_IN_PROGRESS|In Progress|Credit questionnaire being worked on|No|No|
|CREDIT_QUESTIONNAIRE_SUBMITTED|Submitted|Credit questionnaire submitted|No|Yes|

### Legal Review Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|LEGAL_REVIEW_DRAFT|Draft|Legal review in draft mode|Yes|No|
|LEGAL_REVIEW_IN_PROGRESS|In Progress|Legal review being worked on|No|No|
|LEGAL_REVIEW_SUBMITTED|Submitted|Legal review submitted|No|Yes|

### Credit Analysis Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|CREDIT_ANALYSIS_DRAFT|Draft|Credit analysis in draft mode|Yes|No|
|CREDIT_ANALYSIS_IN_PROGRESS|In Progress|Credit analysis being worked on|No|No|
|CREDIT_ANALYSIS_SUBMITTED|Submitted|Credit analysis submitted|No|Yes|

### Credit Compilation Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|CREDIT_COMPILATION_DRAFT|Draft|Credit compilation in draft mode|Yes|No|
|CREDIT_COMPILATION_IN_PROGRESS|In Progress|Credit compilation being worked on|No|No|
|CREDIT_COMPILATION_SUBMITTED|Submitted|Credit compilation submitted for approval|No|Yes|

### Credit Approval Sub-Process

|State Code|Name|Description|Is Initial|Is Terminal|
|---|---|---|---|---|
|CREDIT_APPROVAL_DRAFT|Draft|Credit approval in draft mode|Yes|No|
|CREDIT_APPROVAL_IN_PROGRESS|In Progress|Credit approval being worked on|No|No|
|CREDIT_APPROVAL_SUBMITTED|Submitted|Approval decision submitted|No|Yes|

# Credit Risk Workflow Role Permissions

## Role Definitions

|Role Code|Role Name|Description|
|---|---|---|
|RM|Relationship Manager|Front Office user who initiates credit limit requests and provides business information|
|CA|Credit Analyst|Credit Risk user who reviews requests, performs analysis, and creates credit papers|
|BS|Business Sponsor|Senior Front Office stakeholder who supports credit limit requests|
|LR|Legal Reviewer|Legal department user who reviews legal documentation|
|DA3-DA8|Credit Approver|Credit Analyst with delegated authority levels 3-8|
|DA1-DA2|Committee Approver|Facilitates approval for higher-risk requests through committees|
|ADMIN|System Administrator|Manages system settings, workflows, and user access|

## Permission Matrix

|Permission Code|Description|RM|CA|BS|LR|DA3-DA8|DA1-DA2|ADMIN|
|---|---|---|---|---|---|---|---|---|
|view_dashboard|View main dashboard|✓|✓|✓|✓|✓|✓|✓|
|create_credit_request|Create new credit request|✓|✗|✗|✗|✗|✗|✓|
|view_own_requests|View own credit requests|✓|✓|✓|✓|✓|✓|✓|
|view_department_requests|View department credit requests|✓|✓|✓|✓|✓|✓|✓|
|view_all_requests|View all credit requests|✗|✓|✗|✗|✓|✓|✓|
|edit_credit_request|Edit credit request details|✓|✗|✗|✗|✗|✗|✓|
|submit_credit_request|Submit credit request for review|✓|✗|✗|✗|✗|✗|✓|
|perform_credit_review|Perform credit review|✗|✓|✗|✗|✓|✓|✗|
|submit_credit_review|Submit credit review|✗|✓|✗|✗|✓|✓|✗|
|reject_credit_review|Reject credit paper at review stage|✗|✓|✗|✗|✓|✓|✗|
|provide_business_sponsorship|Provide business sponsorship|✗|✗|✓|✗|✗|✗|✗|
|submit_business_sponsorship|Submit business sponsorship|✗|✗|✓|✗|✗|✗|✗|
|reject_business_sponsorship|Reject at business sponsorship stage|✗|✗|✓|✗|✗|✗|✗|
|complete_credit_questionnaire|Complete credit questionnaire|✓|✗|✗|✗|✗|✗|✗|
|submit_credit_questionnaire|Submit credit questionnaire|✓|✗|✗|✗|✗|✗|✗|
|perform_legal_review|Perform legal review|✗|✗|✗|✓|✗|✗|✗|
|submit_legal_review|Submit legal review|✗|✗|✗|✓|✗|✗|✗|
|perform_credit_analysis|Perform credit analysis|✗|✓|✗|✗|✓|✓|✗|
|submit_credit_analysis|Submit credit analysis|✗|✓|✗|✗|✓|✓|✗|
|compile_credit_paper|Compile credit paper|✗|✓|✗|✗|✓|✓|✗|
|submit_credit_compilation|Submit credit compilation|✗|✓|✗|✗|✓|✓|✗|
|approve_credit_paper_da3_da8|Approve credit paper (DA3-DA8)|✗|✗|✗|✗|✓|✗|✗|
|approve_credit_paper_da1_da2|Approve credit paper (DA1-DA2)|✗|✗|✗|✗|✗|✓|✗|
|reject_credit_paper|Reject credit paper at approval stage|✗|✗|✗|✗|✓|✓|✗|
|upload_documents|Upload documents to credit paper|✓|✓|✓|✓|✓|✓|✓|
|view_documents|View documents attached to credit paper|✓|✓|✓|✓|✓|✓|✓|
|view_metrics|View performance metrics|✗|✓|✗|✗|✓|✓|✓|
|manage_prioritization|Manage request prioritization|✓|✓|✓|✗|✓|✓|✓|
|manage_users|Manage user accounts|✗|✗|✗|✗|✗|✗|✓|
|manage_workflows|Manage workflow definitions|✗|✗|✗|✗|✗|✗|✓|
|export_data|Export data to external formats|✗|✓|✗|✗|✓|✓|✓|

## Form Field Visibility Controls

|Form|Field|RM|CA|BS|LR|DA3-DA8|DA1-DA2|ADMIN|
|---|---|---|---|---|---|---|---|---|
|Credit Request|Header Information|R/W|R|R|R|R|R|R/W|
|Credit Request|Existing and Proposed Limits|R/W|R|R|R|R|R|R/W|
|Credit Request|Relationship Revenue|R/W|R|R|R|R|R|R/W|
|Credit Request|Comments on Limits|R/W|R|R|R|R|R|R/W|
|Credit Request|Country Risk Limit|R/W|R|R|R|R|R|R/W|
|Credit Request|Relationship Comments|R/W|R|R|R|R|R|R/W|
|Credit Request|Legal Documentation|R/W|R|R|R|R|R|R/W|
|Credit Request|Financial Disclosure|R/W|R|R|R|R|R|R/W|
|Credit Request|Prioritisation|R/W|R|R|R|R|R|R/W|
|Credit Request|Request Sponsorship|R/W|R|R|R|R|R|R/W|
|Credit Review|Credit Reviewer|R|R/W|R|R|R/W|R/W|R/W|
|Credit Review|Assigned Credit Analyst|R|R/W|R|R|R/W|R/W|R/W|
|Credit Review|Delegated Authority Level|R|R/W|R|R|R/W|R/W|R/W|
|Credit Review|Questionnaire Required|R|R/W|R|R|R/W|R/W|R/W|
|Credit Review|Additional Information|R|R/W|R|R|R/W|R/W|R/W|
|Credit Review|Rejection Reasons|R|R/W|R|R|R/W|R/W|R/W|
|Business Sponsorship|Sponsorship Decision|R|R|R/W|R|R|R|R/W|
|Business Sponsorship|Comments|R|R|R/W|R|R|R|R/W|
|Business Sponsorship|Second Sponsor|R|R|R/W|R|R|R|R/W|
|Credit Questionnaire|All Sections|R/W|R|R|R|R|R|R/W|
|Legal Review|All Sections|R|R|R|R/W|R|R|R/W|
|Credit Analysis|All Sections|R|R/W|R|R|R/W|R/W|R/W|
|Credit Compilation|All Sections|R|R/W|R|R|R/W|R/W|R/W|
|Credit Approval|Approval Decision|R|R|R|R|R/W (DA3-8)|R/W (DA1-2)|R/W|
|Credit Approval|Comments|R|R|R|R|R/W (DA3-8)|R/W (DA1-2)|R/W|

Legend:

- R: Read access
- R/W: Read and write access
- ✓: Has permission
- ✗: Does not have permission

# Credit Risk Workflow Transitions and Required Actions

## Parent Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|PP_TR_1|Submit for Credit Review|CREDIT_PAPER_CREDIT_REQUEST|CREDIT_PAPER_CREDIT_REVIEW_PENDING|submit_credit_request|Relationship Manager submits Credit Request form|Credit Request sub-process must be in CREDIT_REQUEST_SUBMITTED state|
|PP_TR_2|Submit for Business Sponsorship|CREDIT_PAPER_CREDIT_REVIEW_PENDING|CREDIT_PAPER_BUSINESS_SPONSOR_PENDING|submit_credit_review|Credit Analyst submits Credit Review form|Credit Review sub-process must be in CREDIT_REVIEW_SUBMITTED state|
|PP_TR_3|Reject at Review Stage|CREDIT_PAPER_CREDIT_REVIEW_PENDING|CREDIT_PAPER_REJECTED|reject_credit_review|Credit Analyst rejects application during review|None|
|PP_TR_4|Submit for Analysis|CREDIT_PAPER_BUSINESS_SPONSOR_PENDING|CREDIT_PAPER_ANALYSIS_PENDING|submit_business_sponsorship|Business Sponsor submits Business Sponsorship form|Business Sponsorship sub-process must be in BUSINESS_SPONSOR_SUBMITTED state|
|PP_TR_5|Reject at Sponsorship Stage|CREDIT_PAPER_BUSINESS_SPONSOR_PENDING|CREDIT_PAPER_REJECTED|reject_business_sponsorship|Business Sponsor rejects application|None|
|PP_TR_6|Move to Compilation|CREDIT_PAPER_ANALYSIS_PENDING|CREDIT_PAPER_COMPILATION|submit_credit_analysis|System transition when all analysis sub-processes complete|1. Legal Review sub-process must be in LEGAL_REVIEW_SUBMITTED state<br>2. Credit Analysis sub-process must be in CREDIT_ANALYSIS_SUBMITTED state<br>3. If Questionnaire Required=Yes, Credit Questionnaire sub-process must be in CREDIT_QUESTIONNAIRE_SUBMITTED state|
|PP_TR_7|Submit for Approval|CREDIT_PAPER_COMPILATION|CREDIT_PAPER_APPROVAL_PENDING|submit_credit_compilation|Credit Analyst submits Credit Compilation form|Credit Compilation sub-process must be in CREDIT_COMPILATION_SUBMITTED state|
|PP_TR_8|Approve Credit Paper|CREDIT_PAPER_APPROVAL_PENDING|CREDIT_PAPER_APPROVED|approve_credit_paper_da3_da8 OR approve_credit_paper_da1_da2|Approver submits approval|Credit Approval sub-process must be in CREDIT_APPROVAL_SUBMITTED state|
|PP_TR_9|Reject at Approval Stage|CREDIT_PAPER_APPROVAL_PENDING|CREDIT_PAPER_REJECTED|reject_credit_paper|Approver rejects application|None|

## Credit Request Sub-Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|CR_TR_1|Save as Draft|CREDIT_REQUEST_DRAFT|CREDIT_REQUEST_DRAFT|edit_credit_request|Relationship Manager saves form as draft|None|
|CR_TR_2|Update Credit Paper|CREDIT_REQUEST_DRAFT|CREDIT_REQUEST_IN_PROGRESS|edit_credit_request|Relationship Manager updates Credit Paper|None|
|CR_TR_3|Save as Draft from In Progress|CREDIT_REQUEST_IN_PROGRESS|CREDIT_REQUEST_DRAFT|edit_credit_request|Relationship Manager saves form as draft|None|
|CR_TR_4|Update Credit Paper from In Progress|CREDIT_REQUEST_IN_PROGRESS|CREDIT_REQUEST_IN_PROGRESS|edit_credit_request|Relationship Manager updates Credit Paper|None|
|CR_TR_5|Submit for Credit Review|CREDIT_REQUEST_IN_PROGRESS|CREDIT_REQUEST_SUBMITTED|submit_credit_request|Relationship Manager submits for Credit Review|All required fields must be filled out|

## Credit Review Sub-Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|CRV_TR_1|Save as Draft|CREDIT_REVIEW_DRAFT|CREDIT_REVIEW_DRAFT|perform_credit_review|Credit Analyst saves form as draft|None|
|CRV_TR_2|Update Credit Paper|CREDIT_REVIEW_DRAFT|CREDIT_REVIEW_IN_PROGRESS|perform_credit_review|Credit Analyst updates Credit Paper|None|
|CRV_TR_3|Save as Draft from In Progress|CREDIT_REVIEW_IN_PROGRESS|CREDIT_REVIEW_DRAFT|perform_credit_review|Credit Analyst saves form as draft|None|
|CRV_TR_4|Update Credit Paper from In Progress|CREDIT_REVIEW_IN_PROGRESS|CREDIT_REVIEW_IN_PROGRESS|perform_credit_review|Credit Analyst updates Credit Paper|None|
|CRV_TR_5|Submit for Business Sponsorship|CREDIT_REVIEW_IN_PROGRESS|CREDIT_REVIEW_SUBMITTED|submit_credit_review|Credit Analyst submits for Business Sponsorship|All required fields must be filled out|
|CRV_TR_6|Reject Application|CREDIT_REVIEW_IN_PROGRESS|CREDIT_REVIEW_REJECTED|reject_credit_review|Credit Analyst rejects application|Rejection reason must be provided|

## Business Sponsorship Sub-Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|BS_TR_1|Save as Draft|BUSINESS_SPONSOR_DRAFT|BUSINESS_SPONSOR_DRAFT|provide_business_sponsorship|Business Sponsor saves form as draft|None|
|BS_TR_2|Update Credit Paper|BUSINESS_SPONSOR_DRAFT|BUSINESS_SPONSOR_IN_PROGRESS|provide_business_sponsorship|Business Sponsor updates Credit Paper|None|
|BS_TR_3|Save as Draft from In Progress|BUSINESS_SPONSOR_IN_PROGRESS|BUSINESS_SPONSOR_DRAFT|provide_business_sponsorship|Business Sponsor saves form as draft|None|
|BS_TR_4|Update Credit Paper from In Progress|BUSINESS_SPONSOR_IN_PROGRESS|BUSINESS_SPONSOR_IN_PROGRESS|provide_business_sponsorship|Business Sponsor updates Credit Paper|None|
|BS_TR_5|Submit for Analysis|BUSINESS_SPONSOR_IN_PROGRESS|BUSINESS_SPONSOR_SUBMITTED|submit_business_sponsorship|Business Sponsor approves and submits|is_approved must be true|
|BS_TR_6|Reject Application|BUSINESS_SPONSOR_IN_PROGRESS|BUSINESS_SPONSOR_REJECTED|reject_business_sponsorship|Business Sponsor rejects application|Rejection comments must be provided|

## Credit Questionnaire Sub-Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|CQ_TR_1|Save as Draft|CREDIT_QUESTIONNAIRE_DRAFT|CREDIT_QUESTIONNAIRE_DRAFT|complete_credit_questionnaire|Relationship Manager saves form as draft|None|
|CQ_TR_2|Update Credit Paper|CREDIT_QUESTIONNAIRE_DRAFT|CREDIT_QUESTIONNAIRE_IN_PROGRESS|complete_credit_questionnaire|Relationship Manager updates Credit Paper|None|
|CQ_TR_3|Save as Draft from In Progress|CREDIT_QUESTIONNAIRE_IN_PROGRESS|CREDIT_QUESTIONNAIRE_DRAFT|complete_credit_questionnaire|Relationship Manager saves form as draft|None|
|CQ_TR_4|Update Credit Paper from In Progress|CREDIT_QUESTIONNAIRE_IN_PROGRESS|CREDIT_QUESTIONNAIRE_IN_PROGRESS|complete_credit_questionnaire|Relationship Manager updates Credit Paper|None|
|CQ_TR_5|Submit for Review|CREDIT_QUESTIONNAIRE_IN_PROGRESS|CREDIT_QUESTIONNAIRE_SUBMITTED|submit_credit_questionnaire|Relationship Manager submits for Review|All required fields must be filled out|

## Legal Review Sub-Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|LR_TR_1|Save as Draft|LEGAL_REVIEW_DRAFT|LEGAL_REVIEW_DRAFT|perform_legal_review|Legal Reviewer saves form as draft|None|
|LR_TR_2|Update Credit Paper|LEGAL_REVIEW_DRAFT|LEGAL_REVIEW_IN_PROGRESS|perform_legal_review|Legal Reviewer updates Credit Paper|None|
|LR_TR_3|Save as Draft from In Progress|LEGAL_REVIEW_IN_PROGRESS|LEGAL_REVIEW_DRAFT|perform_legal_review|Legal Reviewer saves form as draft|None|
|LR_TR_4|Update Credit Paper from In Progress|LEGAL_REVIEW_IN_PROGRESS|LEGAL_REVIEW_IN_PROGRESS|perform_legal_review|Legal Reviewer updates Credit Paper|None|
|LR_TR_5|Submit for Review|LEGAL_REVIEW_IN_PROGRESS|LEGAL_REVIEW_SUBMITTED|submit_legal_review|Legal Reviewer submits review|All required fields must be filled out|

## Credit Analysis Sub-Process Transitions

| Transition ID | Name                                 | From State                  | To State                    | Required Permission     | Required Action                     | Conditions                             |
| ------------- | ------------------------------------ | --------------------------- | --------------------------- | ----------------------- | ----------------------------------- | -------------------------------------- |
| CA_TR_1       | Save as Draft                        | CREDIT_ANALYSIS_DRAFT       | CREDIT_ANALYSIS_DRAFT       | perform_credit_analysis | Credit Analyst saves form as draft  | None                                   |
| CA_TR_2       | Update Credit Paper                  | CREDIT_ANALYSIS_DRAFT       | CREDIT_ANALYSIS_IN_PROGRESS | perform_credit_analysis | Credit Analyst updates Credit Paper | None                                   |
| CA_TR_3       | Save as Draft from In Progress       | CREDIT_ANALYSIS_IN_PROGRESS | CREDIT_ANALYSIS_DRAFT       | perform_credit_analysis | Credit Analyst saves form as draft  | None                                   |
| CA_TR_4       | Update Credit Paper from In Progress | CREDIT_ANALYSIS_IN_PROGRESS | CREDIT_ANALYSIS_IN_PROGRESS | perform_credit_analysis | Credit Analyst updates Credit Paper | None                                   |
| CA_TR_5       | Submit for Review                    | CREDIT_ANALYSIS_IN_PROGRESS | CREDIT_ANALYSIS_SUBMITTED   | submit_credit_analysis  | Credit Analyst submits analysis     | All required fields must be filled out |

## Credit Compilation Sub-Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|CC_TR_1|Save as Draft|CREDIT_COMPILATION_DRAFT|CREDIT_COMPILATION_DRAFT|compile_credit_paper|Credit Analyst saves form as draft|None|
|CC_TR_2|Update Credit Paper|CREDIT_COMPILATION_DRAFT|CREDIT_COMPILATION_IN_PROGRESS|compile_credit_paper|Credit Analyst updates Credit Paper|None|
|CC_TR_3|Save as Draft from In Progress|CREDIT_COMPILATION_IN_PROGRESS|CREDIT_COMPILATION_DRAFT|compile_credit_paper|Credit Analyst saves form as draft|None|
|CC_TR_4|Update Credit Paper from In Progress|CREDIT_COMPILATION_IN_PROGRESS|CREDIT_COMPILATION_IN_PROGRESS|compile_credit_paper|Credit Analyst updates Credit Paper|None|
|CC_TR_5|Submit for Approval|CREDIT_COMPILATION_IN_PROGRESS|CREDIT_COMPILATION_SUBMITTED|submit_credit_compilation|Credit Analyst submits for approval|All required fields must be filled out|

## Credit Approval Sub-Process Transitions

|Transition ID|Name|From State|To State|Required Permission|Required Action|Conditions|
|---|---|---|---|---|---|---|
|CA_TR_1|Save as Draft|CREDIT_APPROVAL_DRAFT|CREDIT_APPROVAL_DRAFT|approve_credit_paper_da3_da8 OR approve_credit_paper_da1_da2|Approver saves form as draft|None|
|CA_TR_2|Update Credit Paper|CREDIT_APPROVAL_DRAFT|CREDIT_APPROVAL_IN_PROGRESS|approve_credit_paper_da3_da8 OR approve_credit_paper_da1_da2|Approver updates Credit Paper|None|
|CA_TR_3|Save as Draft from In Progress|CREDIT_APPROVAL_IN_PROGRESS|CREDIT_APPROVAL_DRAFT|approve_credit_paper_da3_da8 OR approve_credit_paper_da1_da2|Approver saves form as draft|None|
|CA_TR_4|Update Credit Paper from In Progress|CREDIT_APPROVAL_IN_PROGRESS|CREDIT_APPROVAL_IN_PROGRESS|approve_credit_paper_da3_da8 OR approve_credit_paper_da1_da2|Approver updates Credit Paper|None|
|CA_TR_5|Submit Approval|CREDIT_APPROVAL_IN_PROGRESS|CREDIT_APPROVAL_SUBMITTED|approve_credit_paper_da3_da8 OR approve_credit_paper_da1_da2|Approver submits approval|is_approved must be true|
|CA_TR_6|Submit Rejection|CREDIT_APPROVAL_IN_PROGRESS|CREDIT_APPROVAL_SUBMITTED|reject_credit_paper|Approver submits rejection|is_approved must be false and comments must be provided|


# Complete Credit Risk Workflow Transition Notes

## Parent Process Transitions

### PP_TR_1: Credit Request to Credit Review Pending

- **Action**: Relationship Manager submits completed Credit Request form
- **System Response**:
    - Creates a Credit Review sub-process in CREDIT_REVIEW_DRAFT state
    - Locks the Credit Request form from further editing
    - Sends email notification to assigned Credit Analysts
- **Note**: This is the initial handoff from Front Office to Credit Risk department

### PP_TR_2: Credit Review Pending to Business Sponsor Pending

- **Action**: Credit Analyst submits completed Credit Review form
- **System Response**:
    - Creates a Business Sponsorship sub-process in BUSINESS_SPONSOR_DRAFT state
    - Records the assigned DA level for later approval routing
    - Records whether a Credit Questionnaire will be required in the Analysis phase
    - Sends email notification to designated Business Sponsor
- **Note**: Credit Analysis determines approval authority level (DA1-DA8) at this stage

### PP_TR_3: Credit Review Pending to Rejected

- **Action**: Credit Analyst rejects application during review
- **System Response**:
    - Moves parent process to terminal REJECTED state
    - Records rejection reason
    - Sends notification to Relationship Manager
- **Note**: Early rejection saves time by not proceeding with applications that don't meet basic criteria

### PP_TR_4: Business Sponsor Pending to Analysis Pending

- **Action**: Business Sponsor approves application
- **System Response**:
    - Initiates three parallel sub-processes:
        1. Legal Review sub-process in LEGAL_REVIEW_DRAFT state
        2. Credit Analysis sub-process in CREDIT_ANALYSIS_DRAFT state
        3. Credit Questionnaire sub-process in CREDIT_QUESTIONNAIRE_DRAFT state (only if specified as required in Credit Review)
    - Sends email notifications to:
        - Legal Reviewers for Legal Review
        - Assigned Credit Analyst for Credit Analysis
        - Relationship Manager for Credit Questionnaire (if required)
- **Note**: This transition marks the beginning of the detailed analysis phase with parallel workflows

### PP_TR_5: Business Sponsor Pending to Rejected

- **Action**: Business Sponsor rejects application
- **System Response**:
    - Moves parent process to terminal REJECTED state
    - Records rejection reason from Business Sponsor
    - Sends notification to Relationship Manager and Credit Analyst
- **Note**: Business sponsorship is required for all applications to proceed

### PP_TR_6: Analysis Pending to Compilation

- **Action**: System-triggered when all required analysis sub-processes complete
- **System Response**:
    - Verifies all required sub-processes are in SUBMITTED state:
        1. Legal Review must be in LEGAL_REVIEW_SUBMITTED state
        2. Credit Analysis must be in CREDIT_ANALYSIS_SUBMITTED state
        3. If Credit Questionnaire was required, it must be in CREDIT_QUESTIONNAIRE_SUBMITTED state
    - Creates a Credit Compilation sub-process in CREDIT_COMPILATION_DRAFT state
    - Sends notification to assigned Credit Analyst
- **Note**: This is an automated transition that only occurs when all required parallel processes are complete

### PP_TR_7: Compilation to Approval Pending

- **Action**: Credit Analyst submits compiled credit paper
- **System Response**:
    - Creates a Credit Approval sub-process in CREDIT_APPROVAL_DRAFT state
    - Routes to appropriate approver based on DA level specified in Credit Review:
        - For DA3-DA8: Routes to individual Credit Approver
        - For DA1-DA2: Routes to Committee Approver
    - Sends notification to appropriate approver
- **Note**: Different approval paths based on the DA level determined during Credit Review

### PP_TR_8: Approval Pending to Approved

- **Action**: Approver submits approval decision
- **System Response**:
    - Moves parent process to terminal APPROVED state
    - Creates approved limits based on the limit requests
    - Records approval details including approver, timestamp, and any comments
    - Sends notifications to all stakeholders (Relationship Manager, Credit Analyst, Business Sponsor)
- **Note**: For DA1-DA2 level approvals, the Committee Approver records the committee decision and uploads committee minutes

### PP_TR_9: Approval Pending to Rejected

- **Action**: Approver rejects application
- **System Response**:
    - Moves parent process to terminal REJECTED state
    - Records rejection reason
    - Sends notifications to all stakeholders
- **Note**: Final rejection at the approval stage

## Credit Request Sub-Process Transitions

### CR_TR_1: Draft to Draft (Save as Draft)

- **Action**: Relationship Manager saves form as draft
- **System Response**:
    - Saves current form data without making it visible to others
    - Maintains DRAFT state
- **Note**: Changes saved as draft are only visible to the current user

### CR_TR_2: Draft to In Progress (Update Credit Paper)

- **Action**: Relationship Manager updates credit paper
- **System Response**:
    - Saves current form data and makes it visible to authorized users
    - Moves to IN_PROGRESS state
- **Note**: This makes the current version of the form visible to all users with appropriate permissions

### CR_TR_3: In Progress to Draft (Save as Draft)

- **Action**: Relationship Manager saves form as draft
- **System Response**:
    - Saves current form data as a draft, not visible to others
    - Moves back to DRAFT state
- **Note**: This allows users to make private changes without affecting the visible version

### CR_TR_4: In Progress to In Progress (Update Credit Paper)

- **Action**: Relationship Manager updates credit paper again
- **System Response**:
    - Updates the visible version of the form data
    - Maintains IN_PROGRESS state
- **Note**: Each update creates a new visible version of the form

### CR_TR_5: In Progress to Submitted (Submit for Credit Review)

- **Action**: Relationship Manager submits for Credit Review
- **System Response**:
    - Validates all required fields are completed
    - Locks the form from further edits
    - Moves to SUBMITTED state
    - Triggers parent process transition PP_TR_1
- **Note**: This finalizes the Credit Request form and initiates the Credit Review process

## Credit Review Sub-Process Transitions

### CRV_TR_1 to CRV_TR_4

- Same pattern as Credit Request: Draft ↔ In Progress with Save as Draft and Update Credit Paper actions

### CRV_TR_5: In Progress to Submitted (Submit for Business Sponsorship)

- **Action**: Credit Analyst submits for Business Sponsorship
- **System Response**:
    - Validates all required fields including DA level and questionnaire requirement
    - Locks the form from further edits
    - Moves to SUBMITTED state
    - Triggers parent process transition PP_TR_2
- **Note**: Critical fields set here include DA level and whether a questionnaire is required

### CRV_TR_6: In Progress to Rejected (Reject Application)

- **Action**: Credit Analyst rejects application
- **System Response**:
    - Requires rejection reason
    - Moves to REJECTED state
    - Triggers parent process transition PP_TR_3
- **Note**: Early rejection option to avoid unnecessary work on applications that don't meet criteria

## Business Sponsorship Sub-Process Transitions

### BS_TR_1 to BS_TR_4

- Same pattern as previous sub-processes: Draft ↔ In Progress with Save as Draft and Update Credit Paper actions

### BS_TR_5: In Progress to Submitted (Submit for Analysis)

- **Action**: Business Sponsor approves and submits
- **System Response**:
    - Requires approval flag to be set (is_approved = true)
    - May include comments and second sponsor information
    - Locks the form from further edits
    - Moves to SUBMITTED state
    - Triggers parent process transition PP_TR_4
- **Note**: Business sponsorship is required for the application to proceed

### BS_TR_6: In Progress to Rejected (Reject Application)

- **Action**: Business Sponsor rejects application
- **System Response**:
    - Requires rejection comments
    - Moves to REJECTED state
    - Triggers parent process transition PP_TR_5
- **Note**: Business Sponsor can reject applications that don't have sufficient business rationale

## Credit Questionnaire, Legal Review, and Credit Analysis Sub-Process Transitions

### CQ_TR_1 to CQ_TR_4, LR_TR_1 to LR_TR_4, CA_TR_1 to CA_TR_4

- Same pattern as previous sub-processes: Draft ↔ In Progress with Save as Draft and Update Credit Paper actions

### CQ_TR_5, LR_TR_5, CA_TR_5: In Progress to Submitted (Submit for Review)

- **Action**: Respective user submits their completed form
- **System Response**:
    - Validates all required fields for the specific form
    - Locks the form from further edits
    - Moves to SUBMITTED state
    - System checks if all required analysis sub-processes are complete
    - If all required sub-processes are complete, triggers parent process transition PP_TR_6
- **Note**: These sub-processes operate in parallel during the Analysis phase

### Analysis Completion Check (System-Triggered)

- **Action**: System check when any analysis sub-process is submitted
- **System Response**:
    - Checks if Legal Review is in LEGAL_REVIEW_SUBMITTED state
    - Checks if Credit Analysis is in CREDIT_ANALYSIS_SUBMITTED state
    - If Credit Questionnaire was required (as specified in Credit Review):
        - Checks if Credit Questionnaire is in CREDIT_QUESTIONNAIRE_SUBMITTED state
    - If all required sub-processes are complete, triggers parent process transition PP_TR_6
- **Note**: This is a crucial synchronization point for the parallel processes

## Credit Compilation Sub-Process Transitions

### CC_TR_1 to CC_TR_4

- Same pattern as previous sub-processes: Draft ↔ In Progress with Save as Draft and Update Credit Paper actions

### CC_TR_5: In Progress to Submitted (Submit for Approval)

- **Action**: Credit Analyst submits compiled credit paper for approval
- **System Response**:
    - Validates all required compilation information is complete
    - Locks the form from further edits
    - Moves to SUBMITTED state
    - Triggers parent process transition PP_TR_7
- **Note**: This compiles all the information from previous phases into a final credit paper for approval

## Credit Approval Sub-Process Transitions

### CA_TR_1 to CA_TR_4

- Same pattern as previous sub-processes: Draft ↔ In Progress with Save as Draft and Update Credit Paper actions

### CA_TR_5: In Progress to Submitted (Submit Approval)

- **Action**: Approver submits approval
- **System Response**:
    - Requires approval flag to be set (is_approved = true)
    - For Committee Approval (DA1-DA2), requires committee minutes
    - Locks the form from further edits
    - Moves to SUBMITTED state
    - Triggers parent process transition PP_TR_8 (to APPROVED)
- **Note**: For committee approvals, the Committee Approver acts as a facilitator recording the committee's decision

### CA_TR_6: In Progress to Submitted (Submit Rejection)

- **Action**: Approver submits rejection
- **System Response**:
    - Requires approval flag to be false (is_approved = false)
    - Requires rejection comments
    - Locks the form from further edits
    - Moves to SUBMITTED state
    - Triggers parent process transition PP_TR_9 (to REJECTED)
- **Note**: Both approvals and rejections move to SUBMITTED state, but trigger different parent transitions

## Additional System Notes

### Document Management Integration

- Documents can be uploaded at any stage of the process
- Document visibility follows permission rules based on user roles
- All uploaded documents are attached to the Credit Paper and remain accessible through the process

### Form Visibility Rules

- Draft form versions are only visible to the user who created them
- In Progress form versions are visible to all users with appropriate permissions
- Submitted form versions are visible to all users with appropriate permissions and are considered final
- Users can only edit forms in Draft or In Progress states, not Submitted states

### Email Notifications

- Automatic notifications are sent at each major state transition
- Notifications include links to access the relevant forms
- Additional ad-hoc notifications can be sent by users to request information

### Audit Trail

- All transitions are logged with:
    - User who performed the action
    - Timestamp
    - From and to states
    - Any comments provided
    - System context information
- Complete audit trails can be viewed by users with appropriate permissions

### Exceptional Workflows

- If additional information is needed at any point, the current user can request it via the system
- Urgent applications can be flagged for priority handling
- Applications can be cloned to create new applications based on existing ones