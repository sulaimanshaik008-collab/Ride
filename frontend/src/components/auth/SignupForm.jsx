import React, { useState } from 'react';
import { User, Mail, Phone, Building, Shield, FileText, Truck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { PasswordField } from './PasswordField';
import { PasswordStrength, calculatePasswordStrength } from './PasswordStrength';

export const SignupForm = ({
  onSubmit,
  loading = false,
  apiError = null,
}) => {
  const [role, setRole] = useState('EMPLOYEE'); // 'EMPLOYEE' | 'DRIVER' | 'TRANSPORT_MANAGER'

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    organizationName: '',
    licenseNumber: '',
    vehicleNumber: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

    // Full name
    if (!formData.fullName.trim()) {
      errs.fullName = `${role === 'DRIVER' ? 'Driver Name' : 'Full Name'} is required.`;
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter a valid full name.';
    }

    // Email
    if (!formData.email.trim()) {
      errs.email = `${role === 'DRIVER' ? 'Email / Login ID' : 'Work Email'} is required.`;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    // Indian Phone validation
    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required.';
    } else {
      const cleanPhone = formData.phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
      const isIndianPhone = /^(\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone);
      if (!isIndianPhone) {
        errs.phoneNumber = 'Please enter a valid 10-digit Indian mobile number (+91 98765 43210).';
      }
    }

    // Role-specific fields
    if (role === 'DRIVER') {
      if (!formData.licenseNumber.trim()) {
        errs.licenseNumber = 'Driver License Number is required.';
      }
      if (!formData.vehicleNumber.trim()) {
        errs.vehicleNumber = 'Vehicle Registration Number is required.';
      }
    }

    // Password
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else {
      const strength = calculatePasswordStrength(formData.password);
      if (!strength.requirements.length) {
        errs.password = 'Password must meet minimum requirements (at least 8 characters).';
      }
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (formData.confirmPassword !== formData.password) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const filtered = value.replace(/[^0-9+\s-]/g, '');
      setFormData((prev) => ({ ...prev, [name]: filtered }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (validate()) {
      const payload = {
        ...formData,
        role: role,
        organizationName: role === 'DRIVER' ? (formData.vehicleNumber || 'Transit Fleet') : (formData.organizationName || 'Acme Corp'),
        department: role === 'DRIVER' ? (formData.licenseNumber || 'Fleet Driver') : (formData.department || formData.organizationName || 'Operations'),
      };
      await onSubmit(payload);
    }
  };

  return (
    <form
      id="panel-signup"
      role="tabpanel"
      aria-labelledby="tab-signup"
      onSubmit={handleSubmit}
      noValidate
      className="auth-form"
    >
      {/* Dynamic Header based on Role */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.4rem', color: 'var(--text-main, #ffffff)' }}>
          {role === 'EMPLOYEE' && 'Employee Registration'}
          {role === 'DRIVER' && 'Driver Partner Registration'}
          {role === 'TRANSPORT_MANAGER' && 'Transport Manager Registration'}
        </h2>
        <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
          {role === 'EMPLOYEE' && 'Join your corporate transit network for fast, verified commutes.'}
          {role === 'DRIVER' && 'Register to accept corporate trips, navigate routes & manage earnings.'}
          {role === 'TRANSPORT_MANAGER' && 'Manage corporate fleet operations, assign drivers & live monitor trips.'}
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
          Account Type <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
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
            { id: 'TRANSPORT_MANAGER', label: 'Transport Manager', desc: 'Operations' },
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

      {/* =========================================================================
          ROLE-SPECIFIC FORM FIELDS
          ========================================================================= */}

      {/* 1. EMPLOYEE FORM FIELDS */}
      {role === 'EMPLOYEE' && (
        <>
          <div className="form-group" style={{ marginBottom: '0.9rem' }}>
            <label htmlFor="emp-name" className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} /> Full Name <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
              </span>
            </label>
            <input
              id="emp-name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              disabled={loading}
              className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
              style={{ minHeight: '44px' }}
            />
            {errors.fullName && (
              <span role="alert" style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                {errors.fullName}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '0.9rem' }}>
            <label htmlFor="emp-email" className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} /> Work Email <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
              </span>
            </label>
            <input
              id="emp-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane.doe@company.com"
              required
              disabled={loading}
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              style={{ minHeight: '44px' }}
            />
            {errors.email && (
              <span role="alert" style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div className="form-group">
              <label htmlFor="emp-phone" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} /> Phone <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
                </span>
              </label>
              <input
                id="emp-phone"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                disabled={loading}
                className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                style={{ minHeight: '44px' }}
              />
              {errors.phoneNumber && (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                  {errors.phoneNumber}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="emp-org" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={14} /> Organization
                </span>
              </label>
              <input
                id="emp-org"
                name="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Acme Corp"
                disabled={loading}
                className="form-control"
                style={{ minHeight: '44px' }}
              />
            </div>
          </div>
        </>
      )}

      {/* 2. DRIVER FORM FIELDS */}
      {role === 'DRIVER' && (
        <>
          <div className="form-group" style={{ marginBottom: '0.9rem' }}>
            <label htmlFor="driver-name" className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} /> Driver Full Name <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
              </span>
            </label>
            <input
              id="driver-name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Rajesh Kumar"
              required
              disabled={loading}
              className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
              style={{ minHeight: '44px' }}
            />
            {errors.fullName && (
              <span role="alert" style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                {errors.fullName}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div className="form-group">
              <label htmlFor="driver-email" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} /> Email / ID <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
                </span>
              </label>
              <input
                id="driver-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rajesh.driver@transit.com"
                required
                disabled={loading}
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                style={{ minHeight: '44px' }}
              />
              {errors.email && (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="driver-phone" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} /> Mobile Phone <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
                </span>
              </label>
              <input
                id="driver-phone"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                disabled={loading}
                className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                style={{ minHeight: '44px' }}
              />
              {errors.phoneNumber && (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                  {errors.phoneNumber}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div className="form-group">
              <label htmlFor="driver-license" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={14} /> License No. <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
                </span>
              </label>
              <input
                id="driver-license"
                name="licenseNumber"
                type="text"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="TN-58-2022001982"
                required
                disabled={loading}
                className={`form-control ${errors.licenseNumber ? 'is-invalid' : ''}`}
                style={{ minHeight: '44px' }}
              />
              {errors.licenseNumber && (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                  {errors.licenseNumber}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="driver-vehicle" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={14} /> Vehicle Plate <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
                </span>
              </label>
              <input
                id="driver-vehicle"
                name="vehicleNumber"
                type="text"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder="TN 58 AB 1234"
                required
                disabled={loading}
                className={`form-control ${errors.vehicleNumber ? 'is-invalid' : ''}`}
                style={{ minHeight: '44px' }}
              />
              {errors.vehicleNumber && (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                  {errors.vehicleNumber}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* 3. TRANSPORT MANAGER FORM FIELDS */}
      {role === 'TRANSPORT_MANAGER' && (
        <>
          <div className="form-group" style={{ marginBottom: '0.9rem' }}>
            <label htmlFor="mgr-name" className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} /> Manager Full Name <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
              </span>
            </label>
            <input
              id="mgr-name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Alex Morgan"
              required
              disabled={loading}
              className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
              style={{ minHeight: '44px' }}
            />
            {errors.fullName && (
              <span role="alert" style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                {errors.fullName}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '0.9rem' }}>
            <label htmlFor="mgr-email" className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} /> Official Work Email <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
              </span>
            </label>
            <input
              id="mgr-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex.m@company.com"
              required
              disabled={loading}
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              style={{ minHeight: '44px' }}
            />
            {errors.email && (
              <span role="alert" style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div className="form-group">
              <label htmlFor="mgr-phone" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} /> Contact Phone <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>
                </span>
              </label>
              <input
                id="mgr-phone"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                disabled={loading}
                className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                style={{ minHeight: '44px' }}
              />
              {errors.phoneNumber && (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
                  {errors.phoneNumber}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mgr-dept" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={14} /> Operations Region
                </span>
              </label>
              <input
                id="mgr-dept"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                placeholder="Madurai Fleet Operations"
                disabled={loading}
                className="form-control"
                style={{ minHeight: '44px' }}
              />
            </div>
          </div>
        </>
      )}

      {/* Password Fields */}
      <div style={{ marginBottom: '0.75rem' }}>
        <PasswordField
          id="signup-password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={loading}
          required
          autoComplete="new-password"
        />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <PasswordField
          id="signup-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={loading}
          required
          autoComplete="new-password"
        />
      </div>

      {formData.password && (
        <div style={{ marginBottom: '1.25rem' }}>
          <PasswordStrength password={formData.password} />
        </div>
      )}

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
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>
              {role === 'EMPLOYEE' && 'Register as Employee'}
              {role === 'DRIVER' && 'Register as Driver'}
              {role === 'TRANSPORT_MANAGER' && 'Register as Manager'}
            </span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
};

export default SignupForm;
