import React from 'react';

// Approval Form Screen for the Credit Risk Workflow
const ApprovalForm = () => {
  // Brand colors
  const colors = {
    icbcRed: '#e31937',
    standardBankBlue: '#0c4da2',
    redLight: '#fde8eb',
    blueLight: '#e6edf7'
  };
  
  // Workflow Status Component
  const WorkflowStatus = ({ currentStep = 5 }) => {
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
                    ? '#38B2AC'  // success color for completed steps
                    : index === currentStep 
                    ? colors.standardBankBlue  // brand blue for current step
                    : '#E4E7EB',  // light gray for future steps
                  color: index <= currentStep ? 'white' : '#7B8794'
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
                  color: index === currentStep ? '#323F4B' : '#7B8794'
                }}>
                  {step}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div style={{ 
                  flexGrow: 1, 
                  height: '0.25rem',
                  backgroundColor: index < currentStep ? '#38B2AC' : '#E4E7EB'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  // Form Field Component
  const FormField = ({ label, type = "text", placeholder, required = false, options = [] }) => {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.25rem', 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          color: '#4A5568' 
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
              border: '1px solid #CBD2D9',
              padding: '0.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            placeholder={placeholder}
            rows={3}
          />
        ) : type === "select" ? (
          <select
            style={{ 
              marginTop: '0.25rem',
              display: 'block',
              width: '100%',
              borderRadius: '0.375rem',
              border: '1px solid #CBD2D9',
              padding: '0.5rem',
              fontSize: '0.875rem',
              background: 'white',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
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
                borderColor: '#CBD2D9'
              }}
            />
            <label style={{ 
              marginLeft: '0.5rem',
              fontSize: '0.875rem',
              color: '#4A5568' 
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
              border: '1px solid #CBD2D9',
              padding: '0.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  };
  
  return (
    <div style={{ 
      fontFamily: "'Inter', sans-serif", 
      color: '#323F4B',
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
                marginBottom: '0'
              }}>
                Credit Approval
              </h1>
              <span style={{ 
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                padding: '0.25rem 0.75rem'
              }}>
                CR-2025-0123
              </span>
            </div>
            <p style={{ 
              marginTop: '0.25rem',
              fontSize: '0.875rem',
              color: '#7B8794'
            }}>
              ABC Corporation - Pending Approval (DA4)
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ 
              backgroundColor: 'white',
              border: '1px solid #CBD2D9',
              color: '#323F4B',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Return for Revision
            </button>
            
            <button style={{ 
              backgroundColor: '#DC2626',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Reject
            </button>
            
            <button style={{ 
              backgroundColor: '#059669',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Approve
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
        <WorkflowStatus currentStep={5} />
      </div>
      
      {/* Content */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Main Content */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            marginBottom: '1.5rem' 
          }}>
            Credit Paper Summary
          </h2>
          
          {/* Executive Summary */}
          <div style={{ 
            backgroundColor: '#F5F7FA',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '0.5rem'
            }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              ABC Corporation is seeking an increase in their existing credit limits to support growing business operations. The company has demonstrated strong financial performance over the past 24 months, with improving margins and consistent cash flow generation. The requested facilities include a term loan increase from USD 3M to USD 5M and a trading line increase from USD 1.5M to USD 2.5M. Internal rating is maintained at BBB with a PD of 2.5%. Key risks include geographic concentration and commodity price sensitivity, which are mitigated by diversification efforts and hedging programs.
            </p>
          </div>
          
          {/* Financial Analysis Highlights */}
          <div style={{ 
            backgroundColor: '#F5F7FA',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '0.5rem'
            }}>
              Financial Analysis Highlights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#7B8794' }}>Revenue Growth (YoY)</span>
                <span style={{ color: '#059669', fontWeight: '500' }}>+12.5%</span>
              </div>
              <div style={{ 
                width: '100%',
                height: '1px',
                backgroundColor: '#E4E7EB',
                margin: '0.25rem 0'
              }}></div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#7B8794' }}>EBITDA Margin</span>
                <span style={{ fontWeight: '500' }}>18.7%</span>
              </div>
              <div style={{ 
                width: '100%',
                height: '1px',
                backgroundColor: '#E4E7EB',
                margin: '0.25rem 0'
              }}></div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#7B8794' }}>Debt-to-EBITDA Ratio</span>
                <span style={{ fontWeight: '500' }}>2.3x</span>
              </div>
              <div style={{ 
                width: '100%',
                height: '1px',
                backgroundColor: '#E4E7EB',
                margin: '0.25rem 0'
              }}></div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#7B8794' }}>Interest Coverage Ratio</span>
                <span style={{ fontWeight: '500' }}>5.8x</span>
              </div>
            </div>
          </div>
          
          {/* Risk Assessment */}
          <div style={{ 
            backgroundColor: '#F5F7FA',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '0.5rem'
            }}>
              Risk Assessment
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  marginBottom: '0.25rem'
                }}>
                  Key Risks
                </h4>
                <ul style={{ 
                  listStyleType: 'disc', 
                  paddingLeft: '1.25rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <li>Geographic concentration in Southeast Asian markets (67% of revenue)</li>
                  <li>Sensitivity to commodity price fluctuations</li>
                  <li>Moderate FX exposure from USD-denominated debt</li>
                </ul>
              </div>
              <div>
                <h4 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  marginBottom: '0.25rem'
                }}>
                  Mitigating Factors
                </h4>
                <ul style={{ 
                  listStyleType: 'disc', 
                  paddingLeft: '1.25rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <li>Diversification strategy in progress with expansion into Australia and Japan</li>
                  <li>Commodity hedging program in place covering 60% of exposure</li>
                  <li>Natural FX hedge from USD export revenues</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Recommendation */}
          <div style={{ 
            backgroundColor: '#F5F7FA',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '0.5rem'
            }}>
              Recommendation
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              Credit Analysis recommends <span style={{ fontWeight: '500' }}>Approval</span> of the requested credit facilities based on the company's strong financial performance, positive outlook, and adequate risk mitigation measures. The required approval level is DA4 (Regional Head).
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Proposed terms include standard financial covenants (Debt/EBITDA ≤ 3.0x, EBITDA/Interest ≥ 4.0x), quarterly financial reporting, and annual review of facilities.
            </p>
          </div>
          
          {/* Approval Form */}
          <div style={{ 
            border: '1px solid #E4E7EB', 
            borderRadius: '0.375rem', 
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '1rem'
            }}>
              Approval Decision
            </h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <FormField 
                label="Decision" 
                type="select" 
                required={true}
                options={[
                  { value: "", label: "Select decision" },
                  { value: "approve", label: "Approve as Requested" },
                  { value: "approve_modified", label: "Approve with Modifications" },
                  { value: "return", label: "Return for Further Analysis" },
                  { value: "reject", label: "Reject" }
                ]} 
              />
              <FormField 
                label="Approval Type" 
                type="select" 
                required={true}
                options={[
                  { value: "individual", label: "Individual Approval" },
                  { value: "committee", label: "Committee Approval" }
                ]} 
              />
            </div>
            
            <FormField 
              label="Decision Comments" 
              type="textarea" 
              placeholder="Provide detailed comments supporting your decision" 
              required={true}
            />
            
            <FormField 
              label="Additional Terms & Conditions" 
              type="textarea" 
              placeholder="Specify any additional terms or conditions for the approval" 
            />
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid #E4E7EB',
              paddingTop: '1rem',
              marginTop: '1rem'
            }}>
              <input
                type="checkbox"
                style={{ 
                  height: '1rem', 
                  width: '1rem',
                  borderRadius: '0.25rem',
                  borderColor: '#CBD2D9'
                }}
              />
              <label style={{ 
                marginLeft: '0.5rem',
                fontSize: '0.875rem',
                color: '#4A5568' 
              }}>
                I confirm that I have reviewed the credit paper and all supporting documentation, and I am authorized to make this credit decision.
              </label>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Credit Request Summary */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '1rem'
            }}>
              Credit Request Summary
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#7B8794',
                  marginBottom: '0.25rem'
                }}>
                  Counterparty
                </p>
                <p style={{ fontWeight: '500' }}>ABC Corporation</p>
              </div>
              
              <div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#7B8794',
                  marginBottom: '0.25rem'
                }}>
                  Internal Rating
                </p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>BBB</span>
                  <span style={{ fontSize: '0.75rem', color: '#7B8794' }}>(PD: 2.5%)</span>
                </div>
              </div>
              
              <div style={{ 
                paddingTop: '0.75rem', 
                borderTop: '1px solid #E4E7EB' 
              }}>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#7B8794',
                  marginBottom: '0.5rem'
                }}>
                  Credit Facilities
                </p>
                
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ 
                    padding: '0.5rem',
                    backgroundColor: '#F5F7FA',
                    borderRadius: '0.25rem',
                    border: '1px solid #E4E7EB'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        Term Loan
                      </span>
                      <span style={{ fontSize: '0.875rem' }}>USD 5,000,000</span>
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: '#7B8794'
                    }}>
                      24 months
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '0.5rem',
                    backgroundColor: '#F5F7FA',
                    borderRadius: '0.25rem',
                    border: '1px solid #E4E7EB'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        Trading Line
                      </span>
                      <span style={{ fontSize: '0.875rem' }}>USD 2,500,000</span>
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: '#7B8794'
                    }}>
                      12 months
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Supporting Documents */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '1rem'
            }}>
              Supporting Documents
            </h3>
            
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {[
                { title: 'Credit Analysis', date: 'Completed on May 5, 2025' },
                { title: 'Legal Review', date: 'Completed on May 4, 2025' },
                { title: 'Credit Questionnaire', date: 'Completed on May 3, 2025' },
                { title: 'Financial Statements', date: 'FY 2024 Audited' }
              ].map((doc) => (
                <a 
                  key={doc.title} 
                  href="#"
                  style={{ 
                    display: 'block',
                    padding: '0.75rem',
                    backgroundColor: '#F5F7FA',
                    borderRadius: '0.5rem',
                    border: '1px solid #E4E7EB',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      color: '#7B8794',
                      marginRight: '0.75rem'
                    }}>
                      📄
                    </div>
                    <div>
                      <p style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {doc.title}
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem',
                        color: '#7B8794'
                      }}>
                        {doc.date}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalForm;