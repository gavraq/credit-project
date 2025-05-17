import React, { useState } from 'react';

const CreditQuestionnaireForm = () => {
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
  
  // Workflow Status Component
  const WorkflowStatus = ({ currentStep = 3 }) => {
    const steps = [
      'Credit Request',
      'Credit Review',
      'Business Sponsorship',
      'Analysis',
      'Credit Paper',
      'Approval'
    ];
    
    return (
      <div style={{ padding: '1rem 0' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
              }}>
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '9999px',
                  backgroundColor: index < currentStep 
                    ? colors.success  // success color for completed steps
                    : index === currentStep 
                    ? colors.standardBankBlue  // brand blue for current step
                    : colors.neutral300,  // light gray for future steps
                  color: index <= currentStep ? 'white' : colors.neutral600
                }}>
                  {index < currentStep ? (
                    '✓'
                  ) : (
                    index + 1
                  )}
                </div>
                <span style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.75rem',
                  fontWeight: index === currentStep ? '500' : '400',
                  color: index === currentStep ? colors.neutral800 : colors.neutral600
                }}>
                  {step}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div style={{ 
                  flexGrow: 1, 
                  height: '0.25rem',
                  backgroundColor: index < currentStep ? colors.success : colors.neutral300
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('businessModel');
  
  // Form Field Component
  const FormField = ({ label, type = "text", placeholder, required = false, options = [], value, onChange, name }) => {
    return (
      <div style={{ marginBottom: '1rem' }}>
        {label && (
          <label style={{ 
            display: 'block', 
            marginBottom: '0.25rem', 
            fontSize: '0.875rem', 
            fontWeight: '500', 
            color: colors.neutral700 
          }}>
            {label} {required && <span style={{ color: colors.icbcRed }}>*</span>}
          </label>
        )}
        
        {type === "textarea" ? (
          <textarea
            style={{ 
              marginTop: '0.25rem',
              display: 'block',
              width: '100%',
              borderRadius: '0.375rem',
              border: `1px solid ${colors.neutral400}`,
              padding: '0.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            placeholder={placeholder}
            rows={3}
            value={value || ""}
            onChange={onChange}
            name={name}
          />
        ) : type === "select" ? (
          <select
            style={{ 
              marginTop: '0.25rem',
              display: 'block',
              width: '100%',
              borderRadius: '0.375rem',
              border: `1px solid ${colors.neutral400}`,
              padding: '0.5rem',
              fontSize: '0.875rem',
              background: 'white',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            value={value || ""}
            onChange={onChange}
            name={name}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === "checkbox" ? (
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ 
                height: '1rem', 
                width: '1rem',
                borderRadius: '0.25rem',
                borderColor: colors.neutral400
              }}
              checked={value || false}
              onChange={onChange}
              name={name}
              id={name}
            />
            <label 
              htmlFor={name}
              style={{ 
                marginLeft: '0.5rem',
                fontSize: '0.875rem',
                color: colors.neutral700 
              }}
            >
              {placeholder}
            </label>
          </div>
        ) : (
          <input
            type={type}
            style={{ 
              marginTop: '0.25rem',
              display: 'block',
              width: '100%',
              borderRadius: '0.375rem',
              border: `1px solid ${colors.neutral400}`,
              padding: '0.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            placeholder={placeholder}
            value={value || ""}
            onChange={onChange}
            name={name}
          />
        )}
      </div>
    );
  };
  
  // Form Section Component
  const FormSection = ({ title, description, children }) => {
    return (
      <div style={{ 
        border: `1px solid ${colors.neutral300}`, 
        borderRadius: '0.375rem', 
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem'
        }}>
          {title}
        </h3>
        
        {description && (
          <p style={{ 
            color: colors.neutral600, 
            marginBottom: '1rem'
          }}>
            {description}
          </p>
        )}
        
        {children}
      </div>
    );
  };

  // Version Control Header Component
  const VersionControlHeader = () => {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              fontWeight: '500',
              marginRight: '0.5rem' 
            }}>
              Version:
            </span>
            <span style={{ 
              backgroundColor: colors.neutral200,
              color: colors.neutral800,
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500',
              padding: '0.125rem 0.625rem'
            }}>
              Draft - v0.2
            </span>
          </div>
          <p style={{ 
            fontSize: '0.75rem',
            color: colors.neutral600,
            marginTop: '0.25rem'
          }}>
            Last saved: May 7, 2025, 11:30 AM
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral400}`,
            color: colors.neutral800,
            padding: '0.375rem 0.625rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            <span style={{ marginRight: '0.25rem' }}>↓</span>
            Save Version
          </button>
          
          <button style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral400}`,
            color: colors.neutral800,
            padding: '0.375rem 0.625rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            <span style={{ marginRight: '0.25rem' }}>👁</span>
            View History
          </button>
        </div>
      </div>
    );
  };

  // State for form fields
  const [formData, setFormData] = useState({
    // Business Model
    businessModelDetails: "",
    keySuppliersCustomers: "",
    
    // Trading Activity
    tradingActivityRationale: "",
    tradingFlowDrivers: "",
    positionSizeDeterminants: "",
    tradingPolicyGovernance: "",
    
    // Risk Management
    hedgeEffectiveness: "",
    hedgeAccountingApproach: "",
    stressTestingMethodology: "",
    varMethodology: "",
    riskManagementSystem: "",
    
    // Liquidity
    cashManagementApproach: "",
    notionalPositionDetails: "",
    liquidityManagement: "",
    bankingRelationships: "",
    
    // References
    accountExecutiveName: "John Smith",
    relationshipManagerName: "Michael Chen",
  });

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add form submission logic here
  };
  
  // Sample data for the credit request
  const creditRequestData = {
    requestId: 'CR-2025-0123',
    title: 'ABC Corporation - Credit Limit Increase',
    counterparty: 'ABC Corporation',
    submissionDate: '2025-05-01',
    requiredByDate: '2025-05-20',
    priority: 'High'
  };

  // Tabs for the questionnaire
  const tabs = [
    { id: 'businessModel', label: 'Business Model' },
    { id: 'tradingActivity', label: 'Trading Activities' },
    { id: 'riskManagement', label: 'Risk Management' },
    { id: 'liquidity', label: 'Funding & Liquidity' }
  ];

  return (
    <div style={{ 
      fontFamily: "'Inter', sans-serif", 
      color: colors.neutral800,
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.5rem'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold',
                marginRight: '1rem',
                marginBottom: 0
              }}>
                Credit Questionnaire
              </h1>
              <span style={{ 
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                padding: '0.25rem 0.75rem'
              }}>
                {creditRequestData.requestId}
              </span>
            </div>
            <p style={{ 
              marginTop: '0.25rem',
              fontSize: '0.875rem',
              color: colors.neutral600
            }}>
              {creditRequestData.title} - Analysis Phase
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ 
              backgroundColor: 'white',
              border: `1px solid ${colors.neutral400}`,
              color: colors.neutral800,
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Save as Draft
            </button>
            
            <button 
              onClick={handleSubmit}
              style={{ 
                backgroundColor: colors.standardBankBlue,
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Submit for Review
            </button>
          </div>
        </div>
      </div>
      
      {/* Workflow Status */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <WorkflowStatus currentStep={3} />
      </div>
      
      {/* Form content */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <VersionControlHeader />
        
        {/* Questionnaire Tabs */}
        <div style={{ 
          display: 'flex',
          borderBottom: `1px solid ${colors.neutral300}`,
          marginBottom: '1.5rem'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '2px solid',
                borderBottomColor: activeTab === tab.id ? colors.standardBankBlue : 'transparent',
                color: activeTab === tab.id ? colors.standardBankBlue : colors.neutral600,
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Business Model Tab Content */}
        {activeTab === 'businessModel' && (
          <FormSection 
            title="Business Model Overview" 
            description="Provide details on the counterparty's business model and operations."
          >
            <FormField 
              label="Business Model Details" 
              type="textarea" 
              name="businessModelDetails"
              value={formData.businessModelDetails}
              onChange={handleChange}
              placeholder="Describe the counterparty's core business model, key products/services, and market position"
              required={true}
            />
            
            <FormField 
              label="Key Suppliers and Customers" 
              type="textarea" 
              name="keySuppliersCustomers"
              value={formData.keySuppliersCustomers}
              onChange={handleChange}
              placeholder="List major suppliers and customers, including concentration percentages if available"
              required={true}
            />
          </FormSection>
        )}
        
        {/* Trading Activities Tab Content */}
        {activeTab === 'tradingActivity' && (
          <FormSection 
            title="Trading Activities" 
            description="Provide details on the counterparty's trading activities and rationale."
          >
            <FormField 
              label="Trading Activity Rationale" 
              type="textarea" 
              name="tradingActivityRationale"
              value={formData.tradingActivityRationale}
              onChange={handleChange}
              placeholder="Explain the business rationale behind the counterparty's trading activities"
              required={true}
            />
            
            <FormField 
              label="Trading Flow Drivers" 
              type="textarea" 
              name="tradingFlowDrivers"
              value={formData.tradingFlowDrivers}
              onChange={handleChange}
              placeholder="Describe the key drivers of trading flows and volumes"
              required={true}
            />
            
            <FormField 
              label="Position Size Determinants" 
              type="textarea" 
              name="positionSizeDeterminants"
              value={formData.positionSizeDeterminants}
              onChange={handleChange}
              placeholder="Explain how position sizes are determined and what limits are in place"
              required={true}
            />
            
            <FormField 
              label="Trading Policy & Governance" 
              type="textarea" 
              name="tradingPolicyGovernance"
              value={formData.tradingPolicyGovernance}
              onChange={handleChange}
              placeholder="Describe the governance structure and oversight of trading activities"
              required={true}
            />
          </FormSection>
        )}
        
        {/* Risk Management Tab Content */}
        {activeTab === 'riskManagement' && (
          <FormSection 
            title="Risk Management" 
            description="Provide details on the counterparty's risk management approach."
          >
            <FormField 
              label="Hedge Effectiveness" 
              type="textarea" 
              name="hedgeEffectiveness"
              value={formData.hedgeEffectiveness}
              onChange={handleChange}
              placeholder="Describe how the effectiveness of hedges is measured and monitored"
              required={true}
            />
            
            <FormField 
              label="Hedge Accounting Approach" 
              type="textarea" 
              name="hedgeAccountingApproach"
              value={formData.hedgeAccountingApproach}
              onChange={handleChange}
              placeholder="Explain the accounting treatment for hedging activities"
              required={true}
            />
            
            <FormField 
              label="Stress Testing Methodology" 
              type="textarea" 
              name="stressTestingMethodology"
              value={formData.stressTestingMethodology}
              onChange={handleChange}
              placeholder="Detail the stress testing approaches used to assess risk exposures"
              required={true}
            />
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1.5rem',
              marginTop: '1.5rem'
            }}>
              <FormField 
                label="Value at Risk (VaR) Methodology" 
                type="select" 
                name="varMethodology"
                value={formData.varMethodology}
                onChange={handleChange}
                placeholder="Select methodology"
                options={[
                  { value: "historical", label: "Historical Simulation" },
                  { value: "parametric", label: "Parametric (Variance-Covariance)" },
                  { value: "monte_carlo", label: "Monte Carlo Simulation" },
                  { value: "none", label: "Not Applicable" }
                ]} 
              />
              
              <FormField 
                label="Risk Management System" 
                type="select" 
                name="riskManagementSystem"
                value={formData.riskManagementSystem}
                onChange={handleChange}
                placeholder="Select system"
                options={[
                  { value: "murex", label: "Murex" },
                  { value: "calypso", label: "Calypso" },
                  { value: "openlink", label: "OpenLink" },
                  { value: "finastra", label: "Finastra" },
                  { value: "custom", label: "Custom In-house System" },
                  { value: "other", label: "Other" },
                  { value: "none", label: "None" }
                ]} 
              />
            </div>
          </FormSection>
        )}
        
        {/* Funding & Liquidity Tab Content */}
        {activeTab === 'liquidity' && (
          <>
            <FormSection 
              title="Funding & Liquidity" 
              description="Provide details on the counterparty's funding sources and liquidity management."
            >
              <FormField 
                label="Cash Management Approach" 
                type="textarea" 
                name="cashManagementApproach"
                value={formData.cashManagementApproach}
                onChange={handleChange}
                placeholder="Describe how cash positions are managed across the organization"
                required={true}
              />
              
              <FormField 
                label="Notional Position Details" 
                type="textarea" 
                name="notionalPositionDetails"
                value={formData.notionalPositionDetails}
                onChange={handleChange}
                placeholder="Provide details on typical notional position sizes and distribution"
                required={true}
              />
              
              <FormField 
                label="Liquidity Management" 
                type="textarea" 
                name="liquidityManagement"
                value={formData.liquidityManagement}
                onChange={handleChange}
                placeholder="Explain liquidity management strategies and contingency planning"
                required={true}
              />
              
              <FormField 
                label="Banking Relationships" 
                type="textarea" 
                name="bankingRelationships"
                value={formData.bankingRelationships}
                onChange={handleChange}
                placeholder="List key banking relationships and credit facilities"
                required={true}
              />
            </FormSection>
            
            <div style={{ 
              backgroundColor: colors.blueLight,
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{ 
                marginRight: '0.75rem',
                fontSize: '1.25rem',
                color: colors.standardBankBlue
              }}>
                ℹ️
              </span>
              <p style={{ 
                fontSize: '0.875rem',
                color: colors.standardBankBlue,
                margin: 0
              }}>
                Please attach the latest liquidity reports and covenant compliance certificates if available. Supporting documentation can be uploaded by clicking the "Attach Document" button below.
              </p>
            </div>
            
            <button style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'white',
              border: `1px solid ${colors.neutral400}`,
              color: colors.neutral800,
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '1.5rem'
            }}>
              <span style={{ marginRight: '0.5rem' }}>📎</span>
              Attach Document
            </button>
          </>
        )}
        
        {/* Request Information */}
        <FormSection 
          title="Reference Information" 
          description="Account Executive and Relationship Manager details."
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <FormField 
              label="Account Executive Name" 
              name="accountExecutiveName"
              value={formData.accountExecutiveName}
              onChange={handleChange}
              disabled={true}
            />
            
            <FormField 
              label="Relationship Manager Name" 
              name="relationshipManagerName"
              value={formData.relationshipManagerName}
              onChange={handleChange}
              disabled={true}
            />
          </div>
        </FormSection>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '2rem' 
        }}>
          <button style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'white',
            color: colors.neutral800,
            fontWeight: '500',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: `1px solid ${colors.neutral400}`,
            cursor: 'pointer'
          }}>
            <span style={{ marginRight: '0.5rem' }}>←</span>
            Back to Dashboard
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ 
              backgroundColor: 'white',
              border: `1px solid ${colors.neutral400}`,
              color: colors.neutral800,
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Save as Draft
            </button>
            
            <button 
              onClick={handleSubmit}
              style={{ 
                backgroundColor: colors.standardBankBlue,
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Submit for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditQuestionnaireForm;
