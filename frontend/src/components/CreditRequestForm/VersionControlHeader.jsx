import React from 'react';

// Version control header component
const VersionControlHeader = ({ colors }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>Version:</span>
        <span style={{ backgroundColor: colors.neutral200, color: colors.neutral800, borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', padding: '0.125rem 0.625rem' }}>Draft - v0.2</span>
      </div>
      <p style={{ fontSize: '0.75rem', color: colors.neutral600, marginTop: '0.25rem' }}>Last saved: May 21, 2025, 10:45 AM</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer' }}>
        <span style={{ marginRight: '0.25rem' }}>↓</span>Save Version
      </button>
      <button style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer' }}>
        <span style={{ marginRight: '0.25rem' }}>👁</span>View History
      </button>
    </div>
  </div>
);

export default VersionControlHeader;
