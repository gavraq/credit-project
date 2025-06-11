import React from 'react';
import FormField from './FormField';

// Counterparty information section component
const CounterpartySection = ({
  counterparties,
  loadingCounterparties,
  counterpartyError,
  selectedCounterparty,
  setSelectedCounterparty,
  counterpartyCIF,
  setCounterpartyCIF,
  selectedGuarantor,
  setSelectedGuarantor,
  guarantorCIF,
  setGuarantorCIF,
  selectedGuarantorName, // Accept prop
  setSelectedGuarantorName, // Accept prop
  requestTitle,
  setRequestTitle,
  requestNumber,
  colors,
  disabled
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
      <FormField 
        label="Request Title" 
        placeholder="Enter a descriptive title for this request" 
        required={true} 
        value={requestTitle}
        onChange={(e) => setRequestTitle(e.target.value)}
        colors={colors}
        disabled={disabled}
      />
      <FormField 
        label="Request Number" 
        placeholder="Auto-generated" 
        value={requestNumber} 
        disabled={true}
        colors={colors}
      />
      
      {loadingCounterparties ? (
        <div style={{ gridColumn: '1 / span 2', color: '#888', fontSize: '0.95rem' }}>Loading counterparties...</div>
      ) : counterpartyError ? (
        <div style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '0.95rem' }}>Error loading counterparties: {counterpartyError}</div>
      ) : (
        <>
          <FormField
            label="Counterparty Name"
            type="select"
            required={true}
            options={counterparties.map(cp => ({ value: cp.id, label: cp.name }))}
            value={selectedCounterparty}
            placeholder="Select counterparty"
            onChange={e => {
              setSelectedCounterparty(e.target.value);
              const found = counterparties.find(cp => String(cp.id) === e.target.value);
              setCounterpartyCIF(found ? found.cif_number : '');
            }}
            colors={colors}
            disabled={disabled}
          />
          <FormField
            label="Counterparty CIF number"
            placeholder="Enter counterparty identifier"
            required={true}
            value={counterpartyCIF}
            disabled={true}
            colors={colors}
          />
          <FormField
            label="Guarantor Name"
            type="select"
            required={false}
            options={counterparties.map(cp => ({ value: cp.id, label: cp.name }))}
            value={selectedGuarantor}
            placeholder="Select guarantor (if applicable)"
            onChange={e => {
              setSelectedGuarantor(e.target.value);
              const found = counterparties.find(cp => String(cp.id) === e.target.value);
              setGuarantorCIF(found ? found.cif_number : '');
              setSelectedGuarantorName(found ? found.name : ''); // Set guarantor name
            }}
            colors={colors}
            disabled={disabled}
          />
          <FormField
            label="Guarantor CIF number"
            placeholder="Enter guarantor identifier"
            required={false}
            value={guarantorCIF}
            disabled={true}
            colors={colors}
          />
        </>
      )}
    </div>
  );
};

export default CounterpartySection;
