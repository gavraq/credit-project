import React, { useState, useEffect } from 'react';

// NOTE: This is a JavaScript (JSX) adaptation of the original TypeScript UI example.
// All TypeScript types and annotations have been removed.
// This file is structured for maintainability, PRD 4.1 traceability, and future integration with validation and API logic.

import { useParams } from 'react-router-dom';

import TopNavBar from './TopNavBar';
import LogoutButton from './LogoutButton';

const CreditRequestForm = (props) => {
  const { id } = useParams();
  const editMode = props.editMode || !!id;
  // Workflow state logic additions
  const [workflowInstance, setWorkflowInstance] = useState(null);
  const [currentState, setCurrentState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  // TODO: Replace with actual workflow instance ID from props or context
  const workflowInstanceId = 'REPLACE_WITH_INSTANCE_ID';

  // Fetch workflow instance on mount
  useEffect(() => {
    async function fetchWorkflowInstance() {
      try {
        const { get } = await import('../services/api');
        // Update the endpoint if needed
        const response = await get(`/workflow-instances/${workflowInstanceId}/`);
        setWorkflowInstance(response.data);
        setCurrentState(response.data.current_state?.name || response.data.current_state || '');
        setAllowedTransitions(response.data.allowed_transitions || []);
      } catch (err) {
        // Optionally handle error
        setWorkflowInstance(null);
        setAllowedTransitions([]);
      }
    }
    if (workflowInstanceId && workflowInstanceId !== 'REPLACE_WITH_INSTANCE_ID') {
      fetchWorkflowInstance();
    }
  }, [workflowInstanceId]);

  // Handler for transition button click
  const handleTransition = async (transitionCode) => {
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      const { post } = await import('../services/api');
      await post(`/workflow-instances/${workflowInstanceId}/transition/`, {
        transition_code: transitionCode
      });
      // Refetch workflow instance to update state and allowed transitions
      const { get } = await import('../services/api');
      const response = await get(`/workflow-instances/${workflowInstanceId}/`);
      setWorkflowInstance(response.data);
      setCurrentState(response.data.current_state?.name || response.data.current_state || '');
      setAllowedTransitions(response.data.allowed_transitions || []);
    } catch (err) {
      setTransitionError(err.message || 'Transition failed');
    } finally {
      setTransitionLoading(false);
    }
  };

  // ...existing state
  const [dateFormStarted, setDateFormStarted] = useState(() => {
    // Try to load from localStorage/sessionStorage if needed, or default to now
    return new Date().toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
  });
  const [dateFormCompleted, setDateFormCompleted] = useState('');
  // ...existing state
  const [selectedGuarantor, setSelectedGuarantor] = useState('');
  const [guarantorCIF, setGuarantorCIF] = useState('');
  const [counterparties, setCounterparties] = useState([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState('');
  const [counterpartyCIF, setCounterpartyCIF] = useState('');
  const [loadingCounterparties, setLoadingCounterparties] = useState(true);
  const [counterpartyError, setCounterpartyError] = useState(null);

  // Business Sponsor Dropdown State
  const [businessSponsors, setBusinessSponsors] = useState([]);
  const [selectedBusinessSponsor, setSelectedBusinessSponsor] = useState('');
  const [selectedSecondBusinessSponsor, setSelectedSecondBusinessSponsor] = useState('');
  const [loadingBusinessSponsors, setLoadingBusinessSponsors] = useState(true);
  const [businessSponsorError, setBusinessSponsorError] = useState(null);

  // Use the api.js service to fetch counterparties with JWT auth
  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      // Collect form data (example: adjust as needed for your fields)
      // Only send fields that exist on the CreditApplication model
      const payload = {
        title: selectedCounterparty ? `${counterparties.find(c => c.id === selectedCounterparty)?.name || ''} - Credit Request` : '',
        counterparty: selectedCounterparty,
        counterparty_id: selectedCounterparty,
        amount: limits?.[0]?.proposedAmount || '',
        description: '',
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        // Include the limits data as required by the backend
        limit_requests: limits
          .filter(limit => limit.type && limit.type !== '') // Only include limits with a valid type
          .map(limit => ({
            limit_type_id: limit.type, // Must be a valid UUID from the limit types
            existing_amount: limit.existingAmount || 0,
            existing_tenor: limit.existingTenor || 0,
            proposed_amount: limit.proposedAmount || 0,
            proposed_tenor: limit.proposedTenor || 0,
            comments: ''
          })),
        // created_by: '', // set by backend from JWT, or add if needed
        // assigned_to: '', // add if needed
        // expiry_date: '', // add if needed
        // purpose: '', // add if needed
        // decision_rationale: '', // add if needed
        // conditions: '', // add if needed
        // priority: '', // add if needed
        // rank: '', // add if needed
        // required_by_date: '', // add if needed
        // risk_score: '', // add if needed
        // risk_assessment_date: '', // add if needed
        // risk_assessment_reference: '', // add if needed
      };
      // Do NOT include application_date or any field not present in the model/serializer
      const { post, patch } = await import('../services/api');
      // If workflowInstance exists, PATCH; else POST
      if (workflowInstance && workflowInstance.id) {
        await patch(`/credit/credit-applications/${workflowInstance.id}/`, payload);
      } else {
        await post('/credit/credit-applications/', payload);
      }
      // Optionally, show a success message or update state/UI
    } catch (err) {
      setTransitionError(err.message || 'Failed to save draft');
    } finally {
      setTransitionLoading(false);
    }
  };

  useEffect(() => {
    async function fetchCounterparties() {
      setLoadingCounterparties(true);
      setCounterpartyError(null);
      try {
        // Import get from services/api
        const { get } = await import('../services/api');
        const response = await get('/credit/counterparties/');
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

  // Fetch Business Sponsors
  useEffect(() => {
    async function fetchBusinessSponsors() {
      setLoadingBusinessSponsors(true);
      setBusinessSponsorError(null);
      try {
        const { get } = await import('../services/api');
        const response = await get('/users/?role=business_sponsor');
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

  // Fetch credit request data in edit mode
  useEffect(() => {
    if (!editMode || !id) return;
    async function fetchCreditRequest() {
      try {
        const { get } = await import('../services/api');
        const response = await get(`/credit/credit-applications/${id}/`);
        const data = response.data;
        // Populate form fields with fetched data
        setSelectedCounterparty(data.counterparty?.id || data.counterparty || '');
        setCounterpartyCIF(data.counterparty?.cif_number || '');
        setLimits(
  (data.limit_requests || []).map(lr => ({
    id: lr.id,
    type: lr.limit_type?.id || lr.limit_type || '',
    existingAmount: lr.approved_amount || '',
    existingTenor: '', // Map if you have a tenor field
    proposedAmount: lr.requested_amount || '',
    proposedTenor: '', // Map if you have a tenor field
    // Add more mappings as needed
  }))
);
        // Add more fields as needed
        // setApplicantName(data.applicant_name || '');
        // setApplicantEmail(data.applicant_email || '');
        // ...etc
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchCreditRequest();
  }, [editMode, id]);

  // Brand colors
  const colors = {
    icbcRed: '#e31937',
    standardBankBlue: '#0c4da2',
    redLight: '#fde8eb',
    blueLight: '#e6edf7',
    success: '#38B2AC',
    warning: '#F6AD55',
    error: '#E53E3E',
    neutral100: '#FFFFFF',
    neutral200: '#F5F7FA',
    neutral300: '#E4E7EB',
    neutral400: '#CBD2D9',
    neutral500: '#9AA5B1',
    neutral600: '#7B8794',
    neutral700: '#4A5568',
    neutral800: '#323F4B',
    neutral900: '#1F2933'
  };

  // Limits state
  const [limits, setLimits] = useState([
    {
      id: 1,
      type: '',
      existingAmount: '',
      existingTenor: '',
      proposedAmount: '',
      proposedTenor: ''
    }
  ]);

  // Limit types state
  const [limitTypes, setLimitTypes] = useState([]);
  const [loadingLimitTypes, setLoadingLimitTypes] = useState(true);
  const [limitTypesError, setLimitTypesError] = useState(null);

  useEffect(() => {
    async function fetchLimitTypes() {
      setLoadingLimitTypes(true);
      setLimitTypesError(null);
      try {
        const { get } = await import('../services/api');
        const response = await get('/credit/limit-types/');
        setLimitTypes(response.data);
      } catch (err) {
        setLimitTypesError(err.message);
        setLimitTypes([]);
      } finally {
        setLoadingLimitTypes(false);
      }
    }
    fetchLimitTypes();
  }, []);

  // Add/remove limit rows
  const addLimit = () => {
    const newId = limits.length > 0 ? Math.max(...limits.map(l => l.id)) + 1 : 1;
    setLimits([...limits, {
      id: newId,
      type: '',
      existingAmount: '',
      existingTenor: '',
      proposedAmount: '',
      proposedTenor: ''
    }]);
  };
  const removeLimit = (id) => {
    if (limits.length > 1) {
      setLimits(limits.filter(limit => limit.id !== id));
    }
  };

  // Wizard navigation (dynamic, scrolls to section)
  const FormWizardNav = ({ sectionRefs, currentStep, setCurrentStep }) => {
    const steps = [
      'Counterparty information',
      'Limit Information',
      'Relationship Information',
      'Legal & Financial Documentation',
      'Prioritisation & Sponsorship'
    ];
    const handleStepClick = (index) => {
      if (sectionRefs[index] && sectionRefs[index].current) {
        sectionRefs[index].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (setCurrentStep) setCurrentStep(index);
      }
    };
    return (
      <div style={{ margin: '0', padding: '0', width: '100%' }}>
        <nav style={{
          display: 'flex',
          gap: '0',
          justifyContent: 'flex-start',
          width: '100%',
          boxSizing: 'border-box',
          margin: '0',
          padding: '0',
        }}>
          {steps.map((step, index) => (
            <div
              key={step}
              tabIndex={0}
              onClick={() => handleStepClick(index)}
              style={{
                flex: 1,
                border: `1px solid ${colors.neutral400}`,
                background: index === currentStep ? colors.blueLight : 'white',
                color: index === currentStep ? colors.standardBankBlue : colors.neutral800,
                fontWeight: index === currentStep ? '700' : '500',
                fontSize: '1rem',
                padding: '1rem 0',
                borderRadius: index === 0 ? '0.5rem 0 0 0.5rem' : index === steps.length - 1 ? '0 0.5rem 0.5rem 0' : '0',
                borderRight: index === steps.length - 1 ? `1px solid ${colors.neutral400}` : 'none',
                borderLeft: index === 0 ? `1px solid ${colors.neutral400}` : 'none',
                textAlign: 'center',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0',
                borderBottom: `2px solid ${index === currentStep ? colors.standardBankBlue : colors.neutral400}`,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <span style={{ marginBottom: '0.2rem', fontSize: '0.9em', opacity: 0.8 }}>{index + 1}</span>
              {step}
            </div>
          ))}
        </nav>
      </div>
    );
  };

  // Reusable form field
  const FormField = ({ label, type = 'text', placeholder, required = false, options = [], value, disabled, onChange }) => {
    return (
      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: colors.neutral700 }}>
          {label} {required && <span style={{ color: colors.icbcRed }}>*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            style={{ marginTop: '0.25rem', display: 'block', width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.5rem', fontSize: '0.875rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            placeholder={placeholder}
            rows={3}
            defaultValue={value}
            disabled={disabled}
          />
        ) : type === 'select' ? (
          <select
            style={{ marginTop: '0.25rem', display: 'block', width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.5rem', fontSize: '0.875rem', background: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            value={value}
            disabled={disabled}
            onChange={onChange}
          >
            <option value=''>{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'checkbox' ? (
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <input
              type='checkbox'
              style={{ height: '1rem', width: '1rem', borderRadius: '0.25rem', borderColor: colors.neutral400 }}
              defaultChecked={value}
              disabled={disabled}
            />
            <label style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: colors.neutral700 }}>
              {placeholder}
            </label>
          </div>
        ) : (
          <input
            type={type}
            style={{ marginTop: '0.25rem', display: 'block', width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.5rem', fontSize: '0.875rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', minHeight: '40px' }}
            placeholder={placeholder}
            defaultValue={value}
            disabled={disabled}
          />
        )}
      </div>
    );
  };

  // Reusable section
  const FormSection = ({ title, description, children }) => (
    <div style={{ border: `1px solid ${colors.neutral300}`, borderRadius: '0.375rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{title}</h3>
      {description && <p style={{ color: colors.neutral600, marginBottom: '1rem' }}>{description}</p>}
      {children}
    </div>
  );

  // Version control header (static for now)
  const VersionControlHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>Version:</span>
          <span style={{ backgroundColor: colors.neutral200, color: colors.neutral800, borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', padding: '0.125rem 0.625rem' }}>Draft - v0.2</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: colors.neutral600, marginTop: '0.25rem' }}>Last saved: May 7, 2025, 10:45 AM</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer' }}>
          <span style={{ marginRight: '0.25rem' }}>↓</span>Save Version
        </button>
        <button style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer' }}>
          <span style={{ marginRight: '0.25rem' }}>👁</span>View History
        </button>
      </div>
    </div>
  );

  // Main render
  // State for current wizard step (for highlighting)
  const [currentStep, setCurrentStep] = useState(0);

  // Section refs for scrolling
  if (!window.sectionRefs) {
    window.sectionRefs = [
      React.createRef(), // Counterparty information
      React.createRef(), // Limit Information
      React.createRef(), // Relationship Information
      React.createRef(), // Legal & Financial Documentation
      React.createRef()  // Prioritisation & Sponsorship
    ];
  }
  const sectionRefs = window.sectionRefs;

  // Helper: update currentStep on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      // (your scroll logic here, if any)
    };
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: colors.neutral800, maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      <TopNavBar LogoutButton={LogoutButton} />
      {/* Header */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '1.5rem' }}>
        <VersionControlHeader />
      </div>
      <FormWizardNav sectionRefs={sectionRefs} currentStep={currentStep} setCurrentStep={setCurrentStep} />
      <form onSubmit={handleSubmit}>
        {/* 1. Counterparty Information */}
        <div ref={sectionRefs[0]}></div>
        <FormSection title="Counterparty Information" description="Basic information about the credit request.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>

            <FormField label="Request Title" placeholder="Enter a descriptive title for this request" required={true} />
            <FormField label="Request Number" placeholder="Auto-generated" value="CR-2025-0124" disabled={true} />
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
                />
                <FormField
                  label="Counterparty CIF number"
                  placeholder="Enter counterparty identifier"
                  required={true}
                  value={counterpartyCIF}
                  disabled={true}
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
                />
                <FormField
                  label="Guarantor CIF number"
                  placeholder="Enter guarantor identifier"
                  required={false}
                  value={guarantorCIF}
                  disabled={true}
                />
              </>
            )}
          </div>
        </FormSection>
        {/* 2. Limits Information */}
        <div ref={sectionRefs[1]}></div>
        <FormSection title="Limits Information" description="Information about the limits.">
          {/* Dynamic Limits Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ background: colors.neutral200 }}>
                  <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Limit Type</th>
                  <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Existing Amount (US$ m)</th>
                  <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Existing Tenor (months)</th>
                  <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Proposed Amount (US$ m)</th>
                  <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Proposed Tenor (months)</th>
                  <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}></th>
                </tr>
              </thead>
              <tbody>
                {loadingLimitTypes ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: colors.neutral600 }}>Loading limit types...</td></tr>
                ) : limitTypesError ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: colors.icbcRed }}>Error loading limit types: {limitTypesError}</td></tr>
                ) : limits.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>No limits added.</td></tr>
                ) : (
                  limits.map((limit, idx) => (
                    <tr key={limit.id}>
                      <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                        <select
                          value={limit.type}
                          onChange={e => {
                            const updated = [...limits];
                            updated[idx].type = e.target.value;
                            setLimits(updated);
                          }}
                          style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                        >
                          <option value="">Select limit type</option>
                          {limitTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                        <input
                          type="number"
                          value={limit.existingAmount}
                          onChange={e => {
                            const updated = [...limits];
                            updated[idx].existingAmount = e.target.value;
                            setLimits(updated);
                          }}
                          style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                        <input
                          type="number"
                          value={limit.existingTenor}
                          onChange={e => {
                            const updated = [...limits];
                            updated[idx].existingTenor = e.target.value;
                            setLimits(updated);
                          }}
                          style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                        <input
                          type="number"
                          value={limit.proposedAmount}
                          onChange={e => {
                            const updated = [...limits];
                            updated[idx].proposedAmount = e.target.value;
                            setLimits(updated);
                          }}
                          style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                        <input
                          type="number"
                          value={limit.proposedTenor}
                          onChange={e => {
                            const updated = [...limits];
                            updated[idx].proposedTenor = e.target.value;
                            setLimits(updated);
                          }}
                          style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}`, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeLimit(limit.id)}
                          disabled={limits.length === 1}
                          style={{ background: 'none', border: 'none', color: colors.icbcRed, cursor: limits.length === 1 ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }}
                          title="Remove row"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addLimit}
              style={{ backgroundColor: colors.blueLight, color: colors.standardBankBlue, border: `1px solid ${colors.standardBankBlue}`, borderRadius: '0.375rem', padding: '0.4rem 1.2rem', fontWeight: '500', cursor: 'pointer', marginTop: '0.5rem' }}
              disabled={loadingLimitTypes || !!limitTypesError}
            >
              + Add Row
            </button>
            <FormField
              label="Country Risk Limit availability"
              type="select"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              placeholder="Select availability"
            />
            <FormField label="Detailed comments on limits required" type="textarea" placeholder="Enter detailed comments on limits required" />
          </div>
        </FormSection>
        {/* 3. Relationship Information */}
        <div ref={sectionRefs[2]}></div>
        <FormSection title="Relationship Information" description="Information about the relationship.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <FormField label="Revenue last 12 months" placeholder="Enter revenue last 12 months" />
            <FormField label="Projected revenue next 12 months" placeholder="Enter projected revenue next 12 months" />
            <FormField label="Projected RoRWA/RoC" placeholder="Enter projected RoRWA/RoC" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>

            <FormField label="Most senior contact" placeholder="Enter most senior contact" />
            <FormField label="Date of last client visit" type="date" placeholder="Select date of last client visit" />
          </div>
          <FormField label="Relationship comments" type="textarea" placeholder="Enter relationship comments" />
        </FormSection>
        {/* 4. Legal & Financial Documentation */}
        <div ref={sectionRefs[3]}></div>
        <FormSection title="Legal & Financial Documentation" description="Information about the legal and financial documentation.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <FormField label="Legal Document type" placeholder="Enter legal document type" />
            <FormField label="Confirmation of positive legal opinion" placeholder="Enter confirmation of positive legal opinion" />
            <FormField label="Confirmation of receipt of audited financial statements" placeholder="Enter confirmation of receipt of audited financial statements" />
            <FormField label="Client produces interim financial statements" placeholder="Enter client produces interim financial statements" />
          </div>
        </FormSection>
        {/* 5. Prioritisation & Business Sponsorship */}
        <div ref={sectionRefs[4]}></div>
        <FormSection title="Prioritisation & Business Sponsorship" description="Information about the prioritisation and business sponsorship.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <FormField
              label="Priority"
              type="select"
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
              placeholder="Select priority"
            />
            <FormField label="Required by date" type="date" placeholder="Select required by date" />

            <FormField label="Account Executive" placeholder="Enter account executive" />
            <FormField label="Relationship Manager" placeholder="Enter relationship manager" />
            {/* Senior Business Sponsor Dropdown */}
            {loadingBusinessSponsors ? (
              <div style={{ gridColumn: '1 / span 2', color: '#888', fontSize: '0.95rem' }}>Loading business sponsors...</div>
            ) : businessSponsorError ? (
              <div style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '0.95rem' }}>Error loading business sponsors: {businessSponsorError}</div>
            ) : (
              <>
                <FormField
                  label="Senior Business Sponsor"
                  type="select"
                  required={true}
                  options={businessSponsors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.username})` }))}
                  value={selectedBusinessSponsor}
                  placeholder="Select senior business sponsor"
                  onChange={e => setSelectedBusinessSponsor(e.target.value)}
                />
                <FormField
                  label="Optional second Senior Business Sponsor"
                  type="select"
                  required={false}
                  options={businessSponsors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.username})` }))}
                  value={selectedSecondBusinessSponsor}
                  placeholder="Select optional second sponsor"
                  onChange={e => setSelectedSecondBusinessSponsor(e.target.value)}
                />
              </>
            )}
          </div>
          <FormField label="Justification for high priority" type="textarea" placeholder="Enter justification for high priority" />
        </FormSection>
        {/* 6. Document Uploads */}
        <FormSection title="Document Uploads" description="Upload supporting documents.">
          <div style={{ padding: '1.5rem', border: `1px dashed ${colors.neutral400}`, borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: colors.neutral500 }}>📄</div>
            <p style={{ fontSize: '0.875rem', color: colors.neutral700, marginBottom: '1rem' }}>Drag and drop files here, or click to browse</p>
            <button style={{ backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Browse Files</button>
          </div>
        </FormSection>
        {/* Footer and workflow state/actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', color: colors.neutral800, fontWeight: '500', fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, cursor: 'pointer' }}
              type="button"
              onClick={() => window.history.back()}
            >
              <span style={{ marginRight: '0.5rem' }}>←</span>Back
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Save as Draft: Just saves the form, keeps state as DRAFT */}
              <button
                style={{ backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: transitionLoading ? 'not-allowed' : 'pointer', opacity: transitionLoading ? 0.7 : 1 }}
                type="button"
                disabled={transitionLoading}
                onClick={handleSubmit}
              >
                {transitionLoading ? 'Saving...' : 'Save as Draft'}
              </button>
              {/* Update Credit Paper: triggers CR_TR_2 transition */}
              <button
                style={{ backgroundColor: colors.standardBankBlue, border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: transitionLoading ? 'not-allowed' : 'pointer', opacity: transitionLoading ? 0.7 : 1 }}
                type="button"
                disabled={transitionLoading}
                onClick={() => handleTransition('CR_TR_2')}
              >
                {transitionLoading ? 'Updating...' : 'Update Credit Paper'}
              </button>
              {/* Submit for Credit Review: triggers CR_TR_4 transition */}
              <button
                style={{ backgroundColor: colors.standardBankBlue, border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: transitionLoading ? 'not-allowed' : 'pointer', opacity: transitionLoading ? 0.7 : 1 }}
                type="button"
                disabled={transitionLoading}
                onClick={() => handleTransition('CR_TR_4')}
              >
                {transitionLoading ? 'Submitting...' : 'Submit for Credit Review'}
              </button>
            </div>
            {/* Error feedback for footer actions */}
            {transitionError && (
              <div style={{ color: colors.error, marginTop: '1rem' }}>{transitionError}</div>
            )}
          </div>
        {/* Workflow State & Actions */}
        {workflowInstance && (
          <div style={{ margin: '2rem 0', padding: '1rem', background: colors.blueLight, borderRadius: '0.5rem', border: `1px solid ${colors.standardBankBlue}` }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: colors.standardBankBlue }}>
              Workflow State: <span style={{ fontWeight: 600 }}>{currentState}</span>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {allowedTransitions.length === 0 ? (
                <span style={{ color: colors.neutral600 }}>No actions available for your role at this state.</span>
              ) : (
                allowedTransitions.map(tr => (
                  <button
                    key={tr.code}
                    disabled={transitionLoading}
                    style={{
                      backgroundColor: colors.standardBankBlue,
                      color: 'white',
                      padding: '0.5rem 1.25rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: 600,
                      cursor: transitionLoading ? 'not-allowed' : 'pointer',
                      opacity: transitionLoading ? 0.8 : 1,
                    }}
                    title={tr.description}
                    onClick={() => handleTransition(tr.code)}
                  >
                    {tr.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreditRequestForm;
