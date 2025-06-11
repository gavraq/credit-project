import React from 'react';

const FormSection = ({ title, description, children }) => {
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E4E7EB',
      borderRadius: '0.375rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600',
          color: '#323F4B',
          marginBottom: '0.25rem'
        }}>
          {title}
        </h2>
        {description && (
          <p style={{ 
            fontSize: '0.875rem',
            color: '#7B8794'
          }}>
            {description}
          </p>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default FormSection;
