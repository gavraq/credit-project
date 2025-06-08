import React from 'react';

const WorkflowStatus = ({ currentStep = 1 }) => {
  const steps = [
    'Credit Request',
    'Credit Review',
    'Business Sponsorship',
    'Analysis',
    'Credit Paper',
    'Approval'
  ];
  
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
                backgroundColor: index + 1 < currentStep 
                  ? colors.success  // success color for completed steps
                  : index + 1 === currentStep 
                  ? colors.standardBankBlue  // brand blue for current step
                  : colors.neutral300,  // light gray for future steps
                color: index + 1 <= currentStep ? 'white' : colors.neutral600
              }}>
                {index + 1 < currentStep ? (
                  '✓'
                ) : (
                  index + 1
                )}
              </div>
              <span style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.75rem',
                fontWeight: index + 1 === currentStep ? '500' : '400',
                color: index + 1 === currentStep ? colors.neutral800 : colors.neutral600
              }}>
                {step}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div style={{ 
                flexGrow: 1, 
                height: '0.25rem',
                backgroundColor: index + 1 < currentStep ? colors.success : colors.neutral300
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WorkflowStatus;
