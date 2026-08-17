import React from 'react';
import { Check, X } from 'lucide-react';

export const calculatePasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: 'Too short',
      color: '#6b7280',
      requirements: {
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
      },
    };
  }

  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  let passedCount = 0;
  if (requirements.length) passedCount += 1;
  if (requirements.lowercase && requirements.uppercase) passedCount += 1;
  if (requirements.number) passedCount += 1;
  if (requirements.special) passedCount += 1;

  let score = 1;
  let label = 'Weak';
  let color = '#ef4444'; // Red

  if (!requirements.length) {
    score = 1;
    label = 'Too Short (min 8 chars)';
    color = '#ef4444';
  } else if (passedCount === 2) {
    score = 2;
    label = 'Fair';
    color = '#f59e0b'; // Amber
  } else if (passedCount === 3) {
    score = 3;
    label = 'Good';
    color = '#10b981'; // Green
  } else if (passedCount >= 4) {
    score = 4;
    label = 'Strong';
    color = '#059669'; // Emerald
  }

  return { score, label, color, requirements };
};

export const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const { score, label, color, requirements } = calculatePasswordStrength(password);

  return (
    <div
      className="password-strength-container"
      style={{
        marginTop: '0.6rem',
        padding: '0.65rem 0.85rem',
        borderRadius: '8px',
        background: 'var(--strength-bg, rgba(255, 255, 255, 0.03))',
        border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.08))',
      }}
      aria-live="polite"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #9ca3af)' }}>
          Password Strength:
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
          {label}
        </span>
      </div>

      {/* 4 Segment Progress Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', height: '4px', marginBottom: '0.6rem' }}>
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            style={{
              height: '100%',
              borderRadius: '2px',
              backgroundColor: step <= score ? color : 'var(--bar-empty, rgba(255, 255, 255, 0.1))',
              transition: 'background-color 0.25s ease-in-out',
            }}
          />
        ))}
      </div>

      {/* Rules Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.72rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: requirements.length ? 'var(--color-success, #10b981)' : 'var(--text-muted, #71717a)' }}>
          {requirements.length ? <Check size={12} /> : <X size={12} />} 8+ characters
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: (requirements.lowercase && requirements.uppercase) ? 'var(--color-success, #10b981)' : 'var(--text-muted, #71717a)' }}>
          {(requirements.lowercase && requirements.uppercase) ? <Check size={12} /> : <X size={12} />} Upper & lowercase
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: requirements.number ? 'var(--color-success, #10b981)' : 'var(--text-muted, #71717a)' }}>
          {requirements.number ? <Check size={12} /> : <X size={12} />} At least 1 number
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: requirements.special ? 'var(--color-success, #10b981)' : 'var(--text-muted, #71717a)' }}>
          {requirements.special ? <Check size={12} /> : <X size={12} />} Special character
        </div>
      </div>
    </div>
  );
};
