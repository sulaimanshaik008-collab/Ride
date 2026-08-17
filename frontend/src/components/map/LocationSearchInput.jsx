import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Navigation, Check } from 'lucide-react';
import { googleMapsService } from '../../services/googleMapsService';

/**
 * Accessible location search input with Google Places / Geocoding autocompletion
 */
export const LocationSearchInput = ({
  label,
  placeholder = 'Search address or landmark...',
  value = '',
  onChange,
  onSelectLocation,
  iconType = 'pickup', // 'pickup' | 'destination'
  disabled = false,
  required = false,
  error = null,
  proximity,
  id,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal query with external value prop
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await googleMapsService.searchPlaces(val, { proximity });
        setSuggestions(results || []);
        setIsOpen(results && results.length > 0);
      } catch (err) {
        console.warn('Failed to search locations:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelect = (item) => {
    const address = item.placeName || item.name;
    setQuery(address);
    setIsOpen(false);
    if (onChange) onChange(address);
    if (onSelectLocation) {
      onSelectLocation({
        address,
        name: item.name,
        coordinates: item.coordinates, // [lng, lat]
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    if (onChange) onChange('');
    if (onSelectLocation) {
      onSelectLocation(null);
    }
  };

  const isPickup = iconType === 'pickup';
  const accentColor = isPickup ? '#06b6d4' : '#6366f1';

  return (
    <div ref={dropdownRef} className="form-group" style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label htmlFor={id} className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {isPickup ? <MapPin size={16} color={accentColor} /> : <Navigation size={16} color={accentColor} />}
          <span>{label}</span>
          {required && <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          required={required}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          style={{
            paddingRight: query ? '3.5rem' : '2.25rem',
            minHeight: '44px',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {loading && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted, #9ca3af)' }} />}
          {!loading && query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear location"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #9ca3af)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <span style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
          {error}
        </span>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            background: 'var(--bg-card, #14171b)',
            border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
            borderRadius: '12px',
            padding: '0.4rem',
            margin: 0,
            listStyle: 'none',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((item) => (
            <li
              key={item.id}
              role="option"
              aria-selected={query === item.placeName}
              onClick={() => handleSelect(item)}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                color: 'var(--text-main, #ffffff)',
                fontSize: '0.85rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <MapPin size={16} color={accentColor} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #9ca3af)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.placeName}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default LocationSearchInput;
