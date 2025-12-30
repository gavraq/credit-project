# Credit Risk Workflow Tool - Project Requirements Document

## 1. Executive Summary

This document outlines the requirements for developing a workflow management tool to streamline the credit limit approval process. The system will track credit limit requests from initiation through various approval stages, improving visibility and efficiency while reducing processing time. The initial version will focus on core workflow management, with future versions planned to integrate with existing systems.

## 2. Project Overview

### 2.1 Background

The current credit limit approval process relies heavily on email communication and manually created documents stored in shared drives. This approach lacks visibility into where requests are in the process, who is responsible at each stage, and how long each step takes. These inefficiencies cause delays and challenges in prioritization.

### 2.2 Business Objectives

- Streamline the credit limit approval workflow process
- Provide transparency into the status of credit limit requests
- Reduce processing time for credit approvals
- Improve coordination between departments (Credit Risk, Front Office, Legal, Operations)
- Create a centralized repository for all documentation related to credit limit requests
- Generate meaningful metrics to identify bottlenecks and improvement opportunities
- Eventually reduce manual data entry by integrating with other systems
- In later phases it would be beneficial to integrate AI to enhance data preparation tasks

### 2.3 Project Scope

#### Version 1 (Initial Release)
- Implementation of core workflow tracking functionality
- Digital forms for request submissions and approvals
- Dashboard for status tracking and reporting
- Document storage and retrieval
- Priority management for multiple requests

#### Future Versions
- Integration with other systems providing information such as Adaptiv, CRS, Spreadpac, and Fitch
- Advanced analytics and reporting
- Automated document generation
- AI-assisted data entry and analysis
- Notification system for pending actions

### 2.4 Project Timeline

- Development: 2 months
- No specific deadline, but timely delivery is preferred to address current inefficiencies

### 2.5 Project Constraints

- Limited budget (preference for open-source solutions)
- Expected volume: 2-3 requests per week

## 3. User Roles and Stakeholders

### 3.1 Primary Stakeholders

- **Credit Risk**: Responsible for analyzing credit limit requests, determining appropriate authority levels, routing approvals
- **Front Office**: Originates credit limit requests, provides additional information as needed
- **Legal Department**: Reviews and comments on legal documentation related to credit limit requests

#### 3.2 User Roles

- **Credit Analyst**: Reviews requests, performs analysis, creates credit papers
- **Relationship Manager**: Submits initial limit requests, completes questionnaires
- **Legal Reviewer**: Provides legal documentation analysis
- **Credit Approver**: Reviews and approves credit limits (DA3-DA8) - A Credit Approver is a combination of a Credit Analyst and the DA approval level for that Credit Analyst
- **Committee Approver**: Participates in approval for higher-risk requests (DA1-DA2)
- **Business Sponsor**: Senior stakeholder (e.g., desk head) who supports the credit limit request
- **System Administrator**: Manages system settings, workflows, and user access

## 4. Functional Requirements

### 4.1 Workflow Management

The system must support the complete credit limit approval workflow as outlined below:

![[credit_workflow 1.png]]

Each stage in the workflow represents a discrete step in the credit limit approval process, with rejection paths available at multiple points.

It is useful to distinguish between the overall Credit Paper which is the "parent process" that end up in an approval or rejection and then sub-processes for each of the individual forms that have their own workflows that make up different parts of the overall Credit Paper, specifically:
- Credit Request
- Credit Review
- Business Sponsorship
- Credit Questionnaire
- Legal Review
- Credit Analysis
- Credit Paper Compilation
- Credit Approval

#### 4.1.1 Phase 1: Credit Request
The Relationship Manager initiates a Credit Request.  This will create:
CREDIT_PAPER_CREDIT_REQUEST - parent process state
CREDIT_REQUEST_DRAFT - Credit Request sub-process state

Relationship manager can edit this Credit Request during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Credit Request form in CREDIT_REQUEST_IN_PROGRESS state.  This version of the Credit Request form is used to update the Credit Paper detailed form when viewed. The Relationship Manager can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper to the In Progress state as many time as they wish.

Once completed, the Relationship Manager will submit the Credit Request form for Credit Review ("Submit for Credit Review").

At this point, the Credit Request sub-process moves to:
CREDIT_REQUEST_SUBMITTED state.
The Credit Paper parent process moves to:
CREDIT_PAPER_CREDIT_REVIEW_PENDING state.

The form for a Relationship Manager from the Front Office to submit new credit limit application request is  structured as a formal "Credit Request" that includes:
  - Header information:
    - Request number (system generated number)
    - Request Title
    - Counterparty Name
    - Counterparty CIF number (internal counterparty identifier)
    - Guarantor information (if applicable)
    - Guarantor CIF number (guarantor counterparty identifier)
    - Date form started
    - Date form completed (updates only once submitted for Credit Review)
  - Existing and Proposed Limits table with columns for:
    - Limit Type (multiple types defined in Limit model including Trading: Pre-Settlement, Trading: Settlement,  Nostro: Primary, Loan: Primary, Metal Lease: Primary, Risk Transfer: Primary, Securities Financing: Pre-Settlement, Securities Financing: Gross Liquid, Securities Financing: Gross, TRS, IM Position, IM Waiver, VM Waiver)
    - Existing limits (US$ m) with sub-columns for Limit amount and Tenor (months)
    - Proposed limits (US$ m) with sub-columns for Limit amount and Tenor (months)
    - Total Risk-Weighted Limits (Primary + Pre-Settlement)
  - Relationship Revenue section:
    - Revenue from client in last 12 months
    - Projected Revenue in the next 12 months
    - Projected RoRWA/RoC percentage
  - Detailed Comments on Limits Required (free text field for business rationale)
  - Country Risk Limit availability confirmation (Y/N)
  - Relationship Comments section including:
    - Relationship comments: How the client was introduced
    - KYC approval status (Y/N)
    - Most senior contact at client
    - Date of last client visit
  - Legal Documentation section:
    - Legal Document type: e.g. ISDA/CSA details including thresholds
    - Confirmation of positive legal opinion (Y/N/TBC)
  - Financial Disclosure section:
    - Confirmation of receipt of audited financial statements (Y/N)
    - Confirmation on whether the client produces interim financial statements (Y/N)
  - Prioritisation section:
    - Urgency indicator (Low/Medium/High)
    - Required by date
    - Justification for high priority requests
    - Senior business head sponsor for high priority requests
  - Request Sponsorship section:
    - Account Executive Name
    - Relationship Manager Name (defaults to logged in user making new request)
    - Senior Business Sponsor Name
    - Optional second Senior Business Sponsor Name
  - Document uploads section - ability to upload documents with document name

At this stage, the Credit Paper can be viewed and will include a completed Credit Request form and all other sub-sections (for each sub-process will be shown as "not started").
#### 4.1.2 Phase 2: Credit Review
The Credit Analyst is responsible for progressing the application in this phase. In this phase the Credit Paper parent process is in the following state:
CREDIT_PAPER_CREDIT_REVIEW_PENDING
The Credit Paper can be viewed by a Credit Analyst the edit button will be available on the Credit Review section of the Credit Paper.  Once the Credit Analyst clicks on this edit button for the first time, the Credit Review sub-process is initiated and this will create:
CREDIT_REVIEW_DRAFT - Credit Review sub-process state.

The Credit Analyst can edit this Credit Review form, during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Credit Review form in CREDIT_REVIEW_IN_PROGRESS state.  This version of the Credit Review form is used to update the Credit Paper detailed form when viewed. The Credit Analyst can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper to the In Progress state as many time as they wish.

Once completed, the Credit Analyst will submit the Credit Review form for Business Sponsorship ("Submit for Business Sponsorship") or Reject the application.

At this point, the Credit Review sub-process moves to:
CREDIT_REVIEW_SUBMITTED state.
The Credit Paper parent process moves to:
CREDIT_PAPER_BUSINESS_SPONSOR_PENDING

The form for a Credit Analyst from the Credit Risk department to perform a Credit Review is  structured as a formal "Credit Review" form that includes:
  - Credit Reviewer (defaults to logged in Credit Analyst - refers to Credit Analyst responsible for completion of this Credit Review form) 
  - Assigned Credit Analysts (refers to Credit Analyst who will be responsible for completion of the Credit Analysis form see below)
  - Delegated Authority (DA) level (1-8) - authority level required for approval
  - Assess need for additional Credit Questionnaire to be completed by Front Office Relationship Manager (Y/N)
  - Request additional information from Front Office
  - Log rejections with reasons
   - Date form started
   - Date form completed (updates only once submitted for Business Sponsorship)

#### 4.1.3 Phase 3: Business Sponsorship

The Business Sponsor is responsible for progressing the application in this phase. In this phase the Credit Paper parent process is in the following state:
CREDIT_PAPER_BUSINESS_SPONSOR_PENDING
The Credit Paper can be viewed by a Business Sponsor and the edit button will be available on the Business Sponsorship section of the Credit Paper.  Once the Business Sponsor clicks on this edit button for the first time, the Business Sponsorship sub-process is initiated and this will create:
BUSINESS_SPONSOR_DRAFT - Business Sponsorship sub-process state.

The Business Sponsor can edit this Business Sponsorship form during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Business Sponsorship form in BUSINESS_SPONSOR_IN_PROGRESS state.  This version of the Business Sponsorship form is used to update the Credit Paper detailed form when viewed. The Business Sponsor can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper to the In Progress state as many time as they wish.

Once completed, the Business Sponsor will submit the Business Sponsorship form for detailed analysis ("Submit for Analysis") or Reject the application.

At this point, the Business Sponsorship sub-process moves to:
BUSINESS_SPONSOR_SUBMITTED state.
The Credit Paper parent process moves to:
CREDIT_PAPER_ANALYSIS_PENDING state.

The form for a Business Sponsor from the Front Office to provide their sponsorship is  structured as a formal "Business Sponsorship" form that includes:
- Senior Business Sponsor Name (defaults to nominated Business Sponsor specified on Credit Request form)
- Ability for Business Sponsor to provide approval or rejection
- Comments - further details on approval or rejection
- Optional Senior Business Sponsor Name
- Second Senior Business Sponsor Comments
- Ability for Optional Second Senior Business Sponsor to provide approval or rejection
- Comments - further details on approval or rejection
- Date form started
- Date form completed (updates only once submitted for Analysis or Rejected)
#### 4.1.4 Phase 4: Analysis

After Business Sponsorship approval has been obtained separate parallel workflows are initiated:
- Credit Questionnaire - this workflow is ONLY required if the additional Credit Questionnaire was required in the Credit Review phase
- Credit Analysis - detailed assessment of credit risks by Credit Analyst
- Legal Analysis - detailed assessment of legal agreements by Legal Reviewer

Each of these assessments, combined with the Credit Request, Credit Review and Business Sponsorship approval together make up the final Credit Paper which gets put forward for final approval.

Whilst these are parallel processes it is important that the form part of a single Credit Paper (with distinct sections) and that while these parallel processes are being performed, any edits to the paper can be "saved as draft" and only updated for the specific reviewer to see these updates, or can be saved to  "Update Credit Paper" and are made available for viewing to other parties to the Credit Paper process.
##### 4.1.4.1 Front Office Credit Questionnaire
The Relationship Manager is responsible for completing the Credit Questionnaire if required.
During the Credit Review phase, one of the fields required to be completed is whether a Credit Questionnaire is required. If this is marked as "Yes", then the Credit Questionnaire sub-process will be initiated once the Credit Paper reaches Analysis phase.

The Credit Paper can be viewed by a Relationship Manager and the edit button will be available if the questionnaire required box is ticked on the credit paper.  Once the relationship manager clicks on this edit button for the first time, the Credit Questionnaire sub-process is initiated and this will create:
CREDIT_QUESTIONNAIRE_DRAFT - Credit questionnaire sub-process state.

The Relationship Manager can edit this Credit Questionnaire form during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Credit Questionnaire form in CREDIT_QUESTIONNAIRE_IN_PROGRESS state.  This version of the Credit Questionnaire form is used to update the Credit Paper detailed form when viewed. The Relationship Manager can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper to the In Progress state as many time as they wish.

Once completed, the Relationship Manager will submit the Credit Questionnaire form for review ("Submit for Review").

At this point, the Credit Questionnaire sub-process moves to:
CREDIT_QUESTIONNAIRE_SUBMITTED state.

The Credit Paper parent process can only moves to Credit Compilation phase if the other two parallel processes have been completed. if not, then the Credit Paper will continue to remain in CREDIT_PAPER_ANALYSIS_PENDING state.

The form for credit questionnaire completion (if required during Credit Review), includes structured sections for:
  - Counterparty Business Model (basic details, key suppliers/customers)
  - Trading activity and rationale for limits (metals/products traded, trading flow drivers, position size determinants)
  - Policies and governance (trading/hedge policy governance)
  - Hedge effectiveness and accounting (basis risk assessment, hedge accounting approaches)
  - Stress testing (market stress tests methodology, cash/liquid assets management)
  - Notional positions (requested MPL/PFE lines, proportion of total trading book)
  - Liquidity management (counterparty relationships, available cash and banking lines)
  - Physical positions (size of repo lines, metal financing lines, hedging basis)
- Account Executive Name (as specified on Credit Request form)
- Relationship Manager Name (defaults to logged in user completing questionnaire)
- Date form started
- Date form completed (updates only once submitted)
##### 4.1.4.2 Legal Analysis
The Legal Reviewer is responsible for completing the Legal Review.
The Legal Review sub-process will be initiated once the Credit Paper reaches Analysis phase.

The Credit Paper can be viewed by a Legal Reviewer and the edit button will be available.  Once the Legal Reviewer clicks on this edit button for the first time, the Legal Review sub-process is initiated and this will create:
LEGAL_REVIEW_DRAFT - Legal review sub-process state.

The Legal Reviewer can edit this Legal Review form during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Legal Review form in LEGAL_REVIEW_IN_PROGRESS state.  This version of the Legal Review form is used to update the Credit Paper detailed form when viewed. The Legal Reviewer can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper to the In Progress state as many time as they wish.

Once completed, the Legal Reviewer will submit the Legal Review form for review ("Submit for Review") 

At this point, Legal Review sub-process moves to:
LEGAL_REVIEW_SUBMITTED state.

The Credit Paper parent process can only move to Credit Compilation phase if the other two parallel processes have been completed. if not, then the Credit Paper will continue to remain in CREDIT_PAPER_ANALYSIS_PENDING state.

The form for Legal Reviewers to document detailed analysis of legal agreements, including:
  - Template selection based on agreement type (ISDA, GMRA, etc.)
  - ISDA Template fields:
	  - Governing Law
	  - Counterparty Additional events of default
	  - Grace period for failure to pay / deliver
	  - Material non-standard provisions
	  - Positive netting opinion (Y/N)
	  - Credit Support Annex (CSA) - Y/N
  - If CSA if "Y" then Credit Support Annex Template fields:
	  - One-way or two-way
	  - IOSCO compliant - Y/N
	  - CSA threshold
	  - CSA minimum transfer amount
	  - CSA independent amount
	  - Positive collateral opinion - Y/N
	  - Material non-standard provisions
  - Ability to document bespoke agreements (e.g., standalone offsetting deposit trades)
  - Structured sections to capture key credit terms with nested hierarchical formatting for:
    - Detailed termination rights (full unwind, partial unwind)
    - Acceleration clauses and events of default
    - Settlement provisions and payment flows
    - Set-off rights and limitations
    - Maturity dates and interest payment terms
  - Support for multiple currency pairs and transaction types within a single review
  - Free-text field for legal commentary on bankruptcy limitations, jurisdictional issues, and other legal risks
  - Ability to document specific dates and financial terms for each transaction
- Legal Reviewer Name (defaults to logged in user completing Legal Review)
- Date form started
- Date form completed (updates only once submitted)
- Document uploads section - ability to upload documents with document name

##### 4.1.4.3 Credit Analysis
The assigned Credit Analyst is responsible for completing the Credit Analysis. During the Credit Review phase a specific Credit Analyst would have been assigned to complete this form.
The Credit Analysis sub-process will be initiated once the Credit Paper reaches Analysis phase.

The Credit Paper can be viewed by a Credit Analyst and the edit button will be available.  Once the Credit Analyst clicks on this edit button for the first time, the Credit Analysis sub-process is initiated and this will create:
CREDIT_ANALYSIS_DRAFT - Credit analysis sub-process state.

The Credit Analyst can edit this Credit Analysis form during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Credit Analysis form in CREDIT_ANALYSIS_IN_PROGRESS state.  This version of the Credit Analysis form is used to update the Credit Paper detailed form when viewed. The Credit Analyst can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper to the In Progress state as many time as they wish.

Once completed, the Credit Analyst will submit the Credit Analysis form for review ("Submit for Review") at which point the Credit Analysis sub-process moves to CREDIT_ANALYSIS_SUBMITTED state.

The Credit Paper parent process can only move to Credit Compilation phase if the other two parallel processes have been completed. if not, then the Credit Paper will continue to remain in CREDIT_PAPER_ANALYSIS_PENDING state.

Once all 3 parallel processes have been submitted then the Credit Paper parent process can move to Credit Compilation phase. In practice the Credit Questionnaire and Legal Review would alway be completed prior to the Credit Analysis and hence a an implementation of the state transition would operate on the Credit Analysis sub-process to trigger the parent process to move to the next phase with the check that both the Legal Review and Credit Questionnaire sub processes were also in a submitted state.  The Credit Paper process would then progress to:
CREDIT_PAPER_COMPILATION state.

The Credit analysis form should have the ability to upload and manage comprehensive credit analysis documents that include:
### Annual Review template:
- Basic Details
	- Counterparty name
	- Counterparty CIF ID
	- Country of Risk
	- Shareholding Structure
	- Revenue prior 12M
	- Revenue projected next 12M
	- RORWA/ROC %
	- Business Activity
- Ratings information
		- Internal Rating in table form with columns for: Current Rating, S&P Equivalent, Previous Rating, Jurisdiction Rating, Sovereign Rating, Country Ceiling
		- ICBCS Rating Outlook in table form with columns for: Outlook, ESG-Rating Adjustment (Score)
		- External Rating in table form with columns for: S&P, Moody's, Fitch
		- GSIB/DSIB
	- Other information
		- Likelihood of state support (H/M/L)
		- Country Ranking by Assets
		- Regulator
		- Share Price (12M change)
		- Auditor
- Group Facilities:
	- table with columns for Current Limit, Current Exposure, Request Limit, Proposed Tenor
	- dynamic ability to add rows based on Limit types from the Limit model
- Legal Review Status - latest status based upon Legal Review sub-process including View button to enable viewing of Legal Review form
- Consolidated Financials & Ratios:
	- ability to create dynamic table with columns for multiple years/periods
	- ability to add multiple rows for each financial statement line item (e.g. Total Assets, Total Equity, Net Income etc)
- Credit Details:
	- Credit Strategy
	- Credit Limit Appetite Guideline (CLAG)
	- Credit Questionnaire required Y/N (inherited from Credit Review form including View button to enable viewing of Credit Questionnaire form)
	- Credit Analyst Name (defaults to assigned Credit Analyst)
	- Date form started
	- Date form completed (updates only once submitted)
### Section A: Executive Summary
- Purpose of Application
- Requested Limits and Transaction Summary (detailed table showing facilities, tenors, limits as per Credit Request form, but with additional columns showing:
	- increases/decreases in limits
	- Comments (for each limit)
- Business Comments - detailed transaction rationale and business case
- Counterparty and Ownership Information
- Financial Summary
### Section B: Risk Assessment
- Key Risks - detailed analysis on key risks
- Rating and Outlook
- Climate & Environmental Risk Framework assessment
- Forward-looking Macroeconomic scenarios
- Market Risk Sensitivities analysis
- Credit Recommendation
### Section C: Climate & Environmental Score Card

#### Counterparty Details
	- Date
	- Counterparty Name
	- Counterparty CIF ID
	- Sector
	- Industry Code (CRS)
	- Industry Name
	- Country of Risk
	- Credit Manager
	- Current Rating

#### Risk Factor Assessment

1. Net Zero and Emissions Strategy:

| Risk Factor                                                                | Score (0-5) | Examples and Scoring Guidance |
| -------------------------------------------------------------------------- | ----------- | ----------------------------- |
| Does the counterparty explicitly target net-zero by 2050?                  |             |                               |
| Does the counterparty publish a TCFD or equivalent report?                 |             |                               |
| Does the counterparty set science-based targets, including board approval? |             |                               |
| **Average Score:**                                                         |             |                               |

2. Public Disclosures & Commitments

This category aims to assess the intent of the client to transition by evaluating their level of public disclosures and commitments to reduce emission levels.

| Risk Factor                                                                                                                    | Score (0-5) | Examples and Scoring Guidance |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------- |
| Does the counterparty have material asset concentrations in vulnerable sectors?                                                |             |                               |
| Does the counterparty operate in a country with high FX/fiscal dependency on a vulnerable sector?                              |             |                               |
| Is the counterparty vulnerable to regulatory pressure to decarbonise its portfolio and can this be achieved?                   |             |                               |
| Does the counterparty have clear targets and actions to transition its portfolio or capital targets based on climate risk?     |             |                               |
| Could asset/sector/business lines become economically unviable/stranded?                                                       |             |                               |
| Is there increased risk of funding/shareholder divestment if regulators pressure carbon intensive sectors/institutions?        |             |                               |
| Is the counterparty's governance likely to be impacted by climate activities (including in boardroom) and associated activism? |             |                               |
| Does the counterparty stand to benefit from transition opportunities?                                                          |             |                               |
| **Average Score:**                                                                                                             |             |                               |

3. Transition Risk

 Aims to assess the gross transition risk if the company and/or geography has the transition mitigation plans capability. Reliance of fossil fuels or heavy polluting sectors are a key consideration, as well as the potential impact of policy shifts within a sector. Other considerations include the potential financial impact from implementation of policies such as carbon taxes and emissions regulations on a forward looking basis.

| Risk Factor                                                                                                                                             | Score (0-5) | Examples and Scoring Guidance |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------- |
| Does the counterparty have asset concentrations in or vulnerable to climate risks?                                                                      |             |                               |
| Does the counterparty’s sector and operations add to the probability/vulnerability to climate risk (e.g., scenario analysis or changing risk appetite)? |             |                               |
| Are the counterparty’s offices exposed to climate risk factors?                                                                                         |             |                               |
| **Average Score:**                                                                                                                                      |             |                               |
|                                                                                                                                                         |             |                               |
#### Combined Average Score

- Combined Average Score:

#### Concluding Remarks

- Add summary of findings and recommendations here. 

## Rating Adjustment

If positive = "+1", if neutral = "0", if negative = "-1" (e.g., if adjust from RG6 to RG7 = -1)
- Rating Adjustment:

### Section D: MLRO Sign Off

- MLRO or MLRO Delegate) Comments
- Decision (accept/reject/defer)
- Update Client Risk Rating - Y/N
- If Y Update Cleitn Risk Rating - H/M/L
- MLRO Name

### Section E: Documents Upload
  - Document uploads section - ability to upload documents with document name

#### 4.1.5 Phase 5: Credit Paper Compilation

The assigned Credit Analyst is responsible for completing the Credit Compilation phase. 
The Credit Compilation sub-process will be initiated once the Credit Paper parent process reaches Credit paper compilation phase.

The Credit Paper can be viewed by a Credit Analyst and the edit button will be available.  Once the Credit Analyst clicks on this edit button for the first time, the Credit Compilation sub-process is initiated and this will create:
CREDIT_COMPILATION_DRAFT - Credit compilation sub-process state.

The Credit Analyst can edit this Credit Compilation form during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Credit Compilation form in CREDIT_COMPILATION_IN_PROGRESS state.  This version of the Credit Compilation form is used to update the Credit Paper detailed form when viewed. The Credit Analyst can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper In Progress state as many time as they wish.

Once completed, the Credit Analyst will submit the Credit Compilation form for approval ("Submit for Approval") at which point the Credit Compilation sub-process moves to CREDIT_COMPILATION_SUBMITTED state.

The Credit Paper parent process then moves to:
CREDIT_PAPER_APPROVAL_PENDING state.

The form for a Credit Compilation includes:
- Credit Analyst Name (defaults to nominated Credit Analyst specified on Credit Review form)
- Comments - further details on overall review of Credit Paper
- Date form started
- Date form completed (updates only once submitted for Approval)

#### 4.1.6 Phase 6: Approval Process

This stage of the process is owned by the Approver (either a Credit Approver which is a Credit Analyst with specific DA approval level or a Credit Analyst that has been set up as the Committee Approver and will facilitate attaching the minutes of the committee approval), they are responsible for completing this phase.

The Credit Paper can be viewed by an approver and the edit button will be available.  Once the approver clicks on this edit button for the first time, the Credit Approval sub-process is initiated and this will create:
CREDIT_APPROVAL_DRAFT - Credit approval sub-process state.

The approver can edit this Credit Approval form during this phase as many time as they wish.  Each time they edit they can save their changes as Draft ("Save as Draft"), or they can Submit change to the Credit Paper ("Update Credit Paper"), creating a version of the Credit Approval form in CREDIT_APPROVAL_IN_PROGRESS state.  This version of the Credit Approval form is used to update the Credit Paper detailed form when viewed. The approver can continue to make edits in the Draft state and can continue to Submit changes to the Credit Paper In Progress state as many time as they wish.

Once completed, the approver will submit the Credit Approval form for approval or rejection ("Submit for Approval" or "Submit Rejection") at which point the Credit Approval sub-process moves to CREDIT_APPROVAL_SUBMITTED state.

The Credit Paper parent process then moves to its final state, either:
CREDIT_PAPER_APPROVED, or
CREDIT_PAPER_REJECTED

The Credit Approval form contains the following:
- Approval level:
  - Individual approval for DA3-DA8
  - Committee approval for DA1-DA2
- Ability to upload committee minutes for committee approvals
- Digital approval/rejection with comments for individual approvals

#### 4.1.7 Credit Paper Workflow
When a Credit Paper is viewed the top section of the Credit Paper should include a Workflow Status section with a visual representation of the full Credit Paper process, highlighting the specific stage the Credit Paper parent process has reached.
Within the Credit Paper, each individual form should include a status indicator shwoing the current status of the individual sub-process.

### 4.2 Dashboard and Reporting

#### 4.2.1 Request Tracking Dashboard
Top navigation bar which includes buttons for "Dashboard", My Requests, Prioritisation (see 4.2.3) and Metrics (see 4.2.2)
Dashboard:
- Summary "buttons" with Number of Credit Papers in each Parent Process state (including Approved and Rejected) as well as summary button for overdue Credit Requests (requests past Required by date)
- Filter section: Filterable by status, priority, counterparty, submitter.
- List of all Credit Papers with ordering by Priority & Rank:
	- Credit Request ID
	- Credit Request Title
	- Counterparty
	- Status indicators showing current workflow state (both parent process and sub-process)
	- Submitted by (Relationship Manager name)
	- Rank
	- Priority
	- Submitted date
	- Required by date
	- Action (with "view" button against each Credit Request)

My Requests:
a Filtered view of the Dashboard with only those Credit Requests applicable to the logged in user

#### 4.2.2 Performance Metrics Dashboard
- Summary "buttons" with Average Days spent for all Credit Papers in each Parent Process state for all completed Credit Requests including total average days across all states
- Ability to apply filtering with dynamic update of metrics for each process state with filtering by:
	- time period
	- Submitter
	- Counterparty
	- Priority
- Summary "buttons" with Average Days spent for all Credit Papers in each Sub-process state for all completed Credit Requests including total average days across all states
- Ability to apply filtering with dynamic update of metrics for each sub-process state with filtering by:
	- time period
	- sub-process state
	- Counterparty
	- Priority
- Volume of requests by type, counterparty, priority etc.

#### 4.2.3 Prioritisation Management Dashboard
- Ability for Front Office to provide a rank number against individual requests within each High, Medium & Low priority Credit Requests 
- Visual highlighting of high-priority requests
- Filters to view urgent requests approaching deadline

### 4.3 Document Management

#### 4.3.1 Storage
- Secure storage of all documents related to credit limit requests
- Version control for documents
- Searchable repository

### 4.5 User Management
- Role-based access control
- Dedicated log-in page
- Top navigation bar to show current logged in user with logout button
- User profile management from django admin screen
- Department/team affiliations
- Role-based access to documents
- Audit trail of document access and modifications

## 5. Non-Functional Requirements

### 5.1 Performance

- Response time: System should respond to user actions within 3 seconds
- Support for concurrent users: At least 50 users simultaneously
- Availability: 99% uptime during business hours

### 5.2 Security

- Secure authentication mechanisms
- Comprehensive audit logging

### 5.3 Usability

- Intuitive user interface requiring minimal training
- Clear status indicators and navigation
- Web-friendly design (with potential extension to mobile later)
- Consistent design language as outlined in the Credit Workflow Design Brief
- Support for complex nested hierarchical content entry and display
- Ability to handle multilevel lists and indentation for structured content

### 5.4 Scalability

- Ability to handle increased volume as adoption grows
- Extensible architecture to support future integrations
- Support for additional document types and workflows
- Ability to accommodate additional limit types and risk metrics as business requirements evolve
- Support for expanding the form structure with new fields without requiring major system changes

### 5.5 Maintainability

- Well-documented codebase
- Modular design allowing for component updates
- Configuration rather than code changes for workflow adjustments

## 6. Technical Requirements

### 6.1 Technology Recommendation

Based on the requirements and constraints, we recommend adopting **Django + Custom Workflow** for the Backend and React for the Frontend as the technology stack for this project. This approach provides the best balance of flexibility, cost-effectiveness, and suitability for the specific document-heavy workflow requirements.
### 6.1 Selected Technology Stack

- **Backend**: Python, Django, Django REST Framework
- **Frontend**: React, Material-UI
- **Database**: PostgreSQL
- **Package Management**: UV (instead of pip/virtualenv)
- **File Storage**: File System

For detailed architecture see separate document on [[Credit-Risk-workflow-architecture]].
### 6.2 Integration Requirements (Future)

- **Adaptiv**: Integration for existing credit limits and client information
- **CRS**: Integration for risk grades and ratings
- **Spreadpac**: Financial data integration
- **Fitch**: External financial information

### 6.3 Hosting and Deployment

- On-premises deployment within bank's infrastructure
- Compliance with bank's IT policies and standards

## Appendix A: Glossary

- **DA (Delegated Authority)**: Scale from 1-8 indicating approval level required (DA1-DA2 for committee approval, DA3-DA8 for individual approvers)
- **Credit Questionnaire**: Additional due diligence document completed by Front Office with detailed sections on counterparty business model, trading activity, risk management, and positions
- **KYC**: Know Your Customer, compliance process for client verification
- **CRS**: Credit Risk System, internal tool for risk ratings
- **Adaptiv**: System for managing credit limits and exposures against limits
- **ISDA**: International Swaps and Derivatives Association agreement, a standardised contract for derivatives transactions
- **CSA**: Credit Support Annex, an addition to the ISDA Master Agreement that addresses credit support (collateral) arrangements
- **GMRA**: Global Master Repurchase Agreement, a standard contract for repurchase transactions
- **MPL**: Maximum Position Limit
- **PFE**: Potential Future Exposure, a measure of counterparty risk for future time periods
- **ICARA**: Internal Capital Adequacy and Risk Assessment
- **NLR**: Net Liquidity Resources
- **RCF**: Revolving Credit Facility
- **RoRWA**: Return on Risk Weighted Assets, a profitability metric
- **ROC**: Return on Capital, a profitability metric
- **CIF**: Customer Information File or customer identification number
- **Offsetting Deposit Trades**: Transactions where deposits in different currencies offset each other for credit risk purposes
- **Events of Default**: Specific circumstances defined in legal agreements that trigger acceleration or termination rights
- **Full Unwind**: Complete termination of a transaction before its scheduled maturity
- **Partial Unwind**: Partial early termination of a transaction
- **Acceleration**: The right to demand immediate repayment under specified conditions
- **Trading (Pre-Settlement)**: Limit type covering market risk before settlement
- **Trading (Settlement)**: Limit type covering settlement risk
- **Nostro (Primary)**: Limit for nostro account exposures
- **Metal Lease**: Limit for metal leasing transactions
- **TRS**: Total Return Swap
- **IM**: Initial Margin
- **VM**: Variation Margin
- **SBLC**: Standby Letter of Credit
- **RWA**: Risk-Weighted Assets
- **NPL**: Non-Performing Loans
- **MLRO**: Money Laundering Reporting Officer, responsible for financial crime risk assessment
- **SLA**: Service Level Agreement
- **Climate & Environmental Scoring Card**: Assessment tool used to evaluate climate-related risks
- **SBSA**: Standard Bank South Africa, partner institution providing credit reviews
- **IOSCO**: International Organization of Securities Commissions
- **VAR**: Value at Risk, a measure of potential losses
- **RWR**: Right-Way Risk, where exposure decreases when counterparty credit quality deteriorates
- **HWWR**: High-Wrong-Way Risk, where exposure increases when counterparty credit quality deteriorates

