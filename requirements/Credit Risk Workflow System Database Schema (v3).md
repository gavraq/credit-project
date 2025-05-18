
# Credit Risk Workflow System Database Schema

## 1. Entity-Relationship Overview

The database schema is designed to support a complex credit risk workflow system with a flexible workflow engine, comprehensive document management, and sophisticated permission handling. The architecture follows a service-oriented approach with clear separation of concerns.

## 2. Key Relationships

### User and Role Management

- **User to Department**: Each user belongs to one department within the organization
- **User to Role**: Each user has a specific role that determines their permissions
- **Role to Permission**: Roles define what actions users can perform and what data they can access

### Workflow Management

- **WorkflowDefinition to State**: Each workflow definition contains multiple possible states
- **State to Transition**: States are connected by transitions, defining the possible flows
- **WorkflowInstance to CreditApplication**: Workflows are attached to applications via generic relations
- **StateLog to WorkflowInstance**: Each state change is logged for audit purposes

### Credit Application and Documents

- **Counterparty to CreditApplication**: A counterparty can have multiple credit applications
- **CreditApplication to Document**: Documents can be attached to applications via generic relations
- **DocumentType to Document**: Each document has a specific type with validation rules
- **CreditApplication to LimitRequest**: An application can include multiple limit requests

### External System Integration

- **Counterparty to External Systems**: Counterparties have identifiers in external systems
- **CreditApplication to Risk Assessment**: Applications can include risk assessment data

## 3. Detailed Entity Descriptions with Fields and Data Types

### User Management Entities

#### Department

- **id**: UUID (Primary Key)
- **name**: String
- **description**: Text

#### Role

- **id**: UUID (Primary Key)
- **name**: String
- **description**: Text
- **can_view_all_applications**: Boolean
- **can_view_department_applications**: Boolean
- **can_approve_applications**: Boolean
- **can_reject_applications**: Boolean
- **can_view_reports**: Boolean
- **can_export_data**: Boolean
- **visible_fields**: JSONField (Defines which fields are visible for this role in various forms)
- **available_dropdown_options**: JSONField (Defines which options are available in dropdowns for this role)

#### User

- **id**: UUID (Primary Key)
- **username**: String
- **email**: String
- **password_hash**: String
- **first_name**: String
- **last_name**: String
- **department**: ForeignKey to Department
- **role**: ForeignKey to Role
- **employee_id**: String
- **phone_number**: String
- **is_active**: Boolean
- **created_at**: DateTime
- **updated_at**: DateTime

#### Permission

- **id**: UUID (Primary Key)
- **name**: String
- **description**: String
- **resource_type**: String (e.g., "CreditApplication", "Document")
- **action**: String (e.g., "create", "view", "approve", "reject")

### Workflow Engine Entities

#### WorkflowDefinition

- **id**: UUID (Primary Key)
- **name**: String
- **description**: Text
- **is_active**: Boolean
- **created_at**: DateTime
- **updated_at**: DateTime

#### State

- **id**: UUID (Primary Key)
- **workflow**: ForeignKey to WorkflowDefinition
- **name**: String
- **description**: Text
- **is_initial**: Boolean
- **is_final**: Boolean
- **ui_color**: String (Hex color for UI display)

#### Transition

- **id**: UUID (Primary Key)
- **workflow**: ForeignKey to WorkflowDefinition
- **source_state**: ForeignKey to State (related_name='outgoing_transitions')
- **target_state**: ForeignKey to State (related_name='incoming_transitions')
- **name**: String
- **description**: Text
- **permission_codename**: String (Permission required to execute this transition)
- **conditions**: JSONField (Conditions that must be met to allow this transition)

#### WorkflowInstance

- **id**: UUID (Primary Key)
- **workflow_definition**: ForeignKey to WorkflowDefinition
- **current_state**: ForeignKey to State
- **content_type**: ForeignKey to ContentType
- **object_id**: PositiveInteger
- **content_object**: GenericForeignKey ('content_type', 'object_id')
- **created_at**: DateTime
- **updated_at**: DateTime

#### StateLog

- **id**: UUID (Primary Key)
- **workflow_instance**: ForeignKey to WorkflowInstance
- **transition**: ForeignKey to Transition (nullable)
- **from_state**: ForeignKey to State
- **to_state**: ForeignKey to State
- **performed_by**: ForeignKey to User (nullable)
- **performed_at**: DateTime
- **comments**: Text
- **metadata**: JSONField (Additional data about the transition)

### Core Business Entities

#### Counterparty

- **id**: UUID (Primary Key)
- **name**: String
- **cif_number**: String (Customer Identification File)
- **legal_entity_identifier**: String
- **registration_number**: String
- **tax_id**: String
- **entity_type**: String
- **country_of_incorporation**: String
- **industry_sector**: String
- **industry_subsector**: String
- **business_description**: Text
- **relationship_since**: Date
- **relationship_manager_id**: UUID (Foreign Key to User)
- **annual_revenue**: Decimal
- **credit_rating**: String
- **kyc_status**: String (Yes/No/In Progress)
- **senior_contact**: String
- **last_visit_date**: Date
- **adaptiv_id**: String (Identifier in Adaptiv system)
- **crs_id**: String (Identifier in CRS system)
- **spreadpac_id**: String (Identifier in Spreadpac system)
- **fitch_id**: String (Identifier in Fitch system)
- **last_sync_date**: DateTime (nullable)
- **created_at**: DateTime
- **updated_at**: DateTime

#### DocumentType

- **id**: UUID (Primary Key)
- **name**: String
- **code**: SlugField (unique)
- **description**: Text
- **allowed_extensions**: JSONField (List of allowed file extensions)
- **max_size_mb**: PositiveInteger (Default: 10)

#### Document

- **id**: UUID (Primary Key)
- **document_type**: ForeignKey to DocumentType
- **title**: String
- **file**: FileField
- **file_size**: PositiveInteger (Size in bytes)
- **file_type**: String (MIME type)
- **original_filename**: String
- **content_type**: ForeignKey to ContentType
- **object_id**: PositiveInteger
- **content_object**: GenericForeignKey ('content_type', 'object_id')
- **uploaded_by**: ForeignKey to User
- **upload_date**: DateTime
- **description**: Text
- **has_preview**: Boolean
- **preview_file**: FileField (nullable)
- **version**: PositiveInteger (Default: 1)
- **previous_version**: ForeignKey to self (nullable, related_name='next_versions')

### Credit Application Entities

#### CreditApplication

- **id**: UUID (Primary Key)
- **title**: String
- **counterparty_id**: UUID (Foreign Key to Counterparty)
- **reference_number**: String
- **amount**: Decimal
- **description**: Text
- **applicant_name**: String
- **applicant_email**: String
- **applicant_phone**: String
- **created_by**: ForeignKey to User (related_name='created_applications')
- **assigned_to**: ForeignKey to User (nullable, related_name='assigned_applications')
- **created_at**: DateTime
- **updated_at**: DateTime
- **expiry_date**: Date
- **purpose**: Text
- **decision_rationale**: Text
- **conditions**: Text
- **priority**: String (Low/Medium/High)
- **rank**: Integer (Prioritization within priority level)
- **required_by_date**: Date
- **risk_score**: Decimal (nullable)
- **risk_assessment_date**: DateTime (nullable)
- **risk_assessment_reference**: String

#### LimitRequest

- **id**: UUID (Primary Key)
- **credit_application_id**: UUID (Foreign Key to CreditApplication)
- **limit_type**: String (e.g., "Trading: Pre-Settlement", "Trading: Settlement")
- **existing_amount**: Decimal (USD millions)
- **existing_tenor**: Integer (months)
- **proposed_amount**: Decimal (USD millions)
- **proposed_tenor**: Integer (months)
- **comments**: Text

#### Limit

- **id**: UUID (Primary Key)
- **limit_request_id**: UUID (Foreign Key to LimitRequest)
- **counterparty_id**: UUID (Foreign Key to Counterparty)
- **limit_type**: String
- **amount**: Decimal (USD millions)
- **tenor**: Integer (months)
- **start_date**: Date
- **end_date**: Date
- **status**: String (active/inactive)
- **approved_by**: UUID (Foreign Key to User)
- **approval_date**: DateTime

### Form Component Models

For more complex credit applications, additional models can be created to store specific form data and linked to the main CreditApplication model. This approach allows flexibility while maintaining the connection to the workflow.

#### CreditRequestForm

- **id**: UUID (Primary Key)
- **credit_application_id**: UUID (Foreign Key to CreditApplication)
- **guarantor_name**: String (nullable)
- **guarantor_cif**: String (nullable)
- **revenue_last_12m**: Decimal
- **revenue_projected_12m**: Decimal
- **projected_rorwa_percent**: Decimal
- **relationship_comments**: Text
- **legal_documentation**: Text
- **positive_legal_opinion**: Boolean
- **financial_statements_received**: Boolean
- **interim_statements_available**: Boolean
- **country_risk_limit_available**: Boolean

#### CreditReviewForm

- **id**: UUID (Primary Key)
- **credit_application_id**: UUID (Foreign Key to CreditApplication)
- **credit_reviewer_id**: UUID (Foreign Key to User)
- **assigned_credit_analyst_id**: UUID (Foreign Key to User)
- **delegated_authority_level**: String (DA1-DA8)
- **questionnaire_required**: Boolean
- **additional_information_request**: Text
- **rejection_reason**: Text (nullable)

#### BusinessSponsorshipForm

- **id**: UUID (Primary Key)
- **credit_application_id**: UUID (Foreign Key to CreditApplication)
- **business_sponsor_id**: UUID (Foreign Key to User)
- **is_approved**: Boolean
- **comments**: Text
- **second_business_sponsor_id**: UUID (Foreign Key to User, nullable)
- **second_sponsor_approval**: Boolean (nullable)
- **second_sponsor_comments**: Text (nullable)

#### LegalReviewForm

- **id**: UUID (Primary Key)
- **credit_application_id**: UUID (Foreign Key to CreditApplication)
- **agreement_template**: String
- **governing_law**: String (nullable)
- **counterparty_events_of_default**: Text (nullable)
- **grace_period**: Text (nullable)
- **non_standard_provisions**: Text (nullable)
- **positive_netting_opinion**: Boolean (nullable)
- **has_csa**: Boolean (nullable)
- **csa_type**: String (nullable)
- **iosco_compliant**: Boolean (nullable)
- **csa_threshold**: Decimal (nullable)
- **csa_minimum_transfer**: Decimal (nullable)
- **csa_independent_amount**: Decimal (nullable)
- **positive_collateral_opinion**: Boolean (nullable)
- **legal_reviewer_id**: UUID (Foreign Key to User)

#### CreditAnalysisForm

- **id**: UUID (Primary Key)
- **credit_application_id**: UUID (Foreign Key to CreditApplication)
- **credit_analyst_id**: UUID (Foreign Key to User)
- **counterparty_details**: Text
- **internal_rating**: Text
- **external_rating**: Text
- **group_facilities**: Text
- **consolidated_financials**: Text
- **credit_strategy**: Text
- **credit_appetite_guideline**: Text
- **executive_summary**: Text
- **risk_assessment**: Text
- **climate_score**: Decimal
- **climate_comments**: Text
- **rating_adjustment**: Text
- **mlro_decision**: String (accept/reject/defer)
- **mlro_comments**: Text
- **updated_client_risk_rating**: String (H/M/L)

## 4. Database Indexes and Optimizations

### Indexes for CreditApplication

```python
class Meta:
    ordering = ['-created_at']
    indexes = [
        models.Index(fields=['created_by']),
        models.Index(fields=['assigned_to']),
        models.Index(fields=['created_at']),
        models.Index(fields=['counterparty_id']),
        models.Index(fields=['priority', 'rank']),
        models.Index(fields=['required_by_date']),
        # Composite indexes for common query patterns
        models.Index(fields=['assigned_to', 'priority']),
    ]
```

### Indexes for Document

```python
class Meta:
    ordering = ['-upload_date']
    indexes = [
        models.Index(fields=['content_type', 'object_id']),
        models.Index(fields=['uploaded_by']),
        models.Index(fields=['document_type']),
        models.Index(fields=['upload_date']),
    ]
```

### Indexes for WorkflowInstance

```python
class Meta:
    indexes = [
        models.Index(fields=['content_type', 'object_id']),
        models.Index(fields=['current_state']),
        models.Index(fields=['workflow_definition']),
    ]
```

### Indexes for StateLog

```python
class Meta:
    ordering = ['-performed_at']
    indexes = [
        models.Index(fields=['workflow_instance']),
        models.Index(fields=['performed_by']),
        models.Index(fields=['performed_at']),
    ]
```

## 5. Implementation Considerations

### 5.1 Workflow State Management

- Pre-populate the WorkflowDefinition table with default workflow types (e.g., "credit_application_workflow")
- Define all possible states and transitions for each workflow
- Use conditions in transitions to implement business rules
- Implement appropriate services for executing transitions with permission checks

### 5.2 Document Storage

- Create standard DocumentTypes for common document categories
- Implement versioning for documents that may be updated during the workflow
- Use the content_type framework to attach documents to various entities
- Generate previews for common document formats to improve user experience

### 5.3 Audit Trail and Compliance

- Use StateLog to maintain a comprehensive audit trail of all workflow changes
- Track document access and modifications
- Implement comprehensive logging for all critical actions
- Design database queries that can extract compliance-related information

### 5.4 Performance Optimization

- Implement appropriate indexes for common query patterns
- Use database-level constraints for data validation
- Configure connection pooling for production environments
- Set appropriate PostgreSQL settings as specified in the architecture document

### 5.5 Data Migration

- Create a migration plan if transitioning from an existing system
- Implement data validation during migrations
- Break complex migrations into smaller, manageable steps

### 5.6 Django Specific Considerations

- Group models into logical Django apps (users, workflow_engine, credit_applications, documents)
- Configure Django admin for easy management of reference data
- Use Django signals for workflow state change notifications
- Implement custom model managers for complex query operations

### 5.7 Security Considerations

- Ensure proper encryption for sensitive data
- Implement appropriate field-level permissions
- Use Django's permission system in conjunction with custom role-based permissions
- Validate all file uploads for security risks

## 6. Database Configuration for PostgreSQL

```python
# credit_risk_project/settings/production.py
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
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5,
        },
    }
}
```

## 7. Initial Data Seeding

To ensure the system is fully functional upon deployment, prepare scripts to seed initial data for:

- Departments (e.g., "Credit Risk", "Front Office", "Legal")
- Roles (e.g., "Credit Analyst", "Relationship Manager", "Legal Reviewer")
- Permissions with appropriate mappings to roles
- DocumentTypes with allowed file extensions and size limits
- WorkflowDefinitions with complete state and transition configurations
- Reference data for domains such as limit types, countries, etc.

## 8. Future Extensions

The schema is designed to accommodate future extensions, including:

### 8.1 Integration with External Systems

- API endpoints for external system integration
- Data mapping and synchronization services
- Integration with risk assessment systems

### 8.2 Advanced Analytics

- Additional models for performance metrics and KPIs
- Historical trend analysis
- SLA monitoring

### 8.3 AI and Automation

- Models to store AI-generated recommendations
- Document classification and data extraction
- Automated workflow routing based on parameters

This database schema provides a comprehensive foundation for the Credit Risk Workflow system, balancing flexibility with the specific needs of the credit application domain as outlined in the Architecture Document.