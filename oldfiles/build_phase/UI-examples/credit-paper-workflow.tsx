import React, { useState } from 'react';

const CreditPaper = () => {
  // State for tracking the current step in the workflow
  const [currentStep, setCurrentStep] = useState(3); // For demo, set to Analysis phase
  
  // Brand colors defined as per the design brief
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

  // Workflow steps
  const workflowSteps = [
    { id: 0, name: 'Credit Request', status: 'completed' },
    { id: 1, name: 'Credit Review', status: 'completed' },
    { id: 2, name: 'Business Sponsorship', status: 'completed' },
    { id: 3, name: 'Analysis', status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending' },
    { id: 4, name: 'Credit Paper', status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending' },
    { id: 5, name: 'Approval', status: currentStep === 5 ? 'current' : currentStep > 5 ? 'completed' : 'pending' }
  ];

  // Sample data for the credit paper
  const creditPaperData = {
    requestId: 'CR-2025-0123',
    title: 'ABC Corporation - Credit Limit Increase',
    counterparty: 'ABC Corporation',
    submissionDate: '2025-05-01',
    requiredByDate: '2025-05-20',
    priority: 'High',
    status: 'Analysis In Progress'
  };

  // Status for each sub-process
  const subProcessStatus = {
    creditRequest: { status: 'COMPLETED', lastUpdated: '2025-05-01' },
    creditReview: { status: 'COMPLETED', lastUpdated: '2025-05-03' },
    businessSponsorship: { status: 'COMPLETED', lastUpdated: '2025-05-05' },
    creditQuestionnaire: { status: 'IN_PROGRESS', lastUpdated: '2025-05-07' },
    legalReview: { status: 'IN_PROGRESS', lastUpdated: '2025-05-06' },
    creditAnalysis: { status: 'DRAFT', lastUpdated: '2025-05-06' },
    creditPaperCompilation: { status: 'NOT_STARTED', lastUpdated: null },
    creditApproval: { status: 'NOT_STARTED', lastUpdated: null }
  };

  // Helper function to get status badge style
  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      padding: '0.125rem 0.625rem',
    };

    switch(status) {
      case 'COMPLETED':
        return {
          ...baseStyle,
          backgroundColor: '#d1fae5',
          color: '#065f46',
        };
      case 'IN_PROGRESS':
        return {
          ...baseStyle,
          backgroundColor: '#dbeafe',
          color: '#1e40af',
        };
      case 'DRAFT':
        return {
          ...baseStyle,
          backgroundColor: '#f3f4f6',
          color: '#1f2937',
        };
      case 'NOT_STARTED':
        return {
          ...baseStyle,
          backgroundColor: '#e4e7eb',
          color: '#4a5568',
        };
      default:
        return baseStyle;
    }
  };

  // Workflow Status Component
  const WorkflowStatus = () => {
    return (
      <div style={{ padding: '1rem 0' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          {workflowSteps.map((step, index) => (
            <React.Fragment key={step.id}>
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
                  backgroundColor: step.status === 'completed' 
                    ? colors.success 
                    : step.status === 'current' 
                    ? colors.standardBankBlue 
                    : colors.neutral300,
                  color: step.status !== 'pending' ? colors.neutral100 : colors.neutral600
                }}>
                  {step.status === 'completed' ? (
                    '✓'
                  ) : (
                    index + 1
                  )}
                </div>
                <span style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.75rem',
                  fontWeight: step.status === 'current' ? '500' : '400',
                  color: step.status === 'current' ? colors.neutral800 : colors.neutral600
                }}>
                  {step.name}
                </span>
              </div>
              
              {index < workflowSteps.length - 1 && (
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

  // Sub-Process Card Component
  const SubProcessCard = ({ title, status, lastUpdated, onView, onEdit }) => {
    return (
      <div style={{ 
        border: `1px solid ${colors.neutral300}`,
        borderRadius: '0.375rem',
        padding: '1rem',
        marginBottom: '1rem',
        backgroundColor: colors.neutral100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1rem',
            fontWeight: '600',
            margin: 0
          }}>
            {title}
          </h3>
          <div style={getStatusBadgeStyle(status)}>
            {status.replace('_', ' ')}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: colors.neutral600 }}>
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Not started'}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onView}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.standardBankBlue,
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              View
            </button>
            
            {(status !== 'COMPLETED' && status !== 'NOT_STARTED') && (
              <button
                onClick={onEdit}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.icbcRed,
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Edit
              </button>
            )}
          </div>
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
        backgroundColor: colors.neutral100,
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
                Credit Paper
              </h1>
              <span style={{ 
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                padding: '0.25rem 0.75rem'
              }}>
                {creditPaperData.requestId}
              </span>
            </div>
            <p style={{ 
              marginTop: '0.25rem',
              fontSize: '0.875rem',
              color: colors.neutral600
            }}>
              {creditPaperData.title}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
            <div style={{ 
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500',
              padding: '0.125rem 0.625rem',
              marginBottom: '0.25rem'
            }}>
              {creditPaperData.priority}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.neutral600 }}>
              Required by: {creditPaperData.requiredByDate}
            </div>
          </div>
        </div>
      </div>
      
      {/* Workflow Status */}
      <div style={{ 
        backgroundColor: colors.neutral100,
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
          Workflow Status
        </h2>
        <WorkflowStatus />
      </div>
      
      {/* Credit Paper Content */}
      <div style={{ 
        backgroundColor: colors.neutral100,
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold',
          marginBottom: '1rem' 
        }}>
          Credit Paper
        </h2>
        
        {/* Credit Request */}
        <SubProcessCard 
          title="Credit Request" 
          status={subProcessStatus.creditRequest.status}
          lastUpdated={subProcessStatus.creditRequest.lastUpdated}
          onView={() => console.log("View Credit Request")}
          onEdit={() => console.log("Edit Credit Request")}
        />
        
        {/* Credit Review */}
        <SubProcessCard 
          title="Credit Review" 
          status={subProcessStatus.creditReview.status}
          lastUpdated={subProcessStatus.creditReview.lastUpdated}
          onView={() => console.log("View Credit Review")}
          onEdit={() => console.log("Edit Credit Review")}
        />
        
        {/* Business Sponsorship */}
        <SubProcessCard 
          title="Business Sponsorship" 
          status={subProcessStatus.businessSponsorship.status}
          lastUpdated={subProcessStatus.businessSponsorship.lastUpdated}
          onView={() => console.log("View Business Sponsorship")}
          onEdit={() => console.log("Edit Business Sponsorship")}
        />
        
        {/* Analysis Phase Sub-processes */}
        <div style={{ 
          border: `1px solid ${colors.neutral300}`,
          borderRadius: '0.375rem',
          padding: '1.5rem',
          marginBottom: '1rem',
          backgroundColor: colors.neutral100
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem' 
          }}>
            Analysis Phase
          </h3>
          
          {/* Credit Questionnaire */}
          <SubProcessCard 
            title="Credit Questionnaire" 
            status={subProcessStatus.creditQuestionnaire.status}
            lastUpdated={subProcessStatus.creditQuestionnaire.lastUpdated}
            onView={() => console.log("View Credit Questionnaire")}
            onEdit={() => console.log("Edit Credit Questionnaire")}
          />
          
          {/* Legal Review */}
          <SubProcessCard 
            title="Legal Review" 
            status={subProcessStatus.legalReview.status}
            lastUpdated={subProcessStatus.legalReview.lastUpdated}
            onView={() => console.log("View Legal Review")}
            onEdit={() => console.log("Edit Legal Review")}
          />
          
          {/* Credit Analysis */}
          <SubProcessCard 
            title="Credit Analysis" 
            status={subProcessStatus.creditAnalysis.status}
            lastUpdated={subProcessStatus.creditAnalysis.lastUpdated}
            onView={() => console.log("View Credit Analysis")}
            onEdit={() => console.log("Edit Credit Analysis")}
          />
        </div>
        
        {/* Credit Paper Compilation */}
        <SubProcessCard 
          title="Credit Paper Compilation" 
          status={subProcessStatus.creditPaperCompilation.status}
          lastUpdated={subProcessStatus.creditPaperCompilation.lastUpdated}
          onView={() => console.log("View Credit Paper Compilation")}
          onEdit={() => console.log("Edit Credit Paper Compilation")}
        />
        
        {/* Credit Approval */}
        <SubProcessCard 
          title="Credit Approval" 
          status={subProcessStatus.creditApproval.status}
          lastUpdated={subProcessStatus.creditApproval.lastUpdated}
          onView={() => console.log("View Credit Approval")}
          onEdit={() => console.log("Edit Credit Approval")}
        />
      </div>
    </div>
  );
};

export default CreditPaper;
