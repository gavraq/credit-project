import React, { useState } from 'react';

const BusinessSponsorshipForm = () => {
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
  const WorkflowStatus = ({ currentStep = 2 }) => {
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
              Draft - v0.1
            </span>
          </div>
          <p style={{ 
            fontSize: '0.75rem',
            color: colors.neutral600,
            marginTop: '0.25rem'
          }}>
            Last saved: May 5, 2025, 9:30 AM
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
    businessSponsorName: "Sarah Johnson",
    secondSponsorName: "",
    sponsorApproval: "",
    sponsorComments: "",
    secondSponsorApproval: "",
    secondSponsorComments: "",
    confirmApproval: false
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

  // Handle rejection
  const handleReject = () => {
    // Show rejection confirmation dialog or directly reject
    console.log("Credit request rejected by Business Sponsor");
  };
  
  // Sample data for the credit request being reviewed
  const creditRequestData = {
    requestId: 'CR-2025-0123',
    title: 'ABC Corporation - Credit Limit Increase',
    counterparty: 'ABC Corporation',
    submissionDate: '2025-05-01',
    requiredByDate: '2025-05-20',
    priority: 'High',
    relationshipManager: 'Michael Chen'
  };

  // Sample data for the requested credit facilities
  const creditFacilities = [
    {
      type: 'Term Loan',
      existing: '3,000,000',
      proposed: '5,000,000',
      tenor: '24 months'
    },
    {
      type: 'Trading Line',
      existing: '1,500,000',
      proposed: '2,500,000',
      tenor: '12 months'
    }
  ];

  // Sample data for Relationship Manager's justification
  const rmJustification = `ABC Corporation has been a key client for 5+ years with consistent growth. The increased limits will support their expansion into new markets in Asia. Their financial performance has been strong with revenue growth of 12% YoY and improved profitability metrics. The additional facilities are expected to generate approximately USD 450,000 in annual revenue for our institution.`;

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
                Business Sponsorship
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
              {creditRequestData.title}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handleReject}
              style={{ 
                backgroundColor: colors.redLight,
                border: 'none',
                color: colors.icbcRed,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Reject
            </button>
            
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
              Submit for Analysis
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
        <WorkflowStatus currentStep={2} />
      </div>
      
      {/* Credit Request Summary */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold',
          marginBottom: '1rem' 
        }}>
          Credit Request Summary
        </h2>
        
        <div style={{ 
          backgroundColor: colors.neutral200,
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <p style={{ 
                fontSize: '0.75rem', 
                color: colors.neutral600,
                marginBottom: '0.25rem'
              }}>
                Counterparty
              </p>
              <p style={{ fontWeight: '500' }}>{creditRequestData.counterparty}</p>
            </div>
            
            <div>
              <p style={{ 
                fontSize: '0.75rem', 
                color: colors.neutral600,
                marginBottom: '0.25rem'
              }}>
                Request Date
              </p>
              <p>{creditRequestData.submissionDate}</p>
            </div>
          </div>
        </div>
        
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          marginBottom: '0.75rem',
          marginTop: '1.5rem'
        }}>
          Requested Credit Facilities
        </h3>
        
        <div style={{ 
          backgroundColor: colors.neutral200,
          padding: '1rem',
          borderRadius: '0.5rem',
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {creditFacilities.map((facility, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.neutral300}`
                }}
              >
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ 
                    fontSize: '1rem',
                    fontWeight: '600' 
                  }}>
                    {facility.type}
                  </span>
                  <span style={{ 
                    backgroundColor: colors.blueLight,
                    color: colors.standardBankBlue,
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    padding: '0.125rem 0.625rem'
                  }}>
                    {facility.tenor}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', color: colors.neutral600 }}>Existing Limit:</span>
                  <span style={{ fontSize: '0.875rem' }}>USD {facility.existing}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: colors.neutral600 }}>Proposed Limit:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>USD {facility.proposed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.75rem'
          }}>
            Relationship Manager's Justification
          </h3>
          <div style={{ 
            backgroundColor: colors.neutral200,
            padding: '1rem',
            borderRadius: '0.5rem',
          }}>
            <p style={{ fontSize: '0.875rem' }}>
              {rmJustification}
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '1.5rem' }}>
          <button style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: colors.blueLight,
            color: colors.standardBankBlue,
            fontWeight: '500',
            fontSize: '0.875rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer'
          }}>
            <span style={{ marginRight: '0.5rem' }}>👁</span>
            View Full Credit Request
          </button>
        </div>
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
          title="Business Sponsorship" 
          description="Provide your business sponsorship approval or rejection for this credit request."
        >
          <div style={{ 
            backgroundColor: colors.neutral200,
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem'
            }}>
              Senior Business Sponsor
            </h4>
            <FormField 
              label="Business Sponsor Name" 
              name="businessSponsorName"
              value={formData.businessSponsorName}
              onChange={handleChange}
              disabled={true}
            />
            
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem',
              marginTop: '1rem'
            }}>
              Sponsorship Decision <span style={{ color: colors.icbcRed }}>*</span>
            </p>
            <FormField 
              type="radio" 
              name="sponsorApproval"
              value={formData.sponsorApproval}
              onChange={handleChange}
              options={[
                { value: "approve", label: "Approve - I sponsor this credit request" },
                { value: "reject", label: "Reject - I do not sponsor this credit request" }
              ]} 
            />
            
            <FormField 
              label="Comments" 
              type="textarea" 
              name="sponsorComments"
              value={formData.sponsorComments}
              onChange={handleChange}
              placeholder="Provide comments on your decision" 
              required={formData.sponsorApproval === 'reject'}
            />
          </div>
          
          <div style={{ 
            backgroundColor: colors.neutral200,
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem'
            }}>
              Optional Second Business Sponsor
            </h4>
            <FormField 
              label="Second Business Sponsor Name" 
              name="secondSponsorName"
              value={formData.secondSponsorName}
              onChange={handleChange}
              placeholder="Enter name of second sponsor (if applicable)"
            />
            
            {formData.secondSponsorName && (
              <>
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  marginBottom: '0.5rem',
                  marginTop: '1rem'
                }}>
                  Second Sponsor Decision
                </p>
                <FormField 
                  type="radio" 
                  name="secondSponsorApproval"
                  value={formData.secondSponsorApproval}
                  onChange={handleChange}
                  options={[
                    { value: "approve", label: "Approve - I sponsor this credit request" },
                    { value: "reject", label: "Reject - I do not sponsor this credit request" }
                  ]} 
                />
                
                <FormField 
                  label="Comments" 
                  type="textarea" 
                  name="secondSponsorComments"
                  value={formData.secondSponsorComments}
                  onChange={handleChange}
                  placeholder="Provide comments on your decision" 
                />
              </>
            )}
          </div>
        </FormSection>
        
        <FormSection 
          title="Confirmation" 
          description="Confirm your sponsorship decision."
        >
          <FormField 
            type="checkbox" 
            name="confirmApproval"
            value={formData.confirmApproval}
            onChange={handleChange}
            placeholder="I confirm that I have reviewed the credit request and supporting documentation, and I approve sponsorship of this request." 
            required={true}
          />
          
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: colors.blueLight,
            borderRadius: '0.5rem',
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
              By approving this request, you are confirming that the credit request aligns with the business strategy and the relationship is expected to meet or exceed the stated revenue projections.
            </p>
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
              Submit for Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSponsorshipForm;
