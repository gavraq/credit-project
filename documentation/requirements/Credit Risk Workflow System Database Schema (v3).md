# Credit Risk Workflow System Database Schema

## 1. Entity-Relationship Overview

The database schema supports a credit risk workflow system with a flexible workflow engine, comprehensive document management, and role-based permissions. The architecture follows Django's app-based approach with clear separation of concerns.

## 2. Django App Structure

| App | Purpose |
|-----|---------|
| `backend.users` | User management, roles, departments, permissions |
| `workflow_engine` | Workflow definitions, states, transitions, instances |
| `credit_applications` | Credit applications, forms, counterparties, documents |
| `documents` | Document type definitions (legacy, mostly in credit_applications) |

## 3. Key Relationships

### User and Role Management

- **User to Department**: Each user belongs to one department (ForeignKey)
- **User to Role**: Each user has one role that determines their permissions (ForeignKey)
- **User da_level**: Credit Analysts can have delegated authority levels (DA1-DA8)

### Workflow Management

- **Workflow to State**: Each workflow contains multiple possible states
- **State to Transition**: States are connected by transitions (from_state, to_state)
- **WorkflowInstance to CreditApplication**: Links workflow state to applications via generic relations
- **StateLog to WorkflowInstance**: Each state change is logged for audit purposes

### Credit Application and Forms

- **Counterparty to CreditApplication**: A counterparty can have multiple credit applications
- **CreditApplication to Form Models**: OneToOne relationships to each form type
- **Form to WorkflowInstance**: Each form has its own sub-workflow instance
- **CreditApplication to LimitRequest**: An application can include multiple limit requests

## 4. Detailed Entity Descriptions

### User Management Entities (`backend.users`)

#### Department

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| name | CharField(100) | Unique |
| description | TextField | Optional |

#### Role

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| name | CharField(100) | Unique |
| description | TextField | Optional |
| can_view_all_applications | BooleanField | Default: False |
| can_view_department_applications | BooleanField | Default: False |
| can_approve_applications | BooleanField | Default: False |
| can_reject_applications | BooleanField | Default: False |
| can_view_reports | BooleanField | Default: False |
| can_export_data | BooleanField | Default: False |
| visible_fields | JSONField | Field visibility by form |
| available_dropdown_options | JSONField | Dropdown options by form |

#### Permission

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| name | CharField(100) | |
| description | TextField | Optional |
| resource_type | CharField(100) | e.g., "CreditApplication" |
| action | CharField(50) | e.g., "create", "view", "approve" |

#### User (extends AbstractUser)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| username | CharField | Inherited from AbstractUser |
| email | EmailField | Inherited from AbstractUser |
| first_name | CharField | Inherited from AbstractUser |
| last_name | CharField | Inherited from AbstractUser |
| department | ForeignKey(Department) | Nullable |
| role | ForeignKey(Role) | Nullable |
| employee_id | CharField(50) | Unique |
| phone_number | CharField(30) | Optional |
| da_level | CharField(4) | Choices: DA1-DA8, for Credit Approvers |

### Workflow Engine Entities (`workflow_engine`)

#### Workflow

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| code | CharField(100) | Unique, e.g., "CREDIT_PAPER", "CREDIT_REQUEST" |
| name | CharField(255) | |
| description | TextField | Optional |
| metadata | JSONField | Contains form_metadata for parent workflow |

#### State

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| workflow | ForeignKey(Workflow) | |
| code | CharField(100) | Unique per workflow |
| name | CharField(255) | |
| description | TextField | Optional |
| is_initial | BooleanField | Default: False |
| is_terminal | BooleanField | Default: False |
| metadata | JSONField | Contains relevant_sub_processes list |

#### Transition

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| workflow | ForeignKey(Workflow) | |
| code | CharField(100) | Unique per workflow, e.g., "CR_TR_1" |
| name | CharField(255) | |
| description | TextField | Optional |
| from_state | ForeignKey(State) | related_name='transitions_from' |
| to_state | ForeignKey(State) | related_name='transitions_to' |
| allowed_roles | JSONField | List of role codes, e.g., ["relationship_manager"] |
| conditions | JSONField | Validation conditions |
| system_action | CharField(100) | Action identifier, e.g., "submit_credit_request" |
| metadata | JSONField | UI behavior, parent workflow triggers |

#### WorkflowInstance

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| workflow | ForeignKey(Workflow) | |
| current_state | ForeignKey(State) | |
| content_type | ForeignKey(ContentType) | For generic relation |
| object_id | UUIDField | |
| content_object | GenericForeignKey | Points to CreditApplication or Form |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

#### StateLog

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| workflow_instance | ForeignKey(WorkflowInstance) | |
| transition | ForeignKey(Transition) | Nullable |
| from_state | ForeignKey(State) | |
| to_state | ForeignKey(State) | |
| performed_by | ForeignKey(User) | Nullable |
| performed_at | DateTimeField | |
| comments | TextField | Optional |
| metadata | JSONField | Additional context |

### Core Business Entities (`credit_applications`)

#### Counterparty

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| name | CharField(255) | |
| cif_number | CharField(100) | Unique (Customer Identification File) |
| legal_entity_identifier | CharField(100) | Optional |
| registration_number | CharField(100) | Optional |
| tax_id | CharField(100) | Optional |
| entity_type | CharField(100) | Optional |
| country_of_incorporation | CharField(100) | Optional |
| industry_sector | CharField(100) | Optional |
| industry_subsector | CharField(100) | Optional |
| business_description | TextField | Optional |
| relationship_since | DateField | Nullable |
| relationship_manager_id | UUIDField | Nullable |
| annual_revenue | DecimalField(20,2) | Nullable |
| credit_rating | CharField(100) | Optional |
| kyc_status | CharField(50) | Optional |
| senior_contact | CharField(255) | Optional |
| last_visit_date | DateField | Nullable |
| adaptiv_id | CharField(100) | External system ID |
| crs_id | CharField(100) | External system ID |
| spreadpac_id | CharField(100) | External system ID |
| fitch_id | CharField(100) | External system ID |
| last_sync_date | DateTimeField | Nullable |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

#### LimitType

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| name | CharField(100) | Unique |
| code | SlugField(50) | Unique |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

#### LimitRequest

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| credit_application | ForeignKey(CreditApplication) | related_name='limit_requests' |
| limit_type | ForeignKey(LimitType) | Nullable |
| existing_amount | DecimalField(20,2) | Nullable (USD millions) |
| existing_tenor | IntegerField | Nullable (months) |
| proposed_amount | DecimalField(20,2) | Nullable (USD millions) |
| proposed_tenor | IntegerField | Nullable (months) |
| comments | TextField | Optional |

#### DocumentType

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| name | CharField(100) | Unique |
| allowed_extensions | CharField(100) | Comma-separated list |
| max_size_mb | PositiveIntegerField | Default: 10 |

#### Document

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| document_type | ForeignKey(DocumentType) | |
| file | FileField | upload_to='documents/' |
| uploaded_at | DateTimeField | Auto |
| uploaded_by | CharField(255) | |
| content_type | ForeignKey(ContentType) | For generic relation |
| object_id | UUIDField | |
| content_object | GenericForeignKey | Points to CreditApplication |

#### CreditApplication

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| reference_number | CharField(100) | Optional |
| title | CharField(255) | |
| counterparty | ForeignKey(Counterparty) | related_name='applications' |
| description | TextField | Optional |
| priority | CharField(20) | Choices: Low, Medium, High |
| required_by_date | DateField | Nullable |
| amount | DecimalField(20,2) | Nullable |
| applicant_name | CharField(255) | Optional |
| applicant_email | EmailField | Optional |
| applicant_phone | CharField(50) | Optional |
| created_by | ForeignKey(User) | related_name='created_credit_applications' |
| assigned_to | ForeignKey(User) | Nullable, related_name='assigned_credit_applications' |
| relationship_manager | ForeignKey(User) | Nullable |
| purpose | TextField | Optional |
| decision_rationale | TextField | Optional |
| conditions | TextField | Optional |
| rank | IntegerField | Nullable (prioritization) |
| risk_score | DecimalField(10,4) | Nullable |
| risk_assessment_date | DateTimeField | Nullable |
| risk_assessment_reference | CharField(100) | Optional |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |
| submitted_at | DateTimeField | Nullable |
| expiry_date | DateField | Nullable |
| workflow_instance | ForeignKey(WorkflowInstance) | Nullable |

### Form Models (`credit_applications`)

All form models share common fields:
- `id`: UUID Primary Key
- `credit_application`: OneToOneField to CreditApplication
- `workflow_instance`: ForeignKey to WorkflowInstance (nullable)
- `created_at`, `updated_at`: DateTimeField (auto)
- `form_started_at`, `form_completed_at`, `form_last_saved_at`: DateTimeField (nullable)

#### CreditRequestForm

| Field | Type | Notes |
|-------|------|-------|
| counterparty_cif | CharField(50) | Nullable |
| counterparty_name | CharField(255) | Denormalized |
| guarantor_name | CharField(255) | Nullable |
| guarantor_cif | CharField(50) | Nullable |
| revenue_last_12m | DecimalField(15,2) | Nullable |
| revenue_projected_12m | DecimalField(15,2) | Nullable |
| projected_rorwa_percent | DecimalField(6,2) | Nullable |
| country_risk_limit_available | BooleanField | Default: False |
| kyc_approval_status | BooleanField | Default: False |
| relationship_comments | TextField | Nullable |
| relationship_manager_name | CharField(255) | Denormalized |
| most_senior_contact | CharField(255) | Nullable |
| last_client_visit_date | DateField | Nullable |
| legal_documentation | TextField | Nullable |
| positive_legal_opinion | BooleanField | Default: False |
| financial_statements_received | BooleanField | Default: False |
| interim_statements_available | BooleanField | Default: False |
| detailed_limit_comments | TextField | Nullable |
| account_executive | CharField(255) | Nullable |
| senior_business_sponsor_name | CharField(255) | Denormalized |
| senior_business_sponsor_id | ForeignKey(User) | Nullable |
| second_business_sponsor_name | CharField(255) | Denormalized |
| second_business_sponsor_id | ForeignKey(User) | Nullable |
| high_priority_justification | TextField | Nullable |

#### CreditReviewForm

| Field | Type | Notes |
|-------|------|-------|
| credit_reviewer | ForeignKey(User) | Nullable |
| assigned_credit_analyst | ForeignKey(User) | Nullable |
| delegated_authority_level | CharField(10) | Choices: DA1-DA8 |
| questionnaire_required | BooleanField | Default: False |
| additional_information_request | TextField | Nullable |
| rejection_reason | TextField | Nullable |

#### BusinessSponsorshipForm

| Field | Type | Notes |
|-------|------|-------|
| senior_business_sponsor | ForeignKey(User) | Nullable, copied from CreditRequestForm |
| senior_business_sponsor_name | CharField(255) | Denormalized |
| senior_sponsor_approval | CharField(10) | Choices: approved, rejected |
| senior_sponsor_comments | TextField | Nullable |
| second_business_sponsor | ForeignKey(User) | Nullable, copied from CreditRequestForm |
| second_business_sponsor_name | CharField(255) | Denormalized |
| second_sponsor_approval | CharField(10) | Choices: approved, rejected |
| second_sponsor_comments | TextField | Nullable |

#### LegalReviewForm

| Field | Type | Notes |
|-------|------|-------|
| legal_reviewer | ForeignKey(User) | Nullable |
| agreement_template | CharField(100) | Optional |
| governing_law | CharField(100) | Nullable |
| counterparty_events_of_default | TextField | Nullable |
| grace_period | TextField | Nullable |
| non_standard_provisions | TextField | Nullable |
| positive_netting_opinion | BooleanField | Nullable |
| has_csa | BooleanField | Nullable |
| csa_type | CharField(100) | Nullable |
| iosco_compliant | BooleanField | Nullable |
| csa_threshold | DecimalField(20,2) | Nullable |
| csa_minimum_transfer | DecimalField(20,2) | Nullable |
| csa_independent_amount | DecimalField(20,2) | Nullable |
| positive_collateral_opinion | BooleanField | Nullable |

#### CreditQuestionnaireForm

| Field | Type | Notes |
|-------|------|-------|
| completed_by | ForeignKey(User) | Nullable |
| section1_* through section10_* | Various | Multiple section fields for questionnaire responses |

#### CreditAnalysisForm

| Field | Type | Notes |
|-------|------|-------|
| credit_analyst | ForeignKey(User) | Nullable |
| counterparty_details | TextField | Nullable |
| internal_rating | TextField | Nullable |
| external_rating | TextField | Nullable |
| group_facilities | TextField | Nullable |
| consolidated_financials | TextField | Nullable |
| credit_strategy | TextField | Nullable |
| credit_appetite_guideline | TextField | Nullable |
| executive_summary | TextField | Nullable |
| risk_assessment | TextField | Nullable |
| climate_score | DecimalField(5,2) | Nullable |
| climate_comments | TextField | Nullable |
| rating_adjustment | TextField | Nullable |
| mlro_decision | CharField(20) | Choices: accept, reject, defer |
| mlro_comments | TextField | Nullable |
| updated_client_risk_rating | CharField(10) | Choices: H, M, L |

#### CreditCompilationForm

| Field | Type | Notes |
|-------|------|-------|
| compiled_by | ForeignKey(User) | Nullable |
| compilation_summary | TextField | Nullable |
| all_forms_reviewed | BooleanField | Default: False |
| ready_for_approval | BooleanField | Default: False |
| compilation_notes | TextField | Nullable |

#### CreditApprovalForm

| Field | Type | Notes |
|-------|------|-------|
| approved_by | ForeignKey(User) | Nullable |
| approval_decision | CharField(20) | Choices: approved, rejected, deferred |
| approval_comments | TextField | Nullable |
| approval_conditions | TextField | Nullable |
| committee_reference | CharField(100) | Nullable (for DA1-DA2) |

## 5. Workflow Metadata Structure

### Parent Workflow Metadata (CREDIT_PAPER)

```json
{
  "form_metadata": {
    "credit_request_form": {
      "title": "Credit Request Form",
      "form_key": "credit_request_form",
      "model_name": "CreditRequestForm",
      "workflow_code": "CREDIT_REQUEST",
      "field_mappings": {
        "boolean_fields": ["country_risk_limit_available", "kyc_approval_status", ...]
      }
    },
    "credit_review_form": { ... },
    "business_sponsorship_form": { ... },
    "legal_review_form": { ... },
    "credit_questionnaire_form": { ... },
    "credit_analysis_form": { ... },
    "credit_compilation_form": { ... },
    "credit_approval_form": { ... }
  }
}
```

### State Metadata

```json
{
  "relevant_sub_processes": ["credit_request_form", "credit_review_form", ...]
}
```

### Transition Metadata

```json
{
  "ui_behavior": {
    "navigate_on_success": "/"
  },
  "parent_workflow": {
    "transition_code": "PP_TR_1",
    "from_state": "CREDIT_PAPER_CREDIT_REQUEST"
  }
}
```

## 6. Database Indexes

### CreditApplication

```python
class Meta:
    ordering = ['-created_at']
    indexes = [
        models.Index(fields=['created_by']),
        models.Index(fields=['assigned_to']),
        models.Index(fields=['created_at']),
        models.Index(fields=['counterparty']),
        models.Index(fields=['priority', 'rank']),
        models.Index(fields=['required_by_date']),
    ]
```

### WorkflowInstance

```python
class Meta:
    indexes = [
        models.Index(fields=['content_type', 'object_id']),
        models.Index(fields=['current_state']),
        models.Index(fields=['workflow']),
    ]
```

### StateLog

```python
class Meta:
    ordering = ['-performed_at']
    indexes = [
        models.Index(fields=['workflow_instance']),
        models.Index(fields=['performed_by']),
        models.Index(fields=['performed_at']),
    ]
```

## 7. Implementation Notes

### Auto-Initialization

Forms are automatically initialized when the parent workflow reaches the relevant state:
- Credit Request Form: Created when CreditApplication is created
- Credit Review Form: Created when PP_TR_1 fires (Credit Request submitted)
- Business Sponsorship Form: Created when PP_TR_2 fires (Credit Review submitted)
- Analysis forms (Legal, Questionnaire, Analysis): Created when PP_TR_4 fires
- Compilation Form: Created when PP_TR_5 fires (all analysis complete)
- Approval Form: Created when PP_TR_7 fires (compilation submitted)

### Sponsor Propagation

BusinessSponsorshipForm automatically copies sponsors from CreditRequestForm on save:
```python
def save(self, *args, **kwargs):
    if self.credit_application and hasattr(self.credit_application, 'credit_request_form'):
        crf = self.credit_application.credit_request_form
        if not self.senior_business_sponsor and crf.senior_business_sponsor_id:
            self.senior_business_sponsor = crf.senior_business_sponsor_id
            self.senior_business_sponsor_name = crf.senior_business_sponsor_name
        # ... similar for second sponsor
```

### Generic Relations

WorkflowInstance uses Django's contenttypes framework to link to any model:
```python
content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
object_id = models.UUIDField()
content_object = GenericForeignKey('content_type', 'object_id')
```

This allows a single WorkflowInstance model to track state for CreditApplication (parent) and all form types (sub-processes).

## 8. Database Configuration

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}
```

## 9. Initial Data Seeding

Required management commands:
- `python manage.py load_workflow_states` - Creates workflows, states, transitions
- `python manage.py seed_roles_departments` - Creates roles and departments
- Load fixtures for LimitTypes, DocumentTypes, Counterparties

## 10. Migration History

Key migrations that shaped the current schema:
- Initial models for Counterparty, CreditApplication, LimitRequest
- Workflow engine extraction to dedicated app
- Form model additions (CreditRequestForm through CreditApprovalForm)
- Migrations 0024-0027: Added `null=True` to text fields in form models (required for workflow transitions)
