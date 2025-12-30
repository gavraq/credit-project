# Simplified Serializer Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for transitioning the Credit Application system to use the simplified serializer pattern. This approach combines nested serializers for read operations with flat field extraction for write operations.

## Implementation Phases

### Phase 1: Backend Serializer Refactoring

#### 1.1 Create Form-Specific Serializers

**Tasks:**
- [ ] Create/update `CreditRequestFormSerializer`
- [ ] Create/update `CreditReviewFormSerializer`
- [ ] Create/update `BusinessSponsorshipFormSerializer`
- [ ] Create/update `LegalReviewFormSerializer`
- [ ] Create/update `CreditQuestionnaireFormSerializer`

**Example:**
```python
class CreditRequestFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditRequestForm
        exclude = ['credit_application']
        
class CreditReviewFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditReviewForm
        exclude = ['credit_application']
        
# ... other form serializers
```

#### 1.2 Update CreditApplicationSerializer

**Tasks:**
- [ ] Add nested serializers with read_only=True
- [ ] Update Meta.fields to include nested serializers
- [ ] Implement helper methods for field extraction
- [ ] Update create and update methods

**Example:**
```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    # Nested serializers for reading
    credit_request_form = CreditRequestFormSerializer(read_only=True)
    credit_review_form = CreditReviewFormSerializer(read_only=True)
    business_sponsorship_form = BusinessSponsorshipFormSerializer(read_only=True)
    legal_review_form = LegalReviewFormSerializer(read_only=True)
    
    class Meta:
        model = CreditApplication
        fields = [
            'id', 'title', 'reference_number', 'counterparty', 'priority',
            'required_by_date', 'credit_request_form', 'credit_review_form',
            'business_sponsorship_form', 'legal_review_form',
            # ... other fields
        ]
```

#### 1.3 Implement Helper Methods

**Tasks:**
- [ ] Implement `_extract_form_data` method
- [ ] Implement `_update_sub_form` method
- [ ] Implement `_resolve_user_fields` method
- [ ] Implement `_convert_booleans` method

**Example:**
```python
def _extract_form_data(self, data):
    """Extract form data based on field prefixes"""
    form_groups = {
        'credit_request': {},
        'credit_review': {},
        'business_sponsorship': {},
        'legal_review': {},
        'credit_questionnaire': {}
    }
    
    for key, value in data.items():
        for form_type in form_groups.keys():
            if key.startswith(f"{form_type}_"):
                field_name = key.replace(f"{form_type}_", "")
                form_groups[form_type][field_name] = value
    
    return form_groups
```

#### 1.4 Update Create/Update Methods

**Tasks:**
- [ ] Update `create` method to use the helper methods
- [ ] Update `update` method to use the helper methods
- [ ] Add proper error handling and transaction management

**Example:**
```python
@transaction.atomic
def create(self, validated_data):
    # Extract form data by prefix
    form_updates = self._extract_form_data(self.initial_data)
    
    # Create parent application
    instance = super().create(validated_data)
    
    # Create each sub-form
    for form_type, form_data in form_updates.items():
        if form_data:
            self._update_sub_form(instance, form_type, form_data)
    
    return instance
```

### Phase 2: Frontend Integration

#### 2.1 Update API Service Layer

**Tasks:**
- [ ] Update `submitCreditRequest` function to use prefixed fields
- [ ] Update `updateCreditRequest` function to use prefixed fields

#### 2.2 Update Form Data Mapping

**Tasks:**
- [ ] Update `buildPayload` function in CreditRequestForm component
- [ ] Modify field mapping to use prefixes

#### 2.3 Implement Interconnected Fields

**Tasks:**
- [ ] Implement backend preservation of sponsor identity fields
- [ ] Update BusinessSponsorshipForm to display read-only sponsor fields
- [ ] Ensure BusinessSponsorshipForm only sends editable fields

**Backend Example:**
```python
# In CreditApplicationSerializer
def _update_sub_form(self, instance, form_type, form_data):
    """Update sub-form with direct field mapping"""
    if form_type == 'business_sponsorship':
        # Get sponsor data from credit_request_form
        try:
            crf = instance.credit_request_form
            # Preserve sponsor information from credit request form
            form_data['senior_business_sponsor_id'] = crf.senior_business_sponsor_id
            form_data['senior_business_sponsor_name'] = crf.senior_business_sponsor_name
            form_data['second_business_sponsor_id'] = crf.second_business_sponsor_id
            form_data['second_business_sponsor_name'] = crf.second_business_sponsor_name
        except CreditRequestForm.DoesNotExist:
            pass
    
    # Normal form update logic
    model_map = {'credit_request': CreditRequestForm, 'business_sponsorship': BusinessSponsorshipForm}
    model_class = model_map.get(form_type)
    if model_class:
        model_class.objects.update_or_create(
            credit_application=instance,
            defaults=form_data
        )
```

**Frontend Example:**
```javascript
// In BusinessSponsorshipForm component
const BusinessSponsorshipForm = ({ creditApplication }) => {
  const { id } = useParams();
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorDecision, setSponsorDecision] = useState('');
  const [sponsorComments, setSponsorComments] = useState('');
  
  const populateFormData = (data) => {
    if (!data || !data.business_sponsorship_form) return;
    
    const bsData = data.business_sponsorship_form;
    
    // Sponsor identity (from Credit Request - immutable)
    setSponsorName(bsData.senior_business_sponsor_name || '');
    
    // Sponsor response (editable by current user)
    setSponsorDecision(bsData.sponsor_decision || '');
    setSponsorComments(bsData.sponsor_comments || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      // IMPORTANT: Don't send sponsor identity - backend handles this
      // business_sponsorship_senior_business_sponsor_name: sponsorName,  // <- DON'T SEND
      
      // Only send editable fields with proper prefixes
      business_sponsorship_sponsor_decision: sponsorDecision,
      business_sponsorship_sponsor_comments: sponsorComments,
    };

    try {
      const updatedData = await updateCreditApplication(id, payload);
      populateFormData(updatedData);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* READ-ONLY sponsor identity from Credit Request */}
      <FormField
        label="Senior Business Sponsor"
        type="text"
        value={sponsorName}
        disabled={true}  // Always disabled - comes from Credit Request
        helpText="This sponsor was nominated in the Credit Request form"
      />
      
      {/* EDITABLE sponsor response */}
      <div>
        <label>Your Decision as {sponsorName}</label>
        <button onClick={() => setSponsorDecision('approve')}>Approve</button>
        <button onClick={() => setSponsorDecision('reject')}>Reject</button>
      </div>

      <FormField
        label="Comments"
        type="textarea"
        value={sponsorComments}
        onChange={(e) => setSponsorComments(e.target.value)}
        required
      />
    </form>
  );
};
```

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

  // Create payload with prefixed fields for forms
  const payload = {
    // CreditApplication fields (no prefix)
    title: requestTitle || 'New Credit Application',
    counterparty: selectedCounterparty || null,
    priority: priority || 'Medium',
    required_by_date: formatDate(requiredByDate),
    
    // CreditRequestForm fields (prefixed)
    credit_request_form_started_at: formatDate(dateFormStarted),
    credit_request_form_completed_at: formatDate(dateFormCompleted),
    credit_request_counterparty_cif: counterpartyCIF || null,
    credit_request_guarantor_name: selectedGuarantorName || null,
    credit_request_guarantor_cif: guarantorCIF || null,
    credit_request_revenue_last_12m: revenueLast12Months || null,
    credit_request_revenue_projected_12m: revenueProjected12Months || null,
    credit_request_projected_rorwa_percent: projectedRorwa || null,
    credit_request_country_risk_limit_available: booleanize(countryRiskLimitAvailable),
    // ... other fields
  };

  return payload;
};
```

#### 2.3 Update Data Loading

**Tasks:**
- [ ] Update `fetchAppData` function to handle nested form objects

**Example:**
```javascript
// Extract data from nested response
if (data.credit_request_form) {
  const crf = data.credit_request_form;
  setDateFormStarted(crf.form_started_at || new Date().toISOString().slice(0, 16));
  setDateFormCompleted(crf.form_completed_at || '');
  setCounterpartyCIF(crf.counterparty_cif || '');
  // ... other fields
}
```

#### 2.4 Implement Dropdown Data Sources

**Tasks:**
- [ ] Audit all dropdown fields across forms
- [ ] Ensure backend provides list endpoints for all dropdown data sources
- [ ] Implement frontend dropdown components with proper data loading

**Backend Example:**
```python
# views.py
class CounterpartyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Counterparty.objects.all().order_by('name')
    serializer_class = CounterpartySerializer
    permission_classes = [IsAuthenticated]
    
    # Optional: Add filtering capabilities
    filterset_fields = ['status', 'country']
    search_fields = ['name', 'cif']

class UserByRoleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        role = self.request.query_params.get('role', None)
        if role:
            return User.objects.filter(roles__code=role).order_by('last_name', 'first_name')
        return User.objects.none()

# urls.py
router.register(r'counterparties', CounterpartyViewSet)
router.register(r'users-by-role', UserByRoleViewSet, basename='users-by-role')
```

**Frontend Example:**
```javascript
// api.js
export const fetchCounterparties = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const response = await api.get(`/api/counterparties/?${queryString}`);
  return response.data;
};

export const fetchUsersByRole = async (role) => {
  const response = await api.get(`/api/users-by-role/?role=${role}`);
  return response.data;
};

// Component with dropdowns
const CreditRequestForm = () => {
  // State for dropdown options
  const [counterparties, setCounterparties] = useState([]);
  const [businessSponsors, setBusinessSponsors] = useState([]);
  
  // State for selected values
  const [selectedCounterparty, setSelectedCounterparty] = useState(null);
  const [selectedBusinessSponsor, setSelectedBusinessSponsor] = useState(null);
  
  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        // Load counterparties
        const counterpartiesData = await fetchCounterparties();
        setCounterparties(counterpartiesData.results || []);
        
        // Load business sponsors
        const sponsorsData = await fetchUsersByRole('BUSINESS_SPONSOR');
        setBusinessSponsors(sponsorsData.results || []);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
      }
    };
    
    loadDropdownData();
  }, []);
  
  // When loading existing data
  useEffect(() => {
    if (data) {
      // Match counterparty ID with options
      if (data.credit_request_form?.counterparty_id) {
        const counterparty = counterparties.find(
          c => c.id === data.credit_request_form.counterparty_id
        );
        setSelectedCounterparty(counterparty || null);
      }
    }
  }, [data, counterparties]);
  
  // Build payload for submission
  const buildPayload = () => {
    return {
      // Prefixed fields
      credit_request_counterparty_id: selectedCounterparty?.id || null,
      credit_request_senior_business_sponsor_id: selectedBusinessSponsor?.id || null,
      // Other fields...
    };
  };
};
```

### Phase 3: Testing and Validation

#### 3.1 Backend Unit Tests

**Tasks:**
- [ ] Test serializer field validation
- [ ] Test create method with various payload combinations
- [ ] Test update method with various payload combinations
- [ ] Test error handling and edge cases
- [ ] Test dropdown data source endpoints

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

1. **Backend Serializer Refactoring**: 2 days
   - Day 1: Create form-specific serializers and update CreditApplicationSerializer
   - Day 2: Implement helper methods and update create/update methods

2. **Frontend Integration**: 1-2 days
   - Day 1: Update API service layer and buildPayload
   - Day 2: Update data loading and state management

3. **Testing and Validation**: 1-2 days
   - Day 1: Backend unit tests and integration tests
   - Day 2: Frontend testing

4. **Migration and Deployment**: 1 day
   - Deploy backend and frontend changes
   - Monitor for issues

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Frontend/backend misalignment | High | Comprehensive testing, clear field documentation |
| Data migration issues | Medium | Thorough testing with production-like data |
| Performance impact | Low | Monitor API response times, optimize if needed |
| Developer learning curve | Low | Clear documentation, code examples |

## Success Criteria

1. All form fields are correctly saved to their respective models
2. API responses include all form data in nested format
3. Frontend correctly displays all form data
4. No regression in existing functionality
5. All tests pass
6. No performance degradation

## Code Samples

### Backend: CreditApplicationSerializer

```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    # Nested serializers for reading
    credit_request_form = CreditRequestFormSerializer(read_only=True)
    credit_review_form = CreditReviewFormSerializer(read_only=True)
    business_sponsorship_form = BusinessSponsorshipFormSerializer(read_only=True)
    legal_review_form = LegalReviewFormSerializer(read_only=True)
    
    class Meta:
        model = CreditApplication
        fields = [
            'id', 'title', 'reference_number', 'counterparty', 'priority',
            'required_by_date', 'credit_request_form', 'credit_review_form',
            'business_sponsorship_form', 'legal_review_form',
            # ... other fields
        ]

    @transaction.atomic
    def update(self, instance, validated_data):
        # Extract form data by prefix
        form_updates = self._extract_form_data(self.initial_data)
        
        # Update parent application
        instance = super().update(instance, validated_data)
        
        # Update each sub-form
        for form_type, form_data in form_updates.items():
            if form_data:
                self._update_sub_form(instance, form_type, form_data)
        
        return instance

    def _extract_form_data(self, data):
        """Extract form data based on field prefixes"""
        form_groups = {
            'credit_request': {},
            'credit_review': {},
            'business_sponsorship': {},
            'legal_review': {},
            'credit_questionnaire': {}
        }
        
        for key, value in data.items():
            for form_type in form_groups.keys():
                if key.startswith(f"{form_type}_"):
                    field_name = key.replace(f"{form_type}_", "")
                    form_groups[form_type][field_name] = value
        
        return form_groups

    def _update_sub_form(self, instance, form_type, form_data):
        """Update sub-form with direct field mapping"""
        model_map = {
            'credit_request': CreditRequestForm,
            'credit_review': CreditReviewForm,
            'business_sponsorship': BusinessSponsorshipForm,
            'legal_review': LegalReviewForm,
            'credit_questionnaire': CreditQuestionnaireForm,
        }
        
        model_class = model_map.get(form_type)
        if model_class:
            # Handle special fields
            self._process_special_fields(form_type, form_data)
            
            # Add audit timestamp
            form_data['form_last_saved_at'] = timezone.now()
            
            # Update or create
            model_class.objects.update_or_create(
                credit_application=instance,
                defaults=form_data
            )
    
    def _process_special_fields(self, form_type, form_data):
        """Process special fields like booleans and foreign keys"""
        # Boolean fields by form type
        boolean_fields = {
            'credit_request': ['country_risk_limit_available', 'positive_legal_opinion',
                              'financial_statements_received', 'interim_statements_available'],
            'credit_review': ['approved', 'exceptions_noted'],
            'business_sponsorship': ['approved'],
            'legal_review': ['approved'],
        }
        
        # User fields by form type
        user_fields = {
            'credit_review': ['reviewer_id', 'approver_id'],
            'business_sponsorship': ['sponsor_id'],
            'legal_review': ['reviewer_id'],
        }
        
        # Convert booleans
        if form_type in boolean_fields:
            self._convert_booleans(form_data, boolean_fields[form_type])
        
        # Resolve user fields
        if form_type in user_fields:
            self._resolve_user_fields(form_data, user_fields[form_type])
```

### Frontend: buildPayload Function

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

  // Create payload with prefixed fields for forms
  const payload = {
    // CreditApplication fields (no prefix)
    title: requestTitle || 'New Credit Application',
    counterparty: selectedCounterparty || null,
    priority: priority || 'Medium',
    required_by_date: formatDate(requiredByDate),
    
    // CreditRequestForm fields (prefixed)
    credit_request_form_started_at: formatDate(dateFormStarted),
    credit_request_form_completed_at: formatDate(dateFormCompleted),
    credit_request_counterparty_cif: counterpartyCIF || null,
    credit_request_guarantor_name: selectedGuarantorName || null,
    credit_request_guarantor_cif: guarantorCIF || null,
    credit_request_country_risk_limit_available: booleanize(countryRiskLimitAvailable),
    
    // Add other form fields as needed
    
    // Limit requests remain the same
    limit_requests: limits
      .filter(l => l.type && (l.proposedAmount || l.existingAmount))
      .map(l => ({
        limit_type_id: l.type.id,
        existing_amount: l.existingAmount || null,
        existing_tenor: l.existingTenor || null,
        proposed_amount: l.proposedAmount || null,
        proposed_tenor: l.proposedTenor || null,
        comments: l.comments || '',
      })),
  };

  return payload;
};
```
