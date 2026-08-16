import React, { useState } from 'react';

export const FeedbackRating = ({ value = 0, onChange, readOnly = false, size = 24 }) => {
  const [hoverValue, setHoverValue] = useState(0);

  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {stars.map((star) => {
        const isFilled = (hoverValue || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: readOnly ? 'default' : 'pointer',
              padding: '2px',
              fontSize: `${size}px`,
              lineHeight: 1,
              color: isFilled ? '#fbbf24' : 'rgba(255,255,255,0.2)',
              transition: 'transform 0.15s ease, color 0.15s ease',
              transform: !readOnly && hoverValue === star ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};
