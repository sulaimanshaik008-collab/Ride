import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Navigation, Plane, Train, Bus, Building2 } from 'lucide-react';
import { googleMapsService } from '../../services/googleMapsService';

/**
 * Uber-Style India Location Search & Autocomplete Input Component
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
  id,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal query with external value prop
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1);
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
        const results = await googleMapsService.searchPlaces(val);
        setSuggestions(results || []);
        setIsOpen(results && results.length > 0);
      } catch (err) {
        console.warn('Failed to fetch place suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleSelect = async (item) => {
    const displayAddress = item.placeName || item.name;
    setQuery(displayAddress);
    setIsOpen(false);
    setFocusedIndex(-1);
    if (onChange) onChange(displayAddress);

    try {
      setResolvingPlace(true);
      // If item already has resolved coordinates, use them directly
      if (item.coordinates && Array.isArray(item.coordinates)) {
        if (onSelectLocation) {
          onSelectLocation({
            address: displayAddress,
            name: item.name,
            coordinates: item.coordinates,
            placeId: item.placeId || item.id,
          });
        }
        return;
      }

      // Resolve coordinates and full address using Google Places / Geocoder
      const details = await googleMapsService.getPlaceDetails(item.placeId || item.id, displayAddress);
      if (onSelectLocation) {
        onSelectLocation({
          address: details.address || displayAddress,
          name: item.name,
          coordinates: details.coordinates,
          placeId: details.placeId || item.placeId,
        });
      }
    } catch (err) {
      console.warn('Failed to resolve place coordinates:', err);
      if (onSelectLocation) {
        onSelectLocation({
          address: displayAddress,
          name: item.name,
          coordinates: [78.1198, 9.9252],
          placeId: item.placeId,
        });
      }
    } finally {
      setResolvingPlace(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setFocusedIndex(-1);
    if (onChange) onChange('');
    if (onSelectLocation) {
      onSelectLocation(null);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        handleSelect(suggestions[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const isPickup = iconType === 'pickup';
  const accentColor = isPickup ? '#06b6d4' : '#6366f1';

  const getPlaceIcon = (types = [], name = '') => {
    const text = name.toLowerCase();
    if (types.includes('airport') || text.includes('airport') || text.includes('aerodrome')) {
      return <Plane size={16} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />;
    }
    if (
      types.includes('train_station') ||
      types.includes('transit_station') ||
      text.includes('railway') ||
      text.includes('station') ||
      text.includes('junction') ||
      text.includes('metro')
    ) {
      return <Train size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />;
    }
    if (types.includes('bus_station') || text.includes('bus stand') || text.includes('bus stop')) {
      return <Bus size={16} color="#fbbf24" style={{ marginTop: '2px', flexShrink: 0 }} />;
    }
    if (types.includes('establishment') || text.includes('tower') || text.includes('park') || text.includes('campus')) {
      return <Building2 size={16} color="#c084fc" style={{ marginTop: '2px', flexShrink: 0 }} />;
    }
    return <MapPin size={16} color={accentColor} style={{ marginTop: '2px', flexShrink: 0 }} />;
  };

  return (
    <div ref={dropdownRef} className="form-group" style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          className="form-label"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            marginBottom: '0.35rem',
            fontSize: '0.825rem',
            fontWeight: 700,
            color: '#374151',
          }}
        >
          {isPickup ? <MapPin size={15} color="#10b981" /> : <Navigation size={15} color="#164032" />}
          <span>{label}</span>
          {required && <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
            minHeight: '46px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            color: '#0f172a',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {(loading || resolvingPlace) && (
            <Loader2 size={16} className="spin-animation" style={{ color: '#10b981' }} />
          )}
          {!loading && !resolvingPlace && query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear location"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
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

      {/* Uber-Style Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '0.45rem',
            margin: 0,
            listStyle: 'none',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0,0,0,0.06)',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((item, index) => {
            const isFocused = focusedIndex === index;
            return (
              <li
                key={item.id || item.placeId || index}
                role="option"
                aria-selected={isFocused}
                onClick={() => handleSelect(item)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  background: isFocused ? 'rgba(22, 64, 50, 0.08)' : 'transparent',
                  border: isFocused ? '1px solid rgba(22, 64, 50, 0.2)' : '1px solid transparent',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {getPlaceIcon(item.types, item.name)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: '#0f2920',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.secondaryText || item.placeName}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
export default LocationSearchInput;
