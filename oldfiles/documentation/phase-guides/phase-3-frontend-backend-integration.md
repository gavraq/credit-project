# Phase 3: Frontend-Backend Integration - Complete Implementation Guide

## Overview

Phase 3 implemented the missing React form components and resolved critical frontend-backend integration challenges. This phase focused on ensuring seamless data flow between React forms and Django serializers, addressing field persistence issues, and establishing patterns for handling different field types including relationships, nested objects, and dynamic dropdowns.

## Problem Statement

### Initial Integration Challenges

**Data Format Mismatch**:
- Frontend sent nested JSON objects
- Backend expected flat, prefixed fields
- Field names didn't match between layers
- Data persistence failures across all form types

**Field Type Handling Issues**:
- Boolean fields sent as strings vs actual booleans
- Foreign key relationships not resolving correctly
- DateTime fields timezone/format inconsistencies
- Dropdown selections not persisting

**Complex Data Structures**:
- Limit requests as separate model instances
- Counterparty relationships with CIF lookups
- Business sponsor user references
- Guarantor name/selection patterns

## Solution: Unified Data Flow Architecture

### 1. Field Prefix Pattern

The system uses a critical **field prefix pattern** to route data from frontend to the appropriate backend models.

#### Frontend Implementation

```javascript
// In buildPayload() method of each form component
const buildPayload = () => {
    const payload = {
        // Main CreditApplication fields (NO PREFIX)
        title: requestTitle,
        counterparty_id: selectedCounterparty,
        priority: priority,
        relationship_manager: relationshipManager,
        
        // CreditRequestForm fields (PREFIXED with 'credit_request_form_')
        credit_request_form_form_started_at: formatDateTime(dateFormStarted),
        credit_request_form_form_completed_at: formatDateTime(dateFormCompleted),
        credit_request_form_counterparty_cif: counterpartyCIF,
        credit_request_form_guarantor_name: selectedGuarantorName || guarantorName,
        credit_request_form_country_risk_limit_available: booleanize(countryRiskLimitAvailable),
        
        // Separate array for related objects
        limit_requests: limits.map(limit => ({
            limit_type_id: limit.type?.id || limit.limit_type_id || null,
            existing_amount: limit.existingAmount,
            proposed_amount: limit.proposedAmount,
            // ... other limit fields
        }))
    };
    return payload;
};
```

**Critical Pattern Rules**:
1. **Main model fields**: No prefix (e.g., `title`, `priority`)
2. **Sub-form fields**: Prefixed with form name + underscore (e.g., `credit_request_form_`)
3. **Related objects**: Sent as arrays in separate keys (e.g., `limit_requests`)

#### Backend Serializer Processing

```python
def _extract_form_data(self, data):
    """Extracts and routes prefixed fields to appropriate forms."""
    # Dynamic prefix discovery from metadata
    prefix_map = get_dynamic_form_prefixes()
    # Example: {'credit_request_form_': 'credit_request_form', ...}
    
    form_groups = {form_name: {} for form_name in prefix_map.values()}
    
    for key, value in data.items():
        for prefix, form_type in prefix_map.items():
            if key.startswith(prefix):
                # Extract field name by removing prefix
                field_name = key[len(prefix):]
                form_groups[form_type][field_name] = value
                break
    
    return form_groups
```

### 2. Field Type Conversion Patterns

#### Boolean Fields

**Problem**: Frontend sends "Yes"/"No" strings, backend expects Python booleans

**Frontend Pattern**:
```javascript
// Helper function in buildPayload
const booleanize = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'yes') return true;
        if (value.toLowerCase() === 'no') return false;
    }
    return null;
};

// Usage
credit_request_form_country_risk_limit_available: booleanize(countryRiskLimitAvailable),
```

**Backend Pattern**:
```python
def _convert_booleans(self, data, boolean_fields):
    """Convert string boolean values to actual booleans."""
    for field in boolean_fields:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                data[field] = value.lower() == 'yes' or value.lower() == 'true'
            elif value is None:
                data[field] = False
    return data
```

#### DateTime Fields

**Problem**: Timezone handling and format consistency

**Frontend Pattern**:
```javascript
// Helper for DateTimeFields (ISO string with timezone)
const formatDateTime = (date) => {
    return date ? new Date(date).toISOString() : null;
};

// Helper for DateFields (YYYY-MM-DD only)
const formatDateOnly = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Usage
credit_request_form_form_started_at: formatDateTime(dateFormStarted),
credit_request_form_last_client_visit_date: formatDateOnly(lastClientVisitDate),
```

**Backend Pattern**:
```python
# Automatic handling by Django DateTimeField and DateField
# No special conversion needed when format is correct
```

### 3. Foreign Key and Relationship Patterns

#### User References (Business Sponsors, Relationship Managers)

**Problem**: Frontend has user objects, backend needs user IDs

**Frontend Pattern**:
```javascript
// State management
const [selectedBusinessSponsor, setSelectedBusinessSponsor] = useState(''); // Stores user ID
const [businessSponsors, setBusinessSponsors] = useState([]); // Array of user objects

// Dropdown rendering
<FormField
    label="Senior Business Sponsor"
    type="select"
    options={[
        { value: '', label: 'Select senior business sponsor' },
        ...businessSponsors.map(u => ({ 
            value: u.id, 
            label: `${u.first_name} ${u.last_name} (${u.username})` 
        }))
    ]}
    value={selectedBusinessSponsor}
    onChange={(e) => setSelectedBusinessSponsor(e.target.value)}
/>

// In payload
credit_request_form_senior_business_sponsor_id: selectedBusinessSponsor,
```

**Backend Pattern**:
```python
def _resolve_user_fields(self, data, user_fields):
    """Resolve user ID fields to actual User instances."""
    for field in user_fields:
        if field in data and data[field]:
            try:
                # Handle both 'field' and 'field_id' patterns
                if field.endswith('_id'):
                    user_field = field[:-3]  # Remove '_id' suffix
                else:
                    user_field = field
                
                user_id = data.pop(field)  # Remove the ID field
                data[user_field] = User.objects.get(id=user_id)
            except User.DoesNotExist:
                logger.warning(f"User with ID {user_id} not found for field {field}")
    return data
```

#### Counterparty Pattern with CIF Lookup

**Problem**: Counterparty selection updates both name and CIF fields

**Frontend Pattern**:
```javascript
// State for counterparty selection
const [selectedCounterparty, setSelectedCounterparty] = useState(''); // ID
const [counterpartyCIF, setCounterpartyCIF] = useState(''); // Auto-populated
const [counterpartyName, setCounterpartyName] = useState(''); // For display

// Handle counterparty selection
const handleCounterpartyChange = (e) => {
    const counterpartyId = e.target.value;
    setSelectedCounterparty(counterpartyId);
    
    if (counterpartyId) {
        const selected = counterparties.find(c => c.id === counterpartyId);
        if (selected) {
            setCounterpartyCIF(selected.cif_number || '');
            setCounterpartyName(selected.name || '');
        }
    } else {
        setCounterpartyCIF('');
        setCounterpartyName('');
    }
};
```

**Backend Pattern**:
```python
# Model includes denormalized fields for performance
class CreditRequestForm(models.Model):
    counterparty_cif = models.CharField(max_length=50, blank=True)
    counterparty_name = models.CharField(max_length=255, blank=True)  # Denormalized
    
    def save(self, *args, **kwargs):
        # Update denormalized name if CIF changed
        if self.counterparty_cif and hasattr(self, 'credit_application'):
            if self.credit_application.counterparty:
                self.counterparty_name = self.credit_application.counterparty.name
        super().save(*args, **kwargs)
```

### 4. Complex Data Structure Patterns

#### Limit Requests (One-to-Many Relationship)

**Problem**: Multiple limit request objects need to be created/updated separately

**Frontend Pattern**:
```javascript
// State for dynamic limit array
const [limits, setLimits] = useState([
    { id: 1, type: '', existingAmount: '', proposedAmount: '', comments: '' }
]);

// Add/remove limits dynamically
const addLimit = () => {
    setLimits([...limits, { 
        id: limits.length + 1, 
        type: '', 
        existingAmount: '', 
        proposedAmount: '' 
    }]);
};

// In payload - extract just the data needed
limit_requests: limits.map(limit => ({
    limit_type_id: limit.type?.id || limit.limit_type_id || null,
    existing_amount: limit.existingAmount,
    existing_tenor: limit.existingTenor,
    proposed_amount: limit.proposedAmount,
    proposed_tenor: limit.proposedTenor,
    comments: limit.comments,
}))
```

**Backend Pattern**:
```python
def update(self, instance, validated_data):
    # Extract limit requests before processing
    limit_requests_data = validated_data.pop('limit_requests', [])
    
    # Update main instance
    instance = super().update(instance, validated_data)
    
    # Handle limit requests separately
    if limit_requests_data:
        # Clear existing limits
        instance.limit_requests.all().delete()
        
        # Create new limits
        for limit_data in limit_requests_data:
            limit_data['credit_application'] = instance
            LimitRequest.objects.create(**limit_data)
    
    return instance
```

#### Guarantor Selection Pattern

**Problem**: Guarantor can be selected from dropdown OR entered manually

**Frontend Pattern**:
```javascript
// Dual state for guarantor
const [selectedGuarantor, setSelectedGuarantor] = useState(''); // ID from dropdown
const [selectedGuarantorName, setSelectedGuarantorName] = useState(''); // Name from selection
const [guarantorName, setGuarantorName] = useState(''); // Manual entry fallback

// Handle selection
const handleGuarantorChange = (e) => {
    const guarantorId = e.target.value;
    setSelectedGuarantor(guarantorId);
    
    if (guarantorId) {
        const selected = counterparties.find(c => c.id === guarantorId);
        if (selected) {
            setSelectedGuarantorName(selected.name);
            setGuarantorCIF(selected.cif_number || '');
        }
    }
};

// In payload - prefer selected name over manual entry
credit_request_form_guarantor_name: selectedGuarantorName || guarantorName,
```

### 5. Data Loading and Persistence Patterns

#### Loading Data from Backend

**Frontend Pattern**:
```javascript
useEffect(() => {
    const fetchAppData = async () => {
        if (id) {
            const data = await fetchCreditRequest(id);
            
            // Main fields
            setRequestTitle(data.title || '');
            setPriority(data.priority || 'Medium');
            
            // Sub-form data
            const crf = data.credit_request_form || {};
            
            // Convert booleans back to form control values
            setCountryRiskLimitAvailable(
                crf.country_risk_limit_available === true ? 'yes' : 
                crf.country_risk_limit_available === false ? 'no' : ''
            );
            
            // Handle user references
            if (data.relationship_manager) {
                if (typeof data.relationship_manager === 'object') {
                    setRelationshipManager(data.relationship_manager.id);
                } else {
                    setRelationshipManager(data.relationship_manager);
                }
            }
            
            // Load limit requests
            if (data.limit_requests && data.limit_requests.length > 0) {
                setLimits(data.limit_requests.map((l, index) => ({
                    id: l.id || index + 1,
                    type: limitTypes.find(lt => lt.id === l.limit_type?.id) || '',
                    existingAmount: l.existing_amount || '',
                    proposedAmount: l.proposed_amount || '',
                    comments: l.comments || '',
                })));
            }
        }
    };
    
    fetchAppData();
}, [id]);
```

### 6. Validation and Error Handling

#### Frontend Validation

```javascript
const handleSave = async () => {
    try {
        // Validate required fields
        if (!selectedCounterparty) {
            setTransitionError('Please select a counterparty');
            return;
        }
        
        const payload = buildPayload();
        
        if (id) {
            await updateCreditRequest(id, payload);
        } else {
            const newApplication = await submitCreditRequest(payload);
            navigate(`/credit-requests/${newApplication.id}/details`);
        }
    } catch (error) {
        // Handle validation errors from API
        if (error.response?.data) {
            const errorData = error.response.data;
            const errorMessages = [];
            
            Object.keys(errorData).forEach(key => {
                const fieldErrors = errorData[key];
                if (Array.isArray(fieldErrors)) {
                    errorMessages.push(`${key}: ${fieldErrors.join(', ')}`);
                }
            });
            
            setTransitionError(errorMessages.join('\n'));
        }
    }
};
```

#### Backend Validation

```python
class CreditRequestFormSerializer(serializers.ModelSerializer):
    # Field-level validation
    country_risk_limit_available = serializers.BooleanField(required=False)
    
    def validate_counterparty_cif(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("CIF must contain only digits")
        return value
    
    def validate(self, data):
        # Cross-field validation
        if data.get('priority') == 'High' and not data.get('high_priority_justification'):
            raise serializers.ValidationError({
                'high_priority_justification': 'Required for high priority requests'
            })
        return data
```

## Implementation Examples

### Credit Analysis Form Implementation

```javascript
// CreditAnalysisForm/index.jsx
const buildPayload = useCallback(() => {
    return {
        // All fields prefixed for credit_analysis_form
        credit_analysis_credit_analyst: creditAnalyst,
        credit_analysis_industry_analysis: industryAnalysis,
        credit_analysis_business_model_assessment: businessModelAssessment,
        credit_analysis_management_quality: managementQuality,
        credit_analysis_financial_analysis: financialAnalysis,
        credit_analysis_revenue_analysis: revenueAnalysis,
        credit_analysis_profitability_analysis: profitabilityAnalysis,
        credit_analysis_cash_flow_analysis: cashFlowAnalysis,
        credit_analysis_leverage_analysis: leverageAnalysis,
        credit_analysis_liquidity_analysis: liquidityAnalysis,
        credit_analysis_capital_structure: capitalStructure,
        credit_analysis_debt_service_coverage: debtServiceCoverage,
        credit_analysis_key_financial_covenants: keyFinancialCovenants,
        credit_analysis_financial_projections: financialProjections,
        credit_analysis_stress_test_results: stressTestResults,
        credit_analysis_key_risk_factors: keyRiskFactors,
        credit_analysis_mitigating_factors: mitigatingFactors,
        credit_analysis_environmental_risks: environmentalRisks,
        credit_analysis_social_risks: socialRisks,
        credit_analysis_governance_assessment: governanceAssessment,
        credit_analysis_climate_risk_score: climateRiskScore,
        credit_analysis_esg_score: esgScore,
        credit_analysis_credit_rating_rationale: creditRatingRationale,
        credit_analysis_credit_rating_recommendation: creditRatingRecommendation,
        credit_analysis_probability_of_default: probabilityOfDefault,
        credit_analysis_loss_given_default: lossGivenDefault,
        credit_analysis_recommendations: recommendations,
        credit_analysis_analysis_completed_at: analysisCompletedAt ? new Date(analysisCompletedAt).toISOString() : null,
        credit_analysis_ready_for_compilation: readyForCompilation
    };
}, [/* all dependencies */]);
```

## Common Pitfalls and Solutions

### 1. Field Name Mismatches

**Problem**: Frontend field name doesn't match backend expectation
```javascript
// Wrong
relationship_manager_id: relationshipManager

// Correct - backend expects 'relationship_manager'
relationship_manager: relationshipManager
```

### 2. Missing Prefix

**Problem**: Sub-form field sent without prefix
```javascript
// Wrong
guarantor_name: selectedGuarantorName

// Correct
credit_request_form_guarantor_name: selectedGuarantorName
```

### 3. Nested Object Instead of ID

**Problem**: Sending full object when backend expects ID
```javascript
// Wrong
limit_type: limitTypeObject

// Correct
limit_type_id: limitTypeObject.id
```

### 4. Boolean String Conversion

**Problem**: Not converting dropdown "yes"/"no" to boolean
```javascript
// Wrong
credit_request_form_country_risk_limit_available: countryRiskLimitAvailable // "yes"

// Correct
credit_request_form_country_risk_limit_available: booleanize(countryRiskLimitAvailable) // true
```

## Testing Patterns

### Frontend Testing Approach

```javascript
// Log payload before submission
console.log('Submitting payload:', JSON.stringify(payload, null, 2));

// Log specific field mappings
console.log('Guarantor name values:', {
    selectedGuarantorName,
    guarantorName,
    final: selectedGuarantorName || guarantorName
});

// Verify field presence
console.log('Relationship manager value:', {
    relationshipManager,
    inPayload: payload.relationship_manager
});
```

### Backend Testing Approach

```python
# Add logging to serializer
logger.info(f"Received payload keys: {list(validated_data.keys())}")
logger.info(f"Extracted form data: {form_updates}")

# Log field processing
for form_type, form_data in form_updates.items():
    logger.info(f"Processing {form_type} with fields: {list(form_data.keys())}")
```

## Reference Implementation Patterns

### For New Forms

1. **Create React Component** with buildPayload using prefix pattern
2. **Handle all field types** using established conversion helpers
3. **Implement bidirectional data flow** (save and load)
4. **Add to ApplicationLoader** component map
5. **Ensure backend serializer** handles the prefixed fields
6. **Test field persistence** thoroughly

### For New Field Types

1. **Identify field type** (boolean, user FK, datetime, etc.)
2. **Apply appropriate pattern** from this guide
3. **Add to backend field mappings** if needed
4. **Test serialization/deserialization** both directions
5. **Document any special handling** required

## Summary

Phase 3 established robust patterns for frontend-backend integration that handle:
- ✅ Field prefix routing system
- ✅ Type conversions (boolean, datetime, user references)
- ✅ Complex relationships (counterparties, guarantors, limits)
- ✅ Dynamic dropdown populations
- ✅ Bidirectional data flow
- ✅ Validation and error handling

These patterns provide a reference implementation for all future form development in the credit workflow system.