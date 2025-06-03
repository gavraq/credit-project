# Credit Risk Workflow System - Credit Request Form Implementation

This document details the implementation of the Credit Request Form component for the Credit Risk Workflow System. The form is designed with a modular structure and integrates with the workflow engine and API services.

## 1. Form Structure Overview

The Credit Request Form is implemented as a modular component with several sections:

1. **CounterpartySection**: Handles counterparty selection and CID/CIF ID display
2. **LimitsSection**: Manages credit limits with proper validation
3. **RelationshipSection**: Captures relationship information
4. **LegalSection**: Handles legal requirements
5. **PrioritisationSection**: Manages prioritization settings
6. **DocumentsSection**: Handles document uploads and management

## 2. Data Flow

The Credit Request Form follows this data flow pattern:

1. On initial load, the form fetches:
   - Counterparties from `/api/credit/counterparties/`
   - Limit types from `/api/credit/limit-types/`
   - Business sponsors from `/api/users/?role=business_sponsor`
   - Existing credit application data if in edit mode

2. On form submission:
   - Credit application data is saved to `/api/credit/credit-applications/`
   - Nested form data is stored in the `form_data` JSON field
   - Limit requests are saved as related objects
   - Workflow instance is created or updated

3. Workflow transitions:
   - Workflow state is fetched from `/api/workflow-instances/{id}/`
   - Available transitions are fetched from `/api/workflow-instances/{id}/allowed-transitions/`
   - Transitions are executed via `/api/workflow-instances/{id}/transition/`

## 3. Main Form Component

The main form component manages the overall state and coordinates between sections:

```jsx
// frontend/src/components/CreditRequestForm/index.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import TopNavBar from '../TopNavBar';
import LogoutButton from '../LogoutButton';
import FormWizardNav from './FormWizardNav';
import FormSection from './FormSection';
import VersionControlHeader from './VersionControlHeader';
import WorkflowActions from './WorkflowActions';
import CounterpartySection from './CounterpartySection';
import LimitsSection from './LimitsSection';
import RelationshipSection from './RelationshipSection';
import LegalSection from './LegalSection';
import PrioritisationSection from './PrioritisationSection';
import DocumentsSection from './DocumentsSection';

const CreditRequestForm = (props) => {
  const { id } = useParams();
  const editMode = props.editMode || !!id;
  
  // Workflow state logic
  const [workflowInstance, setWorkflowInstance] = useState(null);
  const [currentState, setCurrentState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);

  // Form sections state management
  // ... state variables for each section

  // Data fetching functions
  const fetchWorkflowInstance = async (instanceId) => {
    const { get } = await import('../../services/api');
    const response = await get(`/api/workflow-instances/${instanceId}/`);
    const transitionsResponse = await get(`/api/workflow-instances/${instanceId}/allowed-transitions/`);
    
    setWorkflowInstance(response.data);
    setCurrentState(response.data.current_state.name);
    setAllowedTransitions(transitionsResponse.data);
  };

  const createWorkflowInstance = async () => {
    const { patch } = await import('../../services/api');
    const response = await patch(`/api/credit/credit-applications/${id}/`, { create_workflow_instance: true });
    
    if (response.data.workflow_instance) {
      setWorkflowInstanceId(response.data.workflow_instance);
      await fetchWorkflowInstance(response.data.workflow_instance);
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTransitionLoading(true);
    setTransitionError(null);
    
    try {
      // Construct the payload with proper structure
      const payload = {
        title: requestTitle,
        // ... other direct fields
        
        // Nested form data
        credit_request_form: {
          form_data: {
            // ... form data fields
          }
        },
        
        // Properly structured limit requests
        limit_requests: limits
          .filter(limit => limit.type)
          .map(limit => ({
            limit_type_id: limit.type,
            existing_amount: limit.existing_amount || null,
            existing_tenor: limit.existing_tenor || null,
            proposed_amount: limit.proposed_amount || null,
            proposed_tenor: limit.proposed_tenor || null,
            comments: limit.comments || ''
          }))
      };
      
      // Use the appropriate API method
      const { post, patch } = await import('../../services/api');
      let response;
      
      if (editMode) {
        response = await patch(`/api/credit/credit-applications/${id}/`, payload);
        console.log('Updated credit application:', response.data);
      } else {
        response = await post('/api/credit/credit-applications/', payload);
        console.log('Created credit application:', response.data);
      }
      
      // Handle successful submission
      return true;
    } catch (error) {
      console.error('Error submitting form:', error);
      setTransitionError(error.message);
      return false;
    } finally {
      setTransitionLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    // ... data fetching logic
  }, []);

  // Render form sections
  return (
    <div className="credit-request-form">
      <TopNavBar>
        <LogoutButton />
      </TopNavBar>
      
      <div className="form-container">
        <VersionControlHeader
          editMode={editMode}
          dateFormStarted={dateFormStarted}
          dateFormCompleted={dateFormCompleted}
        />
        
        <form onSubmit={handleSubmit}>
          <FormSection title="Counterparty Information">
            <CounterpartySection 
              counterparties={counterparties}
              loadingCounterparties={loadingCounterparties}
              counterpartyError={counterpartyError}
              selectedCounterparty={selectedCounterparty}
              setSelectedCounterparty={setSelectedCounterparty}
              counterpartyCIF={counterpartyCIF}
              setCounterpartyCIF={setCounterpartyCIF}
              selectedGuarantor={selectedGuarantor}
              setSelectedGuarantor={setSelectedGuarantor}
              guarantorCIF={guarantorCIF}
              setGuarantorCIF={setGuarantorCIF}
              requestTitle={requestTitle}
              setRequestTitle={setRequestTitle}
              requestNumber={requestNumber}
              colors={colors}
            />
          </FormSection>
          
          <FormSection title="Limits">
            <LimitsSection 
              limits={limits}
              setLimits={setLimits}
              limitTypes={limitTypes}
              loadingLimitTypes={loadingLimitTypes}
              limitTypeError={limitTypeError}
              colors={colors}
            />
          </FormSection>
          
          {/* Other form sections */}
          
          <WorkflowActions
            workflowInstance={workflowInstance}
            currentState={currentState}
            allowedTransitions={allowedTransitions}
            transitionLoading={transitionLoading}
            transitionError={transitionError}
            handleSubmit={handleSubmit}
            createWorkflowInstance={createWorkflowInstance}
            fetchWorkflowInstance={fetchWorkflowInstance}
            workflowInstanceId={workflowInstanceId}
          />
        </form>
      </div>
    </div>
  );
};

export default CreditRequestForm;
```

## 4. Counterparty Section

The Counterparty Section handles counterparty selection and automatically populates the CID/CIF ID field:

```jsx
// frontend/src/components/CreditRequestForm/CounterpartySection.jsx
import React from 'react';
import FormField from './FormField';

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
  requestTitle,
  setRequestTitle,
  requestNumber,
  colors
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
      <FormField 
        label="Request Title" 
        placeholder="Enter a descriptive title for this request" 
        required={true} 
        value={requestTitle}
        onChange={(e) => setRequestTitle(e.target.value)}
        colors={colors}
      />
      <FormField 
        label="Request Number" 
        placeholder="Auto-generated" 
        value={requestNumber} 
        disabled={true}
        colors={colors}
      />
      
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
            options={counterparties.map(cp => ({ value: cp.id, label: cp.name }))}
            value={selectedCounterparty}
            placeholder="Select counterparty"
            onChange={e => {
              setSelectedCounterparty(e.target.value);
              const found = counterparties.find(cp => String(cp.id) === e.target.value);
              setCounterpartyCIF(found ? found.cif_number : '');
            }}
            colors={colors}
          />
          <FormField
            label="Counterparty CIF number"
            placeholder="Enter counterparty identifier"
            required={true}
            value={counterpartyCIF}
            disabled={true}
            colors={colors}
          />
          <FormField
            label="Guarantor Name"
            type="select"
            required={false}
            options={counterparties.map(cp => ({ value: cp.id, label: cp.name }))}
            value={selectedGuarantor}
            placeholder="Select guarantor (if applicable)"
            onChange={e => {
              setSelectedGuarantor(e.target.value);
              const found = counterparties.find(cp => String(cp.id) === e.target.value);
              setGuarantorCIF(found ? found.cif_number : '');
            }}
            colors={colors}
          />
          <FormField
            label="Guarantor CIF number"
            placeholder="Enter guarantor identifier"
            required={false}
            value={guarantorCIF}
            disabled={true}
            colors={colors}
          />
        </>
      )}
    </div>
  );
};

export default CounterpartySection;
```

## 4. Limits Section

The Limits Section manages credit limits with proper validation:

```jsx
// frontend/src/components/CreditRequestForm/LimitsSection.jsx
import React from 'react';
import FormField from './FormField';

const LimitsSection = ({
  limits,
  setLimits,
  limitTypes,
  loadingLimitTypes,
  limitTypeError,
  colors
}) => {
  const handleLimitChange = (index, field, value) => {
    const updatedLimits = [...limits];
    updatedLimits[index] = {
      ...updatedLimits[index],
      [field]: value
    };
    setLimits(updatedLimits);
  };

  const addLimit = () => {
    setLimits([
      ...limits,
      {
        id: limits.length + 1,
        type: '',
        existing_amount: '',
        existing_tenor: '',
        proposed_amount: '',
        proposed_tenor: '',
        comments: ''
      }
    ]);
  };

  const removeLimit = (index) => {
    const updatedLimits = limits.filter((_, i) => i !== index);
    setLimits(updatedLimits);
  };

  return (
    <div className="limits-section">
      {loadingLimitTypes ? (
        <div style={{ color: '#888', fontSize: '0.95rem' }}>Loading limit types...</div>
      ) : limitTypeError ? (
        <div style={{ color: 'red', fontSize: '0.95rem' }}>Error loading limit types: {limitTypeError}</div>
      ) : (
        <>
          {limits.map((limit, index) => (
            <div key={limit.id} className="limit-row">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <FormField
                  label="Limit Type"
                  type="select"
                  required={true}
                  options={limitTypes.map(lt => ({ value: lt.id, label: lt.name }))}
                  value={limit.type}
                  onChange={(e) => handleLimitChange(index, 'type', e.target.value)}
                  colors={colors}
                />
                <FormField
                  label="Existing Amount"
                  type="number"
                  value={limit.existing_amount}
                  onChange={(e) => handleLimitChange(index, 'existing_amount', e.target.value)}
                  colors={colors}
                />
                <FormField
                  label="Existing Tenor (days)"
                  type="number"
                  value={limit.existing_tenor}
                  onChange={(e) => handleLimitChange(index, 'existing_tenor', e.target.value)}
                  colors={colors}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <FormField
                  label="Proposed Amount"
                  type="number"
                  required={true}
                  value={limit.proposed_amount}
                  onChange={(e) => handleLimitChange(index, 'proposed_amount', e.target.value)}
                  colors={colors}
                />
                <FormField
                  label="Proposed Tenor (days)"
                  type="number"
                  value={limit.proposed_tenor}
                  onChange={(e) => handleLimitChange(index, 'proposed_tenor', e.target.value)}
                  colors={colors}
                />
                <FormField
                  label="Comments"
                  type="textarea"
                  value={limit.comments}
                  onChange={(e) => handleLimitChange(index, 'comments', e.target.value)}
                  colors={colors}
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeLimit(index)}
                className="remove-limit-button"
              >
                Remove Limit
              </button>
              <hr style={{ margin: '1.5rem 0' }} />
            </div>
          ))}
          <button 
            type="button" 
            onClick={addLimit}
            className="add-limit-button"
          >
            Add Limit
          </button>
        </>
      )}
    </div>
  );
};

export default LimitsSection;
```

## 5. Workflow Actions Component

The Workflow Actions component handles workflow transitions and form submission:

```jsx
// frontend/src/components/CreditRequestForm/WorkflowActions.jsx
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

const WorkflowActions = ({
  workflowInstance,
  currentState,
  allowedTransitions,
  transitionLoading,
  transitionError,
  handleSubmit,
  createWorkflowInstance,
  fetchWorkflowInstance,
  workflowInstanceId
}) => {
  const history = useHistory();
  const [selectedTransition, setSelectedTransition] = useState('');
  
  const executeTransition = async () => {
    if (!selectedTransition) return;
    
    try {
      const { post } = await import('../../services/api');
      const response = await post(`/api/workflow-instances/${workflowInstanceId}/transition/`, {
        transition: selectedTransition
      });
      
      console.log('Transition executed:', response.data);
      
      // Refresh workflow state
      await fetchWorkflowInstance(workflowInstanceId);
      
      // Reset selected transition
      setSelectedTransition('');
      
      // Redirect based on transition
      if (response.data.redirect_url) {
        history.push(response.data.redirect_url);
      }
    } catch (error) {
      console.error('Error executing transition:', error);
    }
  };
  
  const handleSaveAsDraft = async () => {
    const success = await handleSubmit();
    if (success) {
      console.log('Form saved as draft');
      // Optionally redirect or show success message
    }
  };
  
  const handleSaveAndSubmit = async () => {
    const success = await handleSubmit();
    if (success && !workflowInstanceId) {
      await createWorkflowInstance();
    }
  };
  
  return (
    <div className="workflow-actions">
      {transitionError && (
        <div className="error-message">
          Error: {transitionError}
        </div>
      )}
      
      <div className="workflow-status">
        {currentState && (
          <div className="current-state">
            Current Status: <span>{currentState}</span>
          </div>
        )}
      </div>
      
      <div className="action-buttons">
        <button 
          type="button" 
          onClick={handleSaveAsDraft}
          disabled={transitionLoading}
          className="save-draft-button"
        >
          Save as Draft
        </button>
        
        {!workflowInstance ? (
          <button 
            type="button" 
            onClick={handleSaveAndSubmit}
            disabled={transitionLoading}
            className="submit-button"
          >
            Submit
          </button>
        ) : (
          <>
            <select
              value={selectedTransition}
              onChange={(e) => setSelectedTransition(e.target.value)}
              disabled={allowedTransitions.length === 0 || transitionLoading}
              className="transition-select"
            >
              <option value="">Select action...</option>
              {allowedTransitions.map(transition => (
                <option key={transition.id} value={transition.name}>
                  {transition.name}
                </option>
              ))}
            </select>
            
            <button 
              type="button" 
              onClick={executeTransition}
              disabled={!selectedTransition || transitionLoading}
              className="execute-transition-button"
            >
              Execute Action
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkflowActions;
```

## 6. Data Fetching Implementation

The form fetches data from various API endpoints:

```jsx
// Inside CreditRequestForm component

// Fetch counterparties
useEffect(() => {
  async function fetchCounterparties() {
    setLoadingCounterparties(true);
    setCounterpartyError(null);
    try {
      const { get } = await import('../../services/api');
      const response = await get('/api/credit/counterparties/');
      setCounterparties(response.data);
    } catch (err) {
      setCounterpartyError(err.message);
      setCounterparties([]);
    } finally {
      setLoadingCounterparties(false);
    }
  }
  fetchCounterparties();
}, []);

// Fetch limit types
useEffect(() => {
  async function fetchLimitTypes() {
    setLoadingLimitTypes(true);
    setLimitTypeError(null);
    try {
      const { get } = await import('../../services/api');
      const response = await get('/api/credit/limit-types/');
      setLimitTypes(response.data);
    } catch (err) {
      setLimitTypeError(err.message);
      setLimitTypes([]);
    } finally {
      setLoadingLimitTypes(false);
    }
  }
  fetchLimitTypes();
}, []);

// Fetch business sponsors
useEffect(() => {
  async function fetchBusinessSponsors() {
    setLoadingBusinessSponsors(true);
    setBusinessSponsorError(null);
    try {
      const { get } = await import('../../services/api');
      const response = await get('/api/users/?role=business_sponsor');
      setBusinessSponsors(response.data);
    } catch (err) {
      setBusinessSponsorError(err.message);
      setBusinessSponsors([]);
    } finally {
      setLoadingBusinessSponsors(false);
    }
  }
  fetchBusinessSponsors();
}, []);

// Fetch existing credit application data in edit mode
useEffect(() => {
  if (editMode && id) {
    async function fetchCreditApplication() {
      try {
        const { get } = await import('../../services/api');
        console.log(`Fetching credit application with ID: ${id}`);
        const response = await get(`/api/credit/credit-applications/${id}/`);
        const creditApp = response.data;
        console.log('Fetched credit application:', creditApp);
        
        // Update form fields with credit application data
        setRequestTitle(creditApp.title || '');
        // ... update other form fields
        
        // Check if the credit application has a workflow instance
        if (creditApp.workflow_instance) {
          setWorkflowInstanceId(creditApp.workflow_instance);
          await fetchWorkflowInstance(creditApp.workflow_instance);
        }
      } catch (err) {
        console.error('Error fetching credit application:', err);
      }
    }
    fetchCreditApplication();
  }
}, [editMode, id]);
```

## 8. Form Data Structure

The form data is structured to match the backend models:

### 8.1 Credit Application Model

The primary data is stored in the CreditApplication model:

```python
class CreditApplication(models.Model):
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField(blank=True)
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    applicant_phone = models.CharField(max_length=50)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_applications')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_applications')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # ... other fields
```

### 8.2 Credit Request Form Model

Additional form data is stored in a related CreditRequestForm model with a JSONField:

```python
class CreditRequestForm(models.Model):
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_request_form')
    form_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # ... other fields
```

### 8.3 Limit Request Model

Limit requests are stored as related objects:

```python
class LimitRequest(models.Model):
    credit_application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='limit_requests')
    limit_type = models.ForeignKey(LimitType, on_delete=models.PROTECT)
    existing_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    existing_tenor = models.IntegerField(null=True, blank=True)
    proposed_amount = models.DecimalField(max_digits=15, decimal_places=2)
    proposed_tenor = models.IntegerField(null=True, blank=True)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # ... other fields
```

## 9. Implementation Notes

1. The form is designed with a modular structure to improve maintainability
2. All API calls use the centralized API service with consistent `/api/` prefix
3. The Counterparty dropdown automatically populates the CID/CIF ID field
4. Limit requests use the correct field names matching the backend model
5. Form validation is implemented on both the frontend and backend
6. The form supports both creating new credit requests and editing existing ones
7. Workflow transitions are properly integrated with the form submission process
