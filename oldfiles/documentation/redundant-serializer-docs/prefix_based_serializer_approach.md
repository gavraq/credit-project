# Prefix-Based Serializer Approach for Credit Application Forms

## Overview

This document explains the prefix-based serializer approach for handling multiple related forms in the Credit Application system. This pattern provides a clean, maintainable, and scalable way to manage form data across multiple related models while avoiding the complexities of nested serializers.

## Key Concepts

### 1. Field Prefixing Convention

Each form's fields are prefixed with a consistent identifier in the API payload:

- `credit_request_*` - Fields belonging to the CreditRequestForm
- `credit_review_*` - Fields belonging to the CreditReviewForm
- `business_sponsorship_*` - Fields belonging to the BusinessSponsorshipForm
- `legal_review_*` - Fields belonging to the LegalReviewForm
- `credit_questionnaire_*` - Fields belonging to the CreditQuestionnaireForm

Fields without these prefixes belong to the parent CreditApplication model.

### 2. Form-Specific Models

Each form has its own dedicated model with direct database fields:

- `CreditApplication` - The parent model that ties everything together
- `CreditRequestForm` - Initial request form with counterparty details, financial data, etc.
- `CreditReviewForm` - Credit team's review and assessment
- `BusinessSponsorshipForm` - Business sponsor approval details
- `LegalReviewForm` - Legal team's review and approval
- `CreditQuestionnaireForm` - Additional questionnaire responses

### 3. One-to-One Relationships

Each form model has a one-to-one relationship with the parent CreditApplication:

```python
class CreditRequestForm(models.Model):
    credit_application = models.OneToOneField(
        CreditApplication, 
        on_delete=models.CASCADE,
        related_name='credit_request_form'
    )
    # Form-specific fields...
```

## Implementation Details

### Serializer Structure

The `CreditApplicationSerializer` handles all forms through a unified pattern:

1. **Field Declarations**: All fields (including prefixed form fields) are declared in the serializer
2. **Field Extraction**: Helper methods extract and group fields by prefix
3. **Form Updates**: A unified method handles creating/updating any sub-form

### Form Field Mapping

| Form Type | Model | Field Prefix | Example Fields |
|-----------|-------|--------------|---------------|
| Credit Request | CreditRequestForm | `credit_request_` | `credit_request_form_started_at`, `credit_request_counterparty_cif` |
| Credit Review | CreditReviewForm | `credit_review_` | `credit_review_approved_by`, `credit_review_risk_rating` |
| Business Sponsorship | BusinessSponsorshipForm | `business_sponsorship_` | `business_sponsorship_sponsor_id`, `business_sponsorship_approval_date` |
| Legal Review | LegalReviewForm | `legal_review_` | `legal_review_approved_by`, `legal_review_comments` |
| Credit Questionnaire | CreditQuestionnaireForm | `credit_questionnaire_` | `credit_questionnaire_completed`, `credit_questionnaire_score` |

### Special Field Handling

#### Boolean Fields
Boolean fields are converted from string representations ('true'/'false') to Python booleans:

- CreditRequestForm: `country_risk_limit_available`, `positive_legal_opinion`, `financial_statements_received`, `interim_statements_available`
- CreditReviewForm: `approved`, `exceptions_noted`
- BusinessSponsorshipForm: `approved`
- LegalReviewForm: `approved`

#### Date/Time Fields
Date/time fields are properly formatted:

- CreditRequestForm: `form_started_at`, `form_completed_at`, `last_client_visit_date`
- CreditReviewForm: `review_date`, `approval_date`
- BusinessSponsorshipForm: `approval_date`
- LegalReviewForm: `review_date`

#### Foreign Key Fields
Foreign keys are handled by ID:

- CreditRequestForm: `senior_business_sponsor_id`, `second_business_sponsor_id`
- CreditReviewForm: `reviewer_id`, `approver_id`
- BusinessSponsorshipForm: `sponsor_id`
- LegalReviewForm: `reviewer_id`

## API Payload Example

```json
{
  "title": "New Credit Application",
  "reference_number": "CR-2025-0042",
  "counterparty_id": 123,
  "priority": "High",
  "required_by_date": "2025-07-15",
  
  "credit_request_form_started_at": "2025-06-20T09:00:00",
  "credit_request_counterparty_cif": "CIF123456",
  "credit_request_guarantor_name": "Acme Holdings Ltd",
  "credit_request_country_risk_limit_available": "true",
  "credit_request_revenue_last_12m": 5000000,
  
  "credit_review_approved": "false",
  "credit_review_risk_rating": "B+",
  "credit_review_comments": "Pending additional documentation",
  
  "business_sponsorship_sponsor_id": 42,
  "business_sponsorship_approval_date": "2025-06-25",
  
  "legal_review_approved": "true",
  "legal_review_comments": "Documentation is satisfactory"
}
```

## Workflow Integration

The serializer pattern integrates with the workflow engine:

1. When a form is updated, the serializer can trigger workflow transitions
2. Post-save hooks can create tasks or notifications based on form updates
3. State-specific validation can be applied based on the current workflow state

## Benefits of This Approach

1. **Clear Field Ownership**: Each field's prefix clearly indicates which model it belongs to
2. **DRF Validation**: Works with DRF's standard validation flow
3. **Scalable**: Adding new forms or fields follows the same pattern
4. **Maintainable**: Helper methods keep the code DRY and organized
5. **Consistent API**: Frontend uses a consistent pattern for all forms
6. **No Nesting Issues**: Avoids problems with nested serializers
7. **Extensible**: Post-save hooks allow for form-specific logic

## Limitations and Considerations

1. **Frontend Changes**: Requires frontend to use prefixed fields
2. **API Verbosity**: Field names are longer due to prefixing
3. **Initial Setup**: Requires more initial setup compared to nested serializers
