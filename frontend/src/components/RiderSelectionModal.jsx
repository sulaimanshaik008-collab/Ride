import React, { useState, useEffect } from 'react';
import { X, User, UserPlus, Check, ChevronDown, ArrowLeft, Trash2 } from 'lucide-react';
import { riderService } from '../services/riderService';
import { useAuth } from '../context/AuthContext';

const COUNTRY_CODES = [
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SG', dial: '+65', name: 'Singapore' },
  { code: 'DE', dial: '+49', name: 'Germany' },
  { code: 'FR', dial: '+33', name: 'France' },
];

export const RiderSelectionModal = ({
  isOpen,
  onClose,
  selectedRider, // { type: 'SELF' | 'COLLEAGUE', name: string, phone: string, id?: string }
  onSelectRider,
}) => {
  const { currentUser } = useAuth();

  // Mode: 'CHOOSE' | 'NEW'
  const [modalMode, setModalMode] = useState('CHOOSE');
  const [savedRiders, setSavedRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);

  // Form states for "New rider"
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [savingRider, setSavingRider] = useState(false);

  // Load saved riders
  const loadRiders = async () => {
    try {
      setLoadingRiders(true);
      const riders = await riderService.getSavedRiders(currentUser?.id || currentUser?.userId);
      setSavedRiders(riders || []);
    } catch (e) {
      console.error('Failed to load saved riders:', e);
    } finally {
      setLoadingRiders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setModalMode('CHOOSE');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setFormError('');
      loadRiders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddRiderSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setFormError('Please enter a first name');
      return;
    }
    if (!lastName.trim()) {
      setFormError('Please enter a last name');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setFormError('Please enter a valid phone number');
      return;
    }

    try {
      setSavingRider(true);
      setFormError('');

      const cleanPhone = phoneNumber.trim().startsWith('+')
        ? phoneNumber.trim()
        : `${selectedCountry.dial}${phoneNumber.trim().replace(/^0+/, '')}`;

      const newRider = await riderService.createSavedRider(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: cleanPhone,
          countryCode: selectedCountry.dial,
        },
        currentUser?.id || currentUser?.userId
      );

      // Refresh list
      await loadRiders();

      // Auto-select this newly created rider
      onSelectRider({
        type: 'COLLEAGUE',
        id: newRider.id,
        name: newRider.fullName || `${firstName.trim()} ${lastName.trim()}`,
        phone: newRider.phoneNumber || cleanPhone,
        initials: newRider.initials || `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
      });

      // Switch back to choose mode
      setModalMode('CHOOSE');
    } catch (err) {
      setFormError(err.message || 'Failed to save rider');
    } finally {
      setSavingRider(false);
    }
  };

  const handleDeleteRider = async (e, riderId) => {
    e.stopPropagation();
    if (window.confirm('Remove this saved colleague?')) {
      await riderService.deleteSavedRider(riderId, currentUser?.id || currentUser?.userId);
      // If currently selected, revert to SELF
      if (selectedRider?.id === riderId) {
        onSelectRider({
          type: 'SELF',
          name: currentUser?.fullName || 'Me',
          phone: currentUser?.phoneNumber || '',
        });
      }
      await loadRiders();
    }
  };

  const isMeSelected = !selectedRider || selectedRider.type === 'SELF';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '1.75rem 1.75rem 1.5rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          color: '#000000',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* =========================================================================
            VIEW 1: "Choose a rider"
            ========================================================================= */}
        {modalMode === 'CHOOSE' ? (
          <div>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#000000',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Choose a rider
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Rider List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                maxHeight: '360px',
                overflowY: 'auto',
                marginBottom: '1.5rem',
              }}
            >
              {/* Option: "Me" */}
              <div
                onClick={() =>
                  onSelectRider({
                    type: 'SELF',
                    name: currentUser?.fullName || 'Me',
                    phone: currentUser?.phoneNumber || '',
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0.75rem',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  background: isMeSelected ? '#f6f6f6' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#71717a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={22} strokeWidth={2.2} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#000000',
                      }}
                    >
                      Me
                    </span>
                    {currentUser?.fullName && (
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {currentUser.fullName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Radio Button */}
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: isMeSelected ? '2px solid #000000' : '2px solid #9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                  }}
                >
                  {isMeSelected && (
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#000000',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Saved Colleagues / Riders List */}
              {savedRiders.map((rider) => {
                const isSelected =
                  selectedRider?.type === 'COLLEAGUE' &&
                  (selectedRider.id === rider.id || selectedRider.phone === rider.phoneNumber);

                const initials =
                  rider.initials ||
                  (
                    (rider.firstName?.[0] || '') + (rider.lastName?.[0] || '')
                  ).toUpperCase() ||
                  'ZS';

                return (
                  <div
                    key={rider.id}
                    onClick={() =>
                      onSelectRider({
                        type: 'COLLEAGUE',
                        id: rider.id,
                        name: rider.fullName || `${rider.firstName} ${rider.lastName}`,
                        phone: rider.phoneNumber,
                        initials,
                      })
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 0.75rem',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      background: isSelected ? '#f6f6f6' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: '#000000',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            color: '#000000',
                            textTransform: 'lowercase',
                          }}
                        >
                          {rider.fullName || `${rider.firstName} ${rider.lastName}`}
                        </span>
                        <span
                          style={{
                            fontSize: '0.88rem',
                            color: '#4b5563',
                            marginTop: '1px',
                          }}
                        >
                          {rider.phoneNumber}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRider(e, rider.id)}
                        title="Delete saved colleague"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          opacity: 0.6,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.6';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>

                      {/* Radio Button */}
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #000000' : '2px solid #9ca3af',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#ffffff',
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: '#000000',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Option: "Order ride for someone else" */}
              <div
                onClick={() => setModalMode('NEW')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 0.75rem',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  borderTop: '1px solid #f3f4f6',
                  marginTop: '0.5rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#f3f4f6',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus size={20} strokeWidth={2.4} />
                </div>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#000000',
                  }}
                >
                  Order ride for someone else
                </span>
              </div>
            </div>

            {/* Bottom Done Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '0.95rem 1.25rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Done
            </button>
          </div>
        ) : (
          /* =========================================================================
              VIEW 2: "New rider"
              ========================================================================= */
          <form onSubmit={handleAddRiderSubmit}>
            {/* Top Bar with Back or Close */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setModalMode('CHOOSE')}
                  style={{
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000000',
                    cursor: 'pointer',
                  }}
                  aria-label="Back"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#000000',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  New rider
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  cursor: 'pointer',
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#000000',
                margin: '0 0 1.25rem 0',
              }}
            >
              Drivers will see this name.
            </p>

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#ef4444',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                ⚠️ {formError}
              </div>
            )}

            {/* First Name */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#000000',
                  marginBottom: '0.4rem',
                }}
              >
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Zoro"
                autoFocus
                style={{
                  width: '100%',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  fontSize: '1rem',
                  color: '#000000',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Last Name */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#000000',
                  marginBottom: '0.4rem',
                }}
              >
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Smith"
                style={{
                  width: '100%',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  fontSize: '1rem',
                  color: '#000000',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Phone Number with Country Selector */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#000000',
                  marginBottom: '0.4rem',
                }}
              >
                Phone number
              </label>

              <div style={{ display: 'flex', gap: '0.65rem', position: 'relative' }}>
                {/* Country selector button */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    style={{
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.9rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#000000',
                      cursor: 'pointer',
                      minWidth: '85px',
                    }}
                  >
                    <span>{selectedCountry.code}</span>
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </button>

                  {/* Country dropdown menu */}
                  {showCountryDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '108%',
                        left: 0,
                        zIndex: 50,
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '0.4rem',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        width: '220px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setSelectedCountry(c);
                            setShowCountryDropdown(false);
                          }}
                          style={{
                            padding: '0.55rem 0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            background:
                              selectedCountry.code === c.code ? '#f3f4f6' : 'transparent',
                            fontWeight: selectedCountry.code === c.code ? 700 : 500,
                          }}
                        >
                          <span>
                            {c.name} ({c.code})
                          </span>
                          <span style={{ color: '#6b7280' }}>{c.dial}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#000000',
                      marginRight: '0.4rem',
                    }}
                  >
                    {selectedCountry.dial}
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="919379264853"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1rem',
                      color: '#000000',
                      outline: 'none',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Subtext */}
            <p
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
                margin: '0.75rem 0 1.25rem 0',
                lineHeight: 1.4,
              }}
            >
              Corporate Rides won't share this phone number with drivers
            </p>

            {/* Agreement Disclaimer */}
            <p
              style={{
                fontSize: '0.85rem',
                color: '#4b5563',
                margin: '0 0 1.5rem 0',
                lineHeight: 1.4,
              }}
            >
              By tapping "Add rider", you confirm that your colleague agreed to share their contact
              information with Corporate Rides and to receive SMS about this trip.
            </p>

            {/* Add Rider Button */}
            <button
              type="submit"
              disabled={savingRider}
              style={{
                width: '100%',
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '0.95rem 1.25rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {savingRider ? 'Adding rider...' : 'Add rider'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
