# Frontend-Backend Integration Patterns

This document describes the critical integration patterns between React frontend forms and Django REST Framework serializers in the Credit Workflow System.

## Overview

The system uses a **unified data flow architecture** where:
1. Frontend sends flat, prefixed JSON payloads
2. Backend serializer routes fields to appropriate sub-forms based on prefix
3. Type conversions happen in both directions (frontend and backend)

---

## 1. Field Prefix Pattern

The core routing mechanism for directing form data to appropriate backend models.

### Prefix Mapping

| Prefix | Backend Model |
|--------|---------------|
| (none) | CreditApplication |
| `credit_request_form_` | CreditRequestForm |
| `business_sponsorship_` | BusinessSponsorshipForm |
| `credit_questionnaire_` | CreditQuestionnaireForm |
| `legal_review_` | LegalReviewForm |
| `credit_review_` | CreditReviewForm |
| `credit_analysis_` | CreditAnalysisForm |
| `credit_compilation_` | CreditCompilationForm |
| `credit_approval_` | CreditApprovalForm |

### Frontend Implementation

```javascript
// In buildPayload() method of each form component
const buildPayload = () => {
    return {
        // Main CreditApplication fields (NO PREFIX)
        title: requestTitle,
        counterparty_id: selectedCounterparty,
        priority: priority,

        // Sub-form fields (PREFIXED with form name)
        credit_request_form_counterparty_cif: counterpartyCIF,
        credit_request_form_guarantor_name: guarantorName,
        credit_request_form_country_risk_limit_available: booleanize(countryRiskLimitAvailable),

        // Related objects as arrays
        limit_requests: limits.map(limit => ({
            limit_type_id: limit.type?.id || null,
            existing_amount: limit.existingAmount,
            proposed_amount: limit.proposedAmount,
        }))
    };
};
```

### Backend Processing

```python
def _extract_form_data(self, data):
    """Extract prefixed fields and route to appropriate form dictionaries."""
    prefix_map = get_dynamic_form_prefixes()
    form_groups = {form_name: {} for form_name in prefix_map.values()}

    for key, value in data.items():
        for prefix, form_type in prefix_map.items():
            if key.startswith(prefix):
                field_name = key[len(prefix):]
                form_groups[form_type][field_name] = value
                break

    return form_groups
```

---

## 2. Type Conversion Patterns

### Boolean Fields

**Problem**: Frontend sends "Yes"/"No" strings, backend expects Python booleans.

**Frontend Helper**:
```javascript
const booleanize = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'yes') return true;
        if (value.toLowerCase() === 'no') return false;
    }
    return null;
};

// Usage in payload
credit_request_form_country_risk_limit_available: booleanize(countryRiskLimitAvailable),
```

**Backend Helper**:
```python
def _convert_booleans(self, data, boolean_fields):
    """Convert string boolean values to actual booleans."""
    for field in boolean_fields:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                data[field] = value.lower() in ('yes', 'true')
            elif value is None:
                data[field] = False
    return data
```

**Data Loading (reverse conversion for display)**:
```javascript
// When loading from backend
setCountryRiskLimitAvailable(
    crf.country_risk_limit_available === true ? 'yes' :
    crf.country_risk_limit_available === false ? 'no' : ''
);
```

### DateTime Fields

**Frontend Helpers**:
```javascript
// For DateTimeFields (full ISO with timezone)
const formatDateTime = (date) => {
    return date ? new Date(date).toISOString() : null;
};

// For DateFields (YYYY-MM-DD only)
const formatDateOnly = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Usage
credit_request_form_form_started_at: formatDateTime(dateFormStarted),
credit_request_form_last_client_visit_date: formatDateOnly(lastClientVisitDate),
```

---

## 3. Foreign Key Resolution

### User References

User fields (business sponsors, relationship managers) are sent as IDs and resolved to User objects.

**Frontend Pattern**:
```javascript
// State stores user ID, not object
const [selectedBusinessSponsor, setSelectedBusinessSponsor] = useState('');

// Dropdown uses ID as value
<FormField
    label="Senior Business Sponsor"
    type="select"
    options={businessSponsors.map(u => ({
        value: u.id,
        label: `${u.first_name} ${u.last_name}`
    }))}
    value={selectedBusinessSponsor}
    onChange={(e) => setSelectedBusinessSponsor(e.target.value)}
/>

// Payload sends ID with _id suffix
credit_request_form_senior_business_sponsor_id: selectedBusinessSponsor,
```

**Backend Resolution**:
```python
def _resolve_user_fields(self, data, user_fields):
    """Resolve user ID fields to User instances."""
    for field in user_fields:
        if field in data and data[field]:
            try:
                user_field = field[:-3] if field.endswith('_id') else field
                user_id = data.pop(field)
                data[user_field] = User.objects.get(id=user_id)
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found for {field}")
    return data
```

**Data Loading**:
```javascript
// Handle object or ID response
if (data.relationship_manager) {
    if (typeof data.relationship_manager === 'object') {
        setRelationshipManager(data.relationship_manager.id);
    } else {
        setRelationshipManager(data.relationship_manager);
    }
}
```

### Counterparty with CIF Auto-Population

**Frontend Pattern**:
```javascript
// State for linked fields
const [selectedCounterparty, setSelectedCounterparty] = useState('');
const [counterpartyCIF, setCounterpartyCIF] = useState('');

// Selection handler auto-populates CIF
const handleCounterpartyChange = (e) => {
    const counterpartyId = e.target.value;
    setSelectedCounterparty(counterpartyId);

    if (counterpartyId) {
        const selected = counterparties.find(c => c.id === counterpartyId);
        if (selected) {
            setCounterpartyCIF(selected.cif_number || '');
        }
    } else {
        setCounterpartyCIF('');
    }
};
```

---

## 4. Related Object Arrays

### Limit Requests Pattern

Limit requests are sent as a separate array and processed independently.

**Frontend**:
```javascript
// Dynamic array state
const [limits, setLimits] = useState([
    { id: 1, type: '', existingAmount: '', proposedAmount: '' }
]);

// Add/remove handlers
const addLimit = () => {
    setLimits([...limits, {
        id: limits.length + 1,
        type: '',
        existingAmount: ''
    }]);
};

// In payload - extract IDs from type objects
limit_requests: limits.map(limit => ({
    limit_type_id: limit.type?.id || limit.limit_type_id || null,
    existing_amount: limit.existingAmount,
    proposed_amount: limit.proposedAmount,
    comments: limit.comments,
}))
```

**Backend**:
```python
def update(self, instance, validated_data):
    limit_requests_data = validated_data.pop('limit_requests', [])

    instance = super().update(instance, validated_data)

    if limit_requests_data:
        instance.limit_requests.all().delete()
        for limit_data in limit_requests_data:
            limit_data['credit_application'] = instance
            LimitRequest.objects.create(**limit_data)

    return instance
```

**Data Loading**:
```javascript
if (data.limit_requests && data.limit_requests.length > 0) {
    setLimits(data.limit_requests.map((l, index) => ({
        id: l.id || index + 1,
        type: limitTypes.find(lt => lt.id === l.limit_type?.id) || '',
        existingAmount: l.existing_amount || '',
        proposedAmount: l.proposed_amount || '',
    })));
}
```

---

## 5. Guarantor Selection Pattern

Guarantor can be selected from dropdown OR entered manually.

**Frontend**:
```javascript
// Dual state
const [selectedGuarantor, setSelectedGuarantor] = useState('');
const [selectedGuarantorName, setSelectedGuarantorName] = useState('');
const [guarantorName, setGuarantorName] = useState(''); // Manual fallback

// Selection populates name
const handleGuarantorChange = (e) => {
    const guarantorId = e.target.value;
    setSelectedGuarantor(guarantorId);

    if (guarantorId) {
        const selected = counterparties.find(c => c.id === guarantorId);
        if (selected) {
            setSelectedGuarantorName(selected.name);
        }
    }
};

// Payload prefers selected name over manual
credit_request_form_guarantor_name: selectedGuarantorName || guarantorName,
```

---

## 6. Common Pitfalls

| Pitfall | Wrong | Correct |
|---------|-------|---------|
| Missing prefix | `guarantor_name: value` | `credit_request_form_guarantor_name: value` |
| Object instead of ID | `limit_type: typeObject` | `limit_type_id: typeObject.id` |
| String boolean | `country_risk: 'yes'` | `country_risk: booleanize('yes')` |
| Wrong field name | `relationship_manager_id: value` | `relationship_manager: value` |

---

## 7. Validation and Error Handling

**Frontend Validation**:
```javascript
const handleSave = async () => {
    try {
        if (!selectedCounterparty) {
            setTransitionError('Please select a counterparty');
            return;
        }

        const payload = buildPayload();
        await updateCreditRequest(id, payload);
    } catch (error) {
        if (error.response?.data) {
            const errorMessages = [];
            Object.entries(error.response.data).forEach(([key, errors]) => {
                if (Array.isArray(errors)) {
                    errorMessages.push(`${key}: ${errors.join(', ')}`);
                }
            });
            setTransitionError(errorMessages.join('\n'));
        }
    }
};
```

---

## Summary

Key integration patterns:
- **Field prefix routing** - Routes flat payload fields to correct sub-models
- **Boolean conversion** - Frontend Yes/No strings ↔ Backend Python booleans
- **DateTime formatting** - ISO strings for DateTime, YYYY-MM-DD for Date
- **FK resolution** - Send IDs, resolve to objects on backend
- **Related arrays** - Handle separately from prefixed fields
- **Dual selection** - Support both dropdown and manual entry where needed
