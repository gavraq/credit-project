import React from 'react';
import FormField from '../common/FormField';

// Limits information section component
const LimitsSection = ({
  limits,
  setLimits,
  addLimit,
  removeLimit,
  limitTypes,
  loadingLimitTypes,
  limitTypesError,
  countryRiskLimitAvailable,
  setCountryRiskLimitAvailable,
  detailedCommentsOnLimits,
  setDetailedCommentsOnLimits,
  colors
}) => {
  return (
    <>
      {/* Dynamic Limits Table */}
      <div style={{ marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ background: colors.neutral200 }}>
              <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Limit Type</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Existing Amount (US$ m)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Existing Tenor (months)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Proposed Amount (US$ m)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Proposed Tenor (months)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>Comments</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}></th>
            </tr>
          </thead>
          <tbody>
            {loadingLimitTypes ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: colors.neutral600 }}>Loading limit types...</td></tr>
            ) : limitTypesError ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: colors.icbcRed }}>Error loading limit types: {limitTypesError}</td></tr>
            ) : limits.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No limits added.</td></tr>
            ) : (
              limits.map((limit, idx) => (
                <tr key={limit.id}>
                  <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                    <select
                      value={limit.type?.id || ''} // Use the ID from the object for the value
                      onChange={e => {
                        const selectedId = e.target.value;
                        const fullLimitType = limitTypes.find(lt => lt.id === selectedId);
                        const updated = [...limits];
                        updated[idx].type = fullLimitType || null; // Store the full object or null
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                    >
                      <option value="">Select limit type</option>
                      {limitTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                    <input
                      type="number"
                      value={limit.existingAmount}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].existingAmount = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                    <input
                      type="number"
                      value={limit.existingTenor}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].existingTenor = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                    <input
                      type="number"
                      value={limit.proposedAmount}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].proposedAmount = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                    <input
                      type="number"
                      value={limit.proposedTenor}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].proposedTenor = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}` }}>
                    <input
                      type="text"
                      value={limit.comments || ''}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].comments = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.25rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${colors.neutral300}`, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeLimit(limit.id)}
                      disabled={limits.length === 1}
                      style={{ background: 'none', border: 'none', color: colors.icbcRed, cursor: limits.length === 1 ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }}
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <button
          type="button"
          onClick={addLimit}
          style={{ backgroundColor: colors.blueLight, color: colors.standardBankBlue, border: `1px solid ${colors.standardBankBlue}`, borderRadius: '0.375rem', padding: '0.4rem 1.2rem', fontWeight: '500', cursor: 'pointer', marginTop: '0.5rem' }}
          disabled={loadingLimitTypes || !!limitTypesError}
        >
          + Add Row
        </button>
        {/* Additional fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <FormField 
            label="Country Risk Limit Availability" 
            type="select"
            options={[
              { value: '', label: 'Select option' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={countryRiskLimitAvailable}
            onChange={(e) => setCountryRiskLimitAvailable(e.target.value)}
            colors={colors}
          />
          <div></div> {/* Empty cell for grid alignment */}
        </div>
        
        {/* Detailed comments on limits */}
        <div style={{ marginTop: '1.5rem' }}>
          <FormField 
            label="Detailed comments on limits required" 
            type="textarea" 
            placeholder="Enter detailed comments on limits required"
            value={detailedCommentsOnLimits}
            onChange={(e) => setDetailedCommentsOnLimits(e.target.value)}
            colors={colors}
          />
        </div>
      </div>
    </>
  );
};

export default LimitsSection;
