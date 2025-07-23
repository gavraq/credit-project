import React from 'react';
import { useTheme } from '@mui/material/styles';

const FormField = ({ 
  label, 
  type = "text", 
  placeholder, 
  required = false, 
  options = [], 
  value, 
  onChange, 
  name,
  colors, // Keep for backward compatibility
  disabled,
  readOnly,
  helperText,
  rows = 3
}) => {
  const theme = useTheme();
  
  // Note: 'colors' prop kept for backward compatibility during transition,
  // but all styling now uses theme colors per design brief
  const inputStyles = {
    marginTop: theme.spacing(1), // 4px
    display: 'block',
    width: '100%',
    borderRadius: '6px',
    border: `1px solid ${theme.palette.grey[300]}`, // Design brief: neutral400 -> CBD2D9
    padding: theme.spacing(2), // 8px
    fontSize: '0.875rem',
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.primary,
    transition: 'border-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px rgba(12, 77, 162, 0.2)`,
    },
    '&:hover': {
      borderColor: theme.palette.grey[400], // Design brief: neutral500 -> 9AA5B1
    }
  };

  return (
    <div style={{ marginBottom: theme.spacing(4) }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: theme.spacing(1), // 4px 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          color: theme.palette.grey[600], // Design brief: neutral700 -> 4A5568
          fontFamily: theme.typography.fontFamily
        }}>
          {label} {required && <span style={{ color: theme.palette.secondary.main }}>*</span>}
        </label>
      )}
      
      {type === "textarea" ? (
        <textarea
          style={{ 
            ...inputStyles,
            minHeight: `${rows * 1.5 + 1}rem`,
            resize: 'vertical'
          }}
          placeholder={placeholder}
          rows={rows}
          value={value || ""}
          disabled={disabled}
          onChange={onChange}
          readOnly={readOnly}
          name={name}
          onFocus={(e) => {
            e.target.style.borderColor = theme.palette.primary.main;
            e.target.style.boxShadow = '0 0 0 2px rgba(12, 77, 162, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.palette.grey[300];
            e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
        />
      ) : type === "select" ? (
        <select
          style={{ 
            ...inputStyles,
            height: '38px',
            cursor: 'pointer'
          }}
          value={value || ""}
          disabled={disabled}
          onChange={onChange}
          name={name}
          onFocus={(e) => {
            e.target.style.borderColor = theme.palette.primary.main;
            e.target.style.boxShadow = '0 0 0 2px rgba(12, 77, 162, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.palette.grey[300];
            e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginTop: '0.25rem' 
        }}>
          <input
            type="checkbox"
            checked={value || false}
            onChange={onChange}
            name={name}
            style={{ 
              marginRight: '0.5rem',
              width: '1rem',
              height: '1rem',
              accentColor: theme.palette.primary.main
            }}
          />
          <span style={{ 
            fontSize: '0.875rem',
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily
          }}>
            {placeholder}
          </span>
        </div>
      ) : type === "radio" ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '0.25rem'
        }}>
          {options.map(option => (
              <div key={option.value} style={{ 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <input
                  type="radio"
                  checked={value === option.value}
                  onChange={onChange}
                  value={option.value}
                  name={name}
                  style={{ 
                    marginRight: '0.5rem',
                    width: '1rem',
                    height: '1rem',
                    accentColor: theme.palette.primary.main
                  }}
                />
                <span style={{ 
                  fontSize: '0.875rem',
                  color: theme.palette.text.primary,
                  fontFamily: theme.typography.fontFamily
                }}>
                  {option.label}
                </span>
              </div>
          ))}
        </div>
      ) : (
        <input
          type={type}
          style={{ 
            ...inputStyles,
            height: type === 'number' || type === 'date' || type === 'email' ? '38px' : 'auto'
          }}
          placeholder={placeholder}
          value={value || ""}
          disabled={disabled}
          onChange={onChange}
          readOnly={readOnly}
          name={name}
          onFocus={(e) => {
            e.target.style.borderColor = theme.palette.primary.main;
            e.target.style.boxShadow = '0 0 0 2px rgba(12, 77, 162, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.palette.grey[300];
            e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
        />
      )}
      
      {helperText && (
        <div style={{
          fontSize: '0.75rem',
          color: theme.palette.grey[400], // Design brief: neutral500 -> 9AA5B1
          marginTop: '0.25rem',
          fontFamily: theme.typography.fontFamily
        }}>
          {helperText}
        </div>
      )}
    </div>
  );
};

export default FormField;
