import React from 'react';

// Reusable section wrapper component
const FormSection = ({ title, description, children, colors }) => (
  <div style={{ border: `1px solid ${colors.neutral300}`, borderRadius: '0.375rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{title}</h3>
    {description && <p style={{ color: colors.neutral600, marginBottom: '1rem' }}>{description}</p>}
    {children}
  </div>
);

export default FormSection;
