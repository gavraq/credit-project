# Simplified Serializer Approach for Credit Application Forms

## Overview

This document explains the simplified serializer approach for handling multiple related forms in the Credit Application system. This pattern provides a clean, maintainable, and scalable way to manage form data across multiple related models while avoiding the complexities of nested serializers for write operations.

## Key Concepts

### 1. Hybrid Serialization Strategy

The approach uses a hybrid strategy:
- **Reading data (GET)**: Uses nested serializers for intuitive, structured responses
- **Writing data (POST/PUT)**: Uses flat field extraction with prefixes for simplicity

This gives you the best of both worlds - structured data for reading and simple data for writing.

### 2. Form-Specific Models

Each form has its own dedicated model with direct database fields:

- `CreditApplication` - The parent model that ties everything together
- `CreditRequestForm` - Initial request form with counterparty details, financial data, etc.
- `CreditReviewForm` - Credit team's review and assessment
- `BusinessSponsorshipForm` - Business sponsor approval details
- `LegalReviewForm` - Legal team's review and approval
- `CreditQuestionnaireForm` - Additional questionnaire responses
- 'CreditAnalysisForm' - not yet implemented
- 'CreditCompilationForm' - not yet implemented
- 'CreditApprovalForm' - not yet implemented

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

The `CreditApplicationSerializer` has two distinct parts:

1. **Read Operations**: Nested serializers for GET responses
   ```python
   credit_request_form = CreditRequestFormSerializer(read_only=True)
   credit_review_form = CreditReviewFormSerializer(read_only=True)
   # ... other nested serializers
   ```

2. **Write Operations**: Helper methods for field extraction and form updates
   ```python
   def _extract_form_data(self, data):
       # Extract form data by prefix
   
   def _update_sub_form(self, instance, form_type, form_data):
       # Update or create sub-form
   ```

### Form Field Prefixing

When sending data to the API, fields are prefixed to indicate which form they belong to:

| Form Type | Model | Field Prefix | Example Fields |
|-----------|-------|--------------|---------------|
| Credit Request | CreditRequestForm | `credit_request_` | `credit_request_form_started_at`, `credit_request_counterparty_cif` |
| Credit Review | CreditReviewForm | `credit_review_` | `credit_review_approved_by`, `credit_review_risk_rating` |
| Business Sponsorship | BusinessSponsorshipForm | `business_sponsorship_` | `business_sponsorship_sponsor_id`, `business_sponsorship_approval_date` |
| Legal Review | LegalReviewForm | `legal_review_` | `legal_review_approved_by`, `legal_review_comments` |
| Credit Questionnaire | CreditQuestionnaireForm | `credit_questionnaire_` | `credit_questionnaire_completed`, `credit_questionnaire_score` |

## Limits Handling

Unlike the form models that have one-to-one relationships with CreditApplication, limits are handled as a one-to-many relationship. The simplified serializer approach maintains the existing pattern for limits, which is already working well:

### Backend Implementation

```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    # Nested serializers for reading
    credit_request_form = CreditRequestFormSerializer(read_only=True)
    # ... other form serializers
    
    # Limits are handled separately with their own serializer
    limit_requests = LimitRequestSerializer(many=True, read_only=True)
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract form data by prefix
        form_updates = self._extract_form_data(self.initial_data)
        
        # Extract limit requests (handled separately from form data)
        limit_requests_payload = self.initial_data.get('limit_requests', [])
        
        # Create parent application
        instance = super().create(validated_data)
        
        # Create each sub-form
        for form_type, form_data in form_updates.items():
            if form_data:
                self._update_sub_form(instance, form_type, form_data)
        
        # Handle limits separately
        if limit_requests_payload:
            for lr_data in limit_requests_payload:
                # Process and create limit requests
                # ...
        
        return instance
```

### Frontend Implementation

In the frontend, limits are maintained in a separate array state and sent as a distinct part of the payload:

```javascript
// In buildPayload()
const payload = {
  // CreditApplication fields (no prefix)
  title: requestTitle || 'New Credit Application',
  // ... other fields
  
  // Prefixed form fields
  credit_request_form_started_at: formatDate(dateFormStarted),
  // ... other prefixed fields
  
  // Limit requests as a separate array
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
```

### Benefits of This Approach for Limits

1. **Maintains Working Code**: The current limits implementation is already working well
2. **Clean Separation**: Limits remain separate from form fields, appropriate for a one-to-many relationship
3. **Consistent API**: The API structure for limits remains intuitive
4. **No Migration Needed**: No data migration required for limits

### Special Field Handling

#### Boolean Fields
Boolean fields are converted from string representations ('true'/'false', 'yes'/'no') to Python booleans, with special handling for empty strings and null values:

```python
def _convert_booleans(self, form_data, boolean_fields):
    for field in boolean_fields:
        if field in form_data:
            value = form_data[field]
            # Handle None and empty string
            if value is None or (isinstance(value, str) and value.strip() == ''):
                form_data[field] = None
            # Handle string booleans
            elif isinstance(value, str):
                value_lower = value.lower()
                if value_lower in ('true', 'yes'):
                    form_data[field] = True
                elif value_lower in ('false', 'no'):
                    form_data[field] = False
                else:
                    # For any other string value, set to None to avoid validation errors
                    form_data[field] = None
```

This approach ensures that:
1. Empty strings (`''`) are safely converted to `None` to avoid validation errors
2. Both 'true'/'false' and 'yes'/'no' string representations are properly handled
3. Any unexpected string values are converted to `None` rather than causing validation errors

#### User Foreign Key Fields
User foreign keys are resolved from IDs to User instances:

```python
def _resolve_user_fields(self, form_data, user_fields):
    for field in user_fields:
        if field in form_data and form_data[field]:
            try:
                user = User.objects.get(id=form_data[field])
                form_data[field.replace('_id', '')] = user
                form_data.pop(field, None)
            except User.DoesNotExist:
                form_data.pop(field, None)
```

## API Interaction Examples

### GET Response Example

```json
{
  "id": 42,
  "title": "New Credit Application",
  "reference_number": "CR-2025-0042",
  "counterparty": {
    "id": 123,
    "name": "Acme Corp"
  },
  "priority": "High",
  "required_by_date": "2025-07-15",
  
  "credit_request_form": {
    "id": 42,
    "form_started_at": "2025-06-20T09:00:00",
    "counterparty_cif": "CIF123456",
    "guarantor_name": "Acme Holdings Ltd",
    "country_risk_limit_available": true,
    "revenue_last_12m": 5000000
  },
  
  "credit_review_form": {
    "id": 24,
    "approved": false,
    "risk_rating": "B+",
    "comments": "Pending additional documentation"
  },
  
  "business_sponsorship_form": {
    "id": 18,
    "sponsor": {
      "id": 42,
      "name": "Jane Smith"
    },
    "approval_date": "2025-06-25",
    "approved": true
  },
  
  "legal_review_form": {
    "id": 15,
    "approved": true,
    "comments": "Documentation is satisfactory"
  }
}
```

### POST/PUT Request Example

```json
{
  "title": "Updated Credit Application",
  "counterparty_id": 123,
  "priority": "Medium",
  "required_by_date": "2025-07-20",
  
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

1. **Simplified Code**: Less boilerplate, more focused helper methods
2. **Intuitive API**: Nested responses for GET, flat fields for POST/PUT
3. **Clear Separation**: Read operations use nested serializers, write operations use flat extraction
4. **Maintainable**: Easier to add new forms and fields
5. **Flexible**: Better support for form-specific field handling
6. **DRF Integration**: Works with standard DRF patterns and validation

## Handling Interconnected Fields

Some fields are connected between different forms. For example, the Business Sponsor nominated in the Credit Request Form should appear pre-populated in the Business Sponsorship Form. The simplified serializer approach handles these interconnected fields through a combination of backend preservation and frontend read-only display.

### Backend Implementation

The backend preserves immutable fields across forms:

```python
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

### Frontend Implementation

The frontend treats interconnected fields as immutable in dependent forms:

```javascript
// In BusinessSponsorshipForm component
const BusinessSponsorshipForm = ({ creditApplication }) => {
  const { id } = useParams();
  const [sponsorName, setSponsorName] = useState('');
  const [secondSponsorName, setSecondSponsorName] = useState('');
  const [sponsorDecision, setSponsorDecision] = useState('');
  const [sponsorComments, setSponsorComments] = useState('');
  
  const populateFormData = (data) => {
    if (!data) return;

    // SPONSOR IDENTITY: Auto-populated from Credit Request (read-only)
    if (data.business_sponsorship_form) {
      const bsData = data.business_sponsorship_form;
      
      // Sponsor identity (from Credit Request - immutable)
      setSponsorName(bsData.senior_business_sponsor_name || '');
      setSecondSponsorName(bsData.second_business_sponsor_name || '');
      
      // Sponsor response (editable by current user)
      setSponsorDecision(bsData.sponsor_decision || '');
      setSponsorComments(bsData.sponsor_comments || '');
    } else {
      // Fallback: If no business sponsorship form exists
      setSponsorName('Will be populated from Credit Request');
      setSecondSponsorName('Will be populated from Credit Request');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const businessSponsorshipPayload = {
      // IMPORTANT: Don't send sponsor identity - backend handles this
      // senior_business_sponsor_name: sponsorName,  // <- DON'T SEND (immutable)
      // senior_business_sponsor_id: sponsorId,      // <- DON'T SEND (immutable)
      
      // Only send editable fields
      business_sponsorship_sponsor_decision: sponsorDecision,
      business_sponsorship_sponsor_comments: sponsorComments,
      // ... other editable fields with proper prefixes
    };

    try {
      const updatedData = await updateCreditApplication(id, businessSponsorshipPayload);
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

This approach ensures that:
1. The Business Sponsorship Form displays sponsor information from the Credit Request Form
2. The backend preserves sponsor identity fields during updates
3. The frontend only sends editable fields in the payload, not immutable fields

### Benefits

1. **Simplified API Responses**: Nested serializers provide clean, structured responses for GET requests
2. **DRF Validation**: Leverages DRF's validation system for all fields
3. **Reduced Boilerplate**: Fewer helper methods and less code than full prefix-based approach
4. **Intuitive Frontend Integration**: Clear mapping between frontend state and API fields
5. **Maintainable**: Changes to form structure require minimal code changes
6. **Field Synchronization**: Connected fields stay in sync through frontend state management

### Limitations

1. **Requires Consistent Prefixing**: Frontend must maintain consistent field prefixing
2. **Manual Field Extraction**: Backend needs helper methods to extract and process fields
3. **Special Field Handling**: Booleans, dates, and foreign keys need special processing
4. **Frontend State Management**: Requires careful state management for interconnected fields

## Handling Dropdown Data Sources

Many forms include dropdown fields populated from backend data sources. The simplified serializer approach needs to handle these dropdowns consistently, with a focus on auto-populating related fields (like CIF and name):

### Backend Implementation

1. **List Endpoints**: Provide basic endpoints for dropdown data sources

```python
# views.py
class CounterpartyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Counterparty.objects.all().order_by('name')
    serializer_class = CounterpartySerializer
    permission_classes = [IsAuthenticated]

class UserByRoleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        role = self.request.query_params.get('role', None)
        if role:
            return User.objects.filter(roles__code=role).order_by('last_name', 'first_name')
        return User.objects.none()
```

2. **URLs Configuration**:

```python
# urls.py
router.register(r'counterparties', CounterpartyViewSet)
router.register(r'users-by-role', UserByRoleViewSet, basename='users-by-role')
```

### Frontend Implementation

1. **Improved Dropdown Component**:

```javascript
// CounterpartySection.jsx
const CounterpartySection = ({
  counterparties,
  loadingCounterparties,
  counterpartyError,
  selectedCounterparty,
  setSelectedCounterparty,
  counterpartyCIF,
  setCounterpartyCIF,
  selectedGuarantor,
  setSelectedGuarantor,
  guarantorCIF,
  setGuarantorCIF,
  selectedGuarantorName,
  setSelectedGuarantorName,
  colors,
  disabled
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
      {loadingCounterparties ? (
        <div style={{ gridColumn: '1 / span 2', color: '#888', fontSize: '0.95rem' }}>Loading counterparties...</div>
      ) : counterpartyError ? (
        <div style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '0.95rem' }}>Error loading counterparties: {counterpartyError}</div>
      ) : (
        <>
          <FormField
            label="Counterparty Name"
            type="select"
            required={true}
            options={[
              { value: '', label: 'Select counterparty...' }, // Add placeholder option
              ...counterparties.map(cp => ({ value: cp.id, label: cp.name }))
            ]}
            value={selectedCounterparty}
            onChange={e => {
              setSelectedCounterparty(e.target.value);
              const found = counterparties.find(cp => String(cp.id) === e.target.value);
              setCounterpartyCIF(found ? found.cif_number : '');
            }}
            colors={colors}
            disabled={disabled}
          />
          <FormField
            label="Counterparty CIF number"
            placeholder="Auto-populated from selection"
            required={true}
            value={counterpartyCIF}
            disabled={true}
            colors={colors}
          />
          {/* Similar pattern for other dropdowns */}
        </>
      )}
    </div>
  );
};
```

2. **Serializer Helper for Auto-Population**:

```python
# serializers.py
def _resolve_counterparty_selection(self, form_data, id_field, cif_field, name_field=None):
    """Auto-populate counterparty CIF and name when ID is provided"""
    counterparty_id = form_data.get(id_field)
    
    if counterparty_id:
        try:
            counterparty = Counterparty.objects.get(id=counterparty_id)
            
            # Auto-populate the CIF field
            form_data[cif_field] = counterparty.cif_number or ''
            
            # Auto-populate the name field if provided
            if name_field and name_field in form_data:
                form_data[name_field] = counterparty.name
                
        except Counterparty.DoesNotExist:
            form_data[id_field] = None
            form_data[cif_field] = ''
            if name_field:
                form_data[name_field] = ''
```

### Handling Selected Values

When loading existing data, the frontend needs to match IDs with dropdown options and auto-populate related fields:

```javascript
// In CreditRequestForm component
useEffect(() => {
  if (data) {
    // Match counterparty ID with options
    if (data.credit_request_form?.counterparty_id) {
      const counterparty = counterparties.find(
        c => c.id === data.credit_request_form.counterparty_id
      );
      setSelectedCounterparty(counterparty?.id || '');
      setCounterpartyCIF(counterparty?.cif_number || '');
    }
    
    // Match guarantor ID with options
    if (data.credit_request_form?.guarantor_id) {
      const guarantor = counterparties.find(
        c => c.id === data.credit_request_form.guarantor_id
      );
      setSelectedGuarantor(guarantor?.id || '');
      setGuarantorCIF(guarantor?.cif_number || '');
      setSelectedGuarantorName(guarantor?.name || '');
    }
    
    // Other fields...
  }
}, [data, counterparties]);
```

## Limitations and Considerations

1. **Frontend Changes**: Requires frontend to use prefixed fields for write operations
2. **Serializer Updates**: All serializers need to be updated to handle prefixed fields
3. **Testing**: Comprehensive testing needed to ensure all fields are correctly mapped
4. **Documentation**: Clear documentation needed for frontend developers
5. **Dropdown Data**: Ensure backend provides all necessary dropdown data sources
