import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const PasswordField = ({
  id = 'password',
  name = 'password',
  label = 'Password',
  value,
  onChange,
  placeholder = 'Enter your password',
  error = null,
  required = true,
  disabled = false,
  autoComplete = 'current-password',
  describedBy,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const errorId = error ? `${id}-error` : undefined;
  const combinedDescribedBy = [describedBy, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label htmlFor={id} className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Lock size={14} color="currentColor" /> {label} {required && <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>}
        </span>
      </label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={combinedDescribedBy}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          style={{
            paddingRight: '3rem',
            minHeight: '46px',
            borderColor: error ? 'var(--color-error, #ef4444)' : undefined,
          }}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          tabIndex={0}
          className="password-toggle-btn"
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #9ca3af)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            minWidth: '44px',
            minHeight: '44px',
            transition: 'color 0.15s, background-color 0.15s',
          }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-error, #f87171)',
            marginTop: '0.35rem',
            display: 'block',
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
