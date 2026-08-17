import React, { useMemo } from 'react';

export const FloatingBackground = () => {
  // Pre-generate stable deterministic particle positions & timing
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const left = ((i * 17) % 100) + Math.sin(i) * 2;
      const size = (i % 3) * 2 + 2; // 2px, 4px, 6px
      const duration = 9 + (i % 8); // 9s to 16s
      const delay = (i * 0.6) % 7; // 0s to 7s
      const opacity = 0.15 + (i % 4) * 0.08; // 0.15 to 0.39
      const drift = (i % 2 === 0 ? 1 : -1) * (15 + (i % 25)); // slight horizontal drift

      return {
        id: i,
        left: `${left}%`,
        size: `${size}px`,
        duration: `${duration}s`,
        delay: `${delay}s`,
        opacity,
        drift: `${drift}px`,
      };
    });
  }, []);

  // Light trails (streaks with staggered movement)
  const lightTrails = useMemo(() => {
    return [
      { id: 1, left: '18%', width: '1px', height: '140px', duration: '9s', delay: '0s', opacity: 0.12 },
      { id: 2, left: '42%', width: '1.5px', height: '220px', duration: '13s', delay: '2.5s', opacity: 0.09 },
      { id: 3, left: '68%', width: '1px', height: '180px', duration: '11s', delay: '5s', opacity: 0.14 },
      { id: 4, left: '86%', width: '2px', height: '160px', duration: '15s', delay: '1.2s', opacity: 0.08 },
    ];
  }, []);

  return (
    <div
      className="floating-bg-container"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Dynamic Ambient Background Gradient Glows */}
      <div
        className="ambient-glow ambient-glow-1"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, var(--glow-accent-1, rgba(16, 185, 129, 0.08)) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulseGlow 10s ease-in-out infinite alternate',
        }}
      />
      <div
        className="ambient-glow ambient-glow-2"
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, var(--glow-accent-2, rgba(255, 255, 255, 0.04)) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'pulseGlow 14s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Subtle Anti-Gravity Particles */}
      <div className="particles-layer">
        {particles.map((p) => (
          <div
            key={p.id}
            className="floating-particle"
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: 'var(--particle-color, #ffffff)',
              boxShadow: '0 0 8px var(--particle-shadow, rgba(16, 185, 129, 0.6))',
              opacity: p.opacity,
              animationName: 'antigravityFloat',
              animationDuration: p.duration,
              animationDelay: p.delay,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
              '--drift': p.drift,
            }}
          />
        ))}
      </div>

      {/* Subtle Light Trails */}
      <div className="light-trails-layer">
        {lightTrails.map((trail) => (
          <div
            key={trail.id}
            className="light-trail"
            style={{
              position: 'absolute',
              bottom: '-250px',
              left: trail.left,
              width: trail.width,
              height: trail.height,
              background: 'linear-gradient(to top, transparent, var(--trail-color, rgba(16, 185, 129, 0.7)), transparent)',
              opacity: trail.opacity,
              animationName: 'lightTrailAscend',
              animationDuration: trail.duration,
              animationDelay: trail.delay,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          />
        ))}
      </div>

      {/* Grid Pattern Overlay for Depth */}
      <div
        className="grid-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(to right, var(--grid-line, rgba(255, 255, 255, 0.02)) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line, rgba(255, 255, 255, 0.02)) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.8,
        }}
      />
    </div>
  );
};
