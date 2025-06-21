import React from 'react';
import FormField from '../common/FormField';

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
  counterpartyName, // Add prop for denormalized field
  guarantorName, // Add prop for denormalized field
  colors,
  disabled
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
      {loadingCounterparties ? (
        <div style={{ gridColumn: '1 / span 2', color: '#888', fontSize: '0.95rem' }}>Loading counterparties...</div>
      ) : counterpartyError ? (
        <div style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '0.95rem' }}>Error loading counterparties: {counterpartyError}</div>
      ) : (
        <>
          {disabled && counterpartyName ? (
            <FormField
              label="Counterparty Name"
              value={counterpartyName}
              disabled={true}
              colors={colors}
            />
          ) : (
            <FormField
              label="Counterparty Name"
              type="select"
              required={true}
              options={[
                { value: '', label: 'Select counterparty...' },
                ...counterparties.map(cp => ({ value: cp.id, label: cp.name }))
              ]}
              value={selectedCounterparty}
              onChange={e => {
                setSelectedCounterparty(e.target.value);
                const found = counterparties.find(cp => String(cp.id) === e.target.value);
                setCounterpartyCIF(found ? found.cif_number : '');
              }}
              colors={colors}
              disabled={disabled}
            />
          )}
          <FormField
            label="Counterparty CIF number"
            placeholder="Enter counterparty identifier"
            required={true}
            value={counterpartyCIF}
            disabled={true}
            colors={colors}
          />
          {disabled && guarantorName ? (
            <FormField
              label="Guarantor Name"
              value={guarantorName}
              disabled={true}
              colors={colors}
            />
          ) : (
            <FormField
              label="Guarantor Name"
              type="select"
              required={false}
              options={[
                { value: '', label: 'Select guarantor (if applicable)' },
                ...counterparties.map(cp => ({ value: cp.id, label: cp.name }))
              ]}
              value={selectedGuarantor}
              onChange={e => {
                setSelectedGuarantor(e.target.value);
                const found = counterparties.find(cp => String(cp.id) === e.target.value);
                setGuarantorCIF(found ? found.cif_number : '');
                setSelectedGuarantorName(found ? found.name : ''); // Set guarantor name
              }}
              colors={colors}
              disabled={disabled}
            />
          )}
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
