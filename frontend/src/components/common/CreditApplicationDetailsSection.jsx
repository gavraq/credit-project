import React from 'react';
import { useTheme } from '@mui/material/styles';
import FormSection from './FormSection';

const CreditApplicationDetailsSection = ({ creditApplication, requestNumber, requestTitle, counterpartyName, priority, requiredByDate }) => {
  const theme = useTheme();

  // Use props if provided (for forms like CreditRequestForm), otherwise use creditApplication data
  const displayData = {
    referenceNumber: requestNumber || creditApplication?.reference_number || 'Auto-generated after saving',
    title: requestTitle || creditApplication?.title || 'Not set',
    counterparty: counterpartyName || creditApplication?.counterparty?.name || 'Not selected',
    priority: priority || creditApplication?.priority || 'Not set',
    requiredBy: requiredByDate || creditApplication?.required_by_date || 'Not set'
  };

  return (
    <FormSection title="Credit Application Details">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', 
        gap: theme.spacing(3),
        marginBottom: theme.spacing(4) 
      }}>
        <div>
          <p style={{ lineHeight: '1.6', fontSize: '0.875rem', margin: 0 }}>
            <strong>Reference Number:</strong><br />
            {displayData.referenceNumber}
          </p>
        </div>
        <div>
          <p style={{ lineHeight: '1.6', fontSize: '0.875rem', margin: 0 }}>
            <strong>Title:</strong><br />
            {displayData.title}
          </p>
        </div>
        <div>
          <p style={{ lineHeight: '1.6', fontSize: '0.875rem', margin: 0 }}>
            <strong>Counterparty:</strong><br />
            {displayData.counterparty}
          </p>
        </div>
        <div>
          <p style={{ lineHeight: '1.6', fontSize: '0.875rem', margin: 0 }}>
            <strong>Priority:</strong><br />
            {displayData.priority}
          </p>
        </div>
        <div>
          <p style={{ lineHeight: '1.6', fontSize: '0.875rem', margin: 0 }}>
            <strong>Required By:</strong><br />
            {displayData.requiredBy}
          </p>
        </div>
      </div>
    </FormSection>
  );
};

export default CreditApplicationDetailsSection;