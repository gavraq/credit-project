# Credit Risk Workflow - Simplified Implementation Plan

## Overview
This implementation plan converts your credit risk workflow from mixed JSON/direct field storage to a unified direct field approach, streamlining the serializer and improving data integrity. **Focus on structural fixes first, task assignment later.**

## Phase 1: Foundation Setup (Week 1)

### 1.1 Add Audit Fields to All Models
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: None

**Models to Update:**
```python
# Add to ALL form models
form_started_at = models.DateTimeField(null=True, blank=True)
form_completed_at = models.DateTimeField(null=True, blank=True)
```

**Files to Modify:**
- `credit_applications/models.py`
- Create migration: `python manage.py makemigrations`

**Testing:**
- Run migration on development database
- Verify new fields appear in Django admin
- Test that forms can save these timestamps

## Phase 2: Credit Request Form Fix (Week 1)

### 2.1 Fix Frontend Data Structure
**Duration**: 2 days  
**Risk**: Low  
**Dependencies**: 1.1 complete

**Current Issue:**
```javascript
// WRONG - wrapped in form_data
const payload = {
  title: 'Test',
  form_data: {
    guarantor_name: 'John',
    senior_business_sponsor_id: 'uuid'
  }
}
```

**Fixed Structure:**
```javascript
// CORRECT - flat payload
const payload = {
  title: 'Test',
  guarantor_name: 'John',
  senior_business_sponsor_id: 'uuid',
  form_started_at: startTime,
  form_completed_at: completionTime
}
```

**Files to Modify:**
- `frontend/src/components/CreditRequestForm/index.jsx`
- Update `buildPayload()` function
- Remove `form_data` wrapper

**Testing:**
- Test form submission with new payload structure
- Verify data reaches backend correctly
- Test edit mode loading

### 2.2 Update Credit Request Serializer
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 2.1 complete

**Changes:**
- Remove `form_data` handling from `CreditRequestFormSerializer`
- Ensure all fields are handled as direct model fields
- Add audit field handling

**Files to Modify:**
- `credit_applications/serializers.py`
- Update `CreditRequestFormSerializer`

**Testing:**
- Test API with new payload structure
- Verify all fields save correctly
- Test foreign key relationships

### 2.3 Fix Limits Array Handling
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 2.1 complete

**Current Issue:**
```javascript
// Frontend assumes l.type is object, but it's a string ID
limit_type_id: l.type.id  // ERROR: l.type.id is undefined
```

**Fix:**
```javascript
// Store limit_type_id directly as string
const [limits, setLimits] = useState([{
  id: Date.now(),
  limit_type_id: '',  // UUID string
  existing_amount: '',
  proposed_amount: ''
}]);

// Clean payload building
limit_requests: limits.map(l => ({
  limit_type_id: l.limit_type_id,  // Already UUID string
  existing_amount: parseFloat(l.existing_amount) || null
}))
```

**Files to Modify:**
- `frontend/src/components/CreditRequestForm/LimitsSection.jsx`
- Update limit state structure

**Testing:**
- Add/remove limits dynamically
- Test with different limit types
- Verify limit data saves correctly

## Phase 3: Credit Review Form Conversion (Week 2)

### 3.1 Convert Model to Direct Fields
**Duration**: 1-2 days  
**Risk**: Low  
**Dependencies**: Phase 2 complete

**New Model Structure:**
```python
class CreditReviewForm(models.Model):
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE)
    
    # User assignments (keep as simple fields for now)
    credit_reviewer_name = models.CharField(max_length=255)  # Auto-filled with current user
    assigned_credit_analyst_id = models.UUIDField(null=True)  # Simple UUID field for now
    assigned_credit_analyst_name = models.CharField(max_length=255, blank=True)  # Display name
    
    # Business fields
    delegated_authority_level = models.CharField(max_length=10)
    questionnaire_required = models.BooleanField(default=False)
    additional_information_request = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Audit fields (from Phase 1)
    form_started_at = models.DateTimeField(null=True)
    form_completed_at = models.DateTimeField(null=True)
    
    # Remove: form_data = JSONField
```

**Files to Modify:**
- `credit_applications/models.py`
- Simple migration (no existing data to preserve)

**Testing:**
- Create new Credit Review forms
- Verify all fields save correctly
- Test field constraints

### 3.2 Update Frontend to Send Flat Data
**Duration**: 1-2 days  
**Risk**: Low  
**Dependencies**: 3.1 complete

**Changes:**
- Remove nested `credit_review_form` wrapper
- Send direct fields
- Auto-set `credit_reviewer_name` to current user
- Handle analyst dropdown properly

**Files to Modify:**
- `frontend/src/components/CreditReviewForm/index.jsx`
- Update `buildPayload()` function

**Testing:**
- Test form submission
- Verify user assignment logic
- Test analyst dropdown

## Phase 4: Business Sponsorship Form Conversion (Week 2-3)

### 4.1 Convert Model (Keep Current Logic)
**Duration**: 1-2 days  
**Risk**: Low  
**Dependencies**: Phase 3 complete

**Key Insight:** Current business logic is CORRECT - sponsors come from Credit Request

**New Model Structure:**
```python
class BusinessSponsorshipForm(models.Model):
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE)
    
    # Sponsor identity (from Credit Request - immutable)
    senior_business_sponsor_name = models.CharField(max_length=255)
    senior_business_sponsor_id = models.UUIDField()  # Reference, not FK
    
    # Sponsor response (editable)
    sponsor_decision = models.CharField(max_length=20, choices=[
        ('approve', 'Approve'), ('reject', 'Reject')
    ])
    sponsor_comments = models.TextField()
    
    # Second sponsor (optional)
    second_business_sponsor_name = models.CharField(max_length=255, null=True)
    second_business_sponsor_id = models.UUIDField(null=True)
    second_sponsor_decision = models.CharField(max_length=20, null=True)
    second_sponsor_comments = models.TextField(null=True)
    
    # Audit fields
    form_started_at = models.DateTimeField(null=True)
    form_completed_at = models.DateTimeField(null=True)
    
    # Remove: form_data = JSONField
```

**Files to Modify:**
- `credit_applications/models.py`
- Simple migration (test data only)

### 4.2 Update Sponsor Identity Population
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 4.1 complete

**Logic:**
When Business Sponsorship form is first created, copy sponsor identity from Credit Request form.

**Files to Modify:**
- `credit_applications/serializers.py`
- Add logic to populate sponsor identity on creation

**Testing:**
- Create new application with sponsors
- Verify sponsor names appear in Business Sponsorship
- Test sponsor identity is populated correctly

### 4.3 Update Frontend Structure
**Duration**: 1-2 days  
**Risk**: Low  
**Dependencies**: 4.1 complete

**Changes:**
- Send flat payload
- Remove nested wrapper
- Keep current sponsor name display logic

**Files to Modify:**
- `frontend/src/components/BusinessSponsorshipForm/index.jsx`

## Phase 5: Remaining Forms Conversion (Week 3)

### 5.1 Legal Review Form
**Duration**: 2 days  
**Risk**: Low  
**Dependencies**: Phase 4 complete

**Key Changes:**
- Convert to direct fields
- Keep complex legal opinion logic but store as direct fields
- Simple UUID field for legal reviewer (no FK complexity yet)

### 5.2 Credit Questionnaire Form
**Duration**: 2 days  
**Risk**: Low  
**Dependencies**: 5.1 complete

**Key Changes:**
- Convert tabbed form structure to direct fields
- Group related fields logically
- Remove JSON storage

## Phase 6: Serializer Streamlining (Week 3-4)

### 6.1 Implement Unified Serializer Pattern
**Duration**: 2-3 days  
**Risk**: Medium  
**Dependencies**: All form conversions complete

**New Serializer Structure:**
```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    def update(self, instance, validated_data):
        # Extract all form data using consistent prefixing
        form_groups = self._extract_form_data(validated_data)
        
        # Update parent application
        instance = super().update(instance, self._clean_parent_data(validated_data))
        
        # Update all sub-forms using the same pattern
        for form_type, form_data in form_groups.items():
            if form_data:
                self._update_sub_form(instance, form_type, form_data)
        
        return instance
```

**Files to Modify:**
- `credit_applications/serializers.py`
- Reduce from ~200 lines to ~80 lines

### 6.2 Remove Legacy JSON Handling
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 6.1 complete

**Tasks:**
- Remove `form_data` fields from models
- Remove JSON handling code from serializers
- Clean up unused imports

### 6.3 Add Validation and Error Handling
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 6.1 complete

**Tasks:**
- Consistent validation across all forms
- Proper error messages
- Field-level validation

## Phase 7: Testing and Documentation (Week 4)

### 7.1 Comprehensive Testing
**Duration**: 2 days  
**Risk**: Low  
**Dependencies**: All phases complete

**Test Cases:**
- Complete workflow end-to-end
- All form submission scenarios
- Data integrity checks
- Performance testing

### 7.2 Update Documentation
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 7.1 complete

**Documents to Update:**
- API documentation
- Frontend component documentation
- Database schema documentation

## Future Enhancements (Post-Implementation)

### Task Assignment System
- Design inbox/notification system
- Add proper FK relationships for task routing
- Implement Credit Analysis auto-assignment
- Add SLA tracking and escalation

### Advanced Features
- Form validation improvements
- Performance optimizations
- Advanced reporting capabilities
- Integration with external systems

## Simplified Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundation | 1 day | Day 1 |
| Phase 2: Credit Request | 4 days | Week 1 |
| Phase 3: Credit Review | 3-4 days | Week 2 |
| Phase 4: Business Sponsorship | 3-4 days | Week 2-3 |
| Phase 5: Remaining Forms | 4 days | Week 3 |
| Phase 6: Serializer Streamlining | 4-5 days | Week 3-4 |
| Phase 7: Testing & Documentation | 3 days | Week 4 |

**Total Estimated Duration: 3-4 weeks**

## Success Metrics

### Technical Metrics
- [ ] Serializer reduced from 200+ to ~80 lines
- [ ] All forms use consistent direct field storage
- [ ] No JSON blob storage remaining
- [ ] API response times improved

### Business Metrics
- [ ] All workflow transitions functional
- [ ] User experience maintained or improved
- [ ] Complete audit trail
- [ ] Clean, maintainable codebase

## Next Steps

1. **Start Simple**: Begin with Phase 1 - Add audit fields
2. **Focus on Structure**: Complete data model conversions first
3. **Streamline Code**: Unify serializer patterns
4. **Plan Future**: Design task assignment system separately
5. **Test Thoroughly**: Ensure all workflows function correctly

## Phase 2: Credit Request Form Fix (Week 1-2)

### 2.1 Fix Frontend Data Structure
**Duration**: 2-3 days  
**Risk**: Medium  
**Dependencies**: None

**Current Issue:**
```javascript
// WRONG - wrapped in form_data
const payload = {
  title: 'Test',
  form_data: {
    guarantor_name: 'John',
    senior_business_sponsor_id: 'uuid'
  }
}
```

**Fixed Structure:**
```javascript
// CORRECT - flat payload
const payload = {
  title: 'Test',
  guarantor_name: 'John',
  senior_business_sponsor_id: 'uuid',
  form_started_at: startTime,
  form_completed_at: completionTime
}
```

**Files to Modify:**
- `frontend/src/components/CreditRequestForm/index.jsx`
- Update `buildPayload()` function
- Remove `form_data` wrapper

**Testing:**
- Test form submission with new payload structure
- Verify data reaches backend correctly
- Test edit mode loading

### 2.2 Update Credit Request Serializer
**Duration**: 1-2 days  
**Risk**: Low  
**Dependencies**: 2.1 complete

**Changes:**
- Remove `form_data` handling from `CreditRequestFormSerializer`
- Ensure all fields are handled as direct model fields
- Add audit field handling

**Files to Modify:**
- `credit_applications/serializers.py`
- Update `CreditRequestFormSerializer`

**Testing:**
- Test API with new payload structure
- Verify all fields save correctly
- Test foreign key relationships

### 2.3 Fix Limits Array Handling
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 2.1 complete

**Current Issue:**
```javascript
// Frontend assumes l.type is object, but it's a string ID
limit_type_id: l.type.id  // ERROR: l.type.id is undefined
```

**Fix:**
```javascript
// Store limit_type_id directly as string
const [limits, setLimits] = useState([{
  id: Date.now(),
  limit_type_id: '',  // UUID string
  existing_amount: '',
  proposed_amount: ''
}]);

// Clean payload building
limit_requests: limits.map(l => ({
  limit_type_id: l.limit_type_id,  // Already UUID string
  existing_amount: parseFloat(l.existing_amount) || null
}))
```

**Files to Modify:**
- `frontend/src/components/CreditRequestForm/LimitsSection.jsx`
- Update limit state structure

**Testing:**
- Add/remove limits dynamically
- Test with different limit types
- Verify limit data saves correctly

## Phase 3: Credit Review Form Conversion (Week 2)

### 3.1 Convert Model to Direct Fields
**Duration**: 2-3 days  
**Risk**: Medium  
**Dependencies**: Phase 1 complete

**New Model Structure:**
```python
class CreditReviewForm(models.Model):
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE)
    
    # User assignments
    credit_reviewer_id = models.ForeignKey(User, related_name='reviewed_applications')
    assigned_credit_analyst_id = models.ForeignKey(User, related_name='assigned_for_analysis')
    
    # Business fields
    delegated_authority_level = models.CharField(max_length=10)
    questionnaire_required = models.BooleanField(default=False)
    additional_information_request = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Audit fields (from Phase 1)
    form_started_at = models.DateTimeField(null=True)
    form_completed_at = models.DateTimeField(null=True)
    
    # Keep temporarily for migration
    form_data = models.JSONField(default=dict, blank=True)
```

**Files to Modify:**
- `credit_applications/models.py`
- Create data migration to copy from JSON to direct fields
- Update Django admin

**Testing:**
- Run migration on copy of production data
- Verify all existing data migrates correctly
- Test new field constraints

### 3.2 Update Frontend to Send Flat Data
**Duration**: 2 days  
**Risk**: Low  
**Dependencies**: 3.1 complete

**Changes:**
- Remove nested `credit_review_form` wrapper
- Send direct fields with `credit_review_` prefix
- Auto-set `credit_reviewer_id` to current user
- Handle analyst dropdown properly

**Files to Modify:**
- `frontend/src/components/CreditReviewForm/index.jsx`
- Update `buildPayload()` function

**Testing:**
- Test form submission
- Verify user assignment logic
- Test analyst dropdown

### 3.3 Add Task Creation Logic
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 3.1, 3.2 complete

**Logic:**
When Credit Review is completed, create task for assigned analyst.

**Files to Modify:**
- `credit_applications/serializers.py`
- Add task creation in Credit Review update logic

**Testing:**
- Complete Credit Review form
- Verify task created for assigned analyst
- Test task appears in analyst's inbox

## Phase 4: Business Sponsorship Form Conversion (Week 3)

### 4.1 Convert Model (Keep Current Logic)
**Duration**: 2 days  
**Risk**: Low  
**Dependencies**: Phase 2 complete

**Key Insight:** Current business logic is CORRECT - sponsors come from Credit Request

**New Model Structure:**
```python
class BusinessSponsorshipForm(models.Model):
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE)
    
    # Sponsor identity (from Credit Request - immutable)
    senior_business_sponsor_name = models.CharField(max_length=255)
    senior_business_sponsor_id = models.UUIDField()  # Reference, not FK
    
    # Sponsor response (editable)
    sponsor_decision = models.CharField(max_length=20, choices=[
        ('approve', 'Approve'), ('reject', 'Reject')
    ])
    sponsor_comments = models.TextField()
    
    # Second sponsor (optional)
    second_business_sponsor_name = models.CharField(max_length=255, null=True)
    second_business_sponsor_id = models.UUIDField(null=True)
    second_sponsor_decision = models.CharField(max_length=20, null=True)
    second_sponsor_comments = models.TextField(null=True)
    
    # Audit fields
    form_started_at = models.DateTimeField(null=True)
    form_completed_at = models.DateTimeField(null=True)
```

**Files to Modify:**
- `credit_applications/models.py`
- Create migration with data copy logic

### 4.2 Update Sponsor Identity Population
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 4.1 complete

**Logic:**
When Business Sponsorship form is first created, copy sponsor identity from Credit Request form.

**Files to Modify:**
- `credit_applications/serializers.py`
- Add logic to populate sponsor identity on creation

**Testing:**
- Create new application with sponsors
- Verify sponsor names appear in Business Sponsorship
- Test sponsor identity is immutable

### 4.3 Update Frontend Structure
**Duration**: 2 days  
**Risk**: Low  
**Dependencies**: 4.1 complete

**Changes:**
- Send flat payload with `business_sponsorship_` prefix
- Remove nested wrapper
- Keep current sponsor name display logic

**Files to Modify:**
- `frontend/src/components/BusinessSponsorshipForm/index.jsx`

## Phase 5: Remaining Forms Conversion (Week 3-4)

### 5.1 Legal Review Form
**Duration**: 3 days  
**Risk**: Medium  
**Dependencies**: Phase 4 complete

**Complex Fields to Handle:**
- Agreement type variations (ISDA, GMRA, CSA)
- Legal opinion selection
- Complex legal reviewer assignment

### 5.2 Credit Questionnaire Form
**Duration**: 3 days  
**Risk**: Medium  
**Dependencies**: 5.1 complete

**Complex Fields to Handle:**
- Tabbed form structure
- Multiple business model sections
- Risk management fields

## Phase 6: Serializer Streamlining (Week 4)

### 6.1 Implement Unified Serializer Pattern
**Duration**: 2-3 days  
**Risk**: Medium  
**Dependencies**: All form conversions complete

**New Serializer Structure:**
```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    def update(self, instance, validated_data):
        # Extract all form data using consistent prefixing
        form_groups = self._extract_form_data(validated_data)
        
        # Update parent application
        instance = super().update(instance, self._clean_parent_data(validated_data))
        
        # Update all sub-forms using the same pattern
        for form_type, form_data in form_groups.items():
            if form_data:
                self._update_sub_form(instance, form_type, form_data)
        
        return instance
```

**Files to Modify:**
- `credit_applications/serializers.py`
- Reduce from ~200 lines to ~80 lines

### 6.2 Remove Legacy JSON Handling
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 6.1 complete

**Tasks:**
- Remove `form_data` fields from models
- Remove JSON handling code from serializers
- Clean up unused imports

### 6.3 Add Validation and Error Handling
**Duration**: 1 day  
**Risk**: Low  
**Dependencies**: 6.1 complete

**Tasks:**
- Consistent validation across all forms
- Proper error messages
- Field-level validation

## Phase 7: Testing and Documentation (Week 5)

### 7.1 Comprehensive Testing
**Duration**: 3 days  
**Risk**: Low  
**Dependencies**: All phases complete

**Test Cases:**
- Complete workflow end-to-end
- All form submission scenarios
- Task assignment functionality
- Data integrity checks
- Performance testing

### 7.2 Update Documentation
**Duration**: 1-2 days  
**Risk**: Low  
**Dependencies**: 7.1 complete

**Documents to Update:**
- API documentation
- Frontend component documentation
- Database schema documentation
- Deployment guide

## Risk Mitigation

### High-Risk Items
1. **Data Migration**: Test extensively on production data copies
2. **Frontend Changes**: Implement feature flags for gradual rollout
3. **Serializer Changes**: Maintain backward compatibility during transition

### Rollback Plans
1. **Model Changes**: Keep `form_data` fields until fully verified
2. **Frontend**: Use feature flags to revert to old structure
3. **Serializer**: Maintain old methods until new ones proven stable

## Success Metrics

### Technical Metrics
- [ ] Serializer reduced from 200+ to ~80 lines
- [ ] All forms use consistent direct field storage
- [ ] API response times improved by >20%
- [ ] Zero data loss during migration

### Business Metrics
- [ ] Task assignment working correctly
- [ ] All workflow transitions functional
- [ ] User experience improved (form loading faster)
- [ ] Audit trail complete and queryable

## Dependencies and Prerequisites

### External Dependencies
- Database migration window (low-traffic period)
- Frontend deployment capability
- Testing environment with production data copy

### Internal Dependencies
- All phases must complete in order
- Cannot skip Phase 1 (foundation)
- Phase 6 requires all form conversions complete

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundation | 3-4 days | Week 1 |
| Phase 2: Credit Request | 4-5 days | Week 1-2 |
| Phase 3: Credit Review | 5-6 days | Week 2 |
| Phase 4: Business Sponsorship | 5 days | Week 3 |
| Phase 5: Remaining Forms | 6 days | Week 3-4 |
| Phase 6: Serializer Streamlining | 4-5 days | Week 4 |
| Phase 7: Testing & Documentation | 4-5 days | Week 5 |

**Total Estimated Duration: 4-5 weeks**

## Next Steps

1. **Week 1 Start**: Begin Phase 1 - Foundation Setup
2. **Get Approval**: Review this plan with stakeholders
3. **Set Up Environment**: Prepare development/testing environments
4. **Create Backup**: Full database backup before starting
5. **Begin Implementation**: Start with Phase 1.1 - Add Audit Fields