import React from 'react';
import { useTheme } from '@mui/material/styles';
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
  setCounterpartyName, // Add setter for denormalized field
  guarantorName, // Add prop for denormalized field
  disabled
}) => {
  const theme = useTheme();
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
                // Also set counterparty name for denormalized field
                if (found && setCounterpartyName) {
                  setCounterpartyName(found.name);
                }
              }}
                    disabled={disabled}
            />
          )}
          <FormField
            label="Counterparty CIF number"
            placeholder="Enter counterparty identifier"
            required={true}
            value={counterpartyCIF}
            disabled={true}
              />
          {disabled && guarantorName ? (
            <FormField
              label="Guarantor Name"
              value={guarantorName}
              disabled={true}
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
                    disabled={disabled}
            />
          )}
          <FormField
            label="Guarantor CIF number"
            placeholder="Enter guarantor identifier"
            required={false}
            value={guarantorCIF}
            disabled={true}
              />
        </>
      )}
    </div>
  );
};

export default CounterpartySection;
