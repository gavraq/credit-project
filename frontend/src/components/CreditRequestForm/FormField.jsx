import React from 'react';

// Reusable form field component
const FormField = ({ 
  label, 
  type = 'text', 
  placeholder, 
  required = false, 
  options = [], 
  value, 
  disabled, 
  onChange,
  colors 
}) => {
  return (
    <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: colors.neutral700 }}>
        {label} {required && <span style={{ color: colors.icbcRed }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          style={{ marginTop: '0.25rem', display: 'block', width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.5rem', fontSize: '0.875rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          placeholder={placeholder}
          rows={3}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      ) : type === 'select' ? (
        <select
          style={{ marginTop: '0.25rem', display: 'block', width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.5rem', fontSize: '0.875rem', background: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          value={value}
          disabled={disabled}
          onChange={onChange}
        >
          <option value=''>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
          <input
            type='checkbox'
            style={{ height: '1rem', width: '1rem', borderRadius: '0.25rem', borderColor: colors.neutral400 }}
            checked={value}
            disabled={disabled}
            onChange={onChange}
          />
          <label style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: colors.neutral700 }}>
            {placeholder}
          </label>
        </div>
      ) : (
        <input
          type={type}
          style={{ marginTop: '0.25rem', display: 'block', width: '100%', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, padding: '0.5rem', fontSize: '0.875rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', minHeight: '40px' }}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      )}
    </div>
  );
};

export default FormField;
