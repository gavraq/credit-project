# Metadata-Driven Workflow System

## Overview

The Credit Risk Workflow System implements a **metadata-driven architecture** where workflow behavior, UI configuration, and business logic are defined through database metadata rather than hardcoded in application code. This approach provides unprecedented flexibility, maintainability, and configurability.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Metadata Structure](#metadata-structure)
3. [Workflow Metadata](#workflow-metadata)
4. [Transition Metadata](#transition-metadata)
5. [State Metadata](#state-metadata)
6. [Form Metadata](#form-metadata)
7. [Dynamic System Behavior](#dynamic-system-behavior)
8. [Implementation Details](#implementation-details)
9. [Benefits and Trade-offs](#benefits-and-trade-offs)
10. [Management and Maintenance](#management-and-maintenance)

---

## Core Concepts

### Metadata-Driven vs. Code-Driven

**Traditional Code-Driven Approach:**
```python
# Hardcoded business logic
def get_available_forms(state):
    if state == 'CREDIT_REVIEW_PENDING':
        return ['credit_request_form', 'credit_review_form']
    elif state == 'BUSINESS_SPONSOR_PENDING':
        return ['credit_request_form', 'credit_review_form', 'business_sponsorship_form']
    # ... requires code changes for new workflows
```

**Metadata-Driven Approach:**
```python
# Dynamic business logic from database
def get_available_forms(state_code):
    return get_relevant_sub_processes_for_state(state_code)  # Reads from metadata
```

### Key Principles

1. **Configuration over Code**: Business rules defined in database, not source code
2. **Dynamic Behavior**: System adapts to metadata changes without deployment
3. **Declarative UI**: Frontend behavior defined by backend metadata
4. **Centralized Management**: All configuration in one place (database)
5. **Extensibility**: New workflows and behaviors without code changes

---

## Metadata Structure

### Storage Location
All metadata is stored as **JSON fields** in Django models:
- **Workflow.metadata**: Overall workflow configuration
- **Transition.metadata**: Transition-specific behavior
- **State.metadata**: State-specific configuration

### JSON Schema Pattern
```json
{
  "section_name": {
    "configuration_key": "value",
    "nested_config": {
      "sub_key": "sub_value"
    }
  }
}
```

---

## Workflow Metadata

### Structure
```json
{
  "form_metadata": {
    "form_name": {
      "form_key": "prefix_for_fields",
      "model_class": "ModelName",
      "workflow_code": "SUB_WORKFLOW_CODE",
      "field_mappings": {
        "boolean_fields": ["field1", "field2"],
        "user_fields": ["field3", "field4"],
        "datetime_fields": ["field5", "field6"]
      }
    }
  }
}
```

### Form Metadata Configuration

#### Example: Credit Review Form
```json
{
  "credit_review_form": {
    "form_key": "credit_review_form",
    "model_class": "CreditReviewForm", 
    "workflow_code": "CREDIT_REVIEW",
    "field_mappings": {
      "boolean_fields": ["questionnaire_required"],
      "user_fields": ["credit_reviewer", "assigned_credit_analyst"],
      "datetime_fields": ["form_started_at", "form_completed_at"]
    }
  }
}
```

#### Field Mappings Purpose
- **boolean_fields**: Auto-convert string inputs ('yes'/'no') to boolean values
- **user_fields**: Convert UUID strings to User object references
- **datetime_fields**: Handle timezone-aware datetime parsing

### Dynamic Functions Using Form Metadata

#### 1. Form Model Mapping
```python
def get_dynamic_form_model_map():
    """Returns mapping of form names to Django model classes"""
    # Reads form_metadata to build: {'credit_review_form': CreditReviewForm, ...}
```

#### 2. Form Prefix Generation
```python
def get_dynamic_form_prefixes():
    """Returns mapping of field prefixes to form names"""
    # Builds: {'credit_review_form_': 'credit_review_form', ...}
```

#### 3. Field Type Mappings
```python
def get_dynamic_field_mappings():
    """Returns field type mappings for all forms"""
    # Returns: {
    #   'boolean_fields': {'credit_review_form': ['questionnaire_required']},
    #   'user_fields': {'credit_review_form': ['credit_reviewer']},
    #   'datetime_fields': {'credit_review_form': ['form_started_at']}
    # }
```

---

## Transition Metadata

### Complete Structure
```json
{
  "ui_behavior": {
    "button_style": "success|primary|error|warning",
    "navigate_on_success": "/path/to/navigate",
    "confirmation_required": true|false,
    "button_text": "Custom Button Text"
  },
  "parent_workflow": {
    "from_state": "PARENT_STATE_CODE", 
    "to_state": "TARGET_STATE_CODE",
    "transition_code": "PARENT_TRANSITION_CODE",
    "description": "Human readable description"
  },
  "system_action": "action_handler_name",
  "validation_rules": {
    "required_fields": ["field1", "field2"],
    "business_rules": ["rule1", "rule2"]
  },
  "permissions": {
    "additional_roles": ["Role1", "Role2"],
    "conditions": ["condition1", "condition2"]
  }
}
```

### UI Behavior Configuration

#### Button Styling
```json
{
  "ui_behavior": {
    "button_style": "success",     // Green button
    "button_style": "primary",     // Blue button  
    "button_style": "error",       // Red button
    "button_style": "warning"      // Orange button
  }
}
```

#### Navigation Control
```json
{
  "ui_behavior": {
    "navigate_on_success": "/",              // Go to dashboard
    "navigate_on_success": "/custom-page",   // Go to specific page
    "navigate_on_success": "refresh"         // Stay and refresh data
  }
}
```

#### User Interaction
```json
{
  "ui_behavior": {
    "confirmation_required": true,    // Show "Are you sure?" dialog
    "button_text": "Submit Review"   // Override default button text
  }
}
```

### Parent Workflow Integration

#### Configuration
```json
{
  "parent_workflow": {
    "from_state": "CREDIT_PAPER_CREDIT_REVIEW_PENDING",
    "description": "Auto-transition parent to Business Sponsor Pending after Credit Review submission", 
    "transition_code": "PP_TR_2"
  }
}
```

#### How It Works
1. **Sub-form transitions** to "Submitted" state
2. **System action handler** reads `parent_workflow` metadata
3. **Parent workflow** automatically performs specified transition
4. **Next forms** become available based on new parent state

### System Actions

#### Purpose
System actions are **automated handlers** that execute after successful transitions.

#### Configuration
```json
{
  "system_action": "submit_credit_request"
}
```

#### Available Handlers

All handlers follow the same metadata-driven pattern using shared helper functions.

| Handler | Triggers | Description |
|---------|----------|-------------|
| `submit_credit_request` | PP_TR_1 | Transitions parent to Credit Review Pending |
| `submit_credit_review` | PP_TR_2 | Transitions parent to Business Sponsor Pending |
| `submit_business_sponsorship` | PP_TR_4 | Transitions parent to Analysis Pending |
| `submit_legal_review` | PP_TR_5* | Shared analysis handler (see below) |
| `submit_credit_questionnaire` | PP_TR_5* | Shared analysis handler (see below) |
| `submit_credit_analysis` | PP_TR_5* | Shared analysis handler (see below) |
| `submit_credit_compilation` | PP_TR_7 | Transitions parent to Approval Pending |
| `submit_credit_approval` | PP_TR_8/9 | Transitions to Approved or Rejected based on decision |

*Analysis phase handlers all call `handle_submit_analysis_form` which only triggers PP_TR_5 when ALL three forms are submitted.

#### Analysis Phase Handler (Parallel Completion)
The analysis phase has a special handler that waits for all three forms:
```python
def handle_submit_analysis_form(workflow_instance, user, transition_obj):
    """
    Called by Legal Review, Credit Questionnaire, and Credit Analysis submissions.
    Checks if ALL THREE forms are in SUBMITTED state before triggering
    parent transition PP_TR_5 to move to Compilation phase.
    """
```

#### Standard Handler Implementation
```python
def handle_submit_credit_request(workflow_instance, user, transition_obj):
    """
    Standard metadata-driven handler that:
    1. Gets parent CreditApplication workflow via helper
    2. Validates parent is in expected state
    3. Performs parent transition via helper
    """
```

---

## State Metadata

### Structure
```json
{
  "relevant_sub_processes": ["form1", "form2", "form3"],
  "ui_config": {
    "display_name": "Custom State Name",
    "description": "What happens in this state",
    "color": "#color-code"
  },
  "business_rules": {
    "auto_advance": true|false,
    "timeout_days": 30,
    "escalation_rules": []
  }
}
```

### Relevant Sub-Processes

#### Purpose
Defines which forms should be **available and visible** when the main workflow is in this state.

#### Example
```json
{
  "relevant_sub_processes": [
    "credit_request_form",
    "credit_review_form", 
    "business_sponsorship_form"
  ]
}
```

#### Implementation
```python
def get_relevant_sub_processes_for_state(state_code):
    """
    Returns list of forms that should be available for given state.
    Used by:
    - Hub page to show available forms
    - Auto-initialization to create required forms
    - Permission checks for form access
    """
```

---

## Form Metadata

### Dynamic Form Configuration

#### Field Prefix System
Each form has a **unique prefix** for field names to avoid conflicts:
```json
{
  "credit_review_form": {
    "form_key": "credit_review_form"  // Creates prefix: "credit_review_form_"
  }
}
```

#### Frontend Payload Structure
```javascript
const payload = {
  credit_review_form_credit_reviewer: user.id,
  credit_review_form_assigned_analyst: selectedAnalyst,
  credit_review_form_delegated_authority: "3"
};
```

#### Backend Processing
```python
def _extract_form_data(self, data):
    """
    Uses dynamic prefixes to route fields to correct forms:
    'credit_review_form_credit_reviewer' → credit_review_form.credit_reviewer
    """
```

### Field Type Mappings

#### Boolean Field Handling
```python
# Frontend sends: needQuestionnaire: 'yes'
# Backend converts: questionnaire_required: True
```

#### User Field Resolution
```python
# Frontend sends: credit_reviewer: 'user-uuid-string'
# Backend converts: credit_reviewer: User(uuid)
```

#### DateTime Field Processing
```python
# Frontend sends: form_started_at: '2025-06-27T10:30:00'
# Backend converts: form_started_at: timezone.aware.datetime
```

---

## Dynamic System Behavior

### Auto-Initialization System

#### Trigger Conditions
Auto-initialization occurs when:
1. **Main workflow transitions** to new state
2. **State metadata** specifies required forms
3. **Forms don't already exist** for the application

#### Process Flow
```python
def auto_initialize_forms_for_state(credit_application, state_code):
    """
    1. Get relevant forms from state metadata
    2. Check which forms don't exist
    3. Create missing forms with workflow instances
    4. Set up sub-workflow initial states
    """
```

### Dynamic Serialization

#### Prefix-Based Field Routing
```python
def _extract_form_data(self, data):
    """
    Routes fields based on dynamic prefixes:
    - 'credit_review_form_*' → CreditReviewForm
    - 'business_sponsorship_form_*' → BusinessSponsorshipForm
    """
```

#### Automated Field Processing
```python
def _update_sub_form(self, instance, form_type, form_data):
    """
    Uses field mappings to automatically:
    - Convert boolean strings to booleans
    - Resolve user IDs to User objects  
    - Parse datetime strings with timezone awareness
    """
```

### Workflow Transition Chain

#### Sequential Form Processing
1. **User submits** Credit Review Form
2. **Form transitions** to "Submitted" state
3. **System action** reads parent_workflow metadata
4. **Parent workflow** transitions to "Business Sponsor Pending"
5. **Auto-initialization** creates Business Sponsorship Form
6. **Hub page** shows newly available form

---

## Implementation Details

### Database Schema

#### Workflow Model
```python
class Workflow(models.Model):
    metadata = models.JSONField(blank=True, null=True)
    # Contains: form_metadata configuration
```

#### Transition Model  
```python
class Transition(models.Model):
    metadata = models.JSONField(blank=True, null=True)
    system_action = models.CharField(max_length=100, blank=True, null=True)
    # Contains: ui_behavior, parent_workflow configuration
```

#### State Model
```python
class State(models.Model):
    metadata = models.JSONField(blank=True, null=True)
    # Contains: relevant_sub_processes, ui_config
```

### Management Commands

#### Metadata Management
- **load_form_metadata**: Load form configurations from files
- **load_workflow_states**: Load workflow states and transitions from fixtures
- **fix_all_parent_workflow_metadata**: Add parent workflow integration
- **fix_system_action_fields**: Update system action fields
- **update_workflow_metadata**: Update workflow metadata configuration
- **update_state_metadata**: Update state-specific metadata

#### Validation and Auditing
- **audit_metadata_step1**: Comprehensive metadata validation
- **check_expected_metadata_step2**: Verify expected metadata structure
- **apply_metadata_fixes_step3**: Apply metadata corrections
- **analyze_all_metadata**: Analyze complete metadata configuration

#### Debugging Tools
- **diagnose_auto_initialization**: Debug form auto-initialization issues
- **debug_credit_review_auto_init**: Debug credit review form initialization
- **debug_credit_review_serialization**: Debug serialization issues
- **get_db_workflow_details**: Inspect workflow configuration in database

### Frontend Integration

#### Metadata Consumption
```javascript
// Read transition metadata for UI behavior
const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
const buttonStyle = transition.metadata?.ui_behavior?.button_style;
const confirmRequired = transition.metadata?.ui_behavior?.confirmation_required;
```

#### Dynamic Form Handling
```javascript
// Build payload using dynamic prefixes from metadata
const buildPayload = () => ({
  credit_review_form_credit_reviewer: user.id,  // Uses metadata prefix
  credit_review_form_assigned_analyst: selectedAnalyst
});
```

---

## Benefits and Trade-offs

### ✅ Benefits

#### 1. **Business Agility**
- **Workflow changes** without code deployment
- **New forms and states** configurable through admin interface
- **Business rules** modifiable by non-developers

#### 2. **Maintainability**
- **Single source of truth** for business logic
- **Reduced code duplication** across forms
- **Consistent patterns** enforced by metadata

#### 3. **Extensibility** 
- **New workflows** added through configuration
- **Custom field types** handled by mappings
- **Integration points** defined in metadata

#### 4. **Testing and QA**
- **Configuration changes** testable in isolation
- **Business logic** verifiable through metadata inspection
- **Rollback capabilities** through metadata versioning

### ⚠️ Trade-offs

#### 1. **Complexity**
- **Learning curve** for metadata structure
- **Debugging challenges** require metadata inspection
- **Documentation dependency** for configuration

#### 2. **Performance Considerations**
- **JSON field queries** may be slower than indexed fields
- **Metadata parsing** adds runtime overhead
- **Caching strategies** needed for frequently accessed metadata

#### 3. **Data Integrity**
- **JSON validation** needed to prevent invalid metadata
- **Schema evolution** requires migration strategies
- **Backup and recovery** must include metadata

---

## Management and Maintenance

### Implemented Utility Functions

#### Form Metadata Retrieval
```python
def get_form_metadata(form_name):
    """
    Get metadata for a specific form from workflow models.
    Raises FormMetadataError if metadata is not found.

    Returns:
        Dictionary containing form metadata (title, form_key, workflow_code, field_mappings)
    """
```

#### Form Permissions
```python
def get_form_permissions(form_name):
    """
    Get role permissions for a specific form from workflow metadata.

    Returns:
        Dict containing 'editable_by_roles', 'viewable_by_roles', and 'ownership_required'
    """
```

#### User Edit Authorization
```python
def can_user_edit_form(user, credit_app, form_name, form_instance=None):
    """
    Metadata-driven function to determine if a user can edit a specific form.
    Checks role permissions, ownership requirements, and DA-level authorization.

    Returns:
        Boolean indicating if user can edit the form
    """
```

### Metadata Validation

Validation is performed via management commands rather than utility functions:
- **audit_metadata_step1**: Validates form metadata completeness
- **check_expected_metadata_step2**: Verifies expected metadata structure
- **analyze_all_metadata**: Comprehensive metadata analysis

### Configuration Management

> **Note**: Version control and migration strategies for metadata are not yet implemented.
> Metadata changes are currently managed through management commands and database fixtures.

#### Current Approach
- Metadata is loaded via `load_workflow_states` and `load_form_metadata` commands
- Changes are applied via fix commands (e.g., `fix_all_parent_workflow_metadata`)
- No automatic versioning or migration system exists

#### Future Enhancements (Not Implemented)
- Metadata version tracking
- Automated migration scripts
- Change audit logging

### Monitoring and Debugging

#### Metadata Inspection Tools
- **Django Admin**: Direct metadata editing interface
- **Management Commands**: Automated validation and updates (see commands listed above)
- **Database Queries**: Use `get_db_workflow_details` command to inspect workflow configuration

#### Logging Strategy
```python
logger.info(f"Using dynamic form mapping: {form_model_map}")
logger.info(f"Processing transition with metadata: {transition.metadata}")
logger.error(f"Metadata validation failed: {validation_errors}")
```

### Best Practices

#### 1. **Metadata Design**
- **Consistent naming conventions** across all metadata
- **Clear documentation** for each metadata section
- **Validation rules** for metadata integrity

#### 2. **Change Management**
- **Test metadata changes** in development environment
- **Backup metadata** before significant updates
- **Document changes** with clear descriptions

#### 3. **Performance Optimization**
- **Cache frequently accessed** metadata
- **Index JSON fields** where possible
- **Monitor query performance** for metadata operations

---

## Conclusion

The metadata-driven workflow system represents a sophisticated approach to business process management that prioritizes **flexibility**, **maintainability**, and **business agility**. By moving configuration from code to database, the system enables rapid adaptation to changing business requirements while maintaining consistency and reliability.

This architecture supports the Credit Risk Workflow System's goal of providing a robust, scalable platform that can evolve with organizational needs without requiring extensive development cycles. The comprehensive metadata structure ensures that business logic, UI behavior, and system integration are all centrally managed and easily modified.

The investment in metadata-driven architecture pays dividends in reduced development time, improved business responsiveness, and enhanced system maintainability, making it an ideal foundation for complex workflow management systems.