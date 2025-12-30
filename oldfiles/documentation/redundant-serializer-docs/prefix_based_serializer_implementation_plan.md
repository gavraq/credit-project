# Prefix-Based Serializer Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for transitioning the Credit Application system to use the prefix-based serializer pattern. This approach will replace the current nested serializer structure with a flat field structure using consistent prefixes.

## Implementation Phases

### Phase 1: Backend Serializer Refactoring

#### 1.1 Update CreditApplicationSerializer

**Tasks:**
- [ ] Define all prefixed fields in the serializer
- [ ] Implement helper methods for field extraction
- [ ] Update `create` and `update` methods
- [ ] Add field validation
- [ ] Add boolean and date conversion utilities

**Code Structure:**
```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    # CreditRequestForm fields (prefixed)
    credit_request_form_started_at = serializers.DateTimeField(required=False)
    credit_request_form_completed_at = serializers.DateTimeField(required=False)
    credit_request_counterparty_cif = serializers.CharField(required=False)
    # ... other CreditRequestForm fields
    
    # CreditReviewForm fields (prefixed)
    credit_review_approved = serializers.CharField(required=False)
    # ... other CreditReviewForm fields
    
    # Similar for other forms
    
    class Meta:
        model = CreditApplication
        fields = [
            # CreditApplication fields
            'id', 'title', 'reference_number', 'counterparty', 'priority',
            # CreditRequestForm fields (prefixed)
            'credit_request_form_started_at', 'credit_request_counterparty_cif',
            # ... other form fields
        ]
    
    # Helper methods and create/update implementations
```

#### 1.2 Implement Helper Methods

**Tasks:**
- [ ] Implement `_extract_form_data` method
- [ ] Implement `_clean_parent_data` method
- [ ] Implement `_update_sub_form` method
- [ ] Implement `_handle_post_save_logic` method
- [ ] Add type conversion utilities for booleans and dates

#### 1.3 Update Create/Update Methods

**Tasks:**
- [ ] Update `create` method to use the helper methods
- [ ] Update `update` method to use the helper methods
- [ ] Add proper error handling and transaction management
- [ ] Add logging for debugging

### Phase 2: Frontend Integration

#### 2.1 Update API Service Layer

**Tasks:**
- [ ] Update `submitCreditRequest` function to use prefixed fields
- [ ] Update `updateCreditRequest` function to use prefixed fields
- [ ] Add utility functions for field prefixing

#### 2.2 Update Form Data Mapping

**Tasks:**
- [ ] Update `buildPayload` function in CreditRequestForm component
- [ ] Modify field mapping to use prefixes
- [ ] Update boolean and date handling

**Example:**
```javascript
const buildPayload = () => {
  // Convert boolean-like strings to actual booleans
  const booleanize = (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  };

  // Format date fields properly
  const formatDate = (dateString) => {
    return dateString ? dateString : null;
  };

  // Create payload with prefixed fields
  const payload = {
    // CreditApplication fields
    title: requestTitle || 'New Credit Application',
    counterparty: selectedCounterparty || null,
    priority: priority || 'Medium',
    required_by_date: formatDate(requiredByDate),
    
    // CreditRequestForm fields (prefixed)
    credit_request_form_started_at: formatDate(dateFormStarted),
    credit_request_form_completed_at: formatDate(dateFormCompleted),
    credit_request_counterparty_cif: counterpartyCIF || null,
    // ... other fields
  };

  return payload;
};
```

#### 2.3 Update Data Loading

**Tasks:**
- [ ] Update `fetchAppData` function to handle prefixed fields
- [ ] Modify state setting to extract from prefixed fields

**Example:**
```javascript
// Extract data from response with prefixed fields
const crf = {}; // No longer using data.credit_request_form
setDateFormStarted(data.credit_request_form_started_at || new Date().toISOString().slice(0, 16));
setCounterpartyCIF(data.credit_request_counterparty_cif || '');
// ... other fields
```

### Phase 3: Testing and Validation

#### 3.1 Backend Unit Tests

**Tasks:**
- [ ] Test serializer field validation
- [ ] Test create method with various payload combinations
- [ ] Test update method with various payload combinations
- [ ] Test error handling and edge cases

#### 3.2 Integration Tests

**Tasks:**
- [ ] Test API endpoints with new payload structure
- [ ] Verify correct form creation and updates
- [ ] Test workflow integration

#### 3.3 Frontend Testing

**Tasks:**
- [ ] Test form submission with new payload structure
- [ ] Test form loading with new response structure
- [ ] Verify all fields are correctly mapped and displayed

### Phase 4: Migration and Deployment

#### 4.1 Data Migration (if needed)

**Tasks:**
- [ ] Create migration script to handle existing data
- [ ] Test migration with production-like data

#### 4.2 Deployment Planning

**Tasks:**
- [ ] Coordinate backend and frontend deployments
- [ ] Plan for backward compatibility during transition
- [ ] Prepare rollback strategy

## Detailed Field Mapping

### CreditApplication Fields (no prefix)
- `id`
- `title`
- `reference_number`
- `counterparty_id`
- `priority`
- `required_by_date`
- `description`
- `created_by`
- `workflow_instance`

### CreditRequestForm Fields (prefix: `credit_request_`)
- `credit_request_form_started_at`
- `credit_request_form_completed_at`
- `credit_request_form_last_saved_at`
- `credit_request_counterparty_cif`
- `credit_request_guarantor_name`
- `credit_request_guarantor_cif`
- `credit_request_revenue_last_12m`
- `credit_request_revenue_projected_12m`
- `credit_request_projected_rorwa_percent`
- `credit_request_country_risk_limit_available`
- `credit_request_relationship_comments`
- `credit_request_most_senior_contact`
- `credit_request_last_client_visit_date`
- `credit_request_legal_documentation`
- `credit_request_positive_legal_opinion`
- `credit_request_financial_statements_received`
- `credit_request_interim_statements_available`
- `credit_request_account_executive`
- `credit_request_senior_business_sponsor_id`
- `credit_request_second_business_sponsor_id`
- `credit_request_high_priority_justification`

### CreditReviewForm Fields (prefix: `credit_review_`)
- `credit_review_reviewer_id`
- `credit_review_review_date`
- `credit_review_risk_rating`
- `credit_review_approved`
- `credit_review_approver_id`
- `credit_review_approval_date`
- `credit_review_comments`
- `credit_review_exceptions_noted`
- `credit_review_exception_details`

### BusinessSponsorshipForm Fields (prefix: `business_sponsorship_`)
- `business_sponsorship_sponsor_id`
- `business_sponsorship_approval_date`
- `business_sponsorship_approved`
- `business_sponsorship_comments`

### LegalReviewForm Fields (prefix: `legal_review_`)
- `legal_review_reviewer_id`
- `legal_review_review_date`
- `legal_review_approved`
- `legal_review_comments`
- `legal_review_documentation_status`

### CreditQuestionnaireForm Fields (prefix: `credit_questionnaire_`)
- `credit_questionnaire_completed`
- `credit_questionnaire_score`
- `credit_questionnaire_responses` (JSON field)

## Implementation Timeline

1. **Backend Serializer Refactoring**: 2-3 days
   - Day 1: Define fields and implement helper methods
   - Day 2: Update create/update methods and add validation
   - Day 3: Testing and debugging

2. **Frontend Integration**: 2 days
   - Day 1: Update API service layer and buildPayload
   - Day 2: Update data loading and state management

3. **Testing and Validation**: 2-3 days
   - Day 1: Backend unit tests
   - Day 2: Integration tests
   - Day 3: Frontend testing

4. **Migration and Deployment**: 1-2 days
   - Day 1: Data migration and deployment planning
   - Day 2: Deployment and monitoring

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Frontend/backend misalignment | High | Comprehensive testing, clear field documentation |
| Data migration issues | Medium | Thorough testing with production-like data |
| Performance impact of flat structure | Low | Monitor API response times, optimize if needed |
| Developer learning curve | Low | Clear documentation, code examples |

## Success Criteria

1. All form fields are correctly saved to their respective models
2. API responses include all form data with correct prefixes
3. Frontend correctly displays all form data
4. No regression in existing functionality
5. All tests pass
6. No performance degradation
