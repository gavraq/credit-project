import React from 'react';

// Wizard navigation component
const FormWizardNav = ({ sectionRefs, currentStep, setCurrentStep, colors }) => {
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

export default FormWizardNav;
