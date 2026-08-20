import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  X,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import '../styles/versoLogin.css';

const ROLE_DEMO_ACCOUNTS = [
  {
    id: 'EMPLOYEE',
    label: 'Employee',
    email: 'eren00987@gmail.com',
    password: 'password123',
    role: 'EMPLOYEE',
  },
  {
    id: 'DRIVER',
    label: 'Driver',
    email: 'driver@company.com',
    password: 'password123',
    role: 'DRIVER',
  },
  {
    id: 'TRANSPORT_MANAGER',
    label: 'Manager',
    email: 'manager@company.com',
    password: 'password123',
    role: 'TRANSPORT_MANAGER',
  },
  {
    id: 'CORPORATE_ADMIN',
    label: 'Admin',
    email: 'admin@company.com',
    password: 'password123',
    role: 'CORPORATE_ADMIN',
  },
];

const ROLE_CONTENT_MAP = {
  EMPLOYEE: {
    login: {
      chip: 'EMPLOYEE PORTAL',
      title: 'Welcome back.',
      desc: 'Your corporate rides, scheduled pickups, and commute history are right where you left them.',
    },
    signup: {
      chip: 'EMPLOYEE ACCESS',
      title: 'Ride in comfort.',
      desc: 'Effortless corporate ride booking, real-time vehicle tracking, and hassle-free daily commutes.',
    },
  },
  DRIVER: {
    login: {
      chip: 'DRIVER PARTNER DESK',
      title: 'Ready to drive?',
      desc: 'View assigned trips, accept employee rides, navigate routes, and track daily payouts.',
    },
    signup: {
      chip: 'DRIVER ONBOARDING',
      title: 'Join our fleet.',
      desc: 'Drive with top corporate clients, enjoy verified passengers, and guaranteed ride schedules.',
    },
  },
  TRANSPORT_MANAGER: {
    login: {
      chip: 'FLEET CONTROL CENTER',
      title: 'Operations Desk.',
      desc: 'Monitor active corporate trips, approve employee requests, and optimize driver & vehicle allocation.',
    },
    signup: {
      chip: 'MANAGER ACCESS',
      title: 'Streamline mobility.',
      desc: 'Centralized corporate transport coordination, real-time dispatch, and intelligent fleet management.',
    },
  },
  CORPORATE_ADMIN: {
    login: {
      chip: 'ADMINISTRATION CONSOLE',
      title: 'Corporate Admin.',
      desc: 'Manage corporate organizations, billing budgets, security policies, and enterprise analytics.',
    },
    signup: {
      chip: 'ENTERPRISE ADMIN',
      title: 'Empower enterprise.',
      desc: 'Total control over employee travel policies, department quotas, and corporate vehicle fleet oversight.',
    },
  },
};

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'signup'
  const isSignupRoute = location.pathname === '/signup';
  const [mode, setMode] = useState(isSignupRoute ? 'signup' : 'login');

  // Selected quick role
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE');

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState('eren00987@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // Sign Up Form States
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('EMPLOYEE');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Status & Modal States
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Current active role content
  const activeRole = mode === 'login' ? selectedRole : signupRole;
  const roleContent = ROLE_CONTENT_MAP[activeRole] || ROLE_CONTENT_MAP.EMPLOYEE;

  // Sync mode if URL changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('signup');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    setLoginEmail(roleItem.email);
    setLoginPassword(roleItem.password);
    setApiError('');
  };

  const redirectByRole = (role) => {
    if (role === 'EMPLOYEE') {
      navigate('/book-ride');
    } else if (role === 'DRIVER') {
      navigate('/driver/dashboard');
    } else if (role === 'TRANSPORT_MANAGER') {
      navigate('/transport-manager/dashboard');
    } else if (role === 'CORPORATE_ADMIN' || role === 'SYSTEM_ADMIN') {
      navigate('/admin');
    } else {
      navigate('/book-ride');
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setApiError('Please enter your email and password');
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      const user = await login(loginEmail.trim(), loginPassword, selectedRole);
      const targetRole = user?.role || selectedRole || 'EMPLOYEE';
      redirectByRole(targetRole);
    } catch (err) {
      setApiError(err?.message || 'Invalid username or password. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!signupFullName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setApiError('Please fill in all required fields');
      return;
    }
    if (signupPassword.length < 6) {
      setApiError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      const formData = {
        fullName: signupFullName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: signupRole,
        organizationName: 'Acme Corporate Mobility',
      };
      const user = await signup(formData);
      const targetRole = user?.role || signupRole;
      setRegisteredUser({ ...user, role: targetRole });
      setTimeout(() => {
        redirectByRole(targetRole);
      }, 1500);
    } catch (err) {
      setApiError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verso-auth-wrapper">
      {/* Top Header Bar */}
      <div className="verso-top-bar">
        <div className="verso-brand-header" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', pointerEvents: 'auto' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #103327 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f2920', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              RideFlow
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Corporate Mobility
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsHelpModalOpen(true)}
          className="verso-back-btn"
          aria-label="Help and Support"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Main 3D Sliding Blade Auth Card */}
      <div className="verso-card-outer" data-mode={mode}>
        {/* Form halves */}
        <div className="verso-forms-container">
          {/* =================================================================
              LEFT HALF: SIGN IN FORM
              ================================================================= */}
          <div className="verso-form-panel signin-side">
            <div className="verso-form-inner">
              <h2>Sign in</h2>

              {/* Quick Demo Role Selector Pills */}
              <div className="verso-demo-roles">
                <span className="verso-demo-roles-label">Select Role / Demo Account</span>
                <div className="verso-role-pills">
                  {ROLE_DEMO_ACCOUNTS.map((roleItem) => (
                    <button
                      key={roleItem.id}
                      type="button"
                      onClick={() => handleRoleSelect(roleItem)}
                      className={`verso-role-pill ${selectedRole === roleItem.id ? 'active' : ''}`}
                    >
                      {roleItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {apiError && mode === 'login' && (
                <div style={{ padding: '0.6rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div className="verso-input-group">
                  <label className="verso-input-label">Username or email</label>
                  <div className="verso-input-field-wrap">
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="verso-input-field"
                    />
                    <User size={16} className="verso-input-icon" />
                  </div>
                </div>

                <div className="verso-input-group">
                  <label className="verso-input-label">Password</label>
                  <div className="verso-input-field-wrap">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="verso-input-field"
                    />
                    <div
                      className="verso-input-icon clickable"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </div>

                <div className="verso-form-row">
                  <label className="verso-checkbox-label">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                    />
                    <span>Keep me signed in</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="verso-forgot-link"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="verso-primary-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </form>

              <div className="verso-switch-footer">
                New to VERSO?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setApiError('');
                  }}
                  className="verso-switch-btn"
                >
                  Create an account
                </button>
              </div>
            </div>
          </div>

          {/* =================================================================
              RIGHT HALF: CREATE ACCOUNT FORM
              ================================================================= */}
          <div className="verso-form-panel signup-side">
            <div className="verso-form-inner">
              <h2>Create account</h2>

              {apiError && mode === 'signup' && (
                <div style={{ padding: '0.6rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{apiError}</span>
                </div>
              )}

              {registeredUser ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ color: '#0f2920', margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>
                    Account Created!
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Redirecting to your dashboard...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignupSubmit}>
                  <div className="verso-input-group">
                    <label className="verso-input-label">Full name</label>
                    <div className="verso-input-field-wrap">
                      <input
                        type="text"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                        className="verso-input-field"
                      />
                      <User size={16} className="verso-input-icon" />
                    </div>
                  </div>

                  <div className="verso-input-group">
                    <label className="verso-input-label">Email address</label>
                    <div className="verso-input-field-wrap">
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className="verso-input-field"
                      />
                      <Mail size={16} className="verso-input-icon" />
                    </div>
                  </div>

                  <div className="verso-input-group">
                    <label className="verso-input-label">Password</label>
                    <div className="verso-input-field-wrap">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create password"
                        required
                        className="verso-input-field"
                      />
                      <div
                        className="verso-input-icon clickable"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </div>
                    </div>
                    <span className="verso-input-helper">
                      Use 8 characters or more with letters &amp; numbers
                    </span>
                  </div>

                  {/* Role Selector */}
                  <div className="verso-input-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="verso-input-label">Account Role</label>
                    <div className="verso-role-pills">
                      {ROLE_DEMO_ACCOUNTS.map((roleItem) => (
                        <button
                          key={roleItem.id}
                          type="button"
                          onClick={() => setSignupRole(roleItem.id)}
                          className={`verso-role-pill ${signupRole === roleItem.id ? 'active' : ''}`}
                        >
                          {roleItem.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="verso-primary-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="spin-animation" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <span>Create account</span>
                    )}
                  </button>
                </form>
              )}

              <div className="verso-switch-footer">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setApiError('');
                  }}
                  className="verso-switch-btn"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            THE 3D SLIDING SKEWED FOREST GREEN BLADE ("auth__band")
            ================================================================= */}
        <div className="verso-blade-band">
          <div className="verso-blade-inner">
            {/* Banner when in LOGIN mode (Blade is on the right) */}
            <div className="verso-banner-content verso-banner-login">
              <span className="brand-chip">{roleContent.login.chip}</span>
              <h3>{roleContent.login.title}</h3>
              <p>{roleContent.login.desc}</p>
            </div>

            {/* Banner when in SIGNUP mode (Blade is on the left) */}
            <div className="verso-banner-content verso-banner-signup">
              <span className="brand-chip">{roleContent.signup.chip}</span>
              <h3>{roleContent.signup.title}</h3>
              <p>{roleContent.signup.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsHelpModalOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#121417',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '2rem',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Corporate Support
              </h3>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Need assistance signing in or setting up your account? Contact our corporate platform administrator.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <Mail size={16} color="#10b981" />
                <span>support@rideflow.corporate.internal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <PhoneCall size={16} color="#10b981" />
                <span>1-800-RIDE-FLOW (Ext. 402)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="verso-primary-btn"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
