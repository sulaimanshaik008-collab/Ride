import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, X, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';

export const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your work email.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid work email address.');
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          background: 'var(--bg-card, #121417)',
          border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 id="forgot-modal-title" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #ffffff)' }}>
            Reset your password
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #9ca3af)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-teal, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main, #ffffff)' }}>
              Check your email
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Check your email for a password reset link. If an account matches <strong>{email}</strong>, instructions will arrive shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', minHeight: '44px' }}
            >
              Return to Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Enter your work email address and we'll send you a secure verification link to reset your corporate password.
            </p>

            {error && (
              <div
                className="alert alert-error"
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.825rem',
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="reset-email" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} /> Work Email
                </span>
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                style={{ minHeight: '46px' }}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '46px', padding: '0.75rem 1.25rem' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #9ca3af)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
