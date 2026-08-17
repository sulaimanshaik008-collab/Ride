import React, { useState } from 'react';
import { UserCheck, ShieldAlert, ArrowRight, X } from 'lucide-react';

export const GuestAccessButton = ({ onGuestLogin, disabled = false }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    try {
      setLoading(true);
      await onGuestLogin();
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Guest access failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={disabled || loading}
          className="guest-access-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #9ca3af)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            transition: 'color 0.15s, background-color 0.15s',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <UserCheck size={16} />
          <span>Continue as Guest</span>
        </button>
      </div>

      {/* Guest Mode Confirmation & Disclosure Modal */}
      {showConfirmModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-modal-title"
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
            className="modal-card guest-disclosure-card"
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
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldAlert size={20} />
                </div>
                <h3 id="guest-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Guest Mode Access
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
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

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Guest mode allows you to explore public vehicle scheduling and platform features with restricted sandbox permissions. 
              <strong> Protected corporate data and ride management require authenticated sign-in.</strong>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.15rem', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {loading ? 'Entering...' : 'Enter as Guest'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
