import React, { useState } from 'react';

const CreditRequestForm = () => {
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
  
  // Form Wizard Nav Component
  const FormWizardNav = () => {
    const steps = [
      "Counterparty Info",
      "Limit Details",
      "Business Justification",
      "Compliance",
      "Review & Submit"
    ];
    
    const currentStep = 0; // For demonstration purposes
    
    return (
      <div style={{ padding: '1rem 0' }}>
        <nav style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '0 1rem'
        }}>
          {steps.map((step, index) => (
            <button
              key={step}
              style={{
                padding: '0.75rem 0',
                borderBottom: '2px solid',
                borderBottomColor: index === currentStep 
                  ? colors.standardBankBlue 
                  : index < currentStep 
                  ? colors.success 
                  : colors.neutral300,
                color: index === currentStep 
                  ? colors.standardBankBlue 
                  : index < currentStep 
                  ? colors.success 
                  : colors.neutral600,
                fontWeight: '500',
                fontSize: '0.875rem',
                background: 'none',
                cursor: 'pointer',
                width: `calc(${100 / steps.length}% - 1rem)`,
                textAlign: 'center'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>{index + 1}.</span>
              {step}
            </button>
          ))}
        </nav>
      </div>
    );
  };
  
  // Form Field Component
  const FormField = ({ label, type = "text", placeholder, required = false, options = [], value }) => {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.25rem', 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          color: colors.neutral700 
        }}>
          {label} {required && <span style={{ color: colors.icbcRed }}>*</span>}
        </label>
        
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
            defaultValue={value}
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
            defaultValue={value}
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
              defaultChecked={value}
            />
            <label style={{ 
              marginLeft: '0.5rem',
              fontSize: '0.875rem',
              color: colors.neutral700 
            }}>
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
            defaultValue={value}
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

  // Sample limits data for the form
  const [limits, setLimits] = useState([
    { 
      id: 1, 
      type: 'Trading: Pre-Settlement', 
      existingAmount: '3000000', 
      existingTenor: '24',
      proposedAmount: '5000000',
      proposedTenor: '24'
    }
  ]);

  // Function to add a new limit row
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

  // Function to remove a limit row
  const removeLimit = (id) => {
    if (limits.length > 1) {
      setLimits(limits.filter(limit => limit.id !== id));
    }
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
            Last saved: May 7, 2025, 10:45 AM
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
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 'bold',
            marginBottom: '0'
          }}>
            New Credit Request
          </h1>
          
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
              Submit for Credit Review
            </button>
          </div>
        </div>
        
        <FormWizardNav />
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
          title="Header Information" 
          description="Basic information about the credit request."
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <FormField 
              label="Request Title" 
              placeholder="Enter a descriptive title for this request" 
              required={true} 
            />
            <FormField 
              label="Request Number" 
              placeholder="Auto-generated" 
              value="CR-2025-0124"
              disabled={true}
            />
            <FormField 
              label="Counterparty Name" 
              placeholder="Enter counterparty name" 
              required={true} 
            />
            <FormField 
              label="Counterparty CIF number" 
              placeholder="Enter counterparty identifier" 
              required={true} 
            />
            <FormField 
              label="Guarantor information" 
              placeholder="Enter guarantor details (if applicable)" 
            />
            <FormField 
              label="Guarantor CIF number" 
              placeholder="Enter guarantor identifier (if applicable)" 
            />
          </div>
        </FormSection>

        <FormSection 
          title="Existing and Proposed Limits" 
          description="Specify the existing and proposed credit limits."
        >
          {limits.map((limit, index) => (
            <div key={limit.id} style={{ 
              marginBottom: index < limits.length - 1 ? '1.5rem' : 0,
              padding: '1rem',
              backgroundColor: colors.neutral200,
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  margin: 0 
                }}>
                  Limit {index + 1}
                </h4>
                
                {limits.length > 1 && (
                  <button
                    onClick={() => removeLimit(limit.id)}
                    style={{ 
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: colors.icbcRed,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '1rem'
              }}>
                <div style={{ gridColumn: 'span 1' }}>
                  <FormField 
                    label="Limit Type" 
                    type="select" 
                    required={true}
                    options={[
                      { value: "trading_presettlement", label: "Trading: Pre-Settlement" },
                      { value: "trading_settlement", label: "Trading: Settlement" },
                      { value: "nostro_primary", label: "Nostro: Primary" },
                      { value: "loan_primary", label: "Loan: Primary" },
                      { value: "metal_lease_primary", label: "Metal Lease: Primary" },
                      { value: "risk_transfer_primary", label: "Risk Transfer: Primary" },
                      { value: "securities_financing_presettlement", label: "Securities Financing: Pre-Settlement" },
                      { value: "securities_financing_gross_liquid", label: "Securities Financing: Gross Liquid" },
                      { value: "securities_financing_gross", label: "Securities Financing: Gross" },
                      { value: "trs", label: "TRS" },
                      { value: "im_position", label: "IM Position" },
                      { value: "im_waiver", label: "IM Waiver" },
                      { value: "vm_waiver", label: "VM Waiver" }
                    ]} 
                    value={limit.type}
                  />
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    marginBottom: '0.5rem' 
                  }}>
                    Existing Limits
                  </div>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem'
                  }}>
                    <FormField 
                      label="Amount (US$ m)"
                      value={limit.existingAmount}
                    />
                    <FormField 
                      label="Tenor (months)"
                      value={limit.existingTenor}
                    />
                  </div>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    marginBottom: '0.5rem' 
                  }}>
                    Proposed Limits
                  </div>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem'
                  }}>
                    <FormField 
                      label="Amount (US$ m)"
                      required={true}
                      value={limit.proposedAmount}
                    />
                    <FormField 
                      label="Tenor (months)"
                      required={true}
                      value={limit.proposedTenor}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={addLimit}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: colors.standardBankBlue,
              color: 'white',
              fontWeight: '500',
              fontSize: '0.875rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            <span style={{ 
              marginRight: '0.5rem',
              fontSize: '1rem' 
            }}>+</span>
            Add Another Credit Limit
          </button>

          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: colors.blueLight,
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center'
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
              The Total Risk-Weighted Limits (Primary + Pre-Settlement) will be calculated automatically based on your inputs.
            </p>
          </div>
        </FormSection>

        <FormSection 
          title="Relationship Revenue" 
          description="Provide information about the revenue from this relationship."
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <FormField 
              label="Revenue from client in last 12 months (US$)" 
              type="number" 
              placeholder="Enter amount in USD" 
              required={true}
            />
            <FormField 
              label="Projected Revenue in the next 12 months (US$)" 
              type="number" 
              placeholder="Enter projected amount in USD" 
              required={true}
            />
            <FormField 
              label="Projected RoRWA/RoC percentage (%)" 
              type="number" 
              placeholder="Enter percentage" 
              required={true}
            />
          </div>
          
          <FormField 
            label="Detailed Comments on Limits Required" 
            type="textarea" 
            placeholder="Provide detailed business rationale for the requested limits" 
            required={true}
          />
          
          <FormField 
            label="Country Risk Limit Confirmation" 
            type="checkbox" 
            placeholder="I confirm that this request falls within the approved country risk limit" 
            required={true}
          />
        </FormSection>

        <FormSection 
          title="Relationship Comments" 
          description="Provide relationship and KYC information."
        >
          <FormField 
            label="How was the client introduced?" 
            type="textarea" 
            placeholder="Describe how the client was introduced" 
            required={true}
          />
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
            <FormField 
              label="KYC approval status" 
              type="select" 
              placeholder="Select KYC status"
              required={true}
              options={[
                { value: "yes", label: "Approved" },
                { value: "no", label: "Not Approved" },
                { value: "pending", label: "Pending" }
              ]} 
            />
            <FormField 
              label="Most senior contact at client" 
              placeholder="Enter name and title" 
              required={true}
            />
            <FormField 
              label="Date of last client visit" 
              type="date" 
              required={true}
            />
          </div>
        </FormSection>

        <FormSection 
          title="Legal Documentation" 
          description="Provide details on legal documentation."
        >
          <FormField 
            label="Legal Document Type" 
            type="textarea" 
            placeholder="Enter ISDA/CSA details including thresholds" 
            required={true}
          />
          
          <FormField 
            label="Confirmation of positive legal opinion" 
            type="select" 
            required={true}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "tbc", label: "TBC" }
            ]} 
          />
        </FormSection>

        <FormSection 
          title="Financial Disclosure" 
          description="Provide information about financial statements."
        >
          <FormField 
            label="Confirmation of receipt of audited financial statements" 
            type="select" 
            required={true}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" }
            ]} 
          />
          
          <FormField 
            label="Does the client produce interim financial statements?" 
            type="select" 
            required={true}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" }
            ]} 
          />
        </FormSection>

        <FormSection 
          title="Prioritisation" 
          description="Specify the priority of this request."
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <FormField 
              label="Urgency indicator" 
              type="select" 
              required={true}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" }
              ]} 
            />
            <FormField 
              label="Required by date" 
              type="date" 
              required={true}
            />
          </div>
          
          <FormField 
            label="Justification for high priority requests" 
            type="textarea" 
            placeholder="If high priority, please provide justification" 
          />
          
          <FormField 
            label="Senior business head sponsor for high priority requests" 
            placeholder="Enter name for high priority requests" 
          />
        </FormSection>

        <FormSection 
          title="Request Sponsorship" 
          description="Provide information about request sponsorship."
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <FormField 
              label="Account Executive Name" 
              placeholder="Enter Account Executive name" 
              required={true}
            />
            <FormField 
              label="Relationship Manager Name" 
              placeholder="Enter Relationship Manager name" 
              required={true}
              value="Michael Chen"
            />
            <FormField 
              label="Senior Business Sponsor Name" 
              placeholder="Enter Senior Business Sponsor name" 
              required={true}
            />
            <FormField 
              label="Optional Second Senior Business Sponsor Name" 
              placeholder="Enter second sponsor name (optional)" 
            />
          </div>
        </FormSection>

        <FormSection 
          title="Document Uploads" 
          description="Upload supporting documents."
        >
          <div style={{ 
            padding: '1.5rem',
            border: `1px dashed ${colors.neutral400}`,
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              color: colors.neutral500
            }}>
              📄
            </div>
            <p style={{ 
              fontSize: '0.875rem',
              color: colors.neutral700,
              marginBottom: '1rem'
            }}>
              Drag and drop files here, or click to browse
            </p>
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
              Browse Files
            </button>
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
            Back
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
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: colors.standardBankBlue,
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Continue
              <span style={{ marginLeft: '0.5rem' }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditRequestForm;
