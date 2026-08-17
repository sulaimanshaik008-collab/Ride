import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  HelpCircle,
  Globe,
  PhoneCall,
  Mail,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/auth/BrandLogo';
import { FloatingBackground } from '../components/auth/FloatingBackground';
import { AuthTabs } from '../components/auth/AuthTabs';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons';
import { GuestAccessButton } from '../components/auth/GuestAccessButton';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

export default function LoginPage() {
  const {
    login,
    signup,
    loginWithGoogle,
    loginAsGuest,
    theme,
    toggleTheme,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial mode from URL (e.g. /signup or /login)
  const isSignupRoute = location.pathname === '/signup';
  const [activeTab, setActiveTab] = useState(isSignupRoute ? 'signup' : 'login');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Subtle Mouse Parallax state (capped at 4-8px)
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const cardContainerRef = useRef(null);

  // Sync mode if route changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setActiveTab('signup');
    } else if (location.pathname === '/login') {
      setActiveTab('login');
    }
  }, [location.pathname]);

  const handleMouseMove = (e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 12; // -6px to +6px
    const y = (e.clientY / innerHeight - 0.5) * 12;
    setParallaxOffset({ x: Math.round(x), y: Math.round(y) });
  };

  const handleMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  const redirectByRole = (role) => {
    if (role === 'EMPLOYEE') {
      navigate('/book-ride');
    } else if (role === 'DRIVER') {
      navigate('/driver-trips');
    } else if (role === 'TRANSPORT_MANAGER') {
      navigate('/scheduling');
    } else if (role === 'CORPORATE_ADMIN' || role === 'SYSTEM_ADMIN') {
      navigate('/admin');
    } else {
      navigate('/book-ride');
    }
  };

  const handleLoginSubmit = async ({ identifier, password }) => {
    try {
      setLoading(true);
      setApiError('');
      const user = await login(identifier, password);
      redirectByRole(user.role);
    } catch (err) {
      setApiError(err?.message || 'Email or password is incorrect. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (formData) => {
    try {
      setLoading(true);
      setApiError('');
      const user = await signup(formData);
      redirectByRole(user.role);
    } catch (err) {
      setApiError(err?.message || 'Unable to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setApiError('');
      const user = await loginWithGoogle();
      redirectByRole(user.role);
    } catch (err) {
      setApiError(err?.message || 'Google authentication connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setApiError('');
      const user = await loginAsGuest();
      redirectByRole(user.role);
    } catch (err) {
      setApiError(err?.message || 'Guest access failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-portal-page"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: 'var(--bg-dark, #000000)',
        color: 'var(--text-main, #ffffff)',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Dynamic Anti-Gravity Particles & Ambient Glow */}
      <FloatingBackground />

      {/* Header */}
      <header
        className="auth-header"
        style={{
          position: 'relative',
          zIndex: 20,
          padding: '1.25rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-glass, rgba(255, 255, 255, 0.08))',
          background: 'var(--header-bg, rgba(5, 5, 5, 0.75))',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left: Brand Logo & Name */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <BrandLogo size="normal" showSubtitle={true} />
        </Link>

        {/* Right: Controls (Help, Theme, Language) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Support / Help link */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            aria-label="Open support and help dialog"
            className="header-action-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--control-bg, #141414)',
              border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.12))',
              color: 'var(--text-muted, #9ca3af)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '40px',
              transition: 'all 0.15s',
            }}
          >
            <HelpCircle size={15} />
            <span className="hide-on-mobile">Help</span>
          </button>

          {/* Language Selector */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              background: 'var(--control-bg, #141414)',
              border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.12))',
              color: 'var(--text-muted, #9ca3af)',
              fontSize: '0.825rem',
              fontWeight: 600,
              minHeight: '40px',
            }}
          >
            <Globe size={14} />
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              aria-label="Select interface language"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="EN" style={{ background: '#111', color: '#fff' }}>EN</option>
              <option value="ES" style={{ background: '#111', color: '#fff' }}>ES</option>
              <option value="FR" style={{ background: '#111', color: '#fff' }}>FR</option>
              <option value="DE" style={{ background: '#111', color: '#fff' }}>DE</option>
            </select>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="header-action-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--control-bg, #141414)',
              border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.12))',
              color: 'var(--text-main, #ffffff)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
          </button>
        </div>
      </header>

      {/* Centered Main Portal Setup */}
      <main
        className="auth-main"
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          width: '100%',
        }}
      >
        <div
          ref={cardContainerRef}
          className="auth-card-container"
          style={{
            maxWidth: '480px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Centered Card */}
          <div
            className="auth-card"
            style={{
              width: '100%',
              background: 'var(--bg-card, #111418)',
              border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
              borderTop: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(255, 255, 255, 0.15) inset',
              position: 'relative',
              transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
              transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
              animation: 'gentleLevitateCard 5s ease-in-out infinite alternate',
            }}
          >
            {/* Centered Brand Icon & Header on Card */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <BrandLogo size="large" showSubtitle={true} />
            </div>

            {/* Segmented Tab Navigation: [ Sign Up ] [ Log In ] */}
            <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Panels */}
            {activeTab === 'login' ? (
              <LoginForm
                onSubmit={handleLoginSubmit}
                onForgotPasswordClick={() => setIsForgotModalOpen(true)}
                loading={loading}
                apiError={apiError}
              />
            ) : (
              <SignupForm
                onSubmit={handleSignupSubmit}
                loading={loading}
                apiError={apiError}
              />
            )}

            {/* Social Divider */}
            <div
              className="auth-divider"
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.75rem 0 1.25rem',
                gap: '0.75rem',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--border-glass, rgba(255, 255, 255, 0.1))' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim, #71717a)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                OR
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-glass, rgba(255, 255, 255, 0.1))' }} />
            </div>

            {/* Social Auth Buttons */}
            <SocialAuthButtons onGoogleClick={handleGoogleLogin} disabled={loading} />

            {/* Guest Access Option */}
            <GuestAccessButton onGuestLogin={handleGuestLogin} disabled={loading} />

            {/* Terms & Privacy Notice */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim, #71717a)', lineHeight: 1.5 }}>
              By continuing, you agree to our{' '}
              <a href="#terms" style={{ color: 'var(--text-muted, #9ca3af)', textDecoration: 'underline' }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" style={{ color: 'var(--text-muted, #9ca3af)', textDecoration: 'underline' }}>
                Privacy Policy
              </a>
              .
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

      {/* Help & Support Modal */}
      {isHelpModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
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
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} color="var(--accent-teal, #10b981)" />
                <h3 id="help-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  RideFlow Corporate Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                aria-label="Close dialog"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #9ca3af)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Need assistance with your corporate account or ride assignments? Reach out to our dedicated 24/7 corporate fleet desk.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <Mail size={16} color="var(--accent-teal, #10b981)" />
                <span>support@rideflow.corporate.internal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <PhoneCall size={16} color="var(--accent-teal, #10b981)" />
                <span>1-800-RIDE-FLOW (Ext. 402)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
