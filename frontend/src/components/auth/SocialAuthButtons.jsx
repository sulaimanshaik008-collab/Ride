import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const SocialAuthButtons = ({ onGoogleClick, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      await onGoogleClick();
    } catch (err) {
      console.error('Google auth failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="social-auth-section" style={{ width: '100%' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        aria-label="Continue with Google"
        className="social-btn google-btn"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          minHeight: '46px',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          background: 'var(--social-btn-bg, #1a1a1a)',
          color: 'var(--text-main, #ffffff)',
          border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
          fontWeight: 600,
          fontSize: '0.925rem',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <GoogleIcon size={18} />
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  );
};
