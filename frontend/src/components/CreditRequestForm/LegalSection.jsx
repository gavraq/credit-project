import React from 'react';
import FormField from './FormField';

// Legal & Financial Documentation section component
const LegalSection = ({
  legalDocumentType,
  setLegalDocumentType,
  positiveLegalOpinion,
  setPositiveLegalOpinion,
  financialStatementsReceived,
  setFinancialStatementsReceived,
  interimStatementsAvailable,
  setInterimStatementsAvailable,
  colors
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
      <FormField 
        label="Legal Document type" 
        placeholder="Enter legal document type" 
        value={legalDocumentType}
        onChange={(e) => setLegalDocumentType(e.target.value)}
        colors={colors}
      />
      <FormField 
        label="Confirmation of positive legal opinion" 
        type="select"
        options={[
          { value: 'Yes', label: 'Yes' },
          { value: 'No', label: 'No' },
          { value: 'TBC', label: 'TBC' }
        ]}
        placeholder="Select option" 
        value={positiveLegalOpinion}
        onChange={(e) => setPositiveLegalOpinion(e.target.value)}
        colors={colors}
      />
      <FormField 
        label="Confirmation of receipt of audited financial statements" 
        type="checkbox"
        placeholder="Audited financial statements received" 
        value={financialStatementsReceived}
        onChange={(e) => setFinancialStatementsReceived(e.target.checked)}
        colors={colors}
      />
      <FormField 
        label="Client produces interim financial statements" 
        type="checkbox"
        placeholder="Interim financial statements available" 
        value={interimStatementsAvailable}
        onChange={(e) => setInterimStatementsAvailable(e.target.checked)}
        colors={colors}
      />
    </div>
  );
};

export default LegalSection;
