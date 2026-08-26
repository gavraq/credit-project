import React from 'react';
import { useTheme } from '@mui/material/styles';
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
  kycApprovalStatus,
  setKycApprovalStatus,
  detailedCommentsOnLimits,
  setDetailedCommentsOnLimits
}) => {
  const theme = useTheme();
  return (
    <>
      {/* Dynamic Limits Table */}
      <div style={{ marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ background: theme.palette.grey[100] }}>
              <th style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, fontFamily: theme.typography.fontFamily }}>Limit Type</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, fontFamily: theme.typography.fontFamily }}>Existing Amount (US$ m)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, fontFamily: theme.typography.fontFamily }}>Existing Tenor (months)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, fontFamily: theme.typography.fontFamily }}>Proposed Amount (US$ m)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, fontFamily: theme.typography.fontFamily }}>Proposed Tenor (months)</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, fontFamily: theme.typography.fontFamily }}>Comments</th>
              <th style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, fontFamily: theme.typography.fontFamily }}></th>
            </tr>
          </thead>
          <tbody>
            {loadingLimitTypes ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: theme.palette.grey[500], fontFamily: theme.typography.fontFamily }}>Loading limit types...</td></tr>
            ) : limitTypesError ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: theme.palette.secondary.main, fontFamily: theme.typography.fontFamily }}>Error loading limit types: {limitTypesError}</td></tr>
            ) : limits.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', fontFamily: theme.typography.fontFamily }}>No limits added.</td></tr>
            ) : (
              limits.map((limit, idx) => (
                <tr key={limit.id}>
                  <td style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}` }}>
                    <select
                      value={limit.type?.id || ''} // Use the ID from the object for the value
                      onChange={e => {
                        const selectedId = e.target.value;

                        // Find the full limit type object
                        const fullLimitType = limitTypes.find(lt => lt.id === selectedId);

                        const updated = [...limits];
                        updated[idx].type = fullLimitType || null; // Store the full object for display
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '6px', border: `1px solid ${theme.palette.grey[300]}`, padding: '0.25rem', fontFamily: theme.typography.fontFamily }}
                    >
                      <option value="">Select limit type</option>
                      {limitTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}` }}>
                    <input
                      type="number"
                      value={limit.existingAmount}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].existingAmount = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '6px', border: `1px solid ${theme.palette.grey[300]}`, padding: '0.25rem', fontFamily: theme.typography.fontFamily }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}` }}>
                    <input
                      type="number"
                      value={limit.existingTenor}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].existingTenor = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '6px', border: `1px solid ${theme.palette.grey[300]}`, padding: '0.25rem', fontFamily: theme.typography.fontFamily }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}` }}>
                    <input
                      type="number"
                      value={limit.proposedAmount}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].proposedAmount = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '6px', border: `1px solid ${theme.palette.grey[300]}`, padding: '0.25rem', fontFamily: theme.typography.fontFamily }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}` }}>
                    <input
                      type="number"
                      value={limit.proposedTenor}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].proposedTenor = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '6px', border: `1px solid ${theme.palette.grey[300]}`, padding: '0.25rem', fontFamily: theme.typography.fontFamily }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}` }}>
                    <input
                      type="text"
                      value={limit.comments || ''}
                      onChange={e => {
                        const updated = [...limits];
                        updated[idx].comments = e.target.value;
                        setLimits(updated);
                      }}
                      style={{ width: '100%', borderRadius: '6px', border: `1px solid ${theme.palette.grey[300]}`, padding: '0.25rem', fontFamily: theme.typography.fontFamily }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: `1px solid ${theme.palette.grey[200]}`, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeLimit(limit.id)}
                      disabled={limits.length === 1}
                      style={{ background: 'none', border: 'none', color: theme.palette.secondary.main, cursor: limits.length === 1 ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontFamily: theme.typography.fontFamily }}
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
          style={{ backgroundColor: theme.palette.primary.light, color: theme.palette.primary.main, border: `1px solid ${theme.palette.primary.main}`, borderRadius: '6px', padding: '0.4rem 1.2rem', fontWeight: '500', cursor: 'pointer', marginTop: '0.5rem', fontFamily: theme.typography.fontFamily }}
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
          />
          <FormField 
            label="KYC Approval obtained" 
            type="select"
            options={[
              { value: '', label: 'Select option' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={kycApprovalStatus}
            onChange={(e) => setKycApprovalStatus(e.target.value)}
          />
        </div>
        
        {/* Detailed comments on limits */}
        <div style={{ marginTop: '1.5rem' }}>
          <FormField 
            label="Detailed comments on limits required" 
            type="textarea" 
            placeholder="Enter detailed comments on limits required"
            value={detailedCommentsOnLimits}
            onChange={(e) => setDetailedCommentsOnLimits(e.target.value)}
          />
        </div>
      </div>
    </>
  );
};

export default LimitsSection;
