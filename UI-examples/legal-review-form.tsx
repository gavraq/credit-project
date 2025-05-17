import React, { useState } from 'react';

const LegalReviewForm = () => {
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
        ) : type === "radio" ? (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
            {options.map((option) => (
              <div key={option.value} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  id={`${name}_${option.value}`}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={onChange}
                  style={{ 
                    marginRight: '0.5rem',
                  }}
                />
                <label 
                  htmlFor={`${name}_${option.value}`}
                  style={{ 
                    fontSize: '0.875rem',
                    color: colors.neutral700 
                  }}
                >
                  {option.label}
                </label>
              </div>
            ))}
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
              Draft - v0.1
            </span>
          </div>
          <p style={{ 
            fontSize: '0.75rem',
            color: colors.neutral600,
            marginTop: '0.25rem'
          }}>
            Last saved: May 6, 2025, 14:15 PM
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

  // Sample data for the credit request
  const creditRequestData = {
    requestId: 'CR-2025-0123',
    title: 'ABC Corporation - Credit Limit Increase',
    counterparty: 'ABC Corporation',
    submissionDate: '2025-05-01',
    requiredByDate: '2025-05-20',
    priority: 'High'
  };

  // Legal opinion options with associated styling
  const legalOpinionOptions = [
    { 
      id: 'approve', 
      title: 'Approve',
      description: 'No legal concerns',
      icon: '✓',
      iconColor: colors.success,
      selected: true
    },
    { 
      id: 'approve_conditions', 
      title: 'Approve with Conditions',
      description: 'Minor legal concerns',
      icon: '⚠️',
      iconColor: colors.warning,
      selected: false
    },
    { 
      id: 'reject', 
      title: 'Reject',
      description: 'Significant concerns',
      icon: '✕',
      iconColor: colors.error,
      selected: false
    }
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
                Legal Review
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
            
            <button style={{ 
              backgroundColor: colors.standardBankBlue,
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
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
        
        <FormSection 
          title="Agreement Information" 
          description="Provide details on the legal agreement structure."
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <FormField 
              label="Agreement Type" 
              type="select" 
              placeholder="Select agreement type"
              required={true}
              options={[
                { value: "isda", label: "ISDA Master Agreement" },
                { value: "gmra", label: "Global Master Repurchase Agreement (GMRA)" },
                { value: "gmsla", label: "Global Master Securities Lending Agreement (GMSLA)" },
                { value: "ifema", label: "International Foreign Exchange Master Agreement (IFEMA)" },
                { value: "loan", label: "Loan Agreement" },
                { value: "bespoke", label: "Bespoke Agreement" }
              ]} 
            />
            
            <FormField 
              label="Governing Law" 
              type="select" 
              placeholder="Select governing law"
              required={true}
              options={[
                { value: "england", label: "English Law" },
                { value: "ny", label: "New York Law" },
                { value: "hongkong", label: "Hong Kong Law" },
                { value: "singapore", label: "Singapore Law" },
                { value: "other", label: "Other" }
              ]} 
            />
          </div>
          
          <div style={{ 
            marginTop: '1.5rem',
            backgroundColor: colors.neutral200,
            padding: '1rem',
            borderRadius: '0.5rem'
          }}>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem'
            }}>
              Agreement Status
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  id="existing"
                  name="agreementStatus"
                  value="existing"
                  checked={true}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="existing" style={{ fontSize: '0.875rem' }}>
                  Existing Agreement
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  id="new"
                  name="agreementStatus"
                  value="new"
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="new" style={{ fontSize: '0.875rem' }}>
                  New Agreement Required
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  id="amendment"
                  name="agreementStatus"
                  value="amendment"
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="amendment" style={{ fontSize: '0.875rem' }}>
                  Amendment Required
                </label>
              </div>
            </div>
          </div>
        </FormSection>
        
        <FormSection 
          title="Key Legal Terms" 
          description="Provide analysis of key legal terms and provisions."
        >
          <FormField 
            label="Termination Rights" 
            type="textarea" 
            placeholder="Describe termination rights, notice periods, and any unusual provisions"
            required={true}
          />
          
          <FormField 
            label="Events of Default" 
            type="textarea" 
            placeholder="List and analyze key events of default and their implications"
            required={true}
          />
          
          <FormField 
            label="Acceleration Clauses" 
            type="textarea" 
            placeholder="Detail acceleration provisions and conditions"
            required={true}
          />
        </FormSection>
        
        <FormSection 
          title="Legal Risk Analysis" 
          description="Analyze key legal risks associated with the agreement."
        >
          <FormField 
            label="Jurisdictional Issues" 
            type="textarea" 
            placeholder="Identify and assess any jurisdictional risks or enforceability concerns"
            required={true}
          />
          
          <FormField 
            label="Bankruptcy Limitations" 
            type="textarea" 
            placeholder="Analyze potential bankruptcy or insolvency implications and limitations"
            required={true}
          />
          
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: colors.redLight,
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            <span style={{ 
              marginRight: '0.75rem',
              fontSize: '1.25rem',
              color: colors.icbcRed
            }}>
              ⚠️
            </span>
            <p style={{ 
              fontSize: '0.875rem',
              color: colors.icbcRed,
              margin: 0
            }}>
              Please highlight any provisions that require specific credit approval or represent material legal risk to the institution.
            </p>
          </div>
        </FormSection>
        
        <FormSection 
          title="Legal Recommendations" 
          description="Provide recommendations and legal opinion."
        >
          <FormField 
            label="Legal Commentary" 
            type="textarea" 
            placeholder="Provide overall legal assessment and recommendations"
            required={true}
          />
          
          <div style={{ 
            marginTop: '1.5rem',
            backgroundColor: colors.neutral200,
            padding: '1rem',
            borderRadius: '0.5rem'
          }}>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem'
            }}>
              Legal Opinion
            </h4>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {legalOpinionOptions.map((option) => (
                <div 
                  key={option.id}
                  style={{ 
                    padding: '1rem',
                    backgroundColor: 'white',
                    borderRadius: '0.375rem',
                    border: `1px solid ${option.selected ? option.iconColor : colors.neutral300}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: option.selected ? `0 0 0 2px ${option.iconColor}` : 'none'
                  }}
                >
                  <div style={{ 
                    color: option.iconColor,
                    marginBottom: '0.5rem',
                    fontSize: '1.25rem'
                  }}>
                    {option.icon}
                  </div>
                  <div style={{ fontWeight: '500' }}>{option.title}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.neutral500 }}>{option.description}</div>
                </div>
              ))}
            </div>
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
            
            <button style={{ 
              backgroundColor: colors.standardBankBlue,
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Submit for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalReviewForm;
