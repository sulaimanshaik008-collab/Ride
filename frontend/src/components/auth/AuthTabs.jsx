import React from 'react';

export const AuthTabs = ({ activeTab, onTabChange }) => {
  const handleKeyDown = (e, tab) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onTabChange(activeTab === 'login' ? 'signup' : 'login');
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Authentication Options"
      className="auth-segmented-tabs"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: 'var(--tab-bg, #0d0f11)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
        position: 'relative',
        marginBottom: '1.75rem',
      }}
    >
      <button
        type="button"
        role="tab"
        id="tab-login"
        aria-selected={activeTab === 'login'}
        aria-controls="panel-login"
        tabIndex={activeTab === 'login' ? 0 : -1}
        onClick={() => onTabChange('login')}
        onKeyDown={(e) => handleKeyDown(e, 'login')}
        className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
        style={{
          padding: '0.65rem 1rem',
          fontSize: '0.925rem',
          fontWeight: 700,
          borderRadius: '9px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: activeTab === 'login' ? 'var(--tab-active-bg, #ffffff)' : 'transparent',
          color: activeTab === 'login' ? 'var(--tab-active-text, #000000)' : 'var(--text-muted, #9ca3af)',
          boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.2) inset' : 'none',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Log In
      </button>

      <button
        type="button"
        role="tab"
        id="tab-signup"
        aria-selected={activeTab === 'signup'}
        aria-controls="panel-signup"
        tabIndex={activeTab === 'signup' ? 0 : -1}
        onClick={() => onTabChange('signup')}
        onKeyDown={(e) => handleKeyDown(e, 'signup')}
        className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
        style={{
          padding: '0.65rem 1rem',
          fontSize: '0.925rem',
          fontWeight: 700,
          borderRadius: '9px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: activeTab === 'signup' ? 'var(--tab-active-bg, #ffffff)' : 'transparent',
          color: activeTab === 'signup' ? 'var(--tab-active-text, #000000)' : 'var(--text-muted, #9ca3af)',
          boxShadow: activeTab === 'signup' ? '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.2) inset' : 'none',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Sign Up
      </button>
    </div>
  );
};
