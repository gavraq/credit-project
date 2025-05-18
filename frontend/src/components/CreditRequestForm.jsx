import React, { useState, useEffect } from 'react';

// NOTE: This is a JavaScript (JSX) adaptation of the original TypeScript UI example.
// All TypeScript types and annotations have been removed.
// This file is structured for maintainability, PRD 4.1 traceability, and future integration with validation and API logic.

const CreditRequestForm = () => {
  // ...existing state
  const [selectedGuarantor, setSelectedGuarantor] = useState('');
  const [guarantorCIF, setGuarantorCIF] = useState('');
  const [counterparties, setCounterparties] = useState([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState('');
  const [counterpartyCIF, setCounterpartyCIF] = useState('');
  const [loadingCounterparties, setLoadingCounterparties] = useState(true);
  const [counterpartyError, setCounterpartyError] = useState(null);

  // Use the api.js service to fetch counterparties with JWT auth
  // Handles form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add form submission logic here
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
      const offsets = sectionRefs.map(ref => ref.current ? ref.current.getBoundingClientRect().top : Infinity);
      // ...rest of handleScroll logic (no JSX here)
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRefs]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: colors.neutral800, maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
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
                  placeholder="Enter guarantor identifier (if applicable)"
                  required={false}
                  value={guarantorCIF}
                  disabled={true}
                />
                <FormField label="Date form started" placeholder="Enter date form started" />
                <FormField label="Date form completed" placeholder="Enter date form completed" />
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
            <FormField label="Country Risk Limit availability" placeholder="Enter country risk limit availability" />
            <FormField label="Detailed comments on limits required" type="textarea" placeholder="Enter detailed comments on limits required" />
          </div>
        </FormSection>
        {/* 3. Relationship Information */}
        <div ref={sectionRefs[2]}></div>
        <FormSection title="Relationship Information" description="Information about the relationship.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <FormField label="Revenue last 12 months" placeholder="Enter revenue last 12 months" />
            <FormField label="Projected revenue next 12 months" placeholder="Enter projected revenue next 12 months" />
            <FormField label="Projected RoRWA/RoC" placeholder="Enter projected RoRWA/RoC" />
            <FormField label="Relationship comments" type="textarea" placeholder="Enter relationship comments" />
            <FormField label="KYC approval status" placeholder="Enter KYC approval status" />
            <FormField label="Most senior contact" placeholder="Enter most senior contact" />
            <FormField label="Date of last client visit" placeholder="Enter date of last client visit" />
          </div>
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
            <FormField label="Urgency indicator" placeholder="Enter urgency indicator" />
            <FormField label="Required by date" placeholder="Enter required by date" />
            <FormField label="Justification for high priority" type="textarea" placeholder="Enter justification for high priority" />
            <FormField label="Senior business head sponsor" placeholder="Enter senior business head sponsor" />
            <FormField label="Account Executive Name" placeholder="Enter account executive name" />
            <FormField label="Relationship Manager Name" placeholder="Enter relationship manager name" />
            <FormField label="Senior Business Sponsor Name" placeholder="Enter senior business sponsor name" />
            <FormField label="Optional second Senior Business Sponsor Name" placeholder="Enter optional second senior business sponsor name" />
          </div>
        </FormSection>
        {/* 6. Document Uploads */}
        <FormSection title="Document Uploads" description="Upload supporting documents.">
          <div style={{ padding: '1.5rem', border: `1px dashed ${colors.neutral400}`, borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: colors.neutral500 }}>📄</div>
            <p style={{ fontSize: '0.875rem', color: colors.neutral700, marginBottom: '1rem' }}>Drag and drop files here, or click to browse</p>
            <button style={{ backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Browse Files</button>
          </div>
        </FormSection>
        {/* Footer buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', color: colors.neutral800, fontWeight: '500', fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, cursor: 'pointer' }}>
            <span style={{ marginRight: '0.5rem' }}>←</span>Back
          </button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Save as Draft</button>
            <button style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: colors.standardBankBlue, border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Continue<span style={{ marginLeft: '0.5rem' }}>→</span></button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreditRequestForm;
