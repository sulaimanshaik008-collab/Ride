import React, { useState, useEffect } from 'react';
import { Fingerprint, ScanFace, Info, X } from 'lucide-react';

export const BiometricButton = ({ onBiometricAuth, disabled = false }) => {
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    // Check if browser environment supports WebAuthn / Passkeys
    if (window.PublicKeyCredential) {
      setHasWebAuthn(true);
    }
  }, []);

  const handleClick = () => {
    setShowInfoModal(true);
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="biometric-btn"
          aria-label="Use Face ID or Fingerprint for biometric login"
          style={{
            background: 'transparent',
            border: '1px dashed var(--border-glass, rgba(255, 255, 255, 0.15))',
            color: 'var(--text-muted, #9ca3af)',
            fontSize: '0.825rem',
            fontWeight: 600,
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
          }}
        >
          <Fingerprint size={16} color="var(--accent-teal, #10b981)" />
          <span>Use Face ID / Fingerprint</span>
        </button>
      </div>

      {showInfoModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bio-modal-title"
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
              maxWidth: '440px',
              width: '100%',
              background: 'var(--bg-card, #121417)',
              border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Fingerprint size={20} />
                </div>
                <h3 id="bio-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Biometric Authentication
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #9ca3af)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.5, marginBottom: '1rem' }}>
              {hasWebAuthn
                ? 'Your device supports WebAuthn / Passkeys. To enable seamless Face ID or fingerprint sign-in, enroll your corporate passkey in your Security Settings after signing in.'
                : 'WebAuthn is not supported by your current browser environment. Please sign in with your work email and password.'}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                fontSize: '0.78rem',
                color: 'var(--text-muted, #9ca3af)',
                marginBottom: '1.25rem',
              }}
            >
              <Info size={16} color="var(--accent-teal, #10b981)" style={{ flexShrink: 0 }} />
              <span>Biometric credentials remain securely stored in your device enclave and are never transmitted to frontend servers.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
