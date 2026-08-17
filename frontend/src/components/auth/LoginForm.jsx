import React, { useState } from 'react';
import { Mail, Phone, Lock, ArrowRight, Loader2, AlertCircle, User, Truck, Shield } from 'lucide-react';
import { PasswordField } from './PasswordField';

export const LoginForm = ({
  onSubmit,
  onForgotPasswordClick,
  loading = false,
  apiError = null,
}) => {
  const [role, setRole] = useState('EMPLOYEE'); // 'EMPLOYEE' | 'DRIVER' | 'TRANSPORT_MANAGER'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const trimmed = identifier.trim();
    if (!trimmed) {
      errs.identifier = `Please enter your ${role === 'DRIVER' ? 'driver ID, email or phone' : 'work email or phone'}.`;
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const cleanPhone = trimmed.replace(/[\s\-\(\)]/g, '');
      const isIndianPhone = /^(\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone);
      if (!isEmail && !isIndianPhone) {
        errs.identifier = 'Please enter a valid email or 10-digit Indian mobile number (+91 98765 43210).';
      }
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (validate()) {
      await onSubmit({ identifier: identifier.trim(), password, role });
    }
  };

  return (
    <form
      id="panel-login"
      role="tabpanel"
      aria-labelledby="tab-login"
      onSubmit={handleSubmit}
      noValidate
      className="auth-form"
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.4rem', color: 'var(--text-main, #ffffff)' }}>
          {role === 'EMPLOYEE' && 'Employee Sign In'}
          {role === 'DRIVER' && 'Driver Partner Sign In'}
          {role === 'TRANSPORT_MANAGER' && 'Manager Sign In'}
        </h2>
        <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
          {role === 'EMPLOYEE' && 'Sign in to book and track your daily corporate rides.'}
          {role === 'DRIVER' && 'Sign in to access your assigned routes and live trips.'}
          {role === 'TRANSPORT_MANAGER' && 'Sign in to manage fleet operations and dispatch.'}
        </p>
      </div>

      {apiError && (
        <div
          className="alert alert-error"
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Clean Role Switcher (NO EMOJIS) */}
      <div style={{ marginBottom: '1.35rem' }}>
        <label className="form-label" style={{ marginBottom: '0.45rem', display: 'block', fontSize: '0.825rem', fontWeight: 700 }}>
          Sign In Portal
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          }}
        >
          {[
            { id: 'EMPLOYEE', label: 'Employee', desc: 'Rider' },
            { id: 'DRIVER', label: 'Driver', desc: 'Fleet Partner' },
            { id: 'TRANSPORT_MANAGER', label: 'Manager', desc: 'Operations' },
          ].map((opt) => {
            const isSelected = role === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setRole(opt.id);
                  setErrors({});
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.55rem 0.3rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#000000' : 'var(--text-muted, #9ca3af)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{opt.label}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 500, opacity: isSelected ? 0.75 : 0.6 }}>{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Email / Identifier Field */}
      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="login-identifier" className="form-label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mail size={14} />
            {role === 'DRIVER' ? 'Driver Email or Mobile Phone' : 'Work Email or Mobile Phone'}
            <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
          </span>
        </label>
        <input
          id="login-identifier"
          name="identifier"
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: null }));
          }}
          placeholder={
            role === 'DRIVER'
              ? 'rajesh.driver@transit.com or +91 98765 43210'
              : role === 'TRANSPORT_MANAGER'
              ? 'manager@company.com or +91 98765 43210'
              : 'jane.doe@company.com or +91 98765 43210'
          }
          required
          autoComplete="username"
          disabled={loading}
          aria-invalid={Boolean(errors.identifier)}
          aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
          className={`form-control ${errors.identifier ? 'is-invalid' : ''}`}
          style={{ minHeight: '46px' }}
        />
        {errors.identifier && (
          <span id="login-identifier-error" role="alert" style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.35rem', display: 'block' }}>
            {errors.identifier}
          </span>
        )}
      </div>

      {/* Password Field */}
      <div style={{ marginBottom: '0.75rem' }}>
        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
          }}
          error={errors.password}
          disabled={loading}
          required
          autoComplete="current-password"
        />
      </div>

      {/* Forgot Password Link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="btn-link"
          style={{ fontSize: '0.85rem', color: 'var(--text-muted, #9ca3af)', textDecoration: 'none', cursor: 'pointer' }}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{
          width: '100%',
          height: '48px',
          fontSize: '1rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          borderRadius: '10px',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <>
            <span>
              {role === 'EMPLOYEE' && 'Sign In as Employee'}
              {role === 'DRIVER' && 'Sign In as Driver'}
              {role === 'TRANSPORT_MANAGER' && 'Sign In as Manager'}
            </span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;
