import React from 'react';

/**
 * Reusable form field component with validation error display.
 * IMPORTANT: This must be defined OUTSIDE of parent components to prevent
 * React from unmounting/remounting inputs on every re-render (focus loss bug).
 */
const FormField = ({ label, name, type = 'text', value, error, required,
    placeholder, hint, maxLength, step, onChange, children }) => (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
        <label>{label}{required && ' *'}</label>
        {children || (
            <input
                className={`form-input ${error ? 'input-error' : ''}`}
                type={type}
                value={value || ''}
                maxLength={maxLength}
                step={step}
                onChange={e => onChange(name, e.target.value)}
                placeholder={placeholder}
            />
        )}
        {error && <div className="field-error">{error}</div>}
        {hint && !error && <div className="form-hint">{hint}</div>}
    </div>
);

export default FormField;
