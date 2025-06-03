import React from 'react';

const FormField = ({ 
  label, 
  type = "text", 
  placeholder, 
  required = false, 
  options = [], 
  value, 
  onChange, 
  name,
  colors 
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '0.25rem', 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          color: colors.neutral700 
        }}>
          {label} {required && <span style={{ color: colors.icbcRed }}>*</span>}
        </label>
      )}
      
      {type === "textarea" ? (
        <textarea
          style={{ 
            marginTop: '0.25rem',
            display: 'block',
            width: '100%',
            borderRadius: '0.375rem',
            border: `1px solid ${colors.neutral400}`,
            padding: '0.5rem',
            fontSize: '0.875rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          placeholder={placeholder}
          rows={3}
          value={value || ""}
          onChange={onChange}
          name={name}
        />
      ) : type === "select" ? (
        <select
          style={{ 
            marginTop: '0.25rem',
            display: 'block',
            width: '100%',
            borderRadius: '0.375rem',
            border: `1px solid ${colors.neutral400}`,
            padding: '0.5rem',
            fontSize: '0.875rem',
            backgroundColor: 'white',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          value={value || ""}
          onChange={onChange}
          name={name}
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
              height: '1rem'
            }}
          />
          <span style={{ fontSize: '0.875rem' }}>{placeholder}</span>
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
                  height: '1rem'
                }}
              />
              <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <input
          type={type}
          style={{ 
            marginTop: '0.25rem',
            display: 'block',
            width: '100%',
            borderRadius: '0.375rem',
            border: `1px solid ${colors.neutral400}`,
            padding: '0.5rem',
            fontSize: '0.875rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          placeholder={placeholder}
          value={value || ""}
          onChange={onChange}
          name={name}
        />
      )}
    </div>
  );
};

export default FormField;
