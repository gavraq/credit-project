# Credit Risk Workflow - Data Model and Forms Analysis

## 1. Database Model Fields Analysis

### 1.1 Core Models and Their Fields

#### CreditApplication (Main Entity)
**Direct Database Fields:**
- `id` (UUID, Primary Key)
- `title` (String)
- `counterparty_id` (Foreign Key to Counterparty)
- `reference_number` (String, unique)
- `amount` (Decimal)
- `description` (Text)
- `applicant_name` (String)
- `applicant_email` (String)
- `applicant_phone` (String)
- `created_by` (Foreign Key to User)
- `assigned_to` (Foreign Key to User, nullable)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `expiry_date` (Date)
- `purpose` (Text)
- `decision_rationale` (Text)
- `conditions` (Text)
- `priority` (String: Low/Medium/High)
- `rank` (Integer)
- `required_by_date` (Date)
- `risk_score` (Decimal, nullable)
- `risk_assessment_date` (DateTime, nullable)
- `risk_assessment_reference` (String)

#### CreditRequestForm (Sub-Form Model)
**Direct Database Fields:**
- `id` (UUID, Primary Key)
- `credit_application_id` (OneToOne to CreditApplication)
- `guarantor_name` (String, nullable)
- `guarantor_cif` (String, nullable)
- `revenue_last_12m` (Decimal)
- `revenue_projected_12m` (Decimal)
- `projected_rorwa_percent` (Decimal)
- `relationship_comments` (Text)
- `legal_documentation` (Text)
- `positive_legal_opinion` (Boolean)
- `financial_statements_received` (Boolean)
- `interim_statements_available` (Boolean)
- `country_risk_limit_available` (Boolean)

#### CreditReviewForm (JSON-Based Model)
**Database Structure:**
- `id` (UUID, Primary Key)
- `credit_application_id` (OneToOne to CreditApplication)
- `form_data` (JSONField) - Contains all form data

**Expected JSON Fields:**
- `credit_reviewer_id` (User ID)
- `assigned_credit_analyst_id` (User ID)
- `delegated_authority_level` (String: DA1-DA8)
- `questionnaire_required` (Boolean)
- `additional_information_request` (Text)
- `rejection_reason` (Text, nullable)

#### BusinessSponsorshipForm (JSON-Based Model)
**Database Structure:**
- `id` (UUID, Primary Key)
- `credit_application_id` (OneToOne to CreditApplication)
- `form_data` (JSONField) - Contains all form data

**Expected JSON Fields:**
- `business_sponsor_id` (User ID)
- `is_approved` (Boolean)
- `comments` (Text)
- `second_business_sponsor_id` (User ID, nullable)
- `second_sponsor_approval` (Boolean, nullable)
- `second_sponsor_comments` (Text, nullable)

#### LegalReviewForm (JSON-Based Model)
**Database Structure:**
- `id` (UUID, Primary Key)
- `credit_application_id` (OneToOne to CreditApplication)
- `form_data` (JSONField) - Contains all form data

**Expected JSON Fields:**
- `agreement_template` (String)
- `governing_law` (String, nullable)
- `counterparty_events_of_default` (Text, nullable)
- `grace_period` (Text, nullable)
- `non_standard_provisions` (Text, nullable)
- `positive_netting_opinion` (Boolean, nullable)
- `has_csa` (Boolean, nullable)
- `csa_type` (String, nullable)
- `iosco_compliant` (Boolean, nullable)
- `csa_threshold` (Decimal, nullable)
- `csa_minimum_transfer` (Decimal, nullable)
- `csa_independent_amount` (Decimal, nullable)
- `positive_collateral_opinion` (Boolean, nullable)
- `legal_reviewer_id` (User ID)

#### CreditAnalysisForm (JSON-Based Model)
**Database Structure:**
- `id` (UUID, Primary Key)
- `credit_application_id` (OneToOne to CreditApplication)
- `form_data` (JSONField) - Contains all form data

**Expected JSON Fields:**
- Complex nested structure including:
  - Basic details (counterparty info, ratings)
  - Financial data (revenue, ratings tables)
  - Climate scoring matrix
  - MLRO decision fields

## 2. Frontend Form Field Analysis

### 2.1 Credit Request Form Fields
**Form State Structure (formData):**
```javascript
{
  // CreditApplication direct fields
  title: '',
  counterparty_id: null,
  
  // CreditRequestForm direct fields  
  guarantor_name: '',
  guarantor_cif: '',
  revenue_last_12m: '',
  revenue_projected_12m: '',
  projected_rorwa_percent: '',
  relationship_comments: '',
  legal_documentation: '',
  positive_legal_opinion: false,
  financial_statements_received: false,
  interim_statements_available: false,
  country_risk_limit_available: false,
  
  // Limit requests (array of objects)
  limit_requests: [
    {
      limit_type_id: '',
      existing_amount: '',
      existing_tenor: '',
      proposed_amount: '',
      proposed_tenor: '',
      comments: ''
    }
  ]
}
```

### 2.2 Credit Review Form Fields
**Form State Structure (formData):**
```javascript
{
  // Stored in CreditReviewForm.form_data JSON
  credit_reviewer_id: null,
  assigned_credit_analyst_id: null,
  delegated_authority_level: '',
  questionnaire_required: false,
  additional_information_request: '',
  rejection_reason: ''
}
```

### 2.3 Business Sponsorship Form Fields
**Form State Structure (formData):**
```javascript
{
  // Stored in BusinessSponsorshipForm.form_data JSON
  business_sponsor_id: null,
  is_approved: null,
  comments: '',
  second_business_sponsor_id: null,
  second_sponsor_approval: null,
  second_sponsor_comments: ''
}
```

### 2.4 Legal Review Form Fields
**Form State Structure (formData):**
```javascript
{
  // Stored in LegalReviewForm.form_data JSON
  agreement_template: '',
  governing_law: '',
  counterparty_events_of_default: '',
  grace_period: '',
  non_standard_provisions: '',
  positive_netting_opinion: null,
  has_csa: null,
  csa_type: '',
  iosco_compliant: null,
  csa_threshold: '',
  csa_minimum_transfer: '',
  csa_independent_amount: '',
  positive_collateral_opinion: null,
  legal_reviewer_id: null
}
```

## 3. Data Handling Mechanisms

### 3.1 Direct Database Fields
**Characteristics:**
- Fields directly mapped to Django model attributes
- Handled through standard Django serializer fields
- Validation and constraints enforced at model level
- Foreign key relationships explicitly defined

**Examples:**
- `CreditApplication.title`
- `CreditApplication.counterparty_id`
- `CreditRequestForm.guarantor_name`
- `CreditRequestForm.positive_legal_opinion`

### 3.2 JSON Field Storage
**Characteristics:**
- Entire form data stored as JSON blob
- More flexible but less structured
- Validation handled at serializer level
- No database-level constraints on individual fields

**Examples:**
- `CreditReviewForm.form_data`
- `BusinessSponsorshipForm.form_data`
- `LegalReviewForm.form_data`

### 3.3 Related Model Arrays (Limit Requests)
**Characteristics:**
- Separate model with foreign key relationship
- Handled as nested serializers
- Can have multiple instances per credit application

**Example:**
- `LimitRequest` model linked to `CreditApplication`

## 4. Current Implementation Assessment

### 4.1 Serializer Pattern Analysis

**Current Approach:**
```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    def update(self, instance, validated_data):
        # Pop form-specific data from self.initial_data
        credit_request_form_data = self.initial_data.get('credit_request_form', None)
        
        # Handle direct fields
        if credit_request_form_data is not None:
            CreditRequestForm.objects.update_or_create(
                credit_application=instance,
                defaults=credit_request_form_data
            )
        
        # Handle JSON fields
        business_sponsorship_form_data = self.initial_data.get('business_sponsorship_form', None)
        if business_sponsorship_form_data is not None:
            BusinessSponsorshipForm.objects.update_or_create(
                credit_application=instance, 
                defaults={'form_data': business_sponsorship_form_data}
            )
```

### 4.2 Frontend-Backend Data Flow

**Current Flow:**
1. Frontend maintains flat `formData` state
2. Frontend sends flat payload to backend
3. Backend serializer inspects `self.initial_data`
4. Serializer routes data to appropriate models/JSON fields

## 5. Identified Issues and Inconsistencies

### 5.1 Data Structure Inconsistencies

**Issue 1: Mixed Storage Approaches**
- `CreditRequestForm` uses direct database fields
- Other forms use JSON storage
- Inconsistent validation and querying capabilities

**Issue 2: Frontend-Backend Data Mapping**
- Frontend sends flat structure
- Backend expects nested structure for some forms
- Confusion between `validated_data` and `self.initial_data`

**Issue 3: Foreign Key Handling**
- Inconsistent handling of User ID fields
- Some forms need FK resolution, others store as JSON

### 5.2 Serializer Logic Issues

**Issue 1: Data Source Confusion**
```python
# Current problematic pattern
credit_request_form_data = self.initial_data.get('credit_request_form', None)
# But frontend sends flat data, not nested
```

**Issue 2: Validation Gaps**
- JSON fields lack proper validation
- Foreign key validation inconsistent
- Boolean field conversion issues

### 5.3 Form-Specific Problems

**Credit Request Form:**
- Limit requests array handling complexity
- FK relationships need proper resolution

**Other Forms:**
- All data stored as JSON loses type safety
- No database-level validation
- Difficult to query and report on

## 6. Complete Form Analysis Summary

### 6.1 Credit Request Form ✅ **Mostly Correct Implementation**
- **Storage**: Direct database fields (GOOD approach)
- **Issue**: Frontend sends `form_data` wrapper instead of direct fields
- **Dropdowns**: Properly stores IDs in state, but wrapped incorrectly
- **Limits**: Dynamic array handling works, but transformation logic has bugs

### 6.2 Credit Review Form ❌ **Full JSON Storage - Needs Task Assignment Logic**
- **Storage**: All data in `form_data` JSON blob
- **Frontend**: Sends nested `credit_review_form: { ... }` structure
- **Issue**: No type safety, difficult querying
- **Missing**: Proper FK relationships for Credit Reviewer (current user) and Assigned Credit Analyst (selected user)
- **Audit Fields**: Missing `form_start_date`, `form_completion_date`

### 6.3 Business Sponsorship Form ✅ **Correct Business Logic - Wrong Storage**
- **Storage**: All data in `form_data` JSON blob  
- **Frontend**: Sends nested `business_sponsorship_form: { ... }` structure
- **Business Logic**: ✅ CORRECTLY pulls sponsor names from Credit Request Form (as designed)
- **Issue**: Should use direct fields for decision fields, but sponsor identity should come from Credit Request
- **Design Note**: Business Sponsors are ASSIGNED in Credit Request, then RESPOND in Business Sponsorship

### 6.4 Legal Review Form ❌ **Full JSON Storage**
- **Storage**: All data in `form_data` JSON blob
- **Frontend**: Sends nested `legal_review_form: { ... }` structure
- **Issue**: Complex legal opinion logic stored as unstructured JSON
- **Missing**: Foreign key for `legal_reviewer_id` (stored as string in JSON)

### 6.5 Credit Questionnaire Form ❌ **Full JSON Storage**
- **Storage**: All data in `form_data` JSON blob
- **Frontend**: Sends nested `credit_questionnaire_form: { ... }` structure
- **Issue**: Complex tabbed form data all in JSON, no structure
- **Missing**: Relationship to business requirements in database

## 7. Comprehensive Issues Analysis

### 7.1 **Data Structure Inconsistency (MAJOR)**
```javascript
// Credit Request Form (CORRECT approach, WRONG implementation)
{
  guarantor_name: "John",           // Should be direct field
  limit_requests: [...]             // Correctly structured
}

// All Other Forms (WRONG approach)
{
  credit_review_form: {             // All wrapped in JSON
    credit_reviewer: "Jane",
    delegated_authority: "DA3"
  }
}
```

### 7.2 **Missing Audit Trail Fields**
None of the forms properly track:
- `form_started_at` - When user first opened the form
- `form_completed_at` - When user submitted the form
- These are currently in frontend state but not saved to database

### 7.3 **Foreign Key Issues**
- **Credit Request**: Has proper FK fields but frontend sends wrong data structure
- **Other Forms**: Store User IDs as strings in JSON instead of proper FK relationships

### 7.4 **User Assignment **
- **Credit Review**: No proper FK for `credit_reviewer_id` (current user) and `assigned_credit_analyst_id` (future assignee)
- **Business Sponsorship**: Correctly pulls sponsor identity from Credit Request (this is proper business logic)

### 7.5 **Business Logic Clarity**
- **✅ CORRECT**: Business Sponsorship gets sponsor names from Credit Request (sponsors are ASSIGNED there, RESPOND here)
- **❌ WRONG**: Credit Review stores user assignments as strings instead of proper FK relationships
- **Missing**: Future Credit Analysis Form needs to auto-route to assigned analyst

### 7.5 **Validation and Type Safety**
- JSON storage prevents database-level validation
- No foreign key constraints for user relationships
- Boolean fields stored as strings ("yes"/"no") instead of actual booleans

## 8. Recommended Solutions

### 8.1 **Standardize to Direct Fields Approach**

**For ALL Forms - Convert to Direct Database Fields (with Business Logic Considerations):**

```python
# Credit Review Form - Needs Task Assignment Logic
class CreditReviewForm(models.Model):
    # User relationships for task routing
    credit_reviewer_id = models.ForeignKey(User, on_delete=models.PROTECT, related_name='reviewed_applications')  # Current user
    assigned_credit_analyst_id = models.ForeignKey(User, on_delete=models.PROTECT, related_name='assigned_for_analysis')  # For future routing
    
    # Business fields
    delegated_authority_level = models.CharField(max_length=10, choices=DA_CHOICES)
    questionnaire_required = models.BooleanField(default=False)
    additional_information_request = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Audit fields
    form_started_at = models.DateTimeField(null=True)
    form_completed_at = models.DateTimeField(null=True)

# Business Sponsorship Form - Sponsor Identity from Credit Request
class BusinessSponsorshipForm(models.Model):
    # Sponsor identity (copied from Credit Request - read-only)
    senior_business_sponsor_name = models.CharField(max_length=255)  # From Credit Request
    senior_business_sponsor_id = models.UUIDField()  # Reference but not FK (immutable)
    
    # Sponsor response (editable by sponsor)
    sponsor_decision = models.CharField(max_length=20, choices=[('approve', 'Approve'), ('reject', 'Reject')])
    sponsor_comments = models.TextField()
    
    # Second sponsor (optional)
    second_business_sponsor_name = models.CharField(max_length=255, null=True)
    second_business_sponsor_id = models.UUIDField(null=True)
    second_sponsor_decision = models.CharField(max_length=20, choices=..., null=True)
    second_sponsor_comments = models.TextField(null=True)
    
    # Audit fields
    form_started_at = models.DateTimeField(null=True)
    form_completed_at = models.DateTimeField(null=True)
    
    # Remove: form_data = JSONField (legacy)

```

### 8.2 **Unified Frontend Data Pattern**

**All forms should send flat payloads with proper user assignment logic:**
```javascript
// Credit Review Form - Task Assignment Logic
const payload = {
  credit_reviewer_id: user.id,  // Auto-set to current user
  assigned_credit_analyst_id: selectedAnalystId,  // From dropdown for future routing
  delegated_authority_level: 'DA3',
  questionnaire_required: true,
  form_started_at: formStartedAt,
  form_completed_at: formCompletedAt
};

// Business Sponsorship Form - Sponsor Identity from Credit Request
const payload = {
  // Identity (copied from Credit Request - immutable)
  senior_business_sponsor_name: sponsorNameFromCreditRequest,
  senior_business_sponsor_id: sponsorIdFromCreditRequest,
  
  // Response (editable by current sponsor)
  sponsor_decision: 'approve',
  sponsor_comments: comments,
  form_started_at: formStartedAt,
  form_completed_at: formCompletedAt
};

// Legal Review Form fields  
const payload = {
  legal_reviewer_id: user.id,  // Current user performing review
  agreement_template: 'ISDA',
  governing_law: 'English Law',
  positive_legal_opinion: true,
  form_started_at: formStartedAt,
  form_completed_at: formCompletedAt
};
```

### 8.3 **Serializer Simplification**

```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    def update(self, instance, validated_data):
        # Extract by field prefixes instead of nested objects
        credit_review_fields = {k.replace('credit_review_', ''): v 
                               for k, v in validated_data.items() 
                               if k.startswith('credit_review_')}
        
        business_fields = {k.replace('business_', ''): v 
                          for k, v in validated_data.items() 
                          if k.startswith('business_')}
        
        # Update sub-forms with direct field mappings
        if credit_review_fields:
            # Handle user assignment for task routing
            credit_review_form, created = CreditReviewForm.objects.update_or_create(
                credit_application=instance, 
                defaults=credit_review_fields
            )
            
            # Create task for assigned analyst when form is completed
            if credit_review_form.form_completed_at and credit_review_form.assigned_credit_analyst_id:
                Task.objects.get_or_create(
                    assigned_to=credit_review_form.assigned_credit_analyst_id,
                    credit_application=instance,
                    task_type='CREDIT_ANALYSIS',
                    defaults={'status': 'PENDING'}
                )
        
        if business_fields:
            # Business Sponsorship - sponsor identity comes from Credit Request
            BusinessSponsorshipForm.objects.update_or_create(
                credit_application=instance, 
                defaults=business_fields
            )
```

## 9. Migration Strategy

### 9.1 **Phase 1: Add Direct Fields to Models**
1. Add all direct fields to each form model
2. Keep `form_data` JSON field temporarily for backward compatibility
3. Create migrations for new fields

### 9.2 **Phase 2: Update Serializers**
1. Modify serializers to handle both old JSON and new direct fields
2. Populate direct fields from JSON during transition period
3. Update frontend to send flat payloads

### 9.3 **Phase 3: Remove JSON Storage**
1. Remove `form_data` fields after all data migrated
2. Update all API calls to use new structure
3. Add proper database constraints and validation

## 10. Immediate Priority Actions

1. **Fix Credit Request Form** - Remove `form_data` wrapper, send direct fields
2. **Add Audit Fields** - Add `form_started_at`, `form_completed_at` to all models  
3. **Keep Business Sponsorship Logic** - Current sponsor source is CORRECT, just improve storage structure
4. **Standardize Dropdown Handling** - Ensure all FK fields receive proper IDs
5. **Update API Documentation** - Document the new flat payload structure