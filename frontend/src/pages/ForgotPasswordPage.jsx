import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../components/auth/BrandLogo';
import { FloatingBackground } from '../components/auth/FloatingBackground';
import { authService } from '../services/authService';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      className="auth-page-container"
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: 'var(--bg-dark, #000000)',
        color: 'var(--text-main, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        overflow: 'hidden',
      }}
    >
      <FloatingBackground />

      <div
        className="auth-card"
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '460px',
          width: '100%',
          background: 'var(--bg-card, #111418)',
          border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(255, 255, 255, 0.15) inset',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <BrandLogo size="large" showSubtitle={false} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '1.25rem', marginBottom: '0.4rem' }}>
            Reset your password
          </h1>
          <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Enter your work email address to receive reset instructions.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-teal, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main, #ffffff)' }}>
              Check your email
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Check your email for a password reset link. If an account is associated with <strong>{email}</strong>, you'll receive instructions shortly.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '46px', padding: '0.75rem' }}
            >
              Return to Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
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
                  marginBottom: '1.5rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="forgot-email-input" className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} /> Work Email <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <input
                id="forgot-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                disabled={loading}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                style={{ minHeight: '46px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '46px', padding: '0.75rem 1.25rem', marginBottom: '1rem' }}
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

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/login"
                style={{
                  color: 'var(--text-muted, #9ca3af)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                  minHeight: '44px',
                }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
