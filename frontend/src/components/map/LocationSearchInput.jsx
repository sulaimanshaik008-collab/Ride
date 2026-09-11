import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  Loader2,
  Navigation,
  Plane,
  Train,
  Bus,
  Building2,
  LocateFixed,
  Sparkles,
  Building,
  ChevronRight,
  History,
  AlertCircle,
  Plus
} from 'lucide-react';
import { googleMapsService, POPULAR_TAMIL_NADU_COMPANIES } from '../../services/googleMapsService';

/**
 * Uber-Style Tamil Nadu Location Search & Autocomplete Input Component
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
  variant = 'default', // 'default' | 'uber'
  showAddStop = false,
  onAddStop,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const inputRef = useRef(null);

  const isPickup = iconType === 'pickup';

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
    setGeoError(null);
    if (onChange) onChange(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(true);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await googleMapsService.searchPlaces(val);
        setSuggestions(results || []);
        setIsOpen(true);
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
    setGeoError(null);
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

  // 3. USE CURRENT LOCATION HANDLER
  const handleUseCurrentLocation = async (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    try {
      setLocatingCurrent(true);
      setGeoError(null);

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      const readableAddress = await googleMapsService.reverseGeocode(longitude, latitude);

      setQuery(readableAddress);
      setIsOpen(false);
      setFocusedIndex(-1);
      if (onChange) onChange(readableAddress);

      if (onSelectLocation) {
        onSelectLocation({
          address: readableAddress,
          name: 'Current Location',
          coordinates: [longitude, latitude],
          placeId: 'current-gps-location',
        });
      }
    } catch (err) {
      console.warn('Current location error:', err);
      if (err.code === 1) {
        setGeoError('Location permission denied. Please search your pickup location manually.');
      } else if (err.code === 2) {
        setGeoError('Location position unavailable. Please search manually.');
      } else {
        setGeoError('Location request timed out. Please search manually.');
      }
    } finally {
      setLocatingCurrent(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setFocusedIndex(-1);
    setGeoError(null);
    if (onChange) onChange('');
    if (onSelectLocation) {
      onSelectLocation(null);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    const listCount = suggestions.length > 0 ? suggestions.length : (isPickup ? 0 : POPULAR_TAMIL_NADU_COMPANIES.slice(0, 10).length);
    if (!isOpen || listCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < listCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : listCount - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) {
        if (suggestions.length > 0 && focusedIndex < suggestions.length) {
          handleSelect(suggestions[focusedIndex]);
        } else if (!isPickup && POPULAR_TAMIL_NADU_COMPANIES[focusedIndex]) {
          handleSelect(POPULAR_TAMIL_NADU_COMPANIES[focusedIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

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
    if (types.includes('establishment') || text.includes('tower') || text.includes('park') || text.includes('campus') || text.includes('tech') || text.includes('limited') || text.includes('ltd')) {
      return <Building2 size={16} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />;
    }
    return <MapPin size={16} color={isPickup ? '#10b981' : '#164032'} style={{ marginTop: '2px', flexShrink: 0 }} />;
  };

  // Curated list of popular Tamil Nadu companies for destination initial state
  const popularCompaniesList = POPULAR_TAMIL_NADU_COMPANIES.slice(0, 15);

  return (
    <div ref={dropdownRef} className={variant === 'uber' ? 'uber-location-group' : 'form-group'} style={{ position: 'relative', width: '100%' }}>
      {variant === 'uber' ? (
        <div
          className={`uber-bar-input ${error ? 'has-error' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f3f4f6',
            borderRadius: '8px',
            height: '48px',
            padding: '0 0.85rem',
            gap: '0.75rem',
            transition: 'background 0.15s ease, box-shadow 0.15s ease',
            position: 'relative',
          }}
        >
          {/* Left Icon: Solid Black Dot for Pickup, Solid Black Square for Dropoff */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isPickup ? (
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#000000',
                }}
              />
            ) : (
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: '#000000',
                }}
              />
            )}
          </div>

          <input
            ref={inputRef}
            id={id}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsOpen(true);
            }}
            placeholder={placeholder || (isPickup ? 'Pickup location' : 'Dropoff location')}
            disabled={disabled}
            autoComplete="off"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.92rem',
              fontWeight: 500,
              color: '#000000',
              padding: 0,
              fontFamily: 'inherit',
              width: '100%',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexShrink: 0,
            }}
          >
            {(loading || resolvingPlace || locatingCurrent) && (
              <Loader2 size={16} className="spin-animation" style={{ color: '#000000' }} />
            )}
            {!loading && !resolvingPlace && !locatingCurrent && query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear location"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
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
            {showAddStop && !query && (
              <div
                onClick={onAddStop}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#000000',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Add stop"
              >
                <Plus size={13} strokeWidth={3} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
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
                setIsOpen(true);
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
              {(loading || resolvingPlace || locatingCurrent) && (
                <Loader2 size={16} className="spin-animation" style={{ color: '#10b981' }} />
              )}
              {!loading && !resolvingPlace && !locatingCurrent && query && (
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
        </>
      )}

      {geoError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#d97706', marginTop: '0.35rem' }}>
          <AlertCircle size={13} />
          <span>{geoError}</span>
        </div>
      )}

      {error && (
        <span style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.3rem', display: 'block' }}>
          {error}
        </span>
      )}

      {/* Uber-Style Location Search Panel Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '0.5rem',
            margin: 0,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0,0,0,0.06)',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {/* 1. USE CURRENT LOCATION BUTTON (For Pickup Search) */}
          {isPickup && (
            <div
              onClick={handleUseCurrentLocation}
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: locatingCurrent ? '#ecfdf5' : '#f8faf9',
                border: '1px solid #e2e8f0',
                marginBottom: '0.45rem',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#ecfdf5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = locatingCurrent ? '#ecfdf5' : '#f8faf9')}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {locatingCurrent ? (
                  <Loader2 size={16} className="spin-animation" />
                ) : (
                  <LocateFixed size={16} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '0.875rem' }}>
                  Use Current Location
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>
                  Detect GPS location via device
                </div>
              </div>
            </div>
          )}

          {/* 2. DYNAMIC AUTOCOMPLETE RESULTS (If User Typed Query) */}
          {suggestions.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.35rem 0.6rem' }}>
                Tamil Nadu Location Results
              </div>
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
          ) : !isPickup && (!query || query.trim().length < 2) ? (
            /* 3. POPULAR COMPANIES IN TAMIL NADU (Clean list without bulky header) */
            <div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {popularCompaniesList.map((company, index) => {
                  const isFocused = focusedIndex === index;
                  return (
                    <li
                      key={company.id}
                      role="option"
                      aria-selected={isFocused}
                      onClick={() => handleSelect(company)}
                      style={{
                        padding: '0.6rem 0.85rem',
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
                      <Building2 size={16} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
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
                          {company.name}
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
                          {company.secondaryText}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : query && query.trim().length >= 2 && !loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              No Tamil Nadu locations found matching "{query}". You can still search any address or landmark.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
export default LocationSearchInput;
