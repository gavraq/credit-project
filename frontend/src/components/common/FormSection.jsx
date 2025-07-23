import React from 'react';
import { useTheme } from '@mui/material/styles';

const FormSection = ({ title, description, children, colors }) => {
  const theme = useTheme();
  
  // Note: 'colors' prop kept for API compatibility during transition,
  // but all styling now uses theme colors per design brief

  return (
    <div style={{
      padding: '1.5rem', // 24px as per design brief
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.grey[200]}`, // Design brief: neutral300 -> E4E7EB
      borderRadius: '6px', // 0.375rem as per design brief
      marginBottom: '1.5rem', // 24px as per design brief
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Card shadow per design brief
      fontFamily: theme.typography.fontFamily
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          fontSize: '1.125rem', // 18px - H3 per design brief
          fontWeight: '600', // Semibold per design brief
          color: theme.palette.grey[700], // Design brief: neutral800 -> 323F4B
          marginBottom: '0.25rem',
          margin: 0,
          fontFamily: theme.typography.fontFamily,
          lineHeight: '1.75rem'
        }}>
          {title}
        </h3>
        {description && (
          <p style={{ 
            fontSize: '0.875rem', // 14px - Standard body per design brief
            color: theme.palette.grey[500], // Design brief: neutral600 -> 7B8794
            margin: '0.25rem 0 0 0',
            fontFamily: theme.typography.fontFamily,
            lineHeight: '1.25rem'
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
