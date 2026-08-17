import React from 'react';

export const MotorcycleKeyIcon = ({ size = 32, className = '', color = 'currentColor' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Motorcycle Body Silhouette */}
      <path
        d="M28 32 C28 28 35 24 45 24 C55 24 60 21 63 17 L65 14 C66 12 69 11 72 12 L75 14 L73 17 L78 18 C80 18 82 20 82 23 L80 27 L74 27 L70 34 L73 42 C74 44 73 47 70 48 L65 49 L58 41 C54 39 48 39 44 41 L35 44 L28 36 Z"
        fill={color}
      />
      {/* Front Fork & Headlight */}
      <path
        d="M68 20 L76 38 L85 48 C86 49 85 52 83 53 L80 54 L71 42 L64 24 Z"
        fill={color}
      />
      {/* Seat & Rear Fender */}
      <path
        d="M22 30 C20 30 18 32 18 34 C18 37 20 38 23 38 L38 38 C40 38 42 36 42 34 L40 30 Z"
        fill={color}
      />
      <path
        d="M15 36 C13 38 12 41 12 44 C12 47 14 50 16 51 L20 48 C18 46 17 44 18 41 C19 39 21 38 23 37 Z"
        fill={color}
      />
      {/* Handlebar & Mirror */}
      <path
        d="M62 12 L64 6 C64 4 66 3 68 4 L70 5 L68 9 L65 13 Z"
        fill={color}
      />
      {/* Front Wheel */}
      <circle cx="82" cy="46" r="13" stroke={color} strokeWidth="6" fill="none" />
      <circle cx="82" cy="46" r="5" fill={color} />

      {/* Rear Wheel with Cutout / Key Motif */}
      <circle cx="24" cy="46" r="14" stroke={color} strokeWidth="6.5" fill="none" />
      <circle cx="24" cy="46" r="4.5" fill={color} />

      {/* Key Shaft extending horizontally into the frame/exhaust */}
      <path
        d="M28 44 L56 44 C57 44 58 45 58 46 C58 47 57 48 56 48 L48 48 L48 51 L45 51 L45 48 L41 48 L41 51 L38 51 L38 48 L28 48 Z"
        fill={color}
      />
    </svg>
  );
};

export const BrandLogo = ({ size = 'normal', showSubtitle = true }) => {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 48 : 34;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isLarge ? '1rem' : '0.75rem',
        userSelect: 'none',
      }}
      className="brand-logo-container"
    >
      <div
        style={{
          width: isLarge ? '56px' : '44px',
          height: isLarge ? '56px' : '44px',
          background: 'var(--brand-icon-bg, linear-gradient(145deg, #1f2421, #0a0e0c))',
          border: '1px solid var(--brand-icon-border, rgba(16, 185, 129, 0.35))',
          borderRadius: isLarge ? '14px' : '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15), 0 2px 0 rgba(0,0,0,0.5)',
          color: 'var(--accent-teal, #10b981)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <MotorcycleKeyIcon size={iconSize} color="currentColor" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: isLarge ? '1.5rem' : '1.25rem',
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            color: 'var(--text-main, #ffffff)',
          }}
        >
          <span>RideFlow</span>
        </div>
        {showSubtitle && (
          <span
            style={{
              fontSize: isLarge ? '0.8rem' : '0.725rem',
              color: 'var(--text-muted, #9ca3af)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Corporate Transit Platform
          </span>
        )}
      </div>
    </div>
  );
};
