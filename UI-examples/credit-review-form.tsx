import React, { useState } from 'react';

const CreditReviewForm = () => {
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
  const WorkflowStatus = ({ currentStep = 1 }) => {
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
            Last saved: May 3, 2025, 2:15 PM
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
    creditReviewer: "Jane Smith",
    assignedCreditAnalyst: "",
    daLevel: "",
    needQuestionnaire: "",
    additionalInfo: "",
    rejectionReason: ""
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
    console.log("Credit request rejected");
  };
  
  // Sample data for the credit request being reviewed
  const creditRequestData = {
    requestId: 'CR-2025-0123',
    title: 'ABC Corporation - Credit Limit Increase',
    counterparty: 'ABC Corporation',
    counterpartyCIF: 'CIF12345',
    submissionDate: '2025-05-01',
    requiredByDate: '2025-05-20',
    priority: 'High',
    relationshipManager: 'Michael Chen'
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
                Credit Review
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
              Submit for Business Sponsorship
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
        <WorkflowStatus currentStep={1} />
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
              Counterparty CIF
            </p>
            <p>{creditRequestData.counterpartyCIF}</p>
          </div>
          
          <div>
            <p style={{ 
              fontSize: '0.75rem', 
              color: colors.neutral600,
              marginBottom: '0.25rem'
            }}>
              Submission Date
            </p>
            <p>{creditRequestData.submissionDate}</p>
          </div>
          
          <div>
            <p style={{ 
              fontSize: '0.75rem', 
              color: colors.neutral600,
              marginBottom: '0.25rem'
            }}>
              Required By Date
            </p>
            <p>{creditRequestData.requiredByDate}</p>
          </div>
          
          <div>
            <p style={{ 
              fontSize: '0.75rem', 
              color: colors.neutral600,
              marginBottom: '0.25rem'
            }}>
              Priority
            </p>
            <div>
              <span style={{ 
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500',
                padding: '0.125rem 0.625rem',
                display: 'inline-block'
              }}>
                {creditRequestData.priority}
              </span>
            </div>
          </div>
          
          <div>
            <p style={{ 
              fontSize: '0.75rem', 
              color: colors.neutral600,
              marginBottom: '0.25rem'
            }}>
              Relationship Manager
            </p>
            <p>{creditRequestData.relationshipManager}</p>
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
          title="Credit Review" 
          description="Provide your assessment and next steps for this credit request."
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <FormField 
              label="Credit Reviewer" 
              name="creditReviewer"
              value={formData.creditReviewer}
              onChange={handleChange}
              disabled={true}
            />
            
            <FormField 
              label="Assigned Credit Analyst" 
              type="select" 
              name="assignedCreditAnalyst"
              value={formData.assignedCreditAnalyst}
              onChange={handleChange}
              placeholder="Select Credit Analyst"
              required={true}
              options={[
                { value: "sarah_johnson", label: "Sarah Johnson" },
                { value: "david_taylor", label: "David Taylor" },
                { value: "michelle_wong", label: "Michelle Wong" },
                { value: "kevin_patel", label: "Kevin Patel" }
              ]} 
            />
            
            <FormField 
              label="Delegated Authority (DA) level" 
              type="select" 
              name="daLevel"
              value={formData.daLevel}
              onChange={handleChange}
              placeholder="Select DA level"
              required={true}
              options={[
                { value: "1", label: "DA1 - Executive Committee" },
                { value: "2", label: "DA2 - Credit Committee" },
                { value: "3", label: "DA3 - Head of Credit" },
                { value: "4", label: "DA4 - Regional Head" },
                { value: "5", label: "DA5 - Department Head" },
                { value: "6", label: "DA6 - Senior Credit Analyst" },
                { value: "7", label: "DA7 - Credit Analyst" },
                { value: "8", label: "DA8 - Junior Credit Analyst" }
              ]} 
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem' 
            }}>
              Need for additional Credit Questionnaire? <span style={{ color: colors.icbcRed }}>*</span>
            </p>
            <FormField 
              type="radio" 
              name="needQuestionnaire"
              value={formData.needQuestionnaire}
              onChange={handleChange}
              options={[
                { value: "yes", label: "Yes - additional questionnaire required" },
                { value: "no", label: "No - sufficient information provided" }
              ]} 
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <FormField 
              label="Request additional information from Front Office" 
              type="textarea" 
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              placeholder="Specify any additional information required from the Front Office" 
            />
          </div>
          
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: colors.redLight,
            borderRadius: '0.5rem'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem',
              color: colors.icbcRed
            }}>
              Rejection Details
            </p>
            <FormField 
              label="Rejection Reason" 
              type="textarea" 
              name="rejectionReason"
              value={formData.rejectionReason}
              onChange={handleChange}
              placeholder="If rejecting this credit request, please provide detailed reasons" 
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
              Submit for Business Sponsorship
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditReviewForm;
